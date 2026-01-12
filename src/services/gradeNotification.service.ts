import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notification.service';
import { getNotificationLink } from './notificationLink.service';

export const gradeNotificationService = {
  /**
   * Send notification when an assignment is graded
   */
  async sendAssignmentGradedNotification(
    studentId: string,
    assignmentTitle: string,
    marksObtained: number,
    totalMarks: number,
    passingMarks: number | null,
    assignmentId: string
  ): Promise<void> {
    try {
      const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      const passed = passingMarks ? marksObtained >= passingMarks : percentage >= 50;
      
      await notificationService.createNotification(
        studentId,
        'student',
        'assignment_graded',
        'Assignment Graded',
        `Your assignment "${assignmentTitle}" has been graded. Score: ${marksObtained}/${totalMarks} (${percentage}%) - ${passed ? 'Passed' : 'Failed'}`,
        getNotificationLink('student', '/assignments'),
        {
          assignment_id: assignmentId,
          marks_obtained: marksObtained,
          total_marks: totalMarks,
          percentage,
          passed,
        }
      );
    } catch (error) {
      console.error('Error sending assignment graded notification:', error);
    }
  },

  /**
   * Send notification when an assessment is completed/graded
   */
  async sendAssessmentGradedNotification(
    studentId: string,
    assessmentTitle: string,
    score: number,
    percentage: number,
    passed: boolean,
    assessmentId: string
  ): Promise<void> {
    try {
      await notificationService.createNotification(
        studentId,
        'student',
        'assessment_graded',
        'Assessment Completed',
        `Assessment "${assessmentTitle}" completed. Score: ${percentage.toFixed(0)}% - ${passed ? 'Passed' : 'Failed'}`,
        getNotificationLink('student', '/assessments'),
        {
          assessment_id: assessmentId,
          score,
          percentage,
          passed,
        }
      );
    } catch (error) {
      console.error('Error sending assessment graded notification:', error);
    }
  },

  /**
   * Send notification when a new assignment is published to students
   */
  async sendNewAssignmentNotification(
    studentIds: string[],
    assignmentTitle: string,
    dueDate: string,
    assignmentId: string,
    totalMarks: number | null
  ): Promise<void> {
    try {
      for (const studentId of studentIds) {
        await notificationService.createNotification(
          studentId,
          'student',
          'new_assignment_published',
          'New Assignment Available',
          `New assignment "${assignmentTitle}" is now available. Due: ${new Date(dueDate).toLocaleDateString()}${totalMarks ? ` (${totalMarks} marks)` : ''}`,
          getNotificationLink('student', '/assignments'),
          {
            assignment_id: assignmentId,
            due_date: dueDate,
            total_marks: totalMarks,
          }
        );
      }
    } catch (error) {
      console.error('Error sending new assignment notifications:', error);
    }
  },

  /**
   * Send notification when a new assessment is published to students
   */
  async sendNewAssessmentNotification(
    studentIds: string[],
    assessmentTitle: string,
    startTime: string,
    endTime: string,
    assessmentId: string,
    durationMinutes: number
  ): Promise<void> {
    try {
      for (const studentId of studentIds) {
        await notificationService.createNotification(
          studentId,
          'student',
          'new_assessment_published',
          'New Assessment Available',
          `New assessment "${assessmentTitle}" is now available. Duration: ${durationMinutes} minutes. Available until: ${new Date(endTime).toLocaleDateString()}`,
          getNotificationLink('student', '/assessments'),
          {
            assessment_id: assessmentId,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: durationMinutes,
          }
        );
      }
    } catch (error) {
      console.error('Error sending new assessment notifications:', error);
    }
  },
};
