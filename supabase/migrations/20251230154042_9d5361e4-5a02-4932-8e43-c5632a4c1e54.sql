-- Create storage bucket for assessment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-images', 'assessment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for authenticated users to upload assessment images
CREATE POLICY "Authenticated users can upload assessment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assessment-images');

-- Policy for authenticated users to update their uploads
CREATE POLICY "Authenticated users can update assessment images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'assessment-images');

-- Public read access for assessment images
CREATE POLICY "Public can view assessment images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assessment-images');

-- Policy for authenticated users to delete assessment images
CREATE POLICY "Authenticated users can delete assessment images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assessment-images');