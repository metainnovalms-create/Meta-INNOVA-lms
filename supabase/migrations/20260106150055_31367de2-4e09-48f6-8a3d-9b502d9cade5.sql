-- Update the entity_type check constraint to include 'roll_number'
ALTER TABLE id_counters 
DROP CONSTRAINT IF EXISTS id_counters_entity_type_check;

ALTER TABLE id_counters 
ADD CONSTRAINT id_counters_entity_type_check 
CHECK (entity_type = ANY (ARRAY['student'::text, 'employee'::text, 'class'::text, 'institution'::text, 'roll_number'::text]));