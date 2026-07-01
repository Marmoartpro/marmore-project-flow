
-- 1) Fix search_path on every public function that lacks it
DO $$
DECLARE r record;
BEGIN
  FOR r IN 
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prokind='f'
      AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
      ))
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- 2) Revoke EXECUTE on internal SECURITY DEFINER helpers
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (
      'enqueue_email','read_email_batch','delete_email','move_to_dlq',
      'handle_new_user','create_project_stages','update_updated_at_column',
      'set_appointments_updated_at','user_has_project_access','get_default_permissions'
    )
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, authenticated, public', r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_default_permissions(user_role) TO authenticated;

-- 3) Drop insecure anon policies
DROP POLICY IF EXISTS "Anon read project by client token" ON public.projects;
DROP POLICY IF EXISTS "Anon can read contract for signing" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can view signature by token" ON public.digital_signatures;
DROP POLICY IF EXISTS "Anyone can update signature by token" ON public.digital_signatures;
DROP POLICY IF EXISTS "Anon read payments of any project" ON public.payments;
DROP POLICY IF EXISTS "Anon read stages of any project" ON public.project_stages;
DROP POLICY IF EXISTS "Anon read stage photos" ON public.stage_photos;
DROP POLICY IF EXISTS "Anon can read messages of any project" ON public.messages;
DROP POLICY IF EXISTS "Anon can insert messages on existing project" ON public.messages;
DROP POLICY IF EXISTS "Anon can submit nps via project token" ON public.nps_responses;
DROP POLICY IF EXISTS "Anon can update own nps for google review" ON public.nps_responses;

-- 4) Profiles: restrict SELECT
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users view relevant profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE (tm.owner_id = auth.uid() AND tm.user_id = public.profiles.user_id)
         OR (tm.user_id  = auth.uid() AND tm.owner_id = public.profiles.user_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.project_invites pi
      JOIN public.projects pr ON pr.id = pi.project_id
      WHERE pi.accepted = true
        AND ((pr.owner_id = auth.uid() AND pi.architect_user_id = public.profiles.user_id)
          OR (pi.architect_user_id = auth.uid() AND pr.owner_id = public.profiles.user_id))
    )
  );

-- 5) Storage ownership on project-files
DROP POLICY IF EXISTS "Auth users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete" ON storage.objects;
CREATE POLICY "Owner can upload to project-files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR (storage.foldername(name))[1] = 'contracts'
    )
  );
CREATE POLICY "Owner can update project-files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner can delete project-files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Anon can upload signed pdfs"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = 'contracts');

-- 6a) Client portal RPC
CREATE OR REPLACE FUNCTION public.get_client_portal(_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_project public.projects; v_result jsonb;
BEGIN
  IF _token IS NULL OR length(_token) < 8 THEN RETURN NULL; END IF;
  SELECT * INTO v_project FROM public.projects WHERE client_access_token = _token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  
  SELECT jsonb_build_object(
    'project', to_jsonb(v_project) - 'client_access_token',
    'stages', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.stage_number) 
                        FROM public.project_stages s WHERE s.project_id = v_project.id), '[]'::jsonb),
    'payments', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.due_date) 
                          FROM public.payments p WHERE p.project_id = v_project.id), '[]'::jsonb),
    'photos', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                          'id', sp.id, 'photo_url', sp.photo_url, 'caption', sp.caption,
                          'stage_id', sp.stage_id, 'stage_name', ps.name, 'created_at', sp.created_at))
                        FROM public.stage_photos sp 
                        JOIN public.project_stages ps ON ps.id = sp.stage_id
                        WHERE ps.project_id = v_project.id), '[]'::jsonb),
    'messages', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                            'id', m.id, 'content', m.content, 'created_at', m.created_at)
                            ORDER BY m.created_at)
                          FROM public.messages m WHERE m.project_id = v_project.id), '[]'::jsonb),
    'contract', (SELECT jsonb_build_object('signed_pdf_url', c.signed_pdf_url, 'status', c.status)
                 FROM public.contracts c WHERE c.owner_id = v_project.owner_id 
                 ORDER BY c.created_at DESC LIMIT 1)
  ) INTO v_result;
  RETURN v_result;
END $$;
GRANT EXECUTE ON FUNCTION public.get_client_portal(text) TO anon, authenticated;

