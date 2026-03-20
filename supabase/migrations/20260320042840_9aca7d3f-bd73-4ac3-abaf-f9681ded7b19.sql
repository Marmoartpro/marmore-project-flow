
-- Fix the overly permissive UPDATE policy on project_invites
DROP POLICY "Authenticated can update invites" ON public.project_invites;

CREATE POLICY "Architect can accept invite" ON public.project_invites 
  FOR UPDATE TO authenticated 
  USING (architect_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (architect_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
