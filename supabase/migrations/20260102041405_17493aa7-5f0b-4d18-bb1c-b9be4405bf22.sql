-- Allow anonymous users to view open job postings
CREATE POLICY "Anyone can view open job postings"
ON public.job_postings FOR SELECT
USING (status = 'open');

-- Allow anonymous users to view interview stages for open jobs
CREATE POLICY "Anyone can view interview stages for open jobs"
ON public.interview_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings 
    WHERE id = job_id AND status = 'open'
  )
);

-- Allow anonymous users to submit job applications
CREATE POLICY "Anyone can submit job applications"
ON public.job_applications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.job_postings 
    WHERE id = job_id AND status = 'open'
  )
);

-- Allow anonymous users to upload resumes to hr-documents bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hr-documents' 
  AND (storage.foldername(name))[1] = 'resumes'
);

-- Allow anyone to read resumes (for HR to download)
CREATE POLICY "Anyone can read resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hr-documents' 
  AND (storage.foldername(name))[1] = 'resumes'
);