-- Add secondary and backup officer columns to timetable assignments
ALTER TABLE institution_timetable_assignments 
ADD COLUMN IF NOT EXISTS secondary_officer_id UUID,
ADD COLUMN IF NOT EXISTS secondary_officer_name TEXT,
ADD COLUMN IF NOT EXISTS backup_officer_id UUID,
ADD COLUMN IF NOT EXISTS backup_officer_name TEXT;

-- Create officer class access grants table for delegation
CREATE TABLE IF NOT EXISTS public.officer_class_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  granting_officer_id UUID NOT NULL,
  receiving_officer_id UUID NOT NULL,
  class_id UUID NOT NULL,
  institution_id UUID NOT NULL,
  timetable_assignment_id UUID,
  access_type TEXT NOT NULL DEFAULT 'temporary' CHECK (access_type IN ('temporary', 'permanent')),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_granting_officer FOREIGN KEY (granting_officer_id) REFERENCES officers(id) ON DELETE CASCADE,
  CONSTRAINT fk_receiving_officer FOREIGN KEY (receiving_officer_id) REFERENCES officers(id) ON DELETE CASCADE,
  CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_timetable_assignment FOREIGN KEY (timetable_assignment_id) REFERENCES institution_timetable_assignments(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.officer_class_access_grants ENABLE ROW LEVEL SECURITY;

-- RLS policies for officer_class_access_grants
CREATE POLICY "Officers can view own grants" ON public.officer_class_access_grants
FOR SELECT USING (
  granting_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()) OR
  receiving_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
);

CREATE POLICY "Officers can create grants for own classes" ON public.officer_class_access_grants
FOR INSERT WITH CHECK (
  granting_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
);

CREATE POLICY "Officers can update own grants" ON public.officer_class_access_grants
FOR UPDATE USING (
  granting_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
);

CREATE POLICY "Officers can delete own grants" ON public.officer_class_access_grants
FOR DELETE USING (
  granting_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
);

CREATE POLICY "Super admins can manage all access grants" ON public.officer_class_access_grants
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all access grants" ON public.officer_class_access_grants
FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Management can view institution access grants" ON public.officer_class_access_grants
FOR SELECT USING (
  has_role(auth.uid(), 'management'::app_role) AND 
  institution_id = get_user_institution_id(auth.uid())
);

-- Create update trigger
CREATE TRIGGER update_officer_class_access_grants_updated_at
  BEFORE UPDATE ON public.officer_class_access_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();