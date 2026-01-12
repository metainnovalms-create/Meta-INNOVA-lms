-- Add unlock_mode column to class_module_assignments
ALTER TABLE public.class_module_assignments 
ADD COLUMN unlock_mode TEXT DEFAULT 'manual';

-- Add unlock_mode column to class_session_assignments
ALTER TABLE public.class_session_assignments 
ADD COLUMN unlock_mode TEXT DEFAULT 'manual';

-- Create function to auto-unlock next sequential content when student completes content
CREATE OR REPLACE FUNCTION public.check_and_unlock_next_content()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id UUID;
  v_module_assignment_id UUID;
  v_class_assignment_id UUID;
  v_session_content_count INTEGER;
  v_completed_content_count INTEGER;
  v_current_session_assignment RECORD;
  v_next_session_assignment RECORD;
  v_current_module_assignment RECORD;
  v_next_module_assignment RECORD;
  v_module_session_count INTEGER;
  v_completed_sessions INTEGER;
BEGIN
  -- Get content details
  SELECT session_id INTO v_session_id 
  FROM course_content WHERE id = NEW.content_id;
  
  IF v_session_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_class_assignment_id := NEW.class_assignment_id;
  
  -- Count total content in this session
  SELECT COUNT(*) INTO v_session_content_count
  FROM course_content WHERE session_id = v_session_id;
  
  -- Count completed content in this session for this student
  SELECT COUNT(DISTINCT scc.content_id) INTO v_completed_content_count
  FROM student_content_completions scc
  JOIN course_content cc ON cc.id = scc.content_id
  WHERE scc.student_id = NEW.student_id
    AND scc.class_assignment_id = v_class_assignment_id
    AND cc.session_id = v_session_id;
  
  -- If all content in session is completed, check for next sequential session
  IF v_completed_content_count >= v_session_content_count THEN
    -- Get current session assignment
    SELECT csa.*, cma.id as module_assignment_id, cma.class_assignment_id as parent_class_assignment_id
    INTO v_current_session_assignment
    FROM class_session_assignments csa
    JOIN class_module_assignments cma ON cma.id = csa.class_module_assignment_id
    WHERE csa.session_id = v_session_id
      AND cma.class_assignment_id = v_class_assignment_id
    LIMIT 1;
    
    IF v_current_session_assignment IS NOT NULL THEN
      -- Find next session in same module with sequential unlock_mode
      SELECT * INTO v_next_session_assignment
      FROM class_session_assignments
      WHERE class_module_assignment_id = v_current_session_assignment.class_module_assignment_id
        AND unlock_order = v_current_session_assignment.unlock_order + 1
        AND unlock_mode = 'sequential'
        AND is_unlocked = false
      LIMIT 1;
      
      -- Unlock next session if found
      IF v_next_session_assignment IS NOT NULL THEN
        UPDATE class_session_assignments
        SET is_unlocked = true, updated_at = now()
        WHERE id = v_next_session_assignment.id;
      END IF;
      
      -- Check if all sessions in module are completed
      SELECT COUNT(*) INTO v_module_session_count
      FROM class_session_assignments
      WHERE class_module_assignment_id = v_current_session_assignment.module_assignment_id;
      
      -- Count completed sessions
      SELECT COUNT(DISTINCT csa.id) INTO v_completed_sessions
      FROM class_session_assignments csa
      WHERE csa.class_module_assignment_id = v_current_session_assignment.module_assignment_id
        AND csa.is_unlocked = true
        AND EXISTS (
          SELECT 1 FROM course_content cc
          WHERE cc.session_id = csa.session_id
          AND NOT EXISTS (
            SELECT 1 FROM course_content cc2
            WHERE cc2.session_id = csa.session_id
            AND NOT EXISTS (
              SELECT 1 FROM student_content_completions scc
              WHERE scc.content_id = cc2.id
                AND scc.student_id = NEW.student_id
                AND scc.class_assignment_id = v_class_assignment_id
            )
          )
        );
      
      -- If all sessions completed, unlock next sequential module
      IF v_completed_sessions >= v_module_session_count THEN
        SELECT * INTO v_current_module_assignment
        FROM class_module_assignments
        WHERE id = v_current_session_assignment.module_assignment_id;
        
        -- Find next module with sequential unlock_mode
        SELECT * INTO v_next_module_assignment
        FROM class_module_assignments
        WHERE class_assignment_id = v_current_module_assignment.class_assignment_id
          AND unlock_order = v_current_module_assignment.unlock_order + 1
          AND unlock_mode = 'sequential'
          AND is_unlocked = false
        LIMIT 1;
        
        -- Unlock next module if found
        IF v_next_module_assignment IS NOT NULL THEN
          UPDATE class_module_assignments
          SET is_unlocked = true, updated_at = now()
          WHERE id = v_next_module_assignment.id;
          
          -- Also unlock first session in the next module if it's sequential
          UPDATE class_session_assignments
          SET is_unlocked = true, updated_at = now()
          WHERE class_module_assignment_id = v_next_module_assignment.id
            AND unlock_order = 1;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-unlock
DROP TRIGGER IF EXISTS trigger_auto_unlock ON student_content_completions;
CREATE TRIGGER trigger_auto_unlock
AFTER INSERT OR UPDATE ON student_content_completions
FOR EACH ROW EXECUTE FUNCTION check_and_unlock_next_content();