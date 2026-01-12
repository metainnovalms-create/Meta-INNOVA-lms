import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  dateText: {
    fontSize: 11,
    color: '#333333',
  },
  
  // Title
  titleSection: {
    textAlign: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textDecoration: 'underline',
  },
  
  // Details Table with Borders
  detailsTable: {
    border: '1 solid #333333',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #333333',
    minHeight: 28,
  },
  detailRowLast: {
    flexDirection: 'row',
    minHeight: 28,
  },
  detailLabel: {
    width: '40%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRight: '1 solid #333333',
  },
  detailValue: {
    width: '60%',
    fontSize: 11,
    color: '#333333',
    padding: 8,
  },
  
  // Trainer Table (multi-column)
  trainerTable: {
    border: '1 solid #333333',
    marginBottom: 20,
  },
  trainerHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderBottom: '1 solid #333333',
  },
  trainerRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #333333',
    minHeight: 24,
  },
  trainerRowLast: {
    flexDirection: 'row',
    minHeight: 24,
  },
  trainerLabelCell: {
    width: '30%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRight: '1 solid #333333',
  },
  trainerNameCell: {
    flex: 1,
    fontSize: 10,
    color: '#333333',
    padding: 6,
    borderRight: '1 solid #333333',
    textAlign: 'center',
  },
  trainerNameCellLast: {
    flex: 1,
    fontSize: 10,
    color: '#333333',
    padding: 6,
    textAlign: 'center',
  },
  
  // Hours note
  hoursNote: {
    fontSize: 9,
    color: '#666666',
    fontStyle: 'italic',
  },
  
  // Activities Table
  activitiesSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  activitiesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  table: {
    border: '1 solid #333333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1 solid #333333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #333333',
    minHeight: 30,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 30,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    padding: 8,
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 10,
    color: '#333333',
    padding: 8,
    textAlign: 'left',
  },
  colActivity: {
    width: '40%',
    borderRight: '1 solid #333333',
  },
  colRemarks: {
    width: '60%',
  },
  
  // Signature Section
  signatureSection: {
    marginTop: 50,
    alignItems: 'flex-end',
  },
  signatureBox: {
    width: 200,
    textAlign: 'center',
  },
  signatureLine: {
    fontSize: 14,
    marginBottom: 5,
  },
  signatureDesignation: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 11,
    color: '#333333',
  },
});