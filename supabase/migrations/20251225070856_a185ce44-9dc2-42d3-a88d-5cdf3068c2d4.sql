-- Create trigger to auto-unlock next session after content completion
CREATE OR REPLACE TRIGGER trigger_check_unlock_on_completion
AFTER INSERT ON public.student_content_completions
FOR EACH ROW
EXECUTE FUNCTION public.check_and_unlock_next_content();