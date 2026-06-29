
ALTER TABLE public.stones
  ADD COLUMN IF NOT EXISTS imagem_chapa_ia text,
  ADD COLUMN IF NOT EXISTS imagem_cozinha_ia text,
  ADD COLUMN IF NOT EXISTS imagem_banheiro_ia text,
  ADD COLUMN IF NOT EXISTS imagens_geradas_por_ia jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_image_monthly_limit integer NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS public.ai_image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  stone_id uuid NOT NULL REFERENCES public.stones(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('chapa','cozinha','banheiro')),
  image_url text NOT NULL,
  prompt text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_image_gen_owner_month ON public.ai_image_generations (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_image_gen_stone_kind ON public.ai_image_generations (stone_id, kind, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.ai_image_generations TO authenticated;
GRANT ALL ON public.ai_image_generations TO service_role;

ALTER TABLE public.ai_image_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view their ai image generations"
  ON public.ai_image_generations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert ai image generations"
  ON public.ai_image_generations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete ai image generations"
  ON public.ai_image_generations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
