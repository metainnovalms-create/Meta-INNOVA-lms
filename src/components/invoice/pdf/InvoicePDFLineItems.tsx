import { View, Text } from '@react-pdf/renderer';
import { styles } from './InvoicePDFStyles';
import type { Invoice } from '@/types/invoice';
import { formatCurrency, formatQuantity, getTaxDisplay, getTaxAmount } from '@/services/pdf.service';

interface InvoicePDFLineItemsProps {
  invoice: Invoice;
}

export function InvoicePDFLineItems({ invoice }: InvoicePDFLineItemsProps) {
  const isInterState = invoice.from_company_state_code !== invoice.to_company_state_code;
  const lineItems = invoice.line_items || [];

  return (
    <View style={styles.table}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.colSNo]}>#</Text>
        <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
        <Text style={[styles.tableHeaderCell, styles.colHSN]}>HSN/SAC</Text>
        <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
        <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
        <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
        <Text style={[styles.tableHeaderCell, styles.colTax]}>Tax</Text>
        <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
      </View>

      {/* Table Rows */}
      {lineItems.map((item, index) => {
        const taxDisplay = getTaxDisplay(
          item.cgst_rate,
          item.sgst_rate,
          item.igst_rate,
          isInterState
        );
        const taxAmount = getTaxAmount(
          item.cgst_amount,
          item.sgst_amount,
          item.igst_amount,
          isInterState
        );

        return (
          <View
            key={item.id || index}
            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, styles.colSNo]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.colHSN]}>{item.hsn_sac_code || '-'}</Text>
            <Text style={[styles.tableCell, styles.colQty]}>
              {formatQuantity(item.quantity)}
            </Text>
            <Text style={[styles.tableCell, styles.colUnit]}>{item.unit || '-'}</Text>
            <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(item.rate)}</Text>
            <View style={styles.colTax}>
              <Text style={styles.tableCell}>{taxDisplay}</Text>
              <Text style={styles.tableCell}>{formatCurrency(taxAmount)}</Text>
            </View>
            <Text style={[styles.tableCellBold, styles.colAmount]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
