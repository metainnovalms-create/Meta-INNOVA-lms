-- Make officer-documents bucket public for profile photos and documents
UPDATE storage.buckets SET public = true WHERE id = 'officer-documents';

-- Add RLS policy for public read access to officer documents
CREATE POLICY "Public read access for officer documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'officer-documents');