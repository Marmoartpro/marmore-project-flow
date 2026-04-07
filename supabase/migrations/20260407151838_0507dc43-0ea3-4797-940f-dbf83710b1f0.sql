
-- Add contract-relevant fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS cpf text DEFAULT '',
ADD COLUMN IF NOT EXISTS rg text DEFAULT '',
ADD COLUMN IF NOT EXISTS address_street text DEFAULT '',
ADD COLUMN IF NOT EXISTS address_number text DEFAULT '',
ADD COLUMN IF NOT EXISTS address_neighborhood text DEFAULT '',
ADD COLUMN IF NOT EXISTS address_city text DEFAULT '',
ADD COLUMN IF NOT EXISTS address_state text DEFAULT '',
ADD COLUMN IF NOT EXISTS address_cep text DEFAULT '';

-- Create contract_settings table for configurable contract defaults
CREATE TABLE IF NOT EXISTS public.contract_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  contractor_name text DEFAULT '',
  contractor_cpf text DEFAULT '',
  contractor_address text DEFAULT '',
  comarca text DEFAULT 'Sertãozinho/SP',
  multa_inadimplemento numeric DEFAULT 2,
  juros_mora numeric DEFAULT 1,
  honorarios_advocaticios numeric DEFAULT 20,
  clausula_penal_rescisao numeric DEFAULT 10,
  testemunha1_nome text DEFAULT '',
  testemunha1_cpf text DEFAULT '',
  testemunha2_nome text DEFAULT '',
  testemunha2_cpf text DEFAULT '',
  clausulas_adicionais text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE public.contract_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage contract settings"
ON public.contract_settings FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
