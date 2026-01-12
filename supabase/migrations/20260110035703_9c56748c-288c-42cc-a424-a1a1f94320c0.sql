-- Create a function to sync profile from student data
CREATE OR REPLACE FUNCTION public.sync_profile_from_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if user_id is set
  IF NEW.user_id IS NOT NULL THEN
    -- Update the profiles table with student's institution and class
    UPDATE public.profiles
    SET 
      institution_id = COALESCE(NEW.institution_id, institution_id),
      class_id = COALESCE(NEW.class_id, class_id),
      name = COALESCE(NEW.student_name, name),
      email = COALESCE(NEW.email, email),
      updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Log for debugging
    RAISE LOG 'sync_profile_from_student: Updated profile % with institution_id=%, class_id=%', 
      NEW.user_id, NEW.institution_id, NEW.class_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on students table to auto-sync profile
DROP TRIGGER IF EXISTS trigger_sync_profile_from_student ON public.students;
CREATE TRIGGER trigger_sync_profile_from_student
  AFTER INSERT OR UPDATE OF user_id, institution_id, class_id, student_name, email
  ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_student();

-- One-time repair: Fix all existing broken profiles where student has user_id but profile lacks institution_id/class_id
UPDATE public.profiles p
SET 
  institution_id = s.institution_id,
  class_id = s.class_id,
  name = COALESCE(s.student_name, p.name),
  updated_at = now()
FROM public.students s
WHERE s.user_id = p.id
  AND s.user_id IS NOT NULL
  AND (p.institution_id IS NULL OR p.class_id IS NULL)
  AND s.institution_id IS NOT NULL;