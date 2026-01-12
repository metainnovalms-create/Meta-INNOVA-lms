-- 1. Add project_completion XP rule if not exists (using correct column name: activity)
INSERT INTO public.xp_rules (activity, points, description, is_active)
VALUES ('project_completion', 200, 'XP for completing a project (100% progress)', true)
ON CONFLICT (activity) DO NOTHING;

-- 2. Create function to award project membership XP
CREATE OR REPLACE FUNCTION public.award_project_membership_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_institution_id uuid;
  v_project_title text;
  v_xp_points integer;
BEGIN
  SELECT user_id INTO v_user_id FROM students WHERE id = NEW.student_id;
  SELECT title, institution_id INTO v_project_title, v_institution_id FROM projects WHERE id = NEW.project_id;
  SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'project_membership' AND is_active = true;
  
  IF v_user_id IS NOT NULL AND v_xp_points IS NOT NULL THEN
    INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
    VALUES (v_user_id, v_institution_id, 'project_membership', NEW.project_id, v_xp_points, 'Joined project: ' || COALESCE(v_project_title, 'Unknown'))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_project_membership_xp ON public.project_members;
CREATE TRIGGER trigger_award_project_membership_xp
AFTER INSERT ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.award_project_membership_xp();

-- 3. Create function to award project achievement XP to all members
CREATE OR REPLACE FUNCTION public.award_project_achievement_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_institution_id uuid;
  v_xp_points integer;
  v_member RECORD;
BEGIN
  SELECT institution_id INTO v_institution_id FROM projects WHERE id = NEW.project_id;
  SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'project_award' AND is_active = true;
  
  IF v_xp_points IS NOT NULL THEN
    FOR v_member IN 
      SELECT pm.student_id, s.user_id 
      FROM project_members pm
      JOIN students s ON s.id = pm.student_id
      WHERE pm.project_id = NEW.project_id AND s.user_id IS NOT NULL
    LOOP
      INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
      VALUES (v_member.user_id, v_institution_id, 'project_award', NEW.id, v_xp_points, 'Project award: ' || COALESCE(NEW.title, 'Achievement'))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_project_achievement_xp ON public.project_achievements;
CREATE TRIGGER trigger_award_project_achievement_xp
AFTER INSERT ON public.project_achievements
FOR EACH ROW EXECUTE FUNCTION public.award_project_achievement_xp();

-- 4. Create function to award project completion XP
CREATE OR REPLACE FUNCTION public.award_project_completion_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_institution_id uuid;
  v_project_title text;
  v_xp_points integer;
  v_member RECORD;
BEGIN
  IF NEW.progress_percentage < 100 THEN RETURN NEW; END IF;
  
  SELECT title, institution_id INTO v_project_title, v_institution_id FROM projects WHERE id = NEW.project_id;
  SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'project_completion' AND is_active = true;
  
  IF v_xp_points IS NOT NULL THEN
    FOR v_member IN 
      SELECT pm.student_id, s.user_id 
      FROM project_members pm
      JOIN students s ON s.id = pm.student_id
      WHERE pm.project_id = NEW.project_id AND s.user_id IS NOT NULL
    LOOP
      INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
      VALUES (v_member.user_id, v_institution_id, 'project_completion', NEW.project_id, v_xp_points, 'Completed project: ' || COALESCE(v_project_title, 'Unknown'))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_project_completion_xp ON public.project_progress_updates;
CREATE TRIGGER trigger_award_project_completion_xp
AFTER INSERT ON public.project_progress_updates
FOR EACH ROW EXECUTE FUNCTION public.award_project_completion_xp();

-- 5. BACKFILL: Award missing project membership XP
INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT DISTINCT s.user_id, p.institution_id, 'project_membership', pm.project_id,
  COALESCE((SELECT points FROM xp_rules WHERE activity = 'project_membership' AND is_active = true), 50),
  'Joined project: ' || COALESCE(p.title, 'Unknown')
FROM project_members pm
JOIN students s ON s.id = pm.student_id
JOIN projects p ON p.id = pm.project_id
WHERE s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM student_xp_transactions sxt
  WHERE sxt.student_id = s.user_id AND sxt.activity_type = 'project_membership' AND sxt.activity_id = pm.project_id
);

-- 6. BACKFILL: Award missing project achievement XP
INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT DISTINCT s.user_id, p.institution_id, 'project_award', pa.id,
  COALESCE((SELECT points FROM xp_rules WHERE activity = 'project_award' AND is_active = true), 75),
  'Project award: ' || COALESCE(pa.title, 'Achievement')
FROM project_achievements pa
JOIN projects p ON p.id = pa.project_id
JOIN project_members pm ON pm.project_id = p.id
JOIN students s ON s.id = pm.student_id
WHERE s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM student_xp_transactions sxt
  WHERE sxt.student_id = s.user_id AND sxt.activity_type = 'project_award' AND sxt.activity_id = pa.id
);

-- 7. BACKFILL: Award missing project completion XP
INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
SELECT DISTINCT s.user_id, p.institution_id, 'project_completion', p.id,
  COALESCE((SELECT points FROM xp_rules WHERE activity = 'project_completion' AND is_active = true), 200),
  'Completed project: ' || COALESCE(p.title, 'Unknown')
FROM projects p
JOIN project_members pm ON pm.project_id = p.id
JOIN students s ON s.id = pm.student_id
WHERE s.user_id IS NOT NULL
AND EXISTS (SELECT 1 FROM project_progress_updates ppu WHERE ppu.project_id = p.id AND ppu.progress_percentage = 100)
AND NOT EXISTS (
  SELECT 1 FROM student_xp_transactions sxt
  WHERE sxt.student_id = s.user_id AND sxt.activity_type = 'project_completion' AND sxt.activity_id = p.id
);