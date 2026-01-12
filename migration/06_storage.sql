-- ============================================
-- Meta-INNOVA LMS - Storage Buckets
-- ============================================

-- Create all storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('assessment-images', 'assessment-images', true),
  ('assignment-submissions', 'assignment-submissions', true),
  ('course-content', 'course-content', false),
  ('crm-attachments', 'crm-attachments', true),
  ('event-files', 'event-files', true),
  ('hr-documents', 'hr-documents', false),
  ('invoice-assets', 'invoice-assets', true),
  ('news-feeds-images', 'news-feeds-images', true),
  ('newsletters', 'newsletters', true),
  ('officer-documents', 'officer-documents', true),
  ('profile-photos', 'profile-photos', true),
  ('project-files', 'project-files', true),
  ('site-assets', 'site-assets', true),
  ('staff-documents', 'staff-documents', true),
  ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for Public Buckets
-- ============================================

-- Assessment Images - Public read, authenticated upload
CREATE POLICY "Assessment images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'assessment-images');

CREATE POLICY "Authenticated users can upload assessment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assessment-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update assessment images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assessment-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete assessment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'assessment-images' AND auth.role() = 'authenticated');

-- Assignment Submissions - Public read, authenticated upload
CREATE POLICY "Assignment submissions are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Authenticated users can upload assignment submissions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assignment-submissions' AND auth.role() = 'authenticated');

-- Course Content - Private, authenticated access only
CREATE POLICY "Authenticated users can access course content"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-content' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update course content"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-content' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete course content"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-content' AND auth.role() = 'authenticated');

-- CRM Attachments - Public read
CREATE POLICY "CRM attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'crm-attachments');

CREATE POLICY "Authenticated users can upload crm attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crm-attachments' AND auth.role() = 'authenticated');

-- Event Files - Public read
CREATE POLICY "Event files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-files');

CREATE POLICY "Authenticated users can upload event files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-files' AND auth.role() = 'authenticated');

-- HR Documents - Private
CREATE POLICY "Authenticated users can access hr documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'hr-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload hr documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hr-documents' AND auth.role() = 'authenticated');

-- Invoice Assets - Public read
CREATE POLICY "Invoice assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-assets');

CREATE POLICY "Authenticated users can upload invoice assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoice-assets' AND auth.role() = 'authenticated');

-- News Feeds Images - Public read
CREATE POLICY "News feeds images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-feeds-images');

CREATE POLICY "Authenticated users can upload news feeds images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-feeds-images' AND auth.role() = 'authenticated');

-- Newsletters - Public read
CREATE POLICY "Newsletters are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'newsletters');

CREATE POLICY "Authenticated users can upload newsletters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'newsletters' AND auth.role() = 'authenticated');

-- Officer Documents - Public read
CREATE POLICY "Officer documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'officer-documents');

CREATE POLICY "Authenticated users can upload officer documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'officer-documents' AND auth.role() = 'authenticated');

-- Profile Photos - Public read, user can manage own
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

-- Project Files - Public read
CREATE POLICY "Project files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

-- Site Assets - Public read
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "Authenticated users can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- Staff Documents - Public read
CREATE POLICY "Staff documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated users can upload staff documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'staff-documents' AND auth.role() = 'authenticated');

-- Task Attachments - Public read
CREATE POLICY "Task attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');
