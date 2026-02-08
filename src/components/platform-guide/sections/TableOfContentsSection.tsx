import { View, Text } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

const tocItems = [
  { number: '1', title: 'Platform Overview', page: '3' },
  { number: '2', title: 'Platform Architecture', page: '4' },
  { number: '3', title: 'User Roles & Capabilities', page: '5' },
  { number: '3.1', title: 'CEO / System Admin', page: '5' },
  { number: '3.2', title: 'Institution Management', page: '6' },
  { number: '3.3', title: 'Innovation Officer (Trainer)', page: '7' },
  { number: '3.4', title: 'Student', page: '8' },
  { number: '4', title: 'Core Modules', page: '9' },
  { number: '4.1', title: 'Learning Management System (LMS)', page: '9' },
  { number: '4.2', title: 'Human Resource Management (HRMS)', page: '10' },
  { number: '4.3', title: 'Inventory & Warehouse (IMS/WMS)', page: '10' },
  { number: '4.4', title: 'Enterprise Resource Planning (ERP)', page: '11' },
  { number: '4.5', title: 'Gamification & SDG Tracking', page: '11' },
  { number: '5', title: 'Live Walkthrough Script', page: '12' },
  { number: '6', title: 'Value Propositions', page: '15' },
  { number: '7', title: 'Contact & Support', page: '16' },
];

export function TableOfContentsSection() {
  return (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>Table of Contents</Text>
        <Text style={styles.pageHeaderMeta}>META-INNOVA Platform Guide</Text>
      </View>

      <Text style={styles.sectionTitle}>Contents</Text>

      <View style={styles.tocContainer}>
        {tocItems.map((item, index) => (
          <View key={index} style={styles.tocItem}>
            <Text style={styles.tocNumber}>{item.number}</Text>
            <Text style={styles.tocTitle}>{item.title}</Text>
            <Text style={styles.tocPage}>{item.page}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
