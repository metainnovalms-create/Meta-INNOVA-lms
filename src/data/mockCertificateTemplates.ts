import { CertificateTemplate } from '@/types/gamification';

export const mockCertificateTemplates: CertificateTemplate[] = [
  {
    id: 'cert-temp-001',
    name: 'Modern Course Completion',
    description: 'Professional blue gradient certificate for course completions',
    category: 'course',
    template_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=900&fit=crop',
    default_width: 1200,
    default_height: 900,
    name_position: {
      x: 600,
      y: 450,
      fontSize: 48,
      color: '#1e3a8a',
      fontFamily: 'serif'
    },
    date_position: {
      x: 600,
      y: 520,
      fontSize: 24,
      color: '#374151'
    },
    created_by: 'sysadmin-001',
    created_at: '2024-01-15T00:00:00Z',
    is_active: true
  },
  {
    id: 'cert-temp-002',
    name: 'Level Excellence',
    description: 'Gold themed certificate for outstanding level performance',
    category: 'level',
    template_image_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&h=900&fit=crop',
    default_width: 1200,
    default_height: 900,
    name_position: {
      x: 600,
      y: 400,
      fontSize: 52,
      color: '#92400e',
      fontFamily: 'serif'
    },
    date_position: {
      x: 600,
      y: 480,
      fontSize: 24,
      color: '#374151'
    },
    created_by: 'sysadmin-001',
    created_at: '2024-01-16T00:00:00Z',
    is_active: true
  },
  {
    id: 'cert-temp-003',
    name: 'Assessment Achievement',
    description: 'Clean modern design for assessment completions',
    category: 'assessment',
    template_image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=900&fit=crop',
    default_width: 1200,
    default_height: 900,
    name_position: {
      x: 600,
      y: 420,
      fontSize: 46,
      color: '#065f46',
      fontFamily: 'serif'
    },
    date_position: {
      x: 600,
      y: 500,
      fontSize: 24,
      color: '#374151'
    },
    created_by: 'sysadmin-001',
    created_at: '2024-01-17T00:00:00Z',
    is_active: true
  },
  {
    id: 'cert-temp-004',
    name: 'Event Participation',
    description: 'Vibrant certificate for event participation',
    category: 'event',
    template_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=900&fit=crop',
    default_width: 1200,
    default_height: 900,
    name_position: {
      x: 600,
      y: 440,
      fontSize: 50,
      color: '#7c2d12',
      fontFamily: 'serif'
    },
    date_position: {
      x: 600,
      y: 510,
      fontSize: 24,
      color: '#374151'
    },
    created_by: 'sysadmin-001',
    created_at: '2024-01-18T00:00:00Z',
    is_active: true
  }
];
