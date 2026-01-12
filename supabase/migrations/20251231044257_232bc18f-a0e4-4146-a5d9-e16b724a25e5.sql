-- Award retroactive XP for existing assessment attempts (only for students that exist in profiles)
INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT 
  aa.student_id,
  aa.institution_id,
  'assessment_completion',
  aa.id,
  10,
  'Assessment completed (retroactive)'
FROM assessment_attempts aa
INNER JOIN profiles p ON p.id = aa.student_id
WHERE aa.status IN ('submitted', 'auto_submitted')
  AND NOT EXISTS (
    SELECT 1 FROM student_xp_transactions sxt
    WHERE sxt.student_id = aa.student_id 
    AND sxt.activity_id = aa.id
    AND sxt.activity_type = 'assessment_completion'
  );

-- Award XP for passed assessments
INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT 
  aa.student_id,
  aa.institution_id,
  'assessment_pass',
  aa.id,
  25,
  'Assessment passed (retroactive)'
FROM assessment_attempts aa
INNER JOIN profiles p ON p.id = aa.student_id
WHERE aa.status IN ('submitted', 'auto_submitted') AND aa.passed = true
  AND NOT EXISTS (
    SELECT 1 FROM student_xp_transactions sxt
    WHERE sxt.student_id = aa.student_id 
    AND sxt.activity_id = aa.id
    AND sxt.activity_type = 'assessment_pass'
  );

-- Award XP for project memberships
INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT 
  pm.student_id,
  proj.institution_id,
  'project_membership',
  pm.project_id,
  100,
  'Joined project team (retroactive)'
FROM project_members pm
JOIN projects proj ON pm.project_id = proj.id
INNER JOIN profiles p ON p.id = pm.student_id
WHERE NOT EXISTS (
  SELECT 1 FROM student_xp_transactions sxt
  WHERE sxt.student_id = pm.student_id 
  AND sxt.activity_id = pm.project_id
  AND sxt.activity_type = 'project_membership'
);