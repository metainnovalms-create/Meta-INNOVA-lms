import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { HRRating } from '@/hooks/useHRRatings';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 15, border: '1 solid #e5e5e5', borderRadius: 4, padding: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontWeight: 'bold', width: 120 },
  value: { flex: 1 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 6, fontWeight: 'bold', borderBottom: '1 solid #e5e5e5' },
  tableRow: { flexDirection: 'row', padding: 6, borderBottom: '1 solid #e5e5e5' },
  tableCell: { flex: 1 },
  totalBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 4, flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  totalItem: { textAlign: 'center' },
  totalLabel: { fontSize: 10, color: '#666', marginBottom: 4 },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  footer: { textAlign: 'center', fontSize: 8, color: '#666', marginTop: 20 }
});

interface Props {
  rating: HRRating;
}

export function HRRatingPDF({ rating }: Props) {
  const projectRatings = rating.project_ratings || [];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Trainer Star Summary Sheet</Text>
          <Text style={styles.subtitle}>Maintained by HR, shared quarterly with trainers</Text>
        </View>

        {/* Trainer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trainer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Trainer Name:</Text>
            <Text style={styles.value}>{rating.trainer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Employee ID:</Text>
            <Text style={styles.value}>{rating.employee_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>{rating.period} {rating.year}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>{format(new Date(rating.created_at), 'MMM dd, yyyy')}</Text>
          </View>
        </View>

        {/* Project Ratings Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Ratings</Text>
          {projectRatings.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Project Title</Text>
                <Text style={styles.tableCell}>Competition Level</Text>
                <Text style={styles.tableCell}>Result</Text>
                <Text style={styles.tableCell}>Stars</Text>
                <Text style={styles.tableCell}>Verified</Text>
              </View>
              {projectRatings.map((project, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{project.project_title}</Text>
                  <Text style={styles.tableCell}>{project.competition_level}</Text>
                  <Text style={styles.tableCell}>{project.result}</Text>
                  <Text style={styles.tableCell}>{'★'.repeat(project.stars_earned)}{'☆'.repeat(5 - project.stars_earned)}</Text>
                  <Text style={styles.tableCell}>{project.verified_by_hr ? 'Yes' : 'Pending'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text>No project ratings recorded</Text>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalBox}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Stars This Quarter</Text>
            <Text style={styles.totalValue}>★ {rating.total_stars_quarter}</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Cumulative Stars This Year</Text>
            <Text style={styles.totalValue}>★ {rating.cumulative_stars_year}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Issued by: Human Resource Management (HRM), Meta-Innova Corporation</Text>
          <Text>Version 1.0 | Generated on {format(new Date(), 'MMMM dd, yyyy')}</Text>
        </View>
      </Page>
    </Document>
  );
}
