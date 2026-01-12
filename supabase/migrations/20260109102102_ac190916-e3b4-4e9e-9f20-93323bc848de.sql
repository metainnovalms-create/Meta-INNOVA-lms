-- Add designation column to officers table
ALTER TABLE officers ADD COLUMN IF NOT EXISTS designation TEXT;

-- Add salary and payroll columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS annual_salary NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_structure JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS statutory_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add statutory_info to officers if not exists
ALTER TABLE officers ADD COLUMN IF NOT EXISTS statutory_info JSONB DEFAULT '{}';

-- Insert default payroll configuration into system_configurations
INSERT INTO system_configurations (id, key, value, category, description)
VALUES (
  gen_random_uuid(),
  'company_payroll_config',
  '{
    "company_name": "MetaSage Alliance",
    "company_address": "Mumbai, Maharashtra, India",
    "company_logo_url": "",
    "statutory_settings": {
      "pf_rate_employee": 12,
      "pf_rate_employer": 12,
      "esi_rate_employee": 0.75,
      "esi_rate_employer": 3.25,
      "esi_wage_limit": 21000,
      "professional_tax_state": "maharashtra"
    },
    "salary_components": {
      "basic_percentage": 50,
      "hra_percentage": 20,
      "conveyance_allowance": 1600,
      "medical_allowance": 1250,
      "special_allowance_percentage": 15
    },
    "overtime_settings": {
      "default_multiplier": 1.5,
      "weekend_multiplier": 2.0
    }
  }',
  'payroll',
  'Company payroll and salary configuration'
)
ON CONFLICT (key) DO NOTHING;