import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from './ActivityReportStyles';
import { Report } from '@/types/report';
import { format } from 'date-fns';
import logoImage from '@/assets/logo.png';

interface ReportSettings {
  report_logo_url?: string | null;
  report_logo_width?: number;
  report_logo_height?: number;
}

interface ActivityReportPDFProps {
  report: Report;
  reportSettings?: ReportSettings;
}

export const ActivityReportPDF = ({ report, reportSettings }: ActivityReportPDFProps) => {
  const reportDate = report.report_date ? new Date(report.report_date) : new Date();
  const formattedDate = format(reportDate, 'dd.MM.yyyy');
  
  const logoSrc = reportSettings?.report_logo_url || logoImage;
  const logoWidth = reportSettings?.report_logo_width || 120;
  const logoHeight = reportSettings?.report_logo_height || 40;
  
  // Format client name with location
  const clientDisplay = report.client_location 
    ? `${report.client_name}, ${report.client_location}`
    : report.client_name;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo and Date */}
        <View style={styles.header}>
          <Image 
            src={logoSrc} 
            style={{ 
              width: logoWidth, 
              height: logoHeight, 
              objectFit: 'contain' as const 
            }} 
          />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{report.report_month.toUpperCase()} Activity Report</Text>
        </View>

        {/* Main Details Table with Borders */}
        <View style={styles.detailsTable}>
          {/* Client Name Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client Name</Text>
            <Text style={styles.detailValue}>{clientDisplay}</Text>
          </View>
        </View>

        {/* Trainer Details Table */}
        {report.trainers.length > 0 && (
          <View style={styles.trainerTable}>
            {/* Trainer Name Row */}
            <View style={styles.trainerRow}>
              <Text style={styles.trainerLabelCell}>Trainer(s) Name and Designation</Text>
              {report.trainers.map((trainer, index) => (
                <Text 
                  key={`name-${index}`} 
                  style={index === report.trainers.length - 1 ? styles.trainerNameCellLast : styles.trainerNameCell}
                >
                  {trainer.name}{'\n'}{trainer.designation}
                </Text>
              ))}
            </View>

            {/* Attendance Row */}
            <View style={styles.trainerRowLast}>
              <Text style={styles.trainerLabelCell}>Trainer(s) Attendance</Text>
              {report.trainers.map((trainer, index) => (
                <Text 
                  key={`attendance-${index}`} 
                  style={index === report.trainers.length - 1 ? styles.trainerNameCellLast : styles.trainerNameCell}
                >
                  {trainer.attendance !== undefined && trainer.attendance !== null ? `${trainer.attendance}%` : '-'}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Statistics Table */}
        <View style={styles.detailsTable}>
          {/* Hours Handled */}
          <View style={styles.detailRow}>
            <View style={{ width: '40%', padding: 8, backgroundColor: '#f8f8f8', borderRight: '1 solid #333333' }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#333333' }}>No. of hours handled</Text>
              <Text style={styles.hoursNote}>(1 hour = 60 minutes)</Text>
            </View>
            <Text style={styles.detailValue}>
              {report.hours_handled !== undefined && report.hours_handled !== null 
                ? `${report.hours_handled} ${report.hours_unit || 'Hours (Sessions Handled)'}`
                : '-'}
            </Text>
          </View>

          {/* Portion Covered */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Percentage of portion covered</Text>
            <Text style={styles.detailValue}>
              {report.portion_covered_percentage !== undefined && report.portion_covered_percentage !== null 
                ? `${report.portion_covered_percentage}%`
                : '-'}
            </Text>
          </View>

          {/* Assessments Completed */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>No. of Assessment completed</Text>
            <Text style={styles.detailValue}>{report.assessments_completed || '-'}</Text>
          </View>

          {/* Assessment Results */}
          <View style={styles.detailRowLast}>
            <Text style={styles.detailLabel}>Results of assessment</Text>
            <Text style={styles.detailValue}>{report.assessment_results || '-'}</Text>
          </View>
        </View>

        {/* Activities Table */}
        {report.activities && report.activities.length > 0 && (
          <View style={styles.activitiesSection}>
            <Text style={styles.activitiesTitle}>Details of other activities completed</Text>
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.colActivity}>
                  <Text style={styles.tableHeaderCell}>Activity</Text>
                </View>
                <View style={styles.colRemarks}>
                  <Text style={styles.tableHeaderCell}>Remarks</Text>
                </View>
              </View>

              {/* Table Rows */}
              {report.activities.map((activity, index) => (
                <View 
                  key={index} 
                  style={index === report.activities.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <View style={styles.colActivity}>
                    <Text style={styles.tableCell}>{activity.activity}</Text>
                  </View>
                  <View style={styles.colRemarks}>
                    <Text style={styles.tableCell}>{activity.remarks}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>-SD-</Text>
            <Text style={styles.signatureDesignation}>
              {report.signatory_designation || 'AGM - Metasage Alliance'}
            </Text>
            <Text style={styles.signatureName}>
              {report.signatory_name || 'Mr. Vasanthaseelan'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};