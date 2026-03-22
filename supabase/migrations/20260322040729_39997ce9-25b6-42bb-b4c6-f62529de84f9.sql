
-- Stones/Mostruário table
CREATE TABLE public.stones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  origin text,
  colors text,
  thicknesses text,
  finishes text,
  usage_indication text,
  price_per_m2 numeric DEFAULT 0,
  promo_badge text,
  promo_active boolean DEFAULT false,
  pros text,
  cons text,
  observations text,
  photo_url text,
  in_stock boolean DEFAULT true,
  featured boolean DEFAULT false,
  is_global boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view stones" ON public.stones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can manage stones" ON public.stones FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  whatsapp text,
  email text,
  materials_supplied text,
  avg_delivery_days integer,
  observations text,
  rating integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Supplier purchases
CREATE TABLE public.supplier_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  material text NOT NULL,
  quantity text,
  amount numeric DEFAULT 0,
  purchase_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage purchases" ON public.supplier_purchases FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Portfolio photos
CREATE TABLE public.portfolio_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  photo_url text NOT NULL,
  caption text,
  environment_type text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  is_before boolean DEFAULT false,
  pair_id uuid,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage portfolio" ON public.portfolio_photos FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Public can view portfolio" ON public.portfolio_photos FOR SELECT TO anon USING (true);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "User can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Project materials (calculator results)
CREATE TABLE public.project_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid NOT NULL,
  description text NOT NULL,
  width_m numeric NOT NULL,
  length_m numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  area_m2 numeric NOT NULL,
  area_with_margin numeric NOT NULL,
  price_per_m2 numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage materials" ON public.project_materials FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Add portfolio_slug to profiles for public portfolio URL
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_slug text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_whatsapp text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_city text;

-- Add status/expired_at to project_invites
ALTER TABLE public.project_invites ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente';
ALTER TABLE public.project_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');
