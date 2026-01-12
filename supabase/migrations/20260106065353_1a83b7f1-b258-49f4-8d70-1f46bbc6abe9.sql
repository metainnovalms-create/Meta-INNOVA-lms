-- Allow management users to read published reports for their institution
CREATE POLICY "Management can view published reports for their institution"
  ON reports
  FOR SELECT
  TO public
  USING (
    is_published = true 
    AND public.has_role(auth.uid(), 'management'::public.app_role)
    AND institution_id = public.get_user_institution_id(auth.uid())
  );