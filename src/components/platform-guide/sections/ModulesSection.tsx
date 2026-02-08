import { View, Text } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

const modules = [
  {
    name: 'Learning Management System (LMS)',
    icon: '📚',
    features: [
      'Hierarchical course structure (Course → Level → Session → Content)',
      'Multiple content types: PDF documents, YouTube videos, PPT presentations',
      'Assessments with MCQ, True/False, and short answer questions',
      'Assignments with various submission types and grading rubrics',
      'Certificate generation upon course/level completion',
      'Class-based course assignments with level-specific access',
    ],
  },
  {
    name: 'Human Resource Management (HRMS)',
    icon: '👥',
    features: [
      'Multi-stage leave approval workflow (Officer → Manager → AGM)',
      'GPS-verified attendance with geofencing radius configuration',
      'Automated payroll calculation with overtime tracking',
      'Company and institution holiday calendar management',
      'Employee document storage and verification',
      'Performance appraisal and HR rating system',
    ],
  },
  {
    name: 'Inventory & Warehouse (IMS/WMS)',
    icon: '📦',
    features: [
      'Lab equipment and material tracking per institution',
      'Multi-stage purchase request workflow with approvals',
      'Issue reporting for damaged/missing/malfunctioning items',
      'Inventory history and audit trail',
      'Stock level monitoring and alerts',
      'Vendor management integration',
    ],
  },
  {
    name: 'Enterprise Resource Planning (ERP)',
    icon: '💼',
    features: [
      'CRM with communication logs and follow-up tracking',
      'Contract management with renewal alerts',
      'GST-compliant invoice generation (Tax Invoice & Proforma)',
      'Multi-company billing profile support',
      'Digital signature integration for documents',
      'Comprehensive business analytics and reports',
    ],
  },
  {
    name: 'Gamification System',
    icon: '🎮',
    features: [
      'XP (Experience Points) for various learning activities',
      'Badge system with achievement categories',
      'Class and institution-wide leaderboards',
      'Login streak tracking and bonuses',
      'Real-time progress updates',
      'Student engagement analytics',
    ],
  },
  {
    name: 'SDG Tracking',
    icon: '🌍',
    features: [
      'Course mapping to UN Sustainable Development Goals',
      'Project tagging with relevant SDGs',
      'Institution contribution scoring and rankings',
      'Student SDG portfolio tracking',
      'Impact analytics and visualization',
      'Global contribution leaderboard',
    ],
  },
  {
    name: 'AI Analytics (Ask Metova)',
    icon: '🤖',
    features: [
      'Natural language query interface',
      'Performance predictions and insights',
      'At-risk student identification',
      'Engagement trend analysis',
      'Automated report generation',
      'Context-aware recommendations',
    ],
  },
];

export function ModulesSection() {
  return (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>Core Modules</Text>
        <Text style={styles.pageHeaderMeta}>META-INNOVA Platform Guide</Text>
      </View>

      <Text style={styles.sectionTitle}>4. Core Modules</Text>

      <Text style={styles.paragraph}>
        META-INNOVA provides a comprehensive suite of integrated modules designed to address 
        every aspect of STEM education delivery and institutional management.
      </Text>

      {modules.map((module, index) => (
        <View key={index} style={styles.roleCard} wrap={false}>
          <Text style={styles.roleTitle}>
            {module.icon} {module.name}
          </Text>
          <View style={styles.bulletList}>
            {module.features.slice(0, 4).map((feature, fIndex) => (
              <View key={fIndex} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
