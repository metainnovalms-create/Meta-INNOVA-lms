import { View, Text } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

const valueProps = [
  {
    title: 'For Educational Institutions',
    items: [
      'Streamlined administrative operations with automated workflows',
      'Complete visibility into teaching activities and student progress',
      'Professional STEM curriculum delivered by trained Innovation Officers',
      'Cost-effective solution compared to building in-house capabilities',
      'Regular updates and new features without additional investment',
      'Dedicated support and training for staff members',
    ],
  },
  {
    title: 'For Students',
    items: [
      'Engaging, gamified learning experience that motivates progress',
      'Access to industry-relevant STEM content and projects',
      'Comprehensive portfolio building with certificates and achievements',
      'Collaborative project experience mimicking real-world scenarios',
      'Clear tracking of skills and competencies developed',
      'Recognition through badges and leaderboard rankings',
    ],
  },
  {
    title: 'For Management & Administrators',
    items: [
      'Real-time dashboards with actionable insights',
      'Reduced manual paperwork through digital workflows',
      'Transparent reporting for stakeholders and parents',
      'Easy coordination with META-INNOVA team',
      'Scalable solution that grows with institution needs',
      'Audit trails for compliance and accountability',
    ],
  },
  {
    title: 'Technical Advantages',
    items: [
      'Cloud-based SaaS with 99.9% uptime guarantee',
      'Multi-tenant architecture ensuring complete data isolation',
      'Role-based access control (RBAC) for security',
      'Real-time data synchronization across all devices',
      'Mobile-responsive design for on-the-go access',
      'Regular security updates and compliance maintenance',
    ],
  },
];

export function ValuePropsSection() {
  return (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>Value Propositions</Text>
        <Text style={styles.pageHeaderMeta}>META-INNOVA Platform Guide</Text>
      </View>

      <Text style={styles.sectionTitle}>6. Value Propositions</Text>

      <Text style={styles.paragraph}>
        META-INNOVA delivers measurable value to all stakeholders in the STEM education ecosystem. 
        Here's how each group benefits from the platform:
      </Text>

      <View style={styles.twoColumn}>
        {valueProps.map((prop, index) => (
          <View key={index} style={[styles.valueCard, { width: '100%', marginBottom: 12 }]} wrap={false}>
            <Text style={styles.valueTitle}>{prop.title}</Text>
            <View style={styles.valueList}>
              {prop.items.slice(0, 4).map((item, iIndex) => (
                <View key={iIndex} style={styles.bulletItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Contact Section */}
      <View style={styles.contactBox}>
        <Text style={styles.contactTitle}>7. Contact & Support</Text>
        <Text style={styles.contactText}>
          For technical support, training, or inquiries:
        </Text>
        <Text style={styles.contactText}>
          Email: support@meta-innova.com
        </Text>
        <Text style={styles.contactUrl}>
          https://innovation-academe.lovable.app
        </Text>
        <Text style={[styles.contactText, { marginTop: 16, fontSize: 9 }]}>
          © 2025 META-INNOVA. All rights reserved.
        </Text>
      </View>
    </View>
  );
}
