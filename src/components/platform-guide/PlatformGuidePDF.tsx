import { Document, Page, Text } from '@react-pdf/renderer';
import { styles } from './PlatformGuidePDFStyles';
import { CoverPageSection } from './sections/CoverPageSection';
import { TableOfContentsSection } from './sections/TableOfContentsSection';
import { PlatformOverviewSection } from './sections/PlatformOverviewSection';
import { RolesSection } from './sections/RolesSection';
import { ModulesSection } from './sections/ModulesSection';
import { WalkthroughSection } from './sections/WalkthroughSection';
import { ValuePropsSection } from './sections/ValuePropsSection';

export function PlatformGuidePDF() {
  return (
    <Document
      title="META-INNOVA Platform Overview & Walkthrough Guide"
      author="META-INNOVA"
      subject="Comprehensive Guide for STEM Education Excellence"
      keywords="META-INNOVA, LMS, ERP, STEM Education, Platform Guide"
    >
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <CoverPageSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <TableOfContentsSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Platform Overview & Architecture */}
      <Page size="A4" style={styles.page}>
        <PlatformOverviewSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* User Roles & Capabilities */}
      <Page size="A4" style={styles.page}>
        <RolesSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Core Modules */}
      <Page size="A4" style={styles.page}>
        <ModulesSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Live Walkthrough Script */}
      <Page size="A4" style={styles.page}>
        <WalkthroughSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Value Propositions & Contact */}
      <Page size="A4" style={styles.page}>
        <ValuePropsSection />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export default PlatformGuidePDF;
