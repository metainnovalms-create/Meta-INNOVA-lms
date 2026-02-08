import { View, Text } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

const walkthroughSteps = [
  {
    time: '0-2 min',
    title: 'Opening & Login',
    steps: [
      'Navigate to the platform login page',
      'Demonstrate role-based login (select different roles)',
      'Show first-time password change flow',
      'Highlight security features and session management',
    ],
    talkingPoints: [
      '"Each user receives temporary credentials and must change password on first login"',
      '"The system automatically routes users to their role-specific dashboard"',
    ],
  },
  {
    time: '2-7 min',
    title: 'CEO / System Admin Dashboard',
    steps: [
      'Overview of analytics cards (institutions, students, revenue)',
      'Navigate to Institution Management → Add new institution',
      'Show officer assignment workflow',
      'Demonstrate course creation with levels and sessions',
      'Preview invoice generation and CRM features',
    ],
    talkingPoints: [
      '"Complete visibility into all platform operations from a single dashboard"',
      '"Onboard new institutions in minutes with automated setup"',
    ],
  },
  {
    time: '7-12 min',
    title: 'Institution Management View',
    steps: [
      'Switch to management portal (tenant-specific URL)',
      'Show student enrollment and class management',
      'Demonstrate inventory oversight and purchase approvals',
      'Navigate academic calendar with holidays',
      'Preview student performance reports',
    ],
    talkingPoints: [
      '"Institution admins have complete control over their students and operations"',
      '"Real-time visibility into officer activities and teaching schedules"',
    ],
  },
  {
    time: '12-16 min',
    title: 'Innovation Officer Experience',
    steps: [
      'Login as Innovation Officer',
      'Demonstrate GPS check-in (show location verification)',
      'Navigate course content and teaching materials',
      'Show student attendance marking for sessions',
      'Create a sample project and assign students',
      'Preview salary tracker with overtime calculation',
    ],
    talkingPoints: [
      '"GPS ensures accountability while providing transparent earnings tracking"',
      '"Officers can focus on teaching while the system handles administration"',
    ],
  },
  {
    time: '16-20 min',
    title: 'Student Dashboard & Closing',
    steps: [
      'Login as Student',
      'Show course navigation and content access',
      'Demonstrate gamification (XP, badges, leaderboard)',
      'Navigate to projects and show collaboration features',
      'Preview resume export with certificates',
      'Highlight SDG contribution tracking',
    ],
    talkingPoints: [
      '"Gamification increases engagement by 40% through rewards and competition"',
      '"Students build a comprehensive portfolio for future opportunities"',
    ],
  },
];

export function WalkthroughSection() {
  return (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>Live Walkthrough Script</Text>
        <Text style={styles.pageHeaderMeta}>META-INNOVA Platform Guide</Text>
      </View>

      <Text style={styles.sectionTitle}>5. Live Walkthrough Script</Text>

      <View style={styles.highlightBox}>
        <Text style={styles.highlightText}>
          Total Duration: ~20 minutes | Recommended for client demonstrations and stakeholder presentations
        </Text>
      </View>

      {walkthroughSteps.map((step, index) => (
        <View key={index} style={styles.walkthroughSection} wrap={false}>
          <View style={styles.walkthroughHeader}>
            <Text style={styles.walkthroughTime}>{step.time}</Text>
            <Text style={styles.walkthroughTitle}>{step.title}</Text>
          </View>

          <View style={styles.walkthroughContent}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151', marginBottom: 6 }}>
              Steps to Demonstrate:
            </Text>
            <View style={styles.bulletList}>
              {step.steps.map((s, sIndex) => (
                <View key={sIndex} style={styles.bulletItem}>
                  <Text style={styles.bullet}>{sIndex + 1}.</Text>
                  <Text style={styles.bulletText}>{s}</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151', marginTop: 8, marginBottom: 6 }}>
              Key Talking Points:
            </Text>
            <View style={styles.bulletList}>
              {step.talkingPoints.map((tp, tpIndex) => (
                <View key={tpIndex} style={styles.bulletItem}>
                  <Text style={styles.bullet}>💬</Text>
                  <Text style={[styles.bulletText, { fontStyle: 'italic' }]}>{tp}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}

      <View style={styles.highlightBox}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>
          Pro Tips for Presenters:
        </Text>
        <Text style={styles.highlightText}>
          • Keep demo data realistic but anonymized{'\n'}
          • Have backup screenshots ready for connectivity issues{'\n'}
          • Encourage questions during each section{'\n'}
          • End with a summary of key benefits for their specific needs
        </Text>
      </View>
    </View>
  );
}
