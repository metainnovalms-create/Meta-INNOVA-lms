import { StudentCertificate } from '@/types/gamification';

export const mockStudentCertificates: StudentCertificate[] = [
  {
    id: 'cert-stud-001',
    student_id: 'MSD-2024-0001',
    student_name: 'Aarav Kumar',
    template_id: 'cert-temp-001',
    activity_type: 'course',
    activity_id: 'course-basic-electronics',
    activity_name: 'Basic Electronics and Circuit Design',
    institution_name: 'Modern School Vasant Vihar',
    issued_date: '2024-03-15T00:00:00Z',
    completion_date: '2024-03-14T00:00:00Z',
    certificate_url: '/generated-certificates/cert-stud-001.pdf',
    verification_code: 'CERT-2024-MSD-0001',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-2024-MSD-0001',
    grade: 'A'
  },
  {
    id: 'cert-stud-002',
    student_id: 'MSD-2024-0002',
    student_name: 'Priya Sharma',
    template_id: 'cert-temp-002',
    activity_type: 'level',
    activity_id: 'level-001',
    activity_name: 'IoT Smart Home Level Completion',
    institution_name: 'Modern School Vasant Vihar',
    issued_date: '2024-03-10T00:00:00Z',
    completion_date: '2024-03-09T00:00:00Z',
    certificate_url: '/generated-certificates/cert-stud-002.pdf',
    verification_code: 'CERT-2024-MSD-0002',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-2024-MSD-0002',
    grade: 'A+'
  },
  {
    id: 'cert-stud-003',
    student_id: 'KGA-2024-0001',
    student_name: 'Aditya Menon',
    template_id: 'cert-temp-003',
    activity_type: 'assessment',
    activity_id: 'assess-001',
    activity_name: 'Artificial Intelligence Fundamentals',
    institution_name: 'Kikani Global Academy',
    issued_date: '2024-03-08T00:00:00Z',
    completion_date: '2024-03-08T00:00:00Z',
    certificate_url: '/generated-certificates/cert-stud-003.pdf',
    verification_code: 'CERT-2024-KGA-0001',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-2024-KGA-0001',
    grade: 'B+'
  },
  {
    id: 'cert-stud-004',
    student_id: 'KGA-2024-0002',
    student_name: 'Sneha Reddy',
    template_id: 'cert-temp-004',
    activity_type: 'event',
    activity_id: 'evt-hack-2024',
    activity_name: 'National Innovation Hackathon 2024',
    institution_name: 'Kikani Global Academy',
    issued_date: '2024-02-28T00:00:00Z',
    completion_date: '2024-02-27T00:00:00Z',
    certificate_url: '/generated-certificates/cert-stud-004.pdf',
    verification_code: 'CERT-2024-KGA-0002',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CERT-2024-KGA-0002'
  }
];
