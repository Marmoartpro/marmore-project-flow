CREATE TABLE IF NOT EXISTS public.nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text,
  would_recommend boolean,
  google_review_clicked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit nps via project token"
ON public.nps_responses FOR INSERT TO anon
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id));

CREATE POLICY "Owner can view nps responses"
ON public.nps_responses FOR SELECT TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Anon can update own nps for google review"
ON public.nps_responses FOR UPDATE TO anon
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id));

CREATE INDEX IF NOT EXISTS idx_nps_owner ON public.nps_responses(owner_id);
CREATE INDEX IF NOT EXISTS idx_nps_project ON public.nps_responses(project_id);