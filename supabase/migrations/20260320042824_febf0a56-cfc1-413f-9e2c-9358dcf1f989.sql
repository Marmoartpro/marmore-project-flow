
-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('marmorista', 'arquiteta');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'marmorista',
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  cau TEXT,
  instagram TEXT,
  website TEXT,
  specialty TEXT,
  city TEXT,
  office_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  environment_type TEXT,
  deadline DATE,
  address TEXT,
  stone_type TEXT,
  stone_color TEXT,
  thickness TEXT,
  finish TEXT,
  pieces TEXT,
  observations TEXT,
  total_value NUMERIC(12,2) DEFAULT 0,
  paid_value NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  owner_logo_url TEXT,
  architect_logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create project invites table
CREATE TABLE public.project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  architect_name TEXT,
  architect_email TEXT NOT NULL,
  architect_phone TEXT,
  architect_office TEXT,
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted BOOLEAN DEFAULT false,
  architect_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;

-- Create project stages table
CREATE TABLE public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 5),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage_number)
);

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Create stage photos
CREATE TABLE public.stage_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stage_photos ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create plant annotations table
CREATE TABLE public.plant_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  x_position NUMERIC NOT NULL,
  y_position NUMERIC NOT NULL,
  comment TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plant_annotations ENABLE ROW LEVEL SECURITY;

-- Helper function to check project access
CREATE OR REPLACE FUNCTION public.user_has_project_access(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_uuid AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM public.project_invites WHERE project_id = project_uuid AND architect_user_id = auth.uid() AND accepted = true
  );
$$;

-- Projects RLS
CREATE POLICY "Owner can do everything" ON public.projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Architect can view assigned projects" ON public.projects FOR SELECT TO authenticated USING (public.user_has_project_access(id));

-- Project invites RLS
CREATE POLICY "Owner can manage invites" ON public.project_invites FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));
CREATE POLICY "Anyone can view invite by token" ON public.project_invites FOR SELECT USING (true);
CREATE POLICY "Authenticated can update invites" ON public.project_invites FOR UPDATE TO authenticated USING (true);

-- Stages RLS
CREATE POLICY "Members can view stages" ON public.project_stages FOR SELECT TO authenticated USING (public.user_has_project_access(project_id));
CREATE POLICY "Owner can manage stages" ON public.project_stages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

-- Stage photos RLS
CREATE POLICY "Members can view photos" ON public.stage_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_stages ps WHERE ps.id = stage_id AND public.user_has_project_access(ps.project_id)));
CREATE POLICY "Owner can manage photos" ON public.stage_photos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.project_stages ps JOIN public.projects p ON p.id = ps.project_id WHERE ps.id = stage_id AND p.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.project_stages ps JOIN public.projects p ON p.id = ps.project_id WHERE ps.id = stage_id AND p.owner_id = auth.uid()));

-- Payments RLS
CREATE POLICY "Members can view payments" ON public.payments FOR SELECT TO authenticated USING (public.user_has_project_access(project_id));
CREATE POLICY "Owner can manage payments" ON public.payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

-- Messages RLS
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT TO authenticated USING (public.user_has_project_access(project_id));
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (public.user_has_project_access(project_id) AND auth.uid() = sender_id);

-- Plant annotations RLS
CREATE POLICY "Members can view annotations" ON public.plant_annotations FOR SELECT TO authenticated USING (public.user_has_project_access(project_id));
CREATE POLICY "Members can add annotations" ON public.plant_annotations FOR INSERT TO authenticated WITH CHECK (public.user_has_project_access(project_id) AND auth.uid() = author_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create 5 stages on project creation
CREATE OR REPLACE FUNCTION public.create_project_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_stages (project_id, stage_number, name) VALUES
    (NEW.id, 1, 'Chegada da chapa'),
    (NEW.id, 2, 'Planejamento de corte'),
    (NEW.id, 3, 'Corte'),
    (NEW.id, 4, 'Montagem'),
    (NEW.id, 5, 'Acabamento final');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_project_stages();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON public.project_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

CREATE POLICY "Auth users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Public can view" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Auth users can update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project-files');
CREATE POLICY "Auth users can delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-files');
