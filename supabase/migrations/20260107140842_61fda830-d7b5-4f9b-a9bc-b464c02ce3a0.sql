-- Create function to apply approved leave to balance (Security Definer bypasses RLS)
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
  -- Get the leave application
  SELECT * INTO v_app
  FROM leave_applications
  WHERE id = p_application_id;
  
  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Leave application not found: %', p_application_id;
  END IF;
  
  -- Only process finally approved applications
  IF v_app.status != 'approved' OR v_app.final_approved_at IS NULL THEN
    RAISE EXCEPTION 'Leave application is not finally approved: %', p_application_id;
  END IF;
  
  -- Initialize balance for the month if it doesn't exist
  SELECT public.initialize_leave_balance(
    v_app.applicant_id,
    v_app.user_type,
    v_app.officer_id,
    EXTRACT(YEAR FROM v_app.start_date)::integer,
    EXTRACT(MONTH FROM v_app.start_date)::integer
  ) INTO v_balance_id;
  
  -- Update the balance based on leave type
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
  
  -- Recompute balance_remaining
  UPDATE leave_balances
  SET 
    balance_remaining = GREATEST(0, monthly_credit + carried_forward - sick_leave_used - casual_leave_used),
    updated_at = now()
  WHERE user_id = v_app.applicant_id
    AND year = EXTRACT(YEAR FROM v_app.start_date)::integer
    AND month = EXTRACT(MONTH FROM v_app.start_date)::integer;
END;
$$;