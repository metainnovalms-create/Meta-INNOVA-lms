import { certificateService } from '@/services/certificate.service';
import { Student } from '@/types/student';
import { Course } from '@/types/course';
import { Assessment } from '@/types/assessment';
import { ActivityEvent } from '@/types/events';
import { mockCertificateTemplates } from '@/data/mockCertificateTemplates';

/**
 * Auto-award certificate when a student completes a course
 */
export async function awardCourseCompletionCertificate(
  student: Student,
  course: Course,
  institutionName: string,
  completionDate: string,
  grade?: string
): Promise<void> {
  if (!course.certificate_template_id) return;

  const template = mockCertificateTemplates.find(t => t.id === course.certificate_template_id);
  if (!template || !template.is_active) {
    console.warn('Certificate template not found or inactive:', course.certificate_template_id);
    return;
  }

  try {
    await certificateService.awardCertificate(
      student,
      'course',
      course.id,
      course.title,
      course.certificate_template_id,
      institutionName,
      completionDate,
      grade
    );
    console.log(`Certificate awarded to ${student.student_name} for course: ${course.title}`);
  } catch (error) {
    console.error('Failed to award course certificate:', error);
  }
}

/**
 * Auto-award certificate when a student passes an assessment
 */
export async function awardAssessmentCompletionCertificate(
  student: Student,
  assessment: Assessment,
  institutionName: string,
  completionDate: string,
  score: number,
  percentage: number
): Promise<void> {
  if (!assessment.certificate_template_id) return;

  // Only award certificate if student passed
  if (percentage < assessment.pass_percentage) {
    console.log(`Score ${percentage}% is below pass threshold ${assessment.pass_percentage}%, certificate not awarded`);
    return;
  }

  const template = mockCertificateTemplates.find(t => t.id === assessment.certificate_template_id);
  if (!template || !template.is_active) {
    console.warn('Certificate template not found or inactive:', assessment.certificate_template_id);
    return;
  }

  try {
    await certificateService.awardCertificate(
      student,
      'assessment',
      assessment.id,
      assessment.title,
      assessment.certificate_template_id,
      institutionName,
      completionDate,
      `${percentage.toFixed(0)}%`
    );
    console.log(`Certificate awarded to ${student.student_name} for assessment: ${assessment.title}`);
  } catch (error) {
    console.error('Failed to award assessment certificate:', error);
  }
}

/**
 * Auto-award certificate when a student participates in an event
 */
export async function awardEventParticipationCertificate(
  student: Student,
  event: ActivityEvent,
  institutionName: string,
  participationDate: string
): Promise<void> {
  if (!event.certificate_template_id) return;

  const template = mockCertificateTemplates.find(t => t.id === event.certificate_template_id);
  if (!template || !template.is_active) {
    console.warn('Certificate template not found or inactive:', event.certificate_template_id);
    return;
  }

  try {
    await certificateService.awardCertificate(
      student,
      'event',
      event.id,
      event.title,
      event.certificate_template_id,
      institutionName,
      participationDate
    );
    console.log(`Certificate awarded to ${student.student_name} for event: ${event.title}`);
  } catch (error) {
    console.error('Failed to award event certificate:', error);
  }
}

/**
 * Batch award certificates to multiple students for an event
 */
export async function batchAwardEventCertificates(
  students: Student[],
  event: ActivityEvent,
  institutionName: string,
  participationDate: string
): Promise<void> {
  if (!event.certificate_template_id) return;

  const results = await Promise.allSettled(
    students.map(student =>
      awardEventParticipationCertificate(student, event, institutionName, participationDate)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Event certificates awarded: ${successful} successful, ${failed} failed`);
}

/**
 * Auto-award certificate when a student completes a module (all sessions at 100%)
 */
export async function awardModuleCompletionCertificate(
  student: Student,
  moduleId: string,
  moduleName: string,
  templateId: string,
  institutionName: string,
  completionDate: string
): Promise<void> {
  const template = mockCertificateTemplates.find(t => t.id === templateId);
  if (!template || !template.is_active) {
    console.warn('Certificate template not found or inactive:', templateId);
    return;
  }

  try {
    await certificateService.awardCertificate(
      student,
      'course', // Use 'course' type for modules as well
      moduleId,
      moduleName,
      templateId,
      institutionName,
      completionDate
    );
    console.log(`Certificate awarded to ${student.student_name} for module: ${moduleName}`);
  } catch (error) {
    console.error('Failed to award module certificate:', error);
  }
}
