import { View, Text, Page } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

const roles = [
  {
    title: 'CEO / System Admin',
    icon: '👔',
    path: '/system-admin/dashboard',
    description: 'Full platform oversight with complete control over all institutions, courses, officers, and business operations.',
    capabilities: [
      'Multi-institution management and onboarding',
      'Revenue tracking and financial analytics',
      'Course creation and content management',
      'Officer recruitment and assignment',
      'Position-based access configuration (RBAC)',
      'Platform-wide reports and insights',
      'CRM and client relationship management',
      'Invoice generation and billing',
    ],
    benefits: [
      'Complete visibility into platform operations',
      'Data-driven decision making with analytics',
      'Streamlined institution onboarding process',
      'Automated payroll calculations',
    ],
  },
  {
    title: 'Institution Management',
    icon: '🏫',
    path: '/tenant/{slug}/management/dashboard',
    description: 'Client institution administrators who manage their school/college operations within the platform.',
    capabilities: [
      'Student enrollment and class management',
      'Officer supervision and scheduling',
      'Inventory oversight and purchase approvals',
      'Academic calendar and holiday management',
      'Student performance monitoring',
      'Assignment and assessment tracking',
      'Event and activity coordination',
      'Communication with META-INNOVA team',
    ],
    benefits: [
      'Centralized student data management',
      'Real-time visibility into teaching activities',
      'Automated administrative workflows',
      'Comprehensive performance reports',
    ],
  },
  {
    title: 'Innovation Officer (Trainer)',
    icon: '👨‍🏫',
    path: '/tenant/{slug}/officer/dashboard',
    description: 'Field trainers assigned to institutions who deliver STEM education and mentor student projects.',
    capabilities: [
      'GPS-verified attendance check-in/out',
      'Course content delivery and teaching',
      'Student project mentoring and guidance',
      'Assessment creation and grading',
      'Lab inventory management',
      'Leave application and tracking',
      'Daily work log submission',
      'Session attendance marking',
    ],
    benefits: [
      'Transparent salary tracking with overtime',
      'Clear teaching schedules and timetables',
      'Easy access to course materials',
      'Mobile-friendly interface for field work',
    ],
  },
  {
    title: 'Student',
    icon: '🎓',
    path: '/tenant/{slug}/student/dashboard',
    description: 'Enrolled learners who access courses, complete assessments, and build their innovation portfolio.',
    capabilities: [
      'Interactive course learning with videos/PDFs',
      'Gamified progress tracking (XP, badges)',
      'Project participation and collaboration',
      'Assessment and assignment submissions',
      'Certificate collection and export',
      'Resume building with achievements',
      'Event registration and participation',
      'SDG contribution tracking',
    ],
    benefits: [
      'Engaging learning experience with gamification',
      'Comprehensive skill portfolio development',
      'Recognition through badges and certificates',
      'Clear visibility into academic progress',
    ],
  },
];

export function RolesSection() {
  return (
    <>
      {roles.map((role, index) => (
        <View key={index} wrap={false}>
          {index === 0 && (
            <>
              <View style={styles.pageHeader}>
                <Text style={styles.pageHeaderTitle}>User Roles & Capabilities</Text>
                <Text style={styles.pageHeaderMeta}>META-INNOVA Platform Guide</Text>
              </View>
              <Text style={styles.sectionTitle}>3. User Roles & Capabilities</Text>
              <Text style={styles.paragraph}>
                META-INNOVA supports four primary user roles, each with specialized dashboards 
                and feature access tailored to their responsibilities.
              </Text>
            </>
          )}

          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>
              {role.icon} {role.title}
            </Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
            <Text style={styles.rolePath}>Dashboard: {role.path}</Text>

            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 6 }}>
              Key Capabilities:
            </Text>
            <View style={styles.bulletList}>
              {role.capabilities.slice(0, 4).map((cap, capIndex) => (
                <View key={capIndex} style={styles.bulletItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.bulletText}>{cap}</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#374151', marginTop: 8, marginBottom: 6 }}>
              Benefits:
            </Text>
            <View style={styles.bulletList}>
              {role.benefits.slice(0, 2).map((benefit, benIndex) => (
                <View key={benIndex} style={styles.bulletItem}>
                  <Text style={styles.bullet}>★</Text>
                  <Text style={styles.bulletText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </>
  );
}
