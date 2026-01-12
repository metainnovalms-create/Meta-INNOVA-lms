import { View, Text } from '@react-pdf/renderer';
import { styles } from './InvoicePDFStyles';
import type { Invoice } from '@/types/invoice';
import { formatCurrency } from '@/services/pdf.service';

interface InvoicePDFTotalsProps {
  invoice: Invoice;
}

export function InvoicePDFTotals({ invoice }: InvoicePDFTotalsProps) {
  return (
    <View>
      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sub Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.sub_total)}</Text>
          </View>

          {invoice.discount_amount && invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>- {formatCurrency(invoice.discount_amount)}</Text>
            </View>
          )}

          {/* Always show all three taxes */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>CGST @{invoice.cgst_rate ?? 0}%:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.cgst_amount || 0)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SGST @{invoice.sgst_rate ?? 0}%:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.sgst_amount || 0)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IGST @{invoice.igst_rate ?? 0}%:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.igst_amount || 0)}
            </Text>
          </View>

          {invoice.tds_amount && invoice.tds_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#dc3545' }]}>
                TDS Withheld @{invoice.tds_rate}%:
              </Text>
              <Text style={[styles.totalValue, { color: '#dc3545' }]}>
                - {formatCurrency(invoice.tds_amount)}
              </Text>
            </View>
          )}

          <View style={styles.totalRowLast}>
            <Text style={styles.totalLabelBold}>Total Amount:</Text>
            <Text style={styles.totalValueBold}>{formatCurrency(invoice.total_amount)}</Text>
          </View>

          {invoice.balance_due !== invoice.total_amount && (
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Balance Due:</Text>
              <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>
                {formatCurrency(invoice.balance_due)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount in Words */}
      {invoice.total_in_words && (
        <View style={styles.amountInWords}>
          <Text style={styles.amountInWordsLabel}>Total Amount in Words:</Text>
          <Text style={styles.amountInWordsValue}>{invoice.total_in_words}</Text>
        </View>
      )}
    </View>
  );
}
