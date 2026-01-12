-- Delete duplicate calendar_day_types entries, keeping only the most recent
DELETE FROM calendar_day_types a
USING (
  SELECT date, calendar_type, COALESCE(institution_id::text, '') as inst_key, MAX(updated_at) as max_updated
  FROM calendar_day_types
  GROUP BY date, calendar_type, COALESCE(institution_id::text, '')
  HAVING COUNT(*) > 1
) dupes
WHERE a.date = dupes.date 
  AND a.calendar_type = dupes.calendar_type 
  AND COALESCE(a.institution_id::text, '') = dupes.inst_key
  AND a.updated_at < dupes.max_updated;

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_day_types_unique 
ON calendar_day_types (date, calendar_type, COALESCE(institution_id::text, ''));