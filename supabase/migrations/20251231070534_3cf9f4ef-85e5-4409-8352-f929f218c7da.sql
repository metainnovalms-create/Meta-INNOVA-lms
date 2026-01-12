-- Create the bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Students can upload their own submissions
CREATE POLICY "Students can upload assignment submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Officers/admins can view all submissions
CREATE POLICY "Officers and admins can view all assignment submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-submissions' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('officer', 'system_admin', 'super_admin')
  )
);

-- RLS policy: Students can update/replace their own submissions
CREATE POLICY "Students can update own assignment submissions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);