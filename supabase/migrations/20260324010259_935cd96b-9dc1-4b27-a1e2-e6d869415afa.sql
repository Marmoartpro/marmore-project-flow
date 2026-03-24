
-- Stage comments table
CREATE TABLE public.stage_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  has_alert boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stage_comments ENABLE ROW LEVEL SECURITY;

-- Members can view comments on stages they have access to
CREATE POLICY "Members can view stage comments" ON public.stage_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_stages ps
    WHERE ps.id = stage_comments.stage_id
    AND user_has_project_access(ps.project_id)
  ));

-- Members can insert comments on stages they have access to
CREATE POLICY "Members can insert stage comments" ON public.stage_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.project_stages ps
      WHERE ps.id = stage_comments.stage_id
      AND user_has_project_access(ps.project_id)
    )
  );

-- Add archived status to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
