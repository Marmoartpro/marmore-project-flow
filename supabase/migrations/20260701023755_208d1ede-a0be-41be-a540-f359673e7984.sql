
-- Deduplicate stones by (owner_id, name), keeping the row with a photo (preferred) and most recent.
-- Reassign child records to the kept row before deleting duplicates.

WITH ranked AS (
  SELECT id, owner_id, name,
    ROW_NUMBER() OVER (
      PARTITION BY owner_id, name
      ORDER BY (photo_url IS NOT NULL) DESC, created_at DESC
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY owner_id, name
      ORDER BY (photo_url IS NOT NULL) DESC, created_at DESC
    ) AS keeper_id
  FROM public.stones
),
losers AS (
  SELECT id, keeper_id FROM ranked WHERE rn > 1
)
UPDATE public.stone_photos sp
   SET stone_id = l.keeper_id
  FROM losers l
 WHERE sp.stone_id = l.id;

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY owner_id, name ORDER BY (photo_url IS NOT NULL) DESC, created_at DESC) AS rn,
    FIRST_VALUE(id) OVER (PARTITION BY owner_id, name ORDER BY (photo_url IS NOT NULL) DESC, created_at DESC) AS keeper_id
  FROM public.stones
),
losers AS (SELECT id, keeper_id FROM ranked WHERE rn > 1)
UPDATE public.ai_image_generations a
   SET stone_id = l.keeper_id
  FROM losers l
 WHERE a.stone_id = l.id;

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY owner_id, name ORDER BY (photo_url IS NOT NULL) DESC, created_at DESC) AS rn
  FROM public.stones
)
DELETE FROM public.stones s
 USING ranked r
 WHERE s.id = r.id AND r.rn > 1;

-- Prevent future duplicates per owner
CREATE UNIQUE INDEX IF NOT EXISTS stones_owner_name_unique ON public.stones (owner_id, name);
