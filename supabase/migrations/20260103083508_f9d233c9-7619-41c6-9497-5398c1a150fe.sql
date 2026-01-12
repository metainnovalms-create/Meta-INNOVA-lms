-- Create news_and_feeds table
CREATE TABLE public.news_and_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('news', 'feed')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_audience TEXT[] NOT NULL DEFAULT ARRAY['all']::TEXT[],
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_news_feeds_type ON public.news_and_feeds(type);
CREATE INDEX idx_news_feeds_status ON public.news_and_feeds(status);
CREATE INDEX idx_news_feeds_created_at ON public.news_and_feeds(created_at DESC);
CREATE INDEX idx_news_feeds_published_at ON public.news_and_feeds(published_at DESC);
CREATE INDEX idx_news_feeds_institution_id ON public.news_and_feeds(institution_id);

-- Enable RLS
ALTER TABLE public.news_and_feeds ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all posts
CREATE POLICY "Super admins can manage all news and feeds"
ON public.news_and_feeds
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can manage all posts
CREATE POLICY "System admins can manage all news and feeds"
ON public.news_and_feeds
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Management can view published posts
CREATE POLICY "Management can view published news and feeds"
ON public.news_and_feeds
FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND status = 'published'
  AND (expires_at IS NULL OR expires_at > now())
  AND ('all' = ANY(target_audience) OR 'management' = ANY(target_audience))
);

-- Officers can view published posts
CREATE POLICY "Officers can view published news and feeds"
ON public.news_and_feeds
FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND status = 'published'
  AND (expires_at IS NULL OR expires_at > now())
  AND ('all' = ANY(target_audience) OR 'officer' = ANY(target_audience))
);

-- Students can view published posts
CREATE POLICY "Students can view published news and feeds"
ON public.news_and_feeds
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND status = 'published'
  AND (expires_at IS NULL OR expires_at > now())
  AND ('all' = ANY(target_audience) OR 'student' = ANY(target_audience))
);

-- Teachers can view published posts
CREATE POLICY "Teachers can view published news and feeds"
ON public.news_and_feeds
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND status = 'published'
  AND (expires_at IS NULL OR expires_at > now())
  AND ('all' = ANY(target_audience) OR 'teacher' = ANY(target_audience))
);

-- Create storage bucket for news feed images
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-feeds-images', 'news-feeds-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for news feed images
CREATE POLICY "Anyone can view news feed images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-feeds-images');

CREATE POLICY "Admins can upload news feed images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'news-feeds-images' 
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role))
);

CREATE POLICY "Admins can delete news feed images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'news-feeds-images' 
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role))
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_and_feeds;
ALTER TABLE public.news_and_feeds REPLICA IDENTITY FULL;

-- Create updated_at trigger
CREATE TRIGGER update_news_and_feeds_updated_at
BEFORE UPDATE ON public.news_and_feeds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();