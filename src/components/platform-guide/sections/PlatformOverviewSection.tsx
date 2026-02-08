import { View, Text } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

export function PlatformOverviewSection() {
  return (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>Platform Overview</Text>
        <Text style={styles.pageHeaderMeta}>META-INNOVA Platform Guide</Text>
      </View>

      <Text style={styles.sectionTitle}>1. What is META-INNOVA?</Text>

      <Text style={styles.paragraph}>
        META-INNOVA is a comprehensive multi-tenant SaaS platform designed specifically for STEM 
        education excellence. It combines a powerful Learning Management System (LMS) with 
        Enterprise Resource Planning (ERP) capabilities, providing educational institutions with 
        a complete digital infrastructure for delivering world-class STEM education.
      </Text>

      <View style={styles.highlightBox}>
        <Text style={styles.highlightText}>
          "Empowering educational institutions to deliver innovative STEM learning experiences 
          while streamlining administrative operations through intelligent automation."
        </Text>
      </View>

      <Text style={styles.sectionSubtitle}>Key Differentiators</Text>

      <View style={styles.bulletList}>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold' }}>Multi-Tenant Architecture: </Text>
            Complete data isolation between institutions with shared infrastructure efficiency.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold' }}>GPS-Verified Attendance: </Text>
            Location-based check-in/out for trainers with automatic payroll integration.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold' }}>Gamified Learning: </Text>
            XP points, badges, leaderboards, and achievement systems to boost engagement.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold' }}>SDG Alignment: </Text>
            Track educational impact against UN Sustainable Development Goals.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold' }}>AI-Powered Analytics: </Text>
            Ask Metova assistant for natural language insights and predictions.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>2. Platform Architecture</Text>

      <Text style={styles.paragraph}>
        META-INNOVA operates on a two-level hierarchy that separates platform operations 
        from client institution management:
      </Text>

      <View style={styles.architectureBox}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', marginBottom: 12 }}>
          Two-Level Hierarchy
        </Text>
        
        <View style={styles.architectureRow}>
          <Text style={styles.architectureItem}>Level 1: Platform Owner (META-INNOVA)</Text>
        </View>
        
        <Text style={styles.architectureArrow}>↓</Text>
        
        <View style={styles.architectureRow}>
          <Text style={[styles.architectureItem, { backgroundColor: '#4ade80', color: '#1a1a2e' }]}>
            Super Admin
          </Text>
          <Text style={[styles.architectureItem, { backgroundColor: '#4ade80', color: '#1a1a2e' }]}>
            System Admin / CEO
          </Text>
          <Text style={[styles.architectureItem, { backgroundColor: '#4ade80', color: '#1a1a2e' }]}>
            Meta Employees
          </Text>
        </View>

        <Text style={styles.architectureArrow}>↓</Text>

        <View style={styles.architectureRow}>
          <Text style={styles.architectureItem}>Level 2: Client Institutions</Text>
        </View>

        <Text style={styles.architectureArrow}>↓</Text>

        <View style={styles.architectureRow}>
          <Text style={[styles.architectureItem, { backgroundColor: '#3b82f6' }]}>
            Management
          </Text>
          <Text style={[styles.architectureItem, { backgroundColor: '#3b82f6' }]}>
            Officers
          </Text>
          <Text style={[styles.architectureItem, { backgroundColor: '#3b82f6' }]}>
            Students
          </Text>
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>Technology Highlights</Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>React + TypeScript frontend</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Real-time data synchronization</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Role-based access control (RBAC)</Text>
            </View>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Secure cloud infrastructure</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>PDF generation & export</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Responsive mobile design</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
