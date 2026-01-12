-- Create officers table
CREATE TABLE public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  employee_id TEXT UNIQUE,
  
  -- Employment Details
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  status TEXT NOT NULL DEFAULT 'active',
  join_date DATE DEFAULT CURRENT_DATE,
  department TEXT DEFAULT 'Innovation & STEM Education',
  
  -- Salary & Payroll (stored in INR)
  annual_salary NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC,
  overtime_rate_multiplier NUMERIC DEFAULT 1.5,
  normal_working_hours INTEGER DEFAULT 8,
  
  -- Leave Configuration
  annual_leave_allowance INTEGER DEFAULT 15,
  sick_leave_allowance INTEGER DEFAULT 10,
  casual_leave_allowance INTEGER DEFAULT 12,
  
  -- Personal Info (filled later)
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  profile_photo_url TEXT,
  
  -- Bank Details (filled later)
  bank_account_number TEXT,
  bank_name TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  
  -- Qualifications (JSON arrays)
  qualifications JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  
  -- Statutory Info
  statutory_info JSONB DEFAULT '{}',
  salary_structure JSONB DEFAULT '{}',
  
  -- Assigned Institutions (array of institution IDs)
  assigned_institutions UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create officer_documents table
CREATE TABLE public.officer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES public.officers(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for officers table
CREATE POLICY "Super admins can manage all officers"
ON public.officers FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all officers"
ON public.officers FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Officers can view own profile"
ON public.officers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Officers can update own profile"
ON public.officers FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for officer_documents table
CREATE POLICY "Super admins can manage all officer documents"
ON public.officer_documents FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all officer documents"
ON public.officer_documents FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Officers can view own documents"
ON public.officer_documents FOR SELECT
USING (officer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid()));

CREATE POLICY "Officers can upload own documents"
ON public.officer_documents FOR INSERT
WITH CHECK (officer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_officers_updated_at
BEFORE UPDATE ON public.officers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for officer documents
INSERT INTO storage.buckets (id, name, public) VALUES ('officer-documents', 'officer-documents', false);

-- Storage policies for officer-documents bucket
CREATE POLICY "Admins can manage officer documents"
ON storage.objects FOR ALL
USING (bucket_id = 'officer-documents' AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'system_admin')));

CREATE POLICY "Officers can view own documents storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'officer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Officers can upload own documents storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'officer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);