-- Create a function to apply sequential unlocks retroactively
-- This runs when sessions are set to sequential or when completions happen
CREATE OR REPLACE FUNCTION public.apply_sequential_unlocks(
  p_class_module_assignment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_prev_session_completed BOOLEAN;
  v_class_assignment_id uuid;
  v_prev_unlock_order integer;
BEGIN
  -- Get the class_assignment_id for this module assignment
  SELECT class_assignment_id INTO v_class_assignment_id
  FROM class_module_assignments
  WHERE id = p_class_module_assignment_id;

  -- Loop through all sessions in this module ordered by unlock_order
  v_prev_session_completed := true; -- First session can be unlocked if module is unlocked
  v_prev_unlock_order := 0;
  
  FOR v_session IN 
    SELECT csa.*, cs.id as course_session_id
    FROM class_session_assignments csa
    JOIN course_sessions cs ON cs.id = csa.session_id
    WHERE csa.class_module_assignment_id = p_class_module_assignment_id
    ORDER BY csa.unlock_order ASC
  LOOP
    -- For sequential sessions, check if previous session is completed
    IF v_session.unlock_mode = 'sequential' AND v_session.unlock_order > 1 THEN
      -- Check if all content in the previous session is completed by at least one student
      -- We consider a session "completed" if all its content has been viewed
      SELECT EXISTS (
        SELECT 1
        FROM class_session_assignments prev_csa
        WHERE prev_csa.class_module_assignment_id = p_class_module_assignment_id
          AND prev_csa.unlock_order = v_session.unlock_order - 1
          AND prev_csa.is_unlocked = true
          AND NOT EXISTS (
            -- Check if there's any content in the previous session that hasn't been completed
            SELECT 1
            FROM course_content cc
            WHERE cc.session_id = prev_csa.session_id
            AND NOT EXISTS (
              SELECT 1
              FROM student_content_completions scc
              WHERE scc.content_id = cc.id
                AND scc.class_assignment_id = v_class_assignment_id
            )
          )
      ) INTO v_prev_session_completed;
      
      -- If previous session is completed and this session is locked, unlock it
      IF v_prev_session_completed AND v_session.is_unlocked = false THEN
        UPDATE class_session_assignments
        SET is_unlocked = true, updated_at = now()
        WHERE id = v_session.id;
      END IF;
    ELSIF v_session.unlock_mode = 'manual' THEN
      -- Manual mode - don't auto-unlock, leave as is
      NULL;
    ELSIF v_session.unlock_order = 1 THEN
      -- First session in module should be unlocked if module is unlocked
      IF v_session.is_unlocked = false THEN
        UPDATE class_session_assignments
        SET is_unlocked = true, updated_at = now()
        WHERE id = v_session.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger function for session assignment changes
CREATE OR REPLACE FUNCTION public.trigger_apply_sequential_unlocks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apply sequential unlocks for this module
  PERFORM public.apply_sequential_unlocks(NEW.class_module_assignment_id);
  RETURN NEW;
END;
$$;

-- Drop existing triggers if any to avoid duplicates
DROP TRIGGER IF EXISTS trigger_session_unlock_on_change ON public.class_session_assignments;

-- Create trigger on session assignment changes
CREATE TRIGGER trigger_session_unlock_on_change
AFTER INSERT OR UPDATE OF unlock_mode, unlock_order, is_unlocked
ON public.class_session_assignments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_apply_sequential_unlocks();

-- Update the check_and_unlock_next_content function to also call apply_sequential_unlocks
CREATE OR REPLACE FUNCTION public.check_and_unlock_next_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_module_assignment_id UUID;
  v_class_assignment_id UUID;
BEGIN
  -- Get content details
  SELECT session_id INTO v_session_id 
  FROM course_content WHERE id = NEW.content_id;
  
  IF v_session_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_class_assignment_id := NEW.class_assignment_id;
  
  -- Get the module assignment for this session
  SELECT csa.class_module_assignment_id INTO v_module_assignment_id
  FROM class_session_assignments csa
  WHERE csa.session_id = v_session_id
    AND csa.class_module_assignment_id IN (
      SELECT cma.id FROM class_module_assignments cma
      WHERE cma.class_assignment_id = v_class_assignment_id
    )
  LIMIT 1;
  
  IF v_module_assignment_id IS NOT NULL THEN
    -- Apply sequential unlocks for this module
    PERFORM public.apply_sequential_unlocks(v_module_assignment_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger on student_content_completions exists and is correct
DROP TRIGGER IF EXISTS trigger_check_unlock_on_completion ON public.student_content_completions;
DROP TRIGGER IF EXISTS trigger_auto_unlock ON public.student_content_completions;

CREATE TRIGGER trigger_check_unlock_on_completion
AFTER INSERT OR UPDATE ON public.student_content_completions
FOR EACH ROW
EXECUTE FUNCTION public.check_and_unlock_next_content();