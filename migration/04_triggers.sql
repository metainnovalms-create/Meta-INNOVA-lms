-- ============================================
-- Meta-INNOVA LMS - Triggers
-- Run this AFTER creating functions
-- ============================================

-- Updated at triggers for tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON public.officers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.update_survey_updated_at();

-- Sync profile from student trigger
CREATE TRIGGER sync_profile_from_student_trigger AFTER INSERT OR UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_student();

-- Sync avatar trigger
CREATE TRIGGER sync_avatar_trigger AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_profile_avatar();

-- Reserve invoice number on delete
CREATE TRIGGER reserve_invoice_number_trigger BEFORE DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.reserve_deleted_invoice_number();

-- XP award triggers
CREATE TRIGGER award_project_membership_xp_trigger AFTER INSERT ON public.project_members FOR EACH ROW EXECUTE FUNCTION public.award_project_membership_xp();
CREATE TRIGGER award_project_achievement_xp_trigger AFTER INSERT ON public.project_achievements FOR EACH ROW EXECUTE FUNCTION public.award_project_achievement_xp();
CREATE TRIGGER award_assignment_xp_trigger AFTER UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.award_assignment_xp();

-- Course unlock triggers
CREATE TRIGGER check_content_completion_trigger AFTER INSERT ON public.student_content_completions FOR EACH ROW EXECUTE FUNCTION public.check_and_unlock_next_content();
