-- ============================================
-- Meta-INNOVA LMS - Database Functions
-- Run this AFTER creating all tables
-- ============================================

-- ============================================
-- 1. Update Updated At Column Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 2. Handle New User (Profile Creation)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- 3. Get User Role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ============================================
-- 4. Has Role Check
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- ============================================
-- 5. Get User Institution ID
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_institution_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT COALESCE(
    (SELECT institution_id FROM public.profiles WHERE id = _user_id LIMIT 1),
    (SELECT assigned_institutions[1] FROM public.officers WHERE user_id = _user_id LIMIT 1)
  );
$$;

-- ============================================
-- 6. Sync Profile From Student
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_from_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      institution_id = COALESCE(NEW.institution_id, institution_id),
      class_id = COALESCE(NEW.class_id, class_id),
      name = COALESCE(NEW.student_name, name),
      email = COALESCE(NEW.email, email),
      updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 7. Sync Profile Avatar
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.avatar IS DISTINCT FROM NEW.avatar THEN
    UPDATE students SET avatar = NEW.avatar WHERE email = NEW.email;
    UPDATE officers SET profile_photo_url = NEW.avatar WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 8. Increment Newsletter Downloads
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_newsletter_downloads(newsletter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE newsletters 
  SET download_count = COALESCE(download_count, 0) + 1 
  WHERE id = newsletter_id;
END;
$$;

-- ============================================
-- 9. Generate Invoice Number
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_invoice_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  CASE p_invoice_type
    WHEN 'institution' THEN v_prefix := 'MSA/MSD/';
    WHEN 'sales' THEN v_prefix := 'INV/';
    WHEN 'purchase' THEN v_prefix := 'PUR/';
    ELSE v_prefix := 'INV/';
  END CASE;
  
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
    v_year := TO_CHAR(CURRENT_DATE, 'YY') || '-' || TO_CHAR(CURRENT_DATE + INTERVAL '1 year', 'YY');
  ELSE
    v_year := TO_CHAR(CURRENT_DATE - INTERVAL '1 year', 'YY') || '-' || TO_CHAR(CURRENT_DATE, 'YY');
  END IF;
  
  INSERT INTO public.invoice_number_sequences (invoice_type, prefix, financial_year, last_number)
  VALUES (p_invoice_type, v_prefix, v_year, 1)
  ON CONFLICT (invoice_type, financial_year)
  DO UPDATE SET last_number = invoice_number_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO v_next_number;
  
  IF p_invoice_type = 'institution' THEN
    v_invoice_number := v_prefix || LPAD(v_next_number::TEXT, 3, '0');
  ELSE
    v_invoice_number := v_prefix || v_year || '/' || LPAD(v_next_number::TEXT, 4, '0');
  END IF;
  
  RETURN v_invoice_number;
END;
$$;

-- ============================================
-- 10. Reserve Deleted Invoice Number
-- ============================================
CREATE OR REPLACE FUNCTION public.reserve_deleted_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.reserved_invoice_numbers (invoice_number, invoice_type, original_invoice_id, deleted_by)
  VALUES (OLD.invoice_number, OLD.invoice_type, OLD.id, auth.uid());
  RETURN OLD;
END;
$$;

-- ============================================
-- 11. Check Invoice Number Available
-- ============================================
CREATE OR REPLACE FUNCTION public.check_invoice_number_available(p_invoice_number text)
RETURNS TABLE(available boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = p_invoice_number) THEN
    RETURN QUERY SELECT FALSE, 'Invoice number already in use'::TEXT;
    RETURN;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.reserved_invoice_numbers WHERE invoice_number = p_invoice_number) THEN
    RETURN QUERY SELECT FALSE, 'Invoice number was previously used and cannot be reused'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Available'::TEXT;
END;
$$;

