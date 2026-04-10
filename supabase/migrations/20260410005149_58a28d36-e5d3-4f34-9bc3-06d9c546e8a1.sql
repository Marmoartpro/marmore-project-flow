
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_text text DEFAULT '';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_pdf_url text DEFAULT '';
ALTER TABLE public.digital_signatures ADD COLUMN IF NOT EXISTS signed_pdf_url text DEFAULT '';

-- Allow anonymous users to read contracts by ID (needed for public signature page)
CREATE POLICY "Anon can read contract for signing"
ON public.contracts
FOR SELECT
TO anon
USING (true);
