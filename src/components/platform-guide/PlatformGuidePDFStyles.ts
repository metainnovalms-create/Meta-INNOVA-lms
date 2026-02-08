import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  // Page styles
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  coverPage: {
    padding: 0,
    backgroundColor: '#1a1a2e',
  },
  
  // Cover page styles
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverHeader: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 8,
    marginBottom: 40,
    width: '100%',
  },
  coverLogo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4ade80',
    textAlign: 'center',
    letterSpacing: 4,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 1.3,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 60,
  },
  coverDivider: {
    width: 100,
    height: 3,
    backgroundColor: '#4ade80',
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Header and footer
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#4ade80',
  },
  pageHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  pageHeaderMeta: {
    fontSize: 9,
    color: '#64748b',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 9,
    color: '#64748b',
  },
  
  // Section styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#4ade80',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    marginTop: 16,
  },
  
  // Table of Contents
  tocContainer: {
    marginTop: 20,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tocNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ade80',
    width: 30,
  },
  tocTitle: {
    fontSize: 12,
    color: '#1a1a2e',
    flex: 1,
  },
  tocPage: {
    fontSize: 11,
    color: '#64748b',
    width: 30,
    textAlign: 'right',
  },
  
  // Content styles
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 12,
    textAlign: 'justify',
  },
  bulletList: {
    marginLeft: 15,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: '#4ade80',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  
  // Role cards
  roleCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 10,
  },
  rolePath: {
    fontSize: 8,
    color: '#4ade80',
    fontFamily: 'Courier',
    backgroundColor: '#f0fdf4',
    padding: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  
  // Module table
  tableContainer: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    padding: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  
  // Walkthrough styles
  walkthroughSection: {
    marginBottom: 20,
  },
  walkthroughHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 6,
  },
  walkthroughTime: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4ade80',
    width: 50,
  },
  walkthroughTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
    flex: 1,
  },
  walkthroughContent: {
    marginLeft: 20,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  
  // Value props
  valueCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  valueList: {
    marginLeft: 10,
  },
  
  // Architecture diagram
  architectureBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  architectureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  architectureItem: {
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 5,
    fontSize: 9,
    textAlign: 'center',
  },
  architectureArrow: {
    fontSize: 14,
    color: '#4ade80',
    textAlign: 'center',
    marginVertical: 5,
  },
  
  // Contact section
  contactBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 5,
  },
  contactUrl: {
    fontSize: 11,
    color: '#4ade80',
    marginTop: 10,
  },
  
  // Highlight box
  highlightBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    padding: 12,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4ade80',
  },
  highlightText: {
    fontSize: 10,
    color: '#166534',
    fontStyle: 'italic',
  },
  
  // Two column layout
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
});
