-- Fix student_content_completions.student_id FK to reference students(id) instead of profiles(id)

-- 1) Safety check: ensure every existing row can be mapped to students
DO $$
DECLARE
  v_unmappable_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_unmappable_count
  FROM public.student_content_completions scc
  WHERE NOT EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = scc.student_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = scc.student_id
    );

  IF v_unmappable_count > 0 THEN
    RAISE EXCEPTION 'Cannot migrate student_content_completions.student_id: % rows cannot be mapped to students', v_unmappable_count;
  END IF;
END $$;

-- 2) Remap any historical rows that stored auth/profile ids into students.id
UPDATE public.student_content_completions scc
SET student_id = s.id
FROM public.students s
WHERE s.user_id = scc.student_id;

-- 3) Replace FK constraint
ALTER TABLE public.student_content_completions
  DROP CONSTRAINT IF EXISTS student_content_completions_student_id_fkey;

ALTER TABLE public.student_content_completions
  ADD CONSTRAINT student_content_completions_student_id_fkey
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE CASCADE;

-- 4) Update student RLS policy (student_id now stores students.id)
DROP POLICY IF EXISTS "Students can manage own completions" ON public.student_content_completions;

CREATE POLICY "Students can manage own completions"
ON public.student_content_completions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_content_completions.student_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_content_completions.student_id
      AND s.user_id = auth.uid()
  )
);
