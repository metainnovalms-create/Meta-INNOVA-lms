-- Add course_name_position and level_title_position columns to certificate_templates
ALTER TABLE public.certificate_templates 
ADD COLUMN IF NOT EXISTS course_name_position JSONB,
ADD COLUMN IF NOT EXISTS level_title_position JSONB;

-- Backfill project_membership XP for existing project members who don't have it
-- Only for students who have valid profiles
INSERT INTO public.student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT 
  pm.student_id,
  p.institution_id,
  'project_membership',
  pm.project_id,
  100,
  'Joined project team: ' || p.title
FROM public.project_members pm
JOIN public.projects p ON pm.project_id = p.id
JOIN public.students s ON pm.student_id = s.id
JOIN public.profiles pr ON pr.id = pm.student_id
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.student_xp_transactions sxt
    WHERE sxt.student_id = pm.student_id 
    AND sxt.activity_id = pm.project_id
    AND sxt.activity_type = 'project_membership'
  );

-- Backfill project_award XP for existing award achievements
INSERT INTO public.student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT 
  pm.student_id,
  p.institution_id,
  'project_award',
  pa.id,
  150,
  'Project award: ' || pa.title
FROM public.project_achievements pa
JOIN public.projects p ON pa.project_id = p.id
JOIN public.project_members pm ON pm.project_id = p.id
JOIN public.students s ON pm.student_id = s.id
JOIN public.profiles pr ON pr.id = pm.student_id
WHERE pa.type = 'award'
  AND s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.student_xp_transactions sxt
    WHERE sxt.student_id = pm.student_id 
    AND sxt.activity_id = pa.id
    AND sxt.activity_type = 'project_award'
  );