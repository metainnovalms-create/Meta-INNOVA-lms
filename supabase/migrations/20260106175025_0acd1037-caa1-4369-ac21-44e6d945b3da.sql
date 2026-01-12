-- Allow students to INSERT their own streak record
CREATE POLICY "Students can insert own streak"
ON public.student_streaks
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Allow students to INSERT their own XP transactions
CREATE POLICY "Students can insert own xp"
ON public.student_xp_transactions
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());