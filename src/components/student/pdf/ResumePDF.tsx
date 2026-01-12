import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/hooks/useStudentResume';
import { format } from 'date-fns';

// SDG Goal info for display
const SDG_INFO: Record<string, { name: string; color: string }> = {
  'SDG1': { name: 'No Poverty', color: '#E5243B' },
  'SDG2': { name: 'Zero Hunger', color: '#DDA63A' },
  'SDG3': { name: 'Good Health', color: '#4C9F38' },
  'SDG4': { name: 'Quality Education', color: '#C5192D' },
  'SDG5': { name: 'Gender Equality', color: '#FF3A21' },
  'SDG6': { name: 'Clean Water', color: '#26BDE2' },
  'SDG7': { name: 'Affordable Energy', color: '#FCC30B' },
  'SDG8': { name: 'Decent Work', color: '#A21942' },
  'SDG9': { name: 'Industry & Innovation', color: '#FD6925' },
  'SDG10': { name: 'Reduced Inequalities', color: '#DD1367' },
  'SDG11': { name: 'Sustainable Cities', color: '#FD9D24' },
  'SDG12': { name: 'Responsible Consumption', color: '#BF8B2E' },
  'SDG13': { name: 'Climate Action', color: '#3F7E44' },
  'SDG14': { name: 'Life Below Water', color: '#0A97D9' },
  'SDG15': { name: 'Life on Land', color: '#56C02B' },
  'SDG16': { name: 'Peace & Justice', color: '#00689D' },
  'SDG17': { name: 'Partnerships', color: '#19486A' },
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 25,
    borderBottom: '2 solid #1a1a2e',
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactItem: {
    fontSize: 9,
    color: '#666666',
  },
  contactSeparator: {
    fontSize: 9,
    color: '#999999',
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '1 solid #e5e5e5',
    paddingBottom: 4,
  },
  educationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
  },
  classInfo: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  academicYear: {
    fontSize: 10,
    color: '#666666',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skill: {
    backgroundColor: '#f0f0f0',
    padding: '4 10',
    borderRadius: 12,
    fontSize: 9,
    color: '#333333',
  },
  projectItem: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeft: '2 solid #1a1a2e',
  },
  projectTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 3,
  },
  projectRole: {
    fontSize: 9,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  projectDescription: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  sdgContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  sdgBadge: {
    padding: '2 6',
    borderRadius: 3,
    fontSize: 7,
    color: '#ffffff',
  },
  certificateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '1 solid #f0f0f0',
  },
  certificateName: {
    fontSize: 10,
    color: '#333333',
    flex: 1,
  },
  certificateGrade: {
    fontSize: 9,
    color: '#666666',
    marginRight: 10,
  },
  certificateDate: {
    fontSize: 9,
    color: '#888888',
  },
  emptyState: {
    fontSize: 9,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTop: '1 solid #e5e5e5',
    paddingTop: 10,
  },
});

interface Props {
  data: ResumeData;
  customSkills?: string[];
}

export function ResumePDF({ data, customSkills = [] }: Props) {
  const allSkills = [...data.skills, ...customSkills];
  
  const formatSdgGoal = (goal: string): { label: string; color: string } => {
    const info = SDG_INFO[goal];
    if (info) {
      return { label: `${goal.replace('SDG', 'SDG ')}`, color: info.color };
    }
    return { label: goal, color: '#666666' };
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.personal.name}</Text>
          <View style={styles.contactInfo}>
            {data.personal.email && (
              <Text style={styles.contactItem}>{data.personal.email}</Text>
            )}
            {data.personal.email && data.personal.phone && (
              <Text style={styles.contactSeparator}>|</Text>
            )}
            {data.personal.phone && (
              <Text style={styles.contactItem}>{data.personal.phone}</Text>
            )}
            {(data.personal.email || data.personal.phone) && data.personal.address && (
              <Text style={styles.contactSeparator}>|</Text>
            )}
            {data.personal.address && (
              <Text style={styles.contactItem}>{data.personal.address}</Text>
            )}
          </View>
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          <View style={styles.educationRow}>
            <View>
              <Text style={styles.institutionName}>{data.education.institution}</Text>
              <Text style={styles.classInfo}>
                {data.education.className}
                {data.education.section && ` - Section ${data.education.section}`}
              </Text>
            </View>
            {data.education.academicYear && (
              <Text style={styles.academicYear}>{data.education.academicYear}</Text>
            )}
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {allSkills.length > 0 ? (
            <View style={styles.skillsContainer}>
              {allSkills.map((skill, index) => (
                <Text key={index} style={styles.skill}>{skill}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyState}>Skills will be added as you complete courses</Text>
          )}
        </View>

        {/* Projects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects & SDG Contributions</Text>
          {data.projects.length > 0 ? (
            data.projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                {project.role && (
                  <Text style={styles.projectRole}>Role: {project.role}</Text>
                )}
                {project.description && (
                  <Text style={styles.projectDescription}>{project.description}</Text>
                )}
                {project.sdg_goals.length > 0 && (
                  <View style={styles.sdgContainer}>
                    {project.sdg_goals.map((goal, idx) => {
                      const { label, color } = formatSdgGoal(goal);
                      return (
                        <Text 
                          key={idx} 
                          style={[styles.sdgBadge, { backgroundColor: color }]}
                        >
                          {label}
                        </Text>
                      );
                    })}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyState}>
              Projects will appear here as you participate in activities
            </Text>
          )}
        </View>

        {/* Certificates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificates</Text>
          {data.certificates.length > 0 ? (
            data.certificates.map((cert) => (
              <View key={cert.id} style={styles.certificateItem}>
                <Text style={styles.certificateName}>{cert.activity_name}</Text>
                {cert.grade && (
                  <Text style={styles.certificateGrade}>Grade: {cert.grade}</Text>
                )}
                <Text style={styles.certificateDate}>
                  {format(new Date(cert.issued_date), 'MMM yyyy')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyState}>
              Certificates will appear here as you earn them
            </Text>
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
