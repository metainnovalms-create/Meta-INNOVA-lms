import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PerformanceAppraisal } from '@/hooks/usePerformanceAppraisals';
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
  badge: { backgroundColor: '#e5e5e5', padding: '2 6', borderRadius: 3, marginRight: 4, marginBottom: 4, fontSize: 8 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 6, fontWeight: 'bold', borderBottom: '1 solid #e5e5e5' },
  tableRow: { flexDirection: 'row', padding: 6, borderBottom: '1 solid #e5e5e5' },
  tableCell: { flex: 1 },
  listItem: { flexDirection: 'row', marginBottom: 4 },
  bullet: { width: 10 },
  listText: { flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center' },
  star: { color: '#facc15' },
  reviewBox: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 4, marginBottom: 8 },
  footer: { textAlign: 'center', fontSize: 8, color: '#666', marginTop: 20 }
});

interface Props {
  appraisal: PerformanceAppraisal;
}

export function PerformanceAppraisalPDF({ appraisal }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Annual Trainer Self-Appraisal Form</Text>
          <Text style={styles.subtitle}>STEM Trainer / Senior STEM Trainer</Text>
        </View>

        {/* Section 1: Trainer Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Trainer Profile & Project Engagement Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{appraisal.trainer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Employee ID:</Text>
            <Text style={styles.value}>{appraisal.employee_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Institution:</Text>
            <Text style={styles.value}>{appraisal.institution_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reporting Period:</Text>
            <Text style={styles.value}>
              {format(new Date(appraisal.reporting_period_from), 'MMM dd, yyyy')} - {format(new Date(appraisal.reporting_period_to), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{appraisal.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        {/* Section 2: Lab Domains */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Lab Domains Handled</Text>
          <View style={styles.badgeContainer}>
            {appraisal.lab_domains.map((domain, i) => (
              <Text key={i} style={styles.badge}>{domain}</Text>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Total Projects:</Text>
            <Text style={styles.value}>{appraisal.total_projects_mentored}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Instructional Hours:</Text>
            <Text style={styles.value}>{appraisal.total_instructional_hours}</Text>
          </View>
        </View>

        {/* Section 3: Projects Summary */}
        {appraisal.projects_summary && appraisal.projects_summary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Summary of Projects Mentored</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Project Title</Text>
                <Text style={styles.tableCell}>Grade</Text>
                <Text style={styles.tableCell}>Domain</Text>
                <Text style={styles.tableCell}>Level</Text>
                <Text style={styles.tableCell}>Result</Text>
              </View>
              {appraisal.projects_summary.map((project, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{project.project_title}</Text>
                  <Text style={styles.tableCell}>{project.grade_level}</Text>
                  <Text style={styles.tableCell}>{project.domain}</Text>
                  <Text style={styles.tableCell}>{project.level}</Text>
                  <Text style={styles.tableCell}>{project.result}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section 4: Self-Reflection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Self-Reflection and Contribution</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Key Contributions:</Text>
          {appraisal.key_contributions.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
          <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Innovations Introduced:</Text>
          {appraisal.innovations_introduced.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
          {appraisal.student_mentorship_experience && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Student Mentorship Experience:</Text>
              <Text>{appraisal.student_mentorship_experience}</Text>
            </>
          )}
        </View>

        {/* Section 5: Student Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Student Feedback Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Concept Clarity:</Text>
            <Text style={styles.value}>{appraisal.student_feedback.concept_clarity}/5</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Responsiveness:</Text>
            <Text style={styles.value}>{appraisal.student_feedback.responsiveness}/5</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mentorship Quality:</Text>
            <Text style={styles.value}>{appraisal.student_feedback.mentorship_quality}/5</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contest Preparation:</Text>
            <Text style={styles.value}>{appraisal.student_feedback.contest_preparation}/5</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Overall Satisfaction:</Text>
            <Text style={styles.value}>{appraisal.student_feedback.overall_satisfaction}/5</Text>
          </View>
        </View>

        {/* Section 6: Forward Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Forward Plan</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Future Goals:</Text>
          {appraisal.future_goals.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
          <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Planned Trainings:</Text>
          {appraisal.planned_trainings.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
          {appraisal.support_needed && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Support Needed:</Text>
              <Text>{appraisal.support_needed}</Text>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on {format(new Date(), 'MMMM dd, yyyy')}</Text>
        </View>
      </Page>
    </Document>
  );
}