-- 6b) Post message
CREATE OR REPLACE FUNCTION public.post_client_message(_token text, _content text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_project public.projects; v_id uuid;
BEGIN
  IF length(coalesce(_content,'')) = 0 OR length(_content) > 2000 THEN RAISE EXCEPTION 'Mensagem inválida'; END IF;
  SELECT * INTO v_project FROM public.projects WHERE client_access_token = _token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Token inválido'; END IF;
  INSERT INTO public.messages(project_id, sender_id, content)
  VALUES (v_project.id, v_project.owner_id, '[Cliente] ' || _content)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_client_message(text, text) TO anon, authenticated;

-- 6c) NPS
CREATE OR REPLACE FUNCTION public.submit_nps(_token text, _score int, _comment text, _google_reviewed boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_project public.projects; v_id uuid;
BEGIN
  IF _score IS NULL OR _score < 0 OR _score > 10 THEN RAISE EXCEPTION 'Nota inválida'; END IF;
  IF length(coalesce(_comment,'')) > 2000 THEN RAISE EXCEPTION 'Comentário muito longo'; END IF;
  SELECT * INTO v_project FROM public.projects WHERE client_access_token = _token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Token inválido'; END IF;
  SELECT id INTO v_id FROM public.nps_responses WHERE project_id = v_project.id LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.nps_responses(project_id, owner_id, score, comment, google_reviewed)
    VALUES (v_project.id, v_project.owner_id, _score, _comment, _google_reviewed)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.nps_responses SET score = _score, comment = _comment, google_reviewed = _google_reviewed WHERE id = v_id;
  END IF;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_nps(text, int, text, boolean) TO anon, authenticated;

-- 6d) Signature fetch
CREATE OR REPLACE FUNCTION public.get_signature_for_signing(_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_sig public.digital_signatures; v_doc jsonb;
BEGIN
  IF _token IS NULL OR length(_token) < 8 THEN RETURN NULL; END IF;
  SELECT * INTO v_sig FROM public.digital_signatures WHERE sign_token = _token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_sig.document_type = 'contrato' THEN
    SELECT to_jsonb(c) INTO v_doc FROM public.contracts c WHERE c.id = v_sig.document_id;
  ELSE
    SELECT to_jsonb(bq) INTO v_doc FROM public.budget_quotes bq WHERE bq.id = v_sig.document_id;
  END IF;
  RETURN jsonb_build_object(
    'signature', jsonb_build_object(
      'id', v_sig.id, 'document_type', v_sig.document_type, 'document_id', v_sig.document_id,
      'status', v_sig.status, 'expires_at', v_sig.expires_at, 'signer_name', v_sig.signer_name,
      'signed_at', v_sig.signed_at, 'signed_pdf_url', v_sig.signed_pdf_url
    ),
    'document', v_doc
  );
END $$;
GRANT EXECUTE ON FUNCTION public.get_signature_for_signing(text) TO anon, authenticated;

-- 6e) Sign
CREATE OR REPLACE FUNCTION public.sign_document(
  _token text, _signer_name text, _signature_image text,
  _signer_ip text, _signer_location text, _signed_pdf_url text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_sig public.digital_signatures;
BEGIN
  IF length(coalesce(_signer_name,'')) < 2 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF length(coalesce(_signature_image,'')) < 100 THEN RAISE EXCEPTION 'Assinatura inválida'; END IF;
  SELECT * INTO v_sig FROM public.digital_signatures WHERE sign_token = _token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Token inválido'; END IF;
  IF v_sig.status = 'assinado' THEN RAISE EXCEPTION 'Documento já assinado'; END IF;
  IF v_sig.expires_at < now() THEN RAISE EXCEPTION 'Link expirado'; END IF;

  UPDATE public.digital_signatures SET
    signer_name = _signer_name,
    signer_ip = _signer_ip,
    signer_location = _signer_location,
    signature_image = _signature_image,
    signed_pdf_url = COALESCE(_signed_pdf_url, signed_pdf_url),
    signed_at = now(),
    status = 'assinado'
  WHERE id = v_sig.id;

  IF v_sig.document_type = 'contrato' THEN
    UPDATE public.contracts 
      SET status = 'assinado', 
          signed_pdf_url = COALESCE(_signed_pdf_url, signed_pdf_url)
      WHERE id = v_sig.document_id;
  ELSE
    UPDATE public.budget_quotes SET status = 'aceito' WHERE id = v_sig.document_id;
  END IF;
  RETURN TRUE;
END $$;
GRANT EXECUTE ON FUNCTION public.sign_document(text, text, text, text, text, text) TO anon, authenticated;
