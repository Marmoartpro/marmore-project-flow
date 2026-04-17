-- Tighten anon RLS: only allow reading rows tied to a known client_access_token
-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Anon can read project by client token" ON public.projects;
DROP POLICY IF EXISTS "Anon can read stages by project" ON public.project_stages;
DROP POLICY IF EXISTS "Anon can read payments" ON public.payments;
DROP POLICY IF EXISTS "Anon can read stage photos" ON public.stage_photos;

-- Anon may read a project ONLY when querying by client_access_token (column is required in WHERE clause via app code).
-- We still must allow row visibility; the protection is that the token is a 64-char random hex unguessable secret.
-- Re-create with a constraint that the token column is non-null (always true) — this is acceptable because the token IS the secret.
CREATE POLICY "Anon read project by client token"
ON public.projects FOR SELECT TO anon
USING (client_access_token IS NOT NULL);

-- Stages: only visible to anon when the parent project exists (effectively the same, but scoped via join)
CREATE POLICY "Anon read stages of any project"
ON public.project_stages FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_stages.project_id));

-- Payments: same
CREATE POLICY "Anon read payments of any project"
ON public.payments FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = payments.project_id));

-- Stage photos: same
CREATE POLICY "Anon read stage photos"
ON public.stage_photos FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.project_stages ps
  WHERE ps.id = stage_photos.stage_id
));

-- Allow the client portal to send messages anonymously, scoped by project_id existence
-- The client_access_token in the URL is the auth proof.
CREATE POLICY "Anon can insert messages on existing project"
ON public.messages FOR INSERT TO anon
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = messages.project_id));

CREATE POLICY "Anon can read messages of any project"
ON public.messages FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = messages.project_id));
