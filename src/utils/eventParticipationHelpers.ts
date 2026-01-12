import { ActivityEvent } from '@/types/events';
import { Student } from '@/types/student';
import { awardEventParticipationCertificate, batchAwardEventCertificates } from './certificateAutoAward';

/**
 * Award certificate when a student's project is assigned to an event
 */
export async function awardCertificateOnEventParticipation(
  student: Student,
  event: ActivityEvent,
  institutionName: string
): Promise<void> {
  if (!event.certificate_template_id) return;

  const participationDate = new Date().toISOString();
  await awardEventParticipationCertificate(student, event, institutionName, participationDate);
}

/**
 * Award certificates to all students in a project team when assigned to event
 */
export async function awardCertificatesToProjectTeam(
  teamMembers: Student[],
  event: ActivityEvent,
  institutionName: string
): Promise<void> {
  if (!event.certificate_template_id) return;

  const participationDate = new Date().toISOString();
  await batchAwardEventCertificates(teamMembers, event, institutionName, participationDate);
}

/**
 * Check if student is eligible for event participation certificate
 */
export function isEligibleForEventCertificate(
  event: ActivityEvent,
  studentId: string
): boolean {
  // Check if event has certificate configured
  if (!event.certificate_template_id) return false;

  // Check if student's project is linked to event
  if (!event.linked_project_ids || event.linked_project_ids.length === 0) return false;

  // Additional checks can be added here (e.g., event completion status)
  return true;
}
