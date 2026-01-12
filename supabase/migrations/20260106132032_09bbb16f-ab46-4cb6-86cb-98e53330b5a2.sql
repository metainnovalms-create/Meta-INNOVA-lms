-- Create officer_institution_assignments junction table
CREATE TABLE public.officer_institution_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(officer_id, institution_id)
);

-- Add RLS policies
ALTER TABLE public.officer_institution_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.officer_institution_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON public.officer_institution_assignments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.officer_institution_assignments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON public.officer_institution_assignments
  FOR DELETE TO authenticated USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_officer_institution_assignments_updated_at
  BEFORE UPDATE ON public.officer_institution_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from officers.assigned_institutions array
INSERT INTO public.officer_institution_assignments (officer_id, institution_id, assigned_at)
SELECT 
  o.id as officer_id,
  unnest(o.assigned_institutions) as institution_id,
  COALESCE(o.updated_at, o.created_at, NOW()) as assigned_at
FROM public.officers o
WHERE o.assigned_institutions IS NOT NULL 
  AND array_length(o.assigned_institutions, 1) > 0
ON CONFLICT (officer_id, institution_id) DO NOTHING;