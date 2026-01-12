-- Drop the existing constraint
ALTER TABLE public.id_counters 
DROP CONSTRAINT IF EXISTS id_counters_entity_type_check;

-- Add new constraint with inventory_item included
ALTER TABLE public.id_counters 
ADD CONSTRAINT id_counters_entity_type_check 
CHECK (entity_type = ANY (ARRAY[
  'student'::text, 
  'employee'::text, 
  'class'::text, 
  'institution'::text, 
  'roll_number'::text,
  'inventory_item'::text
]));