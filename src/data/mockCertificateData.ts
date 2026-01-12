import { StudentCertificate } from '@/types/gamification';

export const mockCertificates: StudentCertificate[] = [
  {
    id: 'cert-001',
    student_id: 'springfield-8-A-001',
    student_name: 'Aarav Sharma',
    template_id: 'cert-temp-001',
    activity_type: 'course',
    activity_id: 'course-1',
    activity_name: 'Introduction to Artificial Intelligence',
    institution_name: 'Springfield High School',
    issued_date: '2024-03-15T00:00:00Z',
    completion_date: '2024-03-14T00:00:00Z',
    certificate_url: '/certificates/springfield-8-A-001-course-1.pdf',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-1710460800000-A001',
    verification_code: 'CERT-1710460800000-A001',
    grade: 'A'
  }
];
