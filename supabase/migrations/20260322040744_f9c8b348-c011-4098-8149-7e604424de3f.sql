
DROP POLICY "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Project members can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = notifications.project_id
    AND (p.owner_id = auth.uid() OR public.user_has_project_access(p.id))
  )
);
