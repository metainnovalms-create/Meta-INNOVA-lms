export interface ContentProgressRecord {
  student_id: string;
  course_id: string;
  completed_content_ids: string[];
  last_updated: string;
}

export const mockContentProgress: ContentProgressRecord[] = [
  {
    student_id: 'springfield-8-A-001',
    course_id: 'course-1',
    completed_content_ids: ['content-1', 'content-2'],
    last_updated: '2024-03-20T10:00:00Z'
  },
  {
    student_id: 'springfield-8-A-002',
    course_id: 'course-1',
    completed_content_ids: ['content-1'],
    last_updated: '2024-03-19T15:30:00Z'
  }
];
