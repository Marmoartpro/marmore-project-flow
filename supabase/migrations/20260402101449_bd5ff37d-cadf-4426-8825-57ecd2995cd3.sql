
-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  budget_quote_id UUID REFERENCES public.budget_quotes(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_cpf_cnpj TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  company_cnpj TEXT DEFAULT '',
  company_address TEXT DEFAULT '',
  company_responsible TEXT DEFAULT '',
  company_phone TEXT DEFAULT '',
  contract_number TEXT NOT NULL,
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  warranty_days INTEGER NOT NULL DEFAULT 90,
  total_value NUMERIC NOT NULL DEFAULT 0,
  payment_conditions TEXT DEFAULT '',
  scope_description TEXT DEFAULT '',
  exclusions TEXT DEFAULT 'Cubas, torneiras, rejunte e instalação hidráulica não estão inclusos nesta proposta.',
  cancellation_policy TEXT DEFAULT 'Em caso de cancelamento após aprovação, será cobrada multa de 30% sobre o valor total do contrato.',
  additional_clauses TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'rascunho',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Digital signatures table
CREATE TABLE public.digital_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'orcamento',
  document_id UUID NOT NULL,
  sign_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  signer_name TEXT DEFAULT '',
  signer_ip TEXT DEFAULT '',
  signer_location TEXT DEFAULT '',
  signature_image TEXT DEFAULT '',
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage signatures" ON public.digital_signatures
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Anyone can view signature by token" ON public.digital_signatures
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can update signature by token" ON public.digital_signatures
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
