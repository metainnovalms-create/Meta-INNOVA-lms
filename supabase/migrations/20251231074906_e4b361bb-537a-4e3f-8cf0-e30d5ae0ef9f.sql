-- Add RLS policies for management role on assessment tables

-- assessments table - Management can view institution assessments
CREATE POLICY "Management can view institution assessments"
  ON public.assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'management'::app_role) AND
    (
      institution_id = get_user_institution_id(auth.uid()) OR
      id IN (
        SELECT aca.assessment_id FROM assessment_class_assignments aca
        WHERE aca.institution_id = get_user_institution_id(auth.uid())
      )
    )
  );

-- assessment_class_assignments table
CREATE POLICY "Management can view institution class assignments"
  ON public.assessment_class_assignments FOR SELECT
  USING (
    has_role(auth.uid(), 'management'::app_role) AND
    institution_id = get_user_institution_id(auth.uid())
  );

-- assessment_attempts table
CREATE POLICY "Management can view institution attempts"
  ON public.assessment_attempts FOR SELECT
  USING (
    has_role(auth.uid(), 'management'::app_role) AND
    institution_id = get_user_institution_id(auth.uid())
  );

-- assessment_questions table
CREATE POLICY "Management can view assessment questions"
  ON public.assessment_questions FOR SELECT
  USING (
    has_role(auth.uid(), 'management'::app_role) AND
    assessment_id IN (
      SELECT aca.assessment_id FROM assessment_class_assignments aca
      WHERE aca.institution_id = get_user_institution_id(auth.uid())
    )
  );

-- assessment_answers table
CREATE POLICY "Management can view institution answers"
  ON public.assessment_answers FOR SELECT
  USING (
    has_role(auth.uid(), 'management'::app_role) AND
    attempt_id IN (
      SELECT id FROM assessment_attempts 
      WHERE institution_id = get_user_institution_id(auth.uid())
    )
  );