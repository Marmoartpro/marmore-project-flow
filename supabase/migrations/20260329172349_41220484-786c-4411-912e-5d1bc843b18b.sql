
-- Create mostruario bucket for stone photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('mostruario', 'mostruario', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for mostruario bucket
CREATE POLICY "Authenticated users can view mostruario files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'mostruario');

CREATE POLICY "Anon can view mostruario files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'mostruario');

CREATE POLICY "Authenticated users can upload mostruario files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mostruario');

CREATE POLICY "Authenticated users can update mostruario files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mostruario');

CREATE POLICY "Authenticated users can delete mostruario files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mostruario');
