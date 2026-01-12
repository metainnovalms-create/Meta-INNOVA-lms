-- Create the webinars table
CREATE TABLE public.webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  guest_name text,
  guest_details text,
  webinar_date timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can view active webinars
CREATE POLICY "Authenticated users can view active webinars"
ON public.webinars
FOR SELECT
TO authenticated
USING (is_active = true);

-- ALL: system_admin and super_admin can manage all webinars
CREATE POLICY "System admins can manage all webinars"
ON public.webinars
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Super admins can manage all webinars"
ON public.webinars
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_webinars_updated_at
  BEFORE UPDATE ON public.webinars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';