
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  role public.user_role NOT NULL DEFAULT 'vendedor',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  invite_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  invite_expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Member can view own record"
  ON public.team_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  role text,
  page_accessed text,
  action text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read access logs"
  ON public.access_logs FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated can insert access logs"
  ON public.access_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_default_permissions(p_role public.user_role)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE p_role
    WHEN 'marmorista' THEN '{"dashboard":true,"projetos":true,"projetos_financeiro":true,"orcamentos":true,"orcamentos_editar":true,"clientes":true,"financeiro":true,"mostruario":true,"fornecedores":true,"contratos":true,"relatorios":true,"equipe":true,"estoque":true,"calculadora":true}'::jsonb
    WHEN 'admin' THEN '{"dashboard":true,"projetos":true,"projetos_financeiro":true,"orcamentos":true,"orcamentos_editar":true,"clientes":true,"financeiro":true,"mostruario":true,"fornecedores":true,"contratos":true,"relatorios":true,"equipe":true,"estoque":true,"calculadora":true}'::jsonb
    WHEN 'arquiteta' THEN '{"dashboard":false,"projetos":true,"projetos_financeiro":false,"orcamentos":false,"orcamentos_editar":false,"clientes":false,"financeiro":false,"mostruario":true,"fornecedores":false,"contratos":false,"relatorios":false,"equipe":false,"estoque":false,"calculadora":false}'::jsonb
    WHEN 'cliente' THEN '{"dashboard":false,"projetos":false,"projetos_financeiro":false,"projetos_cliente":true,"orcamentos":false,"orcamentos_editar":false,"clientes":false,"financeiro":false,"mostruario":false,"fornecedores":false,"contratos":false,"relatorios":false,"equipe":false,"estoque":false,"calculadora":false}'::jsonb
    WHEN 'instalador' THEN '{"dashboard":false,"projetos":true,"projetos_financeiro":false,"orcamentos":false,"orcamentos_editar":false,"clientes":false,"financeiro":false,"mostruario":false,"fornecedores":false,"contratos":false,"relatorios":false,"equipe":false,"estoque":false,"calculadora":false}'::jsonb
    WHEN 'vendedor' THEN '{"dashboard":false,"projetos":false,"projetos_financeiro":false,"orcamentos":true,"orcamentos_editar":true,"clientes":true,"financeiro":false,"mostruario":true,"fornecedores":false,"contratos":false,"relatorios":false,"equipe":false,"estoque":false,"calculadora":true}'::jsonb
    WHEN 'rh' THEN '{"dashboard":false,"projetos":false,"projetos_financeiro":false,"orcamentos":false,"orcamentos_editar":false,"clientes":false,"financeiro":false,"mostruario":false,"fornecedores":false,"contratos":false,"relatorios":true,"equipe":true,"estoque":false,"calculadora":false}'::jsonb
    ELSE '{}'::jsonb
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_invite_by_token(token_param text)
RETURNS TABLE(
  id uuid, owner_id uuid, name text, email text, whatsapp text,
  role public.user_role, permissions jsonb, invite_expires_at timestamptz,
  accepted_at timestamptz, owner_name text, active boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT tm.id, tm.owner_id, tm.name, tm.email, tm.whatsapp,
    tm.role, tm.permissions, tm.invite_expires_at, tm.accepted_at,
    p.full_name AS owner_name, tm.active
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.user_id = tm.owner_id
  WHERE tm.invite_token = token_param LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invite(token_param text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  member_row public.team_members%ROWTYPE;
  profile_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  SELECT * INTO member_row FROM public.team_members WHERE invite_token = token_param LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite não encontrado'; END IF;
  IF member_row.accepted_at IS NOT NULL AND member_row.user_id IS NOT NULL AND member_row.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Este convite já foi aceito por outra conta';
  END IF;
  IF member_row.invite_expires_at < now() AND member_row.accepted_at IS NULL THEN
    RAISE EXCEPTION 'Este convite expirou';
  END IF;
  IF member_row.accepted_at IS NOT NULL THEN RETURN member_row.owner_id; END IF;
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid()) INTO profile_exists;
  IF profile_exists THEN
    UPDATE public.profiles SET role = member_row.role,
      full_name = COALESCE(NULLIF(full_name, ''), member_row.name),
      phone = COALESCE(phone, member_row.whatsapp), updated_at = now()
    WHERE user_id = auth.uid();
  ELSE
    INSERT INTO public.profiles (user_id, role, full_name, phone)
    VALUES (auth.uid(), member_row.role, member_row.name, member_row.whatsapp);
  END IF;
  UPDATE public.team_members SET user_id = auth.uid(), accepted_at = now() WHERE id = member_row.id;
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (member_row.owner_id, 'Novo membro na equipe',
    format('%s aceitou o convite como %s.', member_row.name, member_row.role::text));
  RETURN member_row.owner_id;
END;
$$;
