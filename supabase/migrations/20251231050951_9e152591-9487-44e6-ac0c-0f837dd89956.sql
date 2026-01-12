-- Drop the unique constraint on institution_id so we can have multiple configs (institution + class scope)
ALTER TABLE leaderboard_configs DROP CONSTRAINT IF EXISTS leaderboard_configs_institution_id_key;

-- Add unique constraint on (institution_id, scope) instead
ALTER TABLE leaderboard_configs ADD CONSTRAINT leaderboard_configs_institution_scope_key UNIQUE (institution_id, scope);

-- Insert badge for students who have assessment XP
INSERT INTO student_badges (student_id, badge_id, institution_id, earned_at)
SELECT DISTINCT 
  sxt.student_id,
  gb.id as badge_id,
  sxt.institution_id,
  NOW() as earned_at
FROM student_xp_transactions sxt
CROSS JOIN gamification_badges gb
WHERE sxt.activity_type = 'assessment_completion'
  AND gb.is_active = true
  AND (gb.unlock_criteria->>'type') = 'assessments'
  AND NOT EXISTS (
    SELECT 1 FROM student_badges sb 
    WHERE sb.student_id = sxt.student_id 
    AND sb.badge_id = gb.id
  );

-- Seed institution-level leaderboard config
INSERT INTO leaderboard_configs (institution_id, scope, time_period, top_n_display, is_public, reset_schedule)
SELECT 
  id as institution_id,
  'institution' as scope,
  'all_time' as time_period,
  10 as top_n_display,
  true as is_public,
  'none' as reset_schedule
FROM institutions
ON CONFLICT (institution_id, scope) DO NOTHING;

-- Seed class-level leaderboard config
INSERT INTO leaderboard_configs (institution_id, scope, time_period, top_n_display, is_public, reset_schedule)
SELECT 
  id as institution_id,
  'class' as scope,
  'monthly' as time_period,
  10 as top_n_display,
  true as is_public,
  'monthly' as reset_schedule
FROM institutions
ON CONFLICT (institution_id, scope) DO NOTHING;