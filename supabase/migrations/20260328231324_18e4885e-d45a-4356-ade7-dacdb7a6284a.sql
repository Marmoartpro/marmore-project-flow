
-- Add company logo to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_logo_url text;

-- Create budget_quotes table for storing full budget calculator data
CREATE TABLE public.budget_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  quote_number text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  client_name text NOT NULL DEFAULT '',
  environment_type text,
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  validity_days integer NOT NULL DEFAULT 15,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal_materials numeric NOT NULL DEFAULT 0,
  subtotal_labor numeric NOT NULL DEFAULT 0,
  subtotal_accessories numeric NOT NULL DEFAULT 0,
  subtotal_installation numeric NOT NULL DEFAULT 0,
  profit_margin_percent numeric NOT NULL DEFAULT 30,
  discount numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'percent',
  total numeric NOT NULL DEFAULT 0,
  payment_conditions text,
  observations text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage budget quotes"
  ON public.budget_quotes FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Create pricing_defaults table for standard prices
CREATE TABLE public.pricing_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  price_key text NOT NULL,
  price_label text NOT NULL,
  price_value numeric NOT NULL DEFAULT 0,
  price_unit text NOT NULL DEFAULT 'un',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(owner_id, price_key)
);

ALTER TABLE public.pricing_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage pricing defaults"
  ON public.pricing_defaults FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
