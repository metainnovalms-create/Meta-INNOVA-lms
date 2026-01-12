-- 1. Add allow_resubmit column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_resubmit BOOLEAN DEFAULT true;

-- 2. Add XP rules for assignments (if not exists)
INSERT INTO xp_rules (activity, points, multiplier, description, is_active) VALUES
  ('assignment_submission', 10, 1.0, 'Points for submitting an assignment', true),
  ('assignment_pass', 25, 1.0, 'Points for passing an assignment (50%+ marks)', true),
  ('assignment_perfect_score', 50, 1.0, 'Bonus points for scoring 100% in assignment', true)
ON CONFLICT (activity) DO NOTHING;

-- 3. Create function to award assignment XP when graded
CREATE OR REPLACE FUNCTION award_assignment_xp()
RETURNS trigger AS $$
DECLARE
  v_xp_points integer;
  v_total_marks integer;
  v_percentage numeric;
BEGIN
  -- Only trigger when status changes to 'graded'
  IF NEW.status = 'graded' AND (OLD.status IS NULL OR OLD.status != 'graded') THEN
    -- Get total marks for the assignment
    SELECT total_marks INTO v_total_marks FROM assignments WHERE id = NEW.assignment_id;
    
    -- Calculate percentage
    IF v_total_marks > 0 THEN
      v_percentage := (NEW.marks_obtained::numeric / v_total_marks) * 100;
    ELSE
      v_percentage := 0;
    END IF;
    
    -- Award submission XP
    SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'assignment_submission' AND is_active = true;
    IF v_xp_points IS NOT NULL THEN
      INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
      VALUES (NEW.student_id, NEW.institution_id, 'assignment_submission', NEW.id, v_xp_points, 'Assignment submitted and graded')
      ON CONFLICT (student_id, activity_type, activity_id) DO NOTHING;
    END IF;
    
    -- Award pass XP if 50%+
    IF v_percentage >= 50 THEN
      SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'assignment_pass' AND is_active = true;
      IF v_xp_points IS NOT NULL THEN
        INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
        VALUES (NEW.student_id, NEW.institution_id, 'assignment_pass', NEW.id, v_xp_points, 'Passed assignment with ' || ROUND(v_percentage) || '%')
        ON CONFLICT (student_id, activity_type, activity_id) DO NOTHING;
      END IF;
    END IF;
    
    -- Award perfect score XP if 100%
    IF v_percentage >= 100 THEN
      SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'assignment_perfect_score' AND is_active = true;
      IF v_xp_points IS NOT NULL THEN
        INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
        VALUES (NEW.student_id, NEW.institution_id, 'assignment_perfect_score', NEW.id, v_xp_points, 'Perfect score on assignment!')
        ON CONFLICT (student_id, activity_type, activity_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for assignment grading XP
DROP TRIGGER IF EXISTS trigger_award_assignment_xp ON assignment_submissions;
CREATE TRIGGER trigger_award_assignment_xp
  AFTER UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION award_assignment_xp();