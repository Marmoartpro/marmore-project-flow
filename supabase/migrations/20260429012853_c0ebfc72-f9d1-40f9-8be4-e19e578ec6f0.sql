
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  type text NOT NULL DEFAULT 'compromisso',
  color text DEFAULT '#3b82f6',
  project_id uuid,
  client_id uuid,
  reminder_minutes integer DEFAULT 60,
  status text NOT NULL DEFAULT 'agendado',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_owner_start ON public.appointments(owner_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_project ON public.appointments(project_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_appointments_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_appointments_updated_at();
