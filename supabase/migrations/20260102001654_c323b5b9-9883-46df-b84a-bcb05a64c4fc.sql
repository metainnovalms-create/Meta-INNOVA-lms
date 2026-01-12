-- Create reports table for activity reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL DEFAULT 'activity',
  report_month TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  institution_id UUID REFERENCES public.institutions(id),
  client_name TEXT NOT NULL,
  client_location TEXT,
  trainers JSONB NOT NULL DEFAULT '[]',
  hours_handled INTEGER,
  hours_unit TEXT DEFAULT 'Hours (Sessions Handled)',
  portion_covered_percentage DECIMAL(5,2),
  assessments_completed TEXT,
  assessment_results TEXT,
  activities JSONB NOT NULL DEFAULT '[]',
  signatory_name TEXT DEFAULT 'Mr. Vasanthaseelan',
  signatory_designation TEXT DEFAULT 'AGM - Metasage Alliance',
  signature_url TEXT,
  status TEXT DEFAULT 'draft',
  generated_pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System admins can manage all reports"
  ON public.reports FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Super admins can manage all reports"
  ON public.reports FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();