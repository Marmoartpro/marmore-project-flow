-- Fix Pedrolps profile back to marmorista (the owner)
UPDATE public.profiles 
SET role = 'marmorista' 
WHERE user_id = '6d8f9375-772a-40c3-a619-430300bb2970';

-- Recreate the accept_project_invite function with better role protection
CREATE OR REPLACE FUNCTION public.accept_project_invite(invite_token_param text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_row public.project_invites%ROWTYPE;
  owner_user_id uuid;
  full_name_value text;
  auth_email text;
  project_name_value text;
  current_role public.user_role;
  profile_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  auth_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  SELECT *
  INTO invite_row
  FROM public.project_invites
  WHERE invite_token = invite_token_param
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado';
  END IF;

  SELECT p.owner_id INTO owner_user_id
  FROM public.projects p WHERE p.id = invite_row.project_id;

  IF owner_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode aceitar um convite do seu próprio projeto';
  END IF;

  IF coalesce(invite_row.architect_email, '') <> ''
     AND lower(invite_row.architect_email) <> auth_email THEN
    RAISE EXCEPTION 'Este convite pertence a outro e-mail';
  END IF;

  IF invite_row.expires_at IS NOT NULL
     AND invite_row.expires_at < now()
     AND coalesce(invite_row.accepted, false) = false THEN
    UPDATE public.project_invites SET status = 'expirado' WHERE id = invite_row.id;
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
    invite_row.architect_name,
    auth.jwt() ->> 'email',
    'Arquiteta'
  );

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid()) INTO profile_exists;
  
  IF profile_exists THEN
    SELECT role INTO current_role FROM public.profiles WHERE user_id = auth.uid();
    
    IF current_role = 'marmorista' THEN
      UPDATE public.profiles
      SET full_name = coalesce(nullif(full_name, ''), full_name_value),
          updated_at = now()
      WHERE user_id = auth.uid();
    ELSE
      UPDATE public.profiles
      SET role = 'arquiteta',
          full_name = coalesce(nullif(full_name, ''), full_name_value),
          office_name = coalesce(office_name, invite_row.architect_office),
          phone = coalesce(phone, invite_row.architect_phone),
          updated_at = now()
      WHERE user_id = auth.uid();
    END IF;
  ELSE
    INSERT INTO public.profiles (user_id, role, full_name, office_name, phone)
    VALUES (auth.uid(), 'arquiteta', full_name_value, invite_row.architect_office, invite_row.architect_phone);
  END IF;

  UPDATE public.project_invites
  SET accepted = true,
      architect_user_id = auth.uid(),
      status = 'aceito'
  WHERE id = invite_row.id;

  SELECT p.name INTO project_name_value
  FROM public.projects p WHERE p.id = invite_row.project_id;

  IF owner_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, project_id, title, message)
    VALUES (
      owner_user_id,
      invite_row.project_id,
      'Convite aceito',
      format('Arq. %s aceitou o convite e já tem acesso ao projeto %s.', full_name_value, coalesce(project_name_value, ''))
    );
  END IF;

  RETURN invite_row.project_id;
END;
$function$;