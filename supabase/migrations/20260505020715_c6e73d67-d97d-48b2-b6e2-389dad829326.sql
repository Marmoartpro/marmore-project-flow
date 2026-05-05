-- Table to store PDF history per budget quote
CREATE TABLE public.quote_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  quote_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_pdfs_quote_id ON public.quote_pdfs(quote_id);
CREATE INDEX idx_quote_pdfs_owner_id ON public.quote_pdfs(owner_id);

ALTER TABLE public.quote_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage quote pdfs"
ON public.quote_pdfs
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-pdfs', 'quote-pdfs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read quote pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-pdfs');

CREATE POLICY "Owner can upload quote pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quote-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can update own quote pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'quote-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can delete own quote pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quote-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);