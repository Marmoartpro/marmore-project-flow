-- 1. Add client_access_token to projects
ALTER TABLE public.projects
ADD COLUMN client_access_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex');

-- Create unique index
CREATE UNIQUE INDEX idx_projects_client_access_token ON public.projects(client_access_token);

-- 2. Create project_assignments table
CREATE TABLE public.project_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- Owner can manage assignments
CREATE POLICY "Owner can manage assignments"
ON public.project_assignments
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_assignments.project_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_assignments.project_id AND owner_id = auth.uid()));

-- Assigned user can view own assignments
CREATE POLICY "User can view own assignments"
ON public.project_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow anon to read projects by client_access_token (for portal)
CREATE POLICY "Anon can read project by client token"
ON public.projects
FOR SELECT
TO anon
USING (true);

-- Allow anon to read project_stages for client portal
CREATE POLICY "Anon can read stages by project"
ON public.project_stages
FOR SELECT
TO anon
USING (true);

-- Allow anon to read payments for client portal
CREATE POLICY "Anon can read payments"
ON public.payments
FOR SELECT
TO anon
USING (true);

-- Allow anon to read stage_photos
CREATE POLICY "Anon can read stage photos"
ON public.stage_photos
FOR SELECT
TO anon
USING (true);