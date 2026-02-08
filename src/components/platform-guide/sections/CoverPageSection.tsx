import { View, Text } from '@react-pdf/renderer';
import { styles } from '../PlatformGuidePDFStyles';

export function CoverPageSection() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.coverContainer}>
      {/* Logo Area */}
      <View style={styles.coverHeader}>
        <Text style={styles.coverLogo}>META-INNOVA</Text>
      </View>

      {/* Main Title */}
      <Text style={styles.coverTitle}>
        Platform Overview{'\n'}& Walkthrough Guide
      </Text>

      {/* Divider */}
      <View style={styles.coverDivider} />

      {/* Subtitle */}
      <Text style={styles.coverSubtitle}>
        Comprehensive Guide for STEM Education Excellence
      </Text>

      {/* Meta Information */}
      <Text style={styles.coverMeta}>Version 1.0 | {currentDate}</Text>
      <Text style={[styles.coverMeta, { marginTop: 8 }]}>
        Empowering the Next Generation of Innovators
      </Text>
    </View>
  );
}
