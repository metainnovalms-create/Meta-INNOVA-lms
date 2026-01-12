-- Add daily_streak XP rule
INSERT INTO xp_rules (activity, points, description, is_active)
VALUES ('daily_streak', 2, 'Points for daily login streak', true)
ON CONFLICT (activity) DO NOTHING;

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  submission_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  question_doc_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_role TEXT NOT NULL DEFAULT 'system_admin',
  institution_id UUID REFERENCES institutions(id),
  status TEXT NOT NULL DEFAULT 'draft',
  total_marks INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment class assignments table
CREATE TABLE IF NOT EXISTS assignment_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, class_id)
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  submission_pdf_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marks_obtained INTEGER,
  feedback TEXT,
  graded_by UUID,
  graded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'submitted',
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Assignments RLS policies
CREATE POLICY "System admins can manage all assignments" ON assignments
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Super admins can manage all assignments" ON assignments
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Officers can manage own institution assignments" ON assignments
  FOR ALL USING (
    has_role(auth.uid(), 'officer'::app_role) AND 
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Management can view institution assignments" ON assignments
  FOR SELECT USING (
    has_role(auth.uid(), 'management'::app_role) AND 
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Students can view published assignments" ON assignments
  FOR SELECT USING (
    has_role(auth.uid(), 'student'::app_role) AND 
    status = 'published' AND
    id IN (
      SELECT aca.assignment_id 
      FROM assignment_class_assignments aca
      JOIN profiles p ON p.class_id = aca.class_id
      WHERE p.id = auth.uid()
    )
  );

-- Assignment class assignments RLS
CREATE POLICY "System admins can manage all assignment class assignments" ON assignment_class_assignments
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Super admins can manage all assignment class assignments" ON assignment_class_assignments
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Officers can manage institution assignment class assignments" ON assignment_class_assignments
  FOR ALL USING (
    has_role(auth.uid(), 'officer'::app_role) AND 
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Management can view institution assignment class assignments" ON assignment_class_assignments
  FOR SELECT USING (
    has_role(auth.uid(), 'management'::app_role) AND 
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Students can view own class assignment assignments" ON assignment_class_assignments
  FOR SELECT USING (
    has_role(auth.uid(), 'student'::app_role) AND 
    class_id = (SELECT class_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Assignment submissions RLS
CREATE POLICY "System admins can manage all submissions" ON assignment_submissions
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Super admins can manage all submissions" ON assignment_submissions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Officers can manage institution submissions" ON assignment_submissions
  FOR ALL USING (
    has_role(auth.uid(), 'officer'::app_role) AND 
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Management can view institution submissions" ON assignment_submissions
  FOR SELECT USING (
    has_role(auth.uid(), 'management'::app_role) AND 
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Students can manage own submissions" ON assignment_submissions
  FOR ALL USING (
    has_role(auth.uid(), 'student'::app_role) AND 
    student_id = auth.uid()
  );

-- Add update trigger for assignments
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();