-- Create calendar_day_types table for manual day marking
CREATE TABLE public.calendar_day_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('company', 'institution')),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('working', 'weekend', 'holiday')),
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique date per calendar (company or specific institution)
  UNIQUE(calendar_type, institution_id, date)
);

-- Enable RLS
ALTER TABLE public.calendar_day_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read calendar_day_types"
ON public.calendar_day_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert calendar_day_types"
ON public.calendar_day_types
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update calendar_day_types"
ON public.calendar_day_types
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete calendar_day_types"
ON public.calendar_day_types
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_day_types_updated_at
BEFORE UPDATE ON public.calendar_day_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();