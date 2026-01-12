import { View, Text } from '@react-pdf/renderer';
import { styles } from './InvoicePDFStyles';
import type { Invoice } from '@/types/invoice';
import { formatDate } from '@/services/pdf.service';

interface InvoicePDFHeaderProps {
  invoice: Invoice;
  copyType?: 'original' | 'duplicate' | 'triplicate';
}

export function InvoicePDFHeader({ invoice, copyType = 'original' }: InvoicePDFHeaderProps) {
  const copyText = {
    original: 'Original for Recipient',
    duplicate: 'Duplicate for Transporter',
    triplicate: 'Triplicate for Supplier',
  };

  return (
    <View style={styles.header}>
      {/* Title */}
      <Text style={styles.title}>TAX INVOICE</Text>
      <Text style={styles.subtitle}>({copyText[copyType]})</Text>

      {/* E-Invoice Info if available */}
      {invoice.irn && (
        <View style={styles.eInvoiceSection}>
          <View>
            <Text style={styles.eInvoiceLabel}>IRN:</Text>
            <Text style={styles.eInvoiceValue}>{invoice.irn}</Text>
          </View>
          {invoice.ack_number && (
            <View>
              <Text style={styles.eInvoiceLabel}>Ack No:</Text>
              <Text style={styles.eInvoiceValue}>{invoice.ack_number}</Text>
            </View>
          )}
          {invoice.ack_date && (
            <View>
              <Text style={styles.eInvoiceLabel}>Ack Date:</Text>
              <Text style={styles.eInvoiceValue}>{formatDate(invoice.ack_date)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Company & Invoice Details */}
      <View style={styles.companySection}>
        {/* From Company */}
        <View style={styles.companyBox}>
          <Text style={styles.companyName}>{invoice.from_company_name}</Text>
          {invoice.from_company_address && (
            <Text style={styles.companyDetail}>{invoice.from_company_address}</Text>
          )}
          <Text style={styles.companyDetail}>
            {[invoice.from_company_city, invoice.from_company_state, invoice.from_company_pincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {invoice.from_company_gstin && (
            <Text style={styles.companyDetail}>GSTIN: {invoice.from_company_gstin}</Text>
          )}
          {invoice.from_company_pan && (
            <Text style={styles.companyDetail}>PAN: {invoice.from_company_pan}</Text>
          )}
          {invoice.from_company_cin && (
            <Text style={styles.companyDetail}>CIN: {invoice.from_company_cin}</Text>
          )}
          {invoice.from_company_phone && (
            <Text style={styles.companyDetail}>Phone: {invoice.from_company_phone}</Text>
          )}
          {invoice.from_company_email && (
            <Text style={styles.companyDetail}>Email: {invoice.from_company_email}</Text>
          )}
          {invoice.from_company_website && (
            <Text style={styles.companyDetail}>Web: {invoice.from_company_website}</Text>
          )}
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetailsBox}>
          <View style={styles.invoiceDetailRow}>
            <Text style={styles.invoiceDetailLabel}>Invoice Number:</Text>
            <Text style={styles.invoiceDetailValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.invoiceDetailRow}>
            <Text style={styles.invoiceDetailLabel}>Invoice Date:</Text>
            <Text style={styles.invoiceDetailValue}>{formatDate(invoice.invoice_date)}</Text>
          </View>
          {invoice.terms && (
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Terms:</Text>
              <Text style={styles.invoiceDetailValue}>{invoice.terms}</Text>
            </View>
          )}
          {invoice.due_date && (
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Due Date:</Text>
              <Text style={styles.invoiceDetailValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          )}
          {invoice.place_of_supply && (
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Place of Supply:</Text>
              <Text style={styles.invoiceDetailValue}>{invoice.place_of_supply}</Text>
            </View>
          )}
          {invoice.reference_number && (
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Reference:</Text>
              <Text style={styles.invoiceDetailValue}>{invoice.reference_number}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
