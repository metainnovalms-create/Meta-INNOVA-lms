import { View, Text } from '@react-pdf/renderer';
import { styles } from './InvoicePDFStyles';
import type { Invoice } from '@/types/invoice';

interface InvoicePDFPartiesProps {
  invoice: Invoice;
}

export function InvoicePDFParties({ invoice }: InvoicePDFPartiesProps) {
  const hasShipTo = invoice.ship_to_name || invoice.ship_to_address;

  return (
    <View style={styles.partiesSection}>
      {/* Bill To */}
      <View style={hasShipTo ? styles.partyBox : styles.partyBoxLast}>
        <Text style={styles.partyLabel}>Bill To</Text>
        <Text style={styles.partyName}>{invoice.to_company_name}</Text>
        {invoice.to_company_contact_person && (
          <Text style={styles.partyDetail}>Attn: {invoice.to_company_contact_person}</Text>
        )}
        {invoice.to_company_address && (
          <Text style={styles.partyDetail}>{invoice.to_company_address}</Text>
        )}
        <Text style={styles.partyDetail}>
          {[invoice.to_company_city, invoice.to_company_state, invoice.to_company_pincode]
            .filter(Boolean)
            .join(', ')}
        </Text>
        {invoice.to_company_state_code && (
          <Text style={styles.partyDetail}>State Code: {invoice.to_company_state_code}</Text>
        )}
        {invoice.to_company_gstin && (
          <Text style={styles.partyDetail}>GSTIN: {invoice.to_company_gstin}</Text>
        )}
        {invoice.to_company_phone && (
          <Text style={styles.partyDetail}>Phone: {invoice.to_company_phone}</Text>
        )}
      </View>

      {/* Ship To (if different) */}
      {hasShipTo && (
        <View style={styles.partyBoxLast}>
          <Text style={styles.partyLabel}>Ship To</Text>
          {invoice.ship_to_name && (
            <Text style={styles.partyName}>{invoice.ship_to_name}</Text>
          )}
          {invoice.ship_to_address && (
            <Text style={styles.partyDetail}>{invoice.ship_to_address}</Text>
          )}
          <Text style={styles.partyDetail}>
            {[invoice.ship_to_city, invoice.ship_to_state, invoice.ship_to_pincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {invoice.ship_to_state_code && (
            <Text style={styles.partyDetail}>State Code: {invoice.ship_to_state_code}</Text>
          )}
          {invoice.ship_to_gstin && (
            <Text style={styles.partyDetail}>GSTIN: {invoice.ship_to_gstin}</Text>
          )}
        </View>
      )}
    </View>
  );
}
