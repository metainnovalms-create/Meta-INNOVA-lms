-- Create table to track AI prompt usage per user per month
CREATE TABLE public.ai_prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'unknown',
  prompt_count INT NOT NULL DEFAULT 0,
  month INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.ai_prompt_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage
CREATE POLICY "Users can view own usage" 
ON public.ai_prompt_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for edge function)
CREATE POLICY "Service role full access" 
ON public.ai_prompt_usage 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_ai_prompt_usage_user_month_year 
ON public.ai_prompt_usage(user_id, month, year);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_prompt_usage_updated_at
BEFORE UPDATE ON public.ai_prompt_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();