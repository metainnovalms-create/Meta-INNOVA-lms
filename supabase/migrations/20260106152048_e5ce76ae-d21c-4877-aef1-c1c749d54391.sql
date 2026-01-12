-- Sync the roll_number counter with existing students to ensure proper incrementing
-- This updates each institution's roll_number counter to the max existing counter value

INSERT INTO id_counters (institution_id, entity_type, current_counter)
SELECT 
  institution_id,
  'roll_number' as entity_type,
  COALESCE(MAX(
    CASE 
      WHEN roll_number ~ '^[A-Z]+-[0-9]{4}-[0-9]{4}(-[A-Z]+)?$'
      THEN CAST(split_part(roll_number, '-', 3) AS INTEGER)
      ELSE 0
    END
  ), 0) as current_counter
FROM students
WHERE institution_id IS NOT NULL
GROUP BY institution_id
ON CONFLICT (institution_id, entity_type)
DO UPDATE SET 
  current_counter = GREATEST(
    id_counters.current_counter,
    EXCLUDED.current_counter
  ),
  updated_at = now();