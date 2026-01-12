import { Document, Page, Text } from '@react-pdf/renderer';
import { styles } from './InvoicePDFStyles';
import { InvoicePDFHeader } from './InvoicePDFHeader';
import { InvoicePDFParties } from './InvoicePDFParties';
import { InvoicePDFLineItems } from './InvoicePDFLineItems';
import { InvoicePDFTotals } from './InvoicePDFTotals';
import { InvoicePDFFooter } from './InvoicePDFFooter';
import type { Invoice } from '@/types/invoice';

interface InvoicePDFProps {
  invoice: Invoice;
  copyType?: 'original' | 'duplicate' | 'triplicate';
}

export function InvoicePDF({ invoice, copyType = 'original' }: InvoicePDFProps) {
  return (
    <Document
      title={`Invoice ${invoice.invoice_number}`}
      author={invoice.from_company_name}
      subject={`Invoice for ${invoice.to_company_name}`}
      keywords={`invoice, ${invoice.invoice_type}, ${invoice.invoice_number}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header with company info and invoice details */}
        <InvoicePDFHeader invoice={invoice} copyType={copyType} />

        {/* Bill To / Ship To */}
        <InvoicePDFParties invoice={invoice} />

        {/* Line Items Table */}
        <InvoicePDFLineItems invoice={invoice} />

        {/* Totals and Amount in Words */}
        <InvoicePDFTotals invoice={invoice} />

        {/* Footer with bank details, notes, terms */}
        <InvoicePDFFooter invoice={invoice} />

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export default InvoicePDF;
