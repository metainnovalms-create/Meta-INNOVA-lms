-- Drop old news_and_feeds table
DROP TABLE IF EXISTS news_and_feeds;

-- Create new newsletters table
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'published',
  target_audience TEXT[] NOT NULL DEFAULT '{all}',
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: System admins can do everything
CREATE POLICY "System admins can manage newsletters" ON newsletters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'system_admin')
    )
  );

-- RLS Policy: Everyone can read published newsletters
CREATE POLICY "Users can read published newsletters" ON newsletters
  FOR SELECT USING (status = 'published');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE newsletters;

-- Create newsletters storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletters', 'newsletters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can read newsletters
CREATE POLICY "Anyone can read newsletters" ON storage.objects
  FOR SELECT USING (bucket_id = 'newsletters');

-- Storage policy: System admins can upload newsletters
CREATE POLICY "System admins can upload newsletters" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'newsletters');

-- Storage policy: System admins can delete newsletters
CREATE POLICY "System admins can delete newsletters" ON storage.objects
  FOR DELETE USING (bucket_id = 'newsletters');