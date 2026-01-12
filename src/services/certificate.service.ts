import { CertificateTemplate, StudentCertificate } from '@/types/gamification';
import { Student } from '@/types/student';

// Extended template type with additional position fields
interface ExtendedCertificateTemplate extends CertificateTemplate {
  course_name_position?: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
  };
  level_title_position?: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
  };
}

export const certificateService = {
  // Generate certificate image with all placeholder overlays
  generateCertificateImage: async (
    template: ExtendedCertificateTemplate,
    studentName: string,
    courseName?: string,
    levelTitle?: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = template.default_width || 1200;
      canvas.height = template.default_height || 900;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw template image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Draw student name
        ctx.font = `${template.name_position.fontSize}px ${template.name_position.fontFamily}`;
        ctx.fillStyle = template.name_position.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(studentName, template.name_position.x, template.name_position.y);
        
        // Draw course name if position is defined
        if (courseName && template.course_name_position) {
          ctx.font = `${template.course_name_position.fontSize}px sans-serif`;
          ctx.fillStyle = template.course_name_position.color;
          ctx.fillText(courseName, template.course_name_position.x, template.course_name_position.y);
        }
        
        // Draw level/module title if position is defined
        if (levelTitle && template.level_title_position) {
          ctx.font = `${template.level_title_position.fontSize}px sans-serif`;
          ctx.fillStyle = template.level_title_position.color;
          ctx.fillText(levelTitle, template.level_title_position.x, template.level_title_position.y);
        }
        
        // Draw date if date_position exists
        if (template.date_position) {
          const dateStr = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          ctx.font = `${template.date_position.fontSize}px sans-serif`;
          ctx.fillStyle = template.date_position.color;
          ctx.fillText(dateStr, template.date_position.x, template.date_position.y);
        }
        
        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        resolve('');
      };
      
      img.src = template.template_image_url;
    });
  },

  // Save generated certificate
  saveCertificate: (certificate: StudentCertificate): void => {
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
  },

  // Get student's certificates
  getStudentCertificates: (studentId: string): StudentCertificate[] => {
    const key = `certificates_${studentId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  // Generate and save certificate
  awardCertificate: async (
    student: Student,
    activityType: 'course' | 'level' | 'assessment' | 'event',
    activityId: string,
    activityName: string,
    templateId: string,
    institutionName: string,
    completionDate: string,
    grade?: string
  ): Promise<StudentCertificate> => {
    const timestamp = Date.now();
    const verificationCode = `CERT-${timestamp}-${student.id.slice(-4).toUpperCase()}`;
    
    const certificate: StudentCertificate = {
      id: `cert-${timestamp}`,
      student_id: student.id,
      student_name: student.student_name,
      template_id: templateId,
      activity_type: activityType,
      activity_id: activityId,
      activity_name: activityName,
      institution_name: institutionName,
      issued_date: new Date().toISOString(),
      completion_date: completionDate,
      certificate_url: `/generated-certificates/${student.id}-${activityId}.pdf`,
      verification_code: verificationCode,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationCode)}`,
      grade
    };
    
    certificateService.saveCertificate(certificate);
    return certificate;
  }
};
