-- Clear invalid position_id values first (they contain non-UUID values like "pos-ceo")
UPDATE public.profiles SET position_id = NULL WHERE position_id IS NOT NULL;

-- Now alter the column type to uuid
ALTER TABLE public.profiles 
  ALTER COLUMN position_id TYPE uuid USING position_id::uuid;