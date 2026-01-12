-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  display_order INTEGER DEFAULT 0,
  academic_year TEXT,
  capacity INTEGER DEFAULT 30,
  room_number TEXT,
  class_teacher_id UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL UNIQUE,
  roll_number TEXT,
  admission_number TEXT,
  student_name TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT DEFAULT 'male',
  blood_group TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  previous_school TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Classes RLS policies
CREATE POLICY "Super admins can manage all classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Management can view own institution classes"
ON public.classes FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Management can insert own institution classes"
ON public.classes FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Management can update own institution classes"
ON public.classes FOR UPDATE
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Management can delete own institution classes"
ON public.classes FOR DELETE
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Officers can view own institution classes"
ON public.classes FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Teachers can view own institution classes"
ON public.classes FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Students RLS policies
CREATE POLICY "Super admins can manage all students"
ON public.students FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all students"
ON public.students FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Management can view own institution students"
ON public.students FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Management can insert own institution students"
ON public.students FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Management can update own institution students"
ON public.students FOR UPDATE
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Management can delete own institution students"
ON public.students FOR DELETE
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Officers can view own institution students"
ON public.students FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Teachers can view own institution students"
ON public.students FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  institution_id IN (
    SELECT institution_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Students can view own profile"
ON public.students FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Students can update own profile"
ON public.students FOR UPDATE
USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_classes_institution_id ON public.classes(institution_id);
CREATE INDEX idx_students_institution_id ON public.students(institution_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_students_user_id ON public.students(user_id);