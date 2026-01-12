-- Create staff_documents table (similar to officer_documents)
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC,
  file_type TEXT,
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on staff_documents
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_documents
CREATE POLICY "Staff documents are viewable by authenticated users"
ON public.staff_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff documents can be created by authenticated users"
ON public.staff_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff documents can be updated by authenticated users"
ON public.staff_documents
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Staff documents can be deleted by authenticated users"
ON public.staff_documents
FOR DELETE
TO authenticated
USING (true);

-- Add missing profile columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE public.profiles ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_photo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employee_id') THEN
    ALTER TABLE public.profiles ADD COLUMN employee_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'designation') THEN
    ALTER TABLE public.profiles ADD COLUMN designation TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
    ALTER TABLE public.profiles ADD COLUMN department TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'salary_structure') THEN
    ALTER TABLE public.profiles ADD COLUMN salary_structure JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'statutory_info') THEN
    ALTER TABLE public.profiles ADD COLUMN statutory_info JSONB;
  END IF;
END $$;

-- Create storage bucket for staff documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-documents', 'staff-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff-documents bucket
CREATE POLICY "Staff documents are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated users can upload staff documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated users can update staff documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated users can delete staff documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'staff-documents');