-- ============================================
-- 12. Get Next ID
-- ============================================
CREATE OR REPLACE FUNCTION public.get_next_id(p_institution_id uuid, p_entity_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO public.id_counters (institution_id, entity_type, current_counter)
  VALUES (p_institution_id, p_entity_type, 1)
  ON CONFLICT (institution_id, entity_type)
  DO UPDATE SET 
    current_counter = id_counters.current_counter + 1,
    updated_at = now()
  RETURNING current_counter
  INTO v_next;
  
  RETURN v_next;
END;
$$;

-- ============================================
-- 13. Reserve ID Range
-- ============================================
CREATE OR REPLACE FUNCTION public.reserve_id_range(p_institution_id uuid, p_entity_type text, p_count integer)
RETURNS TABLE(start_counter integer, end_counter integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start INTEGER;
  v_end INTEGER;
BEGIN
  INSERT INTO public.id_counters (institution_id, entity_type, current_counter)
  VALUES (p_institution_id, p_entity_type, p_count)
  ON CONFLICT (institution_id, entity_type)
  DO UPDATE SET 
    current_counter = id_counters.current_counter + p_count,
    updated_at = now()
  RETURNING current_counter - p_count + 1, current_counter
  INTO v_start, v_end;
  
  RETURN QUERY SELECT v_start, v_end;
END;
$$;

-- ============================================
-- 14. Generate Request Code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_request_code(prefix text, table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_code TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  IF table_name = 'purchase_requests' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM public.purchase_requests 
    WHERE request_code LIKE prefix || '-' || v_year || '-%';
  ELSIF table_name = 'inventory_issues' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM public.inventory_issues 
    WHERE issue_code LIKE prefix || '-' || v_year || '-%';
  ELSE
    v_count := 1;
  END IF;
  
  v_code := prefix || '-' || v_year || '-' || lpad(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$$;

-- ============================================
-- 15. Leave Balance Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.get_leave_balance(p_user_id uuid, p_year integer, p_month integer)
RETURNS TABLE(monthly_credit integer, carried_forward integer, total_available integer, sick_leave_used integer, casual_leave_used integer, total_used integer, lop_days integer, balance_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance RECORD;
  v_prev_remaining integer;
  v_carried integer;
BEGIN
  SELECT * INTO v_balance
  FROM leave_balances lb
  WHERE lb.user_id = p_user_id AND lb.year = p_year AND lb.month = p_month;
  
  IF v_balance IS NULL THEN
    IF p_month = 1 THEN
      SELECT lb.balance_remaining INTO v_prev_remaining
      FROM leave_balances lb
      WHERE lb.user_id = p_user_id AND lb.year = p_year - 1 AND lb.month = 12;
    ELSE
      SELECT lb.balance_remaining INTO v_prev_remaining
      FROM leave_balances lb
      WHERE lb.user_id = p_user_id AND lb.year = p_year AND lb.month = p_month - 1;
    END IF;
    
    v_carried := LEAST(COALESCE(v_prev_remaining, 0), 1);
    
    RETURN QUERY SELECT 
      1::integer,
      v_carried::integer,
      (1 + v_carried)::integer,
      0::integer,
      0::integer,
      0::integer,
      0::integer,
      (1 + v_carried)::integer;
  ELSE
    RETURN QUERY SELECT 
      v_balance.monthly_credit,
      v_balance.carried_forward,
      (v_balance.monthly_credit + v_balance.carried_forward)::integer,
      v_balance.sick_leave_used,
      v_balance.casual_leave_used,
      (v_balance.sick_leave_used + v_balance.casual_leave_used)::integer,
      v_balance.lop_days,
      v_balance.balance_remaining;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_leave_balance(p_user_id uuid, p_user_type text, p_officer_id uuid, p_year integer, p_month integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance_id uuid;
  v_carried_forward integer := 0;
  v_prev_remaining integer;
BEGIN
  IF p_month = 1 THEN
    SELECT balance_remaining INTO v_prev_remaining
    FROM leave_balances
    WHERE user_id = p_user_id AND year = p_year - 1 AND month = 12;
  ELSE
    SELECT balance_remaining INTO v_prev_remaining
    FROM leave_balances
    WHERE user_id = p_user_id AND year = p_year AND month = p_month - 1;
  END IF;
  
  v_carried_forward := LEAST(COALESCE(v_prev_remaining, 0), 1);
  
  INSERT INTO leave_balances (
    user_id, user_type, officer_id, year, month,
    monthly_credit, carried_forward, balance_remaining
  )
  VALUES (
    p_user_id, p_user_type, p_officer_id, p_year, p_month,
    1, v_carried_forward, 1 + v_carried_forward
  )
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    carried_forward = EXCLUDED.carried_forward,
    balance_remaining = leave_balances.monthly_credit + EXCLUDED.carried_forward - 
                        leave_balances.sick_leave_used - leave_balances.casual_leave_used,
    updated_at = now()
  RETURNING id INTO v_balance_id;
  
  RETURN v_balance_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_leave_application_to_balance(p_application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_app RECORD;
  v_balance_id uuid;
  v_total_available integer;
  v_total_used integer;
BEGIN
  SELECT * INTO v_app
  FROM leave_applications
  WHERE id = p_application_id;
  
  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Leave application not found: %', p_application_id;
  END IF;
  
  IF v_app.status != 'approved' OR v_app.final_approved_at IS NULL THEN
    RAISE EXCEPTION 'Leave application is not finally approved: %', p_application_id;
  END IF;
  
  SELECT public.initialize_leave_balance(
    v_app.applicant_id,
    v_app.user_type,
    v_app.officer_id,
    EXTRACT(YEAR FROM v_app.start_date)::integer,
    EXTRACT(MONTH FROM v_app.start_date)::integer
  ) INTO v_balance_id;
  
  IF v_app.leave_type = 'sick' THEN
    UPDATE leave_balances
    SET 
      sick_leave_used = sick_leave_used + COALESCE(v_app.paid_days, 0),
      lop_days = lop_days + COALESCE(v_app.lop_days, 0),
      updated_at = now()
    WHERE user_id = v_app.applicant_id
      AND year = EXTRACT(YEAR FROM v_app.start_date)::integer
      AND month = EXTRACT(MONTH FROM v_app.start_date)::integer;
  ELSE
    UPDATE leave_balances
    SET 
      casual_leave_used = casual_leave_used + COALESCE(v_app.paid_days, 0),
      lop_days = lop_days + COALESCE(v_app.lop_days, 0),
      updated_at = now()
    WHERE user_id = v_app.applicant_id
      AND year = EXTRACT(YEAR FROM v_app.start_date)::integer
      AND month = EXTRACT(MONTH FROM v_app.start_date)::integer;
  END IF;
  
  UPDATE leave_balances
  SET 
    balance_remaining = GREATEST(0, monthly_credit + carried_forward - sick_leave_used - casual_leave_used),
    updated_at = now()
  WHERE user_id = v_app.applicant_id
    AND year = EXTRACT(YEAR FROM v_app.start_date)::integer
    AND month = EXTRACT(MONTH FROM v_app.start_date)::integer;
END;
$$;

-- ============================================
-- 16. XP Award Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.award_project_membership_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.award_project_achievement_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.award_project_completion_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.award_assignment_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_points integer;
  v_total_marks integer;
  v_percentage numeric;
BEGIN
  IF NEW.status = 'graded' AND (OLD.status IS NULL OR OLD.status != 'graded') THEN
    SELECT total_marks INTO v_total_marks FROM assignments WHERE id = NEW.assignment_id;
    
    IF v_total_marks > 0 THEN
      v_percentage := (NEW.marks_obtained::numeric / v_total_marks) * 100;
    ELSE
      v_percentage := 0;
    END IF;
    
    SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'assignment_submission' AND is_active = true;
    IF v_xp_points IS NOT NULL THEN
      INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
      VALUES (NEW.student_id, NEW.institution_id, 'assignment_submission', NEW.id, v_xp_points, 'Assignment submitted and graded')
      ON CONFLICT (student_id, activity_type, activity_id) DO NOTHING;
    END IF;
    
    IF v_percentage >= 50 THEN
      SELECT points INTO v_xp_points FROM xp_rules WHERE activity = 'assignment_pass' AND is_active = true;
      IF v_xp_points IS NOT NULL THEN
        INSERT INTO student_xp_transactions (student_id, institution_id, activity_type, activity_id, points_earned, description)
        VALUES (NEW.student_id, NEW.institution_id, 'assignment_pass', NEW.id, v_xp_points, 'Passed assignment with ' || ROUND(v_percentage) || '%')
        ON CONFLICT (student_id, activity_type, activity_id) DO NOTHING;
      END IF;
    END IF;
    
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
$$;

-- ============================================
-- 17. Event Management Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.can_manage_events(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT (
    public.has_role(_user_id, 'super_admin'::public.app_role)
    OR public.has_role(_user_id, 'system_admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = _user_id
        AND is_ceo = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.positions pos ON pos.id = p.position_id
      WHERE p.id = _user_id
        AND pos.is_ceo_position = true
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_owner(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND e.created_by = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_assigned_to_user_institution(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_class_assignments eca
    WHERE eca.event_id = _event_id
      AND eca.institution_id = public.get_user_institution_id(_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_event(_user_id uuid, _event_id uuid, _status text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT (
    public.can_manage_events(_user_id)
    OR (
      _status = 'published'
      AND public.is_event_assigned_to_user_institution(_user_id, _event_id)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_event_updates(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT (
    public.can_manage_events(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = _event_id
        AND e.status = 'published'
        AND public.is_event_assigned_to_user_institution(_user_id, _event_id)
    )
  );
$$;

-- ============================================
-- 18. Project Member Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    JOIN students s ON s.id = pm.student_id
    WHERE pm.project_id = _project_id AND s.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_project_institution_id(_project_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT institution_id FROM projects WHERE id = _project_id LIMIT 1
$$;

-- ============================================
-- 19. Course Unlock Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.apply_sequential_unlocks(p_class_module_assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session RECORD;
  v_prev_session_completed BOOLEAN;
  v_class_assignment_id uuid;
  v_prev_unlock_order integer;
BEGIN
  SELECT class_assignment_id INTO v_class_assignment_id
  FROM class_module_assignments
  WHERE id = p_class_module_assignment_id;

  v_prev_session_completed := true;
  v_prev_unlock_order := 0;
  
  FOR v_session IN 
    SELECT csa.*, cs.id as course_session_id
    FROM class_session_assignments csa
    JOIN course_sessions cs ON cs.id = csa.session_id
    WHERE csa.class_module_assignment_id = p_class_module_assignment_id
    ORDER BY csa.unlock_order ASC
  LOOP
    IF v_session.unlock_mode = 'sequential' AND v_session.unlock_order > 1 THEN
      SELECT EXISTS (
        SELECT 1
        FROM class_session_assignments prev_csa
        WHERE prev_csa.class_module_assignment_id = p_class_module_assignment_id
          AND prev_csa.unlock_order = v_session.unlock_order - 1
          AND prev_csa.is_unlocked = true
          AND NOT EXISTS (
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
      
      IF v_prev_session_completed AND v_session.is_unlocked = false THEN
        UPDATE class_session_assignments
        SET is_unlocked = true, updated_at = now()
        WHERE id = v_session.id;
      END IF;
    ELSIF v_session.unlock_mode = 'manual' THEN
      NULL;
    ELSIF v_session.unlock_order = 1 THEN
      IF v_session.is_unlocked = false THEN
        UPDATE class_session_assignments
        SET is_unlocked = true, updated_at = now()
        WHERE id = v_session.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_apply_sequential_unlocks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.apply_sequential_unlocks(NEW.class_module_assignment_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_unlock_next_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_id UUID;
  v_module_assignment_id UUID;
  v_class_assignment_id UUID;
BEGIN
  SELECT session_id INTO v_session_id 
  FROM course_content WHERE id = NEW.content_id;
  
  IF v_session_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_class_assignment_id := NEW.class_assignment_id;
  
  SELECT csa.class_module_assignment_id INTO v_module_assignment_id
  FROM class_session_assignments csa
  WHERE csa.session_id = v_session_id
    AND csa.class_module_assignment_id IN (
      SELECT cma.id FROM class_module_assignments cma
      WHERE cma.class_assignment_id = v_class_assignment_id
    )
  LIMIT 1;
  
  IF v_module_assignment_id IS NOT NULL THEN
    PERFORM public.apply_sequential_unlocks(v_module_assignment_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 20. Survey Updated At
-- ============================================
CREATE OR REPLACE FUNCTION public.update_survey_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- Create trigger for new user profile creation
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
