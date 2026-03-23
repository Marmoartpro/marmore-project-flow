DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.project_invites;
DROP POLICY IF EXISTS "Architect can accept invite" ON public.project_invites;

CREATE POLICY "Invited architect can view own invites"
ON public.project_invites
FOR SELECT
TO authenticated
USING (
  architect_user_id = auth.uid()
  OR lower(coalesce(architect_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_invites.project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.get_project_invite_by_token(invite_token_param text)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  architect_name text,
  architect_email text,
  architect_phone text,
  architect_office text,
  accepted boolean,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  project_name text,
  client_name text,
  owner_id uuid,
  architect_user_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.project_id,
    pi.architect_name,
    pi.architect_email,
    pi.architect_phone,
    pi.architect_office,
    pi.accepted,
    pi.status,
    pi.expires_at,
    pi.created_at,
    p.name AS project_name,
    p.client_name,
    p.owner_id,
    pi.architect_user_id
  FROM public.project_invites pi
  JOIN public.projects p ON p.id = pi.project_id
  WHERE pi.invite_token = invite_token_param
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_invite_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_project_invite(invite_token_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_row public.project_invites%ROWTYPE;
  owner_user_id uuid;
  full_name_value text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT *
  INTO invite_row
  FROM public.project_invites
  WHERE invite_token = invite_token_param
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado';
  END IF;

  IF invite_row.expires_at IS NOT NULL
     AND invite_row.expires_at < now()
     AND coalesce(invite_row.accepted, false) = false THEN
    UPDATE public.project_invites
    SET status = 'expirado'
    WHERE id = invite_row.id;

    RAISE EXCEPTION 'Este convite expirou';
  END IF;

  IF coalesce(invite_row.accepted, false) = true THEN
    IF invite_row.architect_user_id IS NOT NULL
       AND invite_row.architect_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Este convite já foi aceito por outra conta';
    END IF;

    RETURN invite_row.project_id;
  END IF;

  full_name_value := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    auth.jwt() ->> 'email',
    invite_row.architect_name,
    'Arquiteta'
  );

  UPDATE public.profiles
  SET role = 'arquiteta',
      full_name = coalesce(nullif(full_name, ''), full_name_value),
      office_name = coalesce(office_name, invite_row.architect_office),
      phone = coalesce(phone, invite_row.architect_phone),
      updated_at = now()
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, role, full_name, office_name, phone)
    VALUES (auth.uid(), 'arquiteta', full_name_value, invite_row.architect_office, invite_row.architect_phone);
  END IF;

  UPDATE public.project_invites
  SET accepted = true,
      architect_user_id = auth.uid(),
      status = 'aceito'
  WHERE id = invite_row.id;

  SELECT p.owner_id
  INTO owner_user_id
  FROM public.projects p
  WHERE p.id = invite_row.project_id;

  IF owner_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, project_id, title, message)
    VALUES (
      owner_user_id,
      invite_row.project_id,
      'Convite aceito',
      format('Arq. %s aceitou o convite e já tem acesso ao projeto.', full_name_value)
    );
  END IF;

  RETURN invite_row.project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_project_invite(text) TO authenticated;