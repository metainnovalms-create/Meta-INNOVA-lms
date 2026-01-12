-- Add site branding configuration
INSERT INTO system_configurations (key, value, category, description) VALUES
('site_branding', '{
  "logo_expanded_url": "",
  "logo_collapsed_url": "",
  "favicon_url": "",
  "site_title": "Meta-INNOVA LMS",
  "site_description": "Meta-Innova Innovation Academy - Empowering Education Through Technology",
  "og_image_url": "",
  "primary_color": "#051c2d",
  "sidebar_logo_bg": "#2d437f"
}'::jsonb, 'branding', 'Site branding and SEO settings')
ON CONFLICT (key) DO NOTHING;

-- Create site-assets storage bucket for branding files
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to site-assets bucket
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow super_admin and system_admin to upload site assets
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow admins to update site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- Allow admins to delete site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');