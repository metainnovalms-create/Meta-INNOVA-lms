import { Student } from '@/types/student';
import { Course } from '@/types/course';
import { StudentCertificate } from '@/types/gamification';

export function generateCourseCertificate(
  student: Student,
  course: Course,
  officerName: string,
  institutionName: string,
  completionDate: string,
  templateId: string,
  grade?: string
): StudentCertificate {
  const timestamp = Date.now();
  const verificationCode = `CERT-${timestamp}-${student.id.slice(-4).toUpperCase()}`;
  
  return {
    id: `cert-${timestamp}`,
    student_id: student.id,
    student_name: student.student_name,
    template_id: templateId,
    activity_type: 'course',
    activity_id: course.id,
    activity_name: course.title,
    institution_name: institutionName,
    issued_date: new Date().toISOString(),
    completion_date: completionDate,
    certificate_url: `/certificates/${student.id}-${course.id}.pdf`,
    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationCode)}`,
    verification_code: verificationCode,
    grade
  };
}

export function storeCertificate(certificate: StudentCertificate): void {
  const key = `certificates_${certificate.student_id}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  
  // Check if certificate already exists
  const existingIndex = existing.findIndex(
    (c: StudentCertificate) => 
      c.activity_type === certificate.activity_type && 
      c.activity_id === certificate.activity_id
  );
  
  if (existingIndex >= 0) {
    existing[existingIndex] = certificate;
  } else {
    existing.unshift(certificate);
  }
  
  localStorage.setItem(key, JSON.stringify(existing));
}

export function getCertificates(studentId: string): StudentCertificate[] {
  const key = `certificates_${studentId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

export function getCertificateByCourse(studentId: string, courseId: string): StudentCertificate | null {
  const certificates = getCertificates(studentId);
  return certificates.find(c => c.activity_type === 'course' && c.activity_id === courseId) || null;
}
