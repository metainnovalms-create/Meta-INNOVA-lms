import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from './InvoicePDFStyles';
import type { Invoice } from '@/types/invoice';

interface InvoicePDFFooterProps {
  invoice: Invoice;
}

export function InvoicePDFFooter({ invoice }: InvoicePDFFooterProps) {
  const bankDetails = invoice.bank_details;
  const hasBankDetails = bankDetails && Object.keys(bankDetails).length > 0;

  return (
    <View wrap={false}>
      {/* Bank Details & Notes */}
      <View style={styles.footerSection}>
        {/* Bank Details */}
        {hasBankDetails && (
          <View style={styles.bankDetailsBox}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            {bankDetails.account_holder && (
              <Text style={styles.bankDetail}>
                Account Holder: {bankDetails.account_holder}
              </Text>
            )}
            {bankDetails.bank_name && (
              <Text style={styles.bankDetail}>Bank Name: {bankDetails.bank_name}</Text>
            )}
            {bankDetails.account_number && (
              <Text style={styles.bankDetail}>
                Account No: {bankDetails.account_number}
              </Text>
            )}
            {bankDetails.account_type && (
              <Text style={styles.bankDetail}>
                Account Type: {bankDetails.account_type}
              </Text>
            )}
            {bankDetails.ifsc_code && (
              <Text style={styles.bankDetail}>IFSC Code: {bankDetails.ifsc_code}</Text>
            )}
            {bankDetails.bank_address && (
              <Text style={styles.bankDetail}>
                Branch: {bankDetails.bank_address}
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </View>
        )}
      </View>

      {/* Terms & Conditions */}
      {invoice.terms_and_conditions && (
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>{invoice.terms_and_conditions}</Text>
        </View>
      )}

      {/* Declaration */}
      {invoice.declaration && (
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Declaration</Text>
          <Text style={styles.termsText}>{invoice.declaration}</Text>
        </View>
      )}

      {/* Signature */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          {invoice.signature_url ? (
            <Image src={invoice.signature_url} style={styles.signatureImage} />
          ) : (
            <View style={styles.signatureLine} />
          )}
          <Text style={styles.signatureText}>Authorized Signatory</Text>
          <Text style={styles.signatureCompany}>For {invoice.from_company_name}</Text>
        </View>
      </View>
    </View>
  );
}
