
-- Quotes table for orçamentos
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT,
  environment_type TEXT,
  stone_type TEXT,
  estimated_value NUMERIC DEFAULT 0,
  sent_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'aguardando',
  observations TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage quotes" ON public.quotes
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  city TEXT,
  service_type TEXT,
  observations TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Billing reminders table
CREATE TABLE public.billing_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  reminder_date DATE NOT NULL,
  expected_value NUMERIC DEFAULT 0,
  note TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage reminders" ON public.billing_reminders
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add payment_method and down_payment columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS down_payment NUMERIC DEFAULT 0;
