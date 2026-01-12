// PDF utility functions for invoice generation

/**
 * Format amount as Indian Rupees with proper separators
 */
export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date as DD.MM.YYYY
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Get invoice copy text
 */
export function getInvoiceCopyText(copyType: 'original' | 'duplicate' | 'triplicate'): string {
  switch (copyType) {
    case 'original':
      return 'Original for Recipient';
    case 'duplicate':
      return 'Duplicate for Transporter';
    case 'triplicate':
      return 'Triplicate for Supplier';
    default:
      return '';
  }
}

/**
 * Format quantity with unit
 */
export function formatQuantity(qty: number, unit?: string): string {
  const formattedQty = qty.toLocaleString('en-IN');
  return unit ? `${formattedQty} ${unit}` : formattedQty;
}

/**
 * Get tax display text
 */
export function getTaxDisplay(
  cgstRate?: number,
  sgstRate?: number,
  igstRate?: number,
  isInterState?: boolean
): string {
  if (isInterState && igstRate) {
    return `IGST @${igstRate}%`;
  }
  if (cgstRate && sgstRate) {
    return `GST @${(cgstRate + sgstRate)}%`;
  }
  return '';
}

/**
 * Calculate tax amount for display
 */
export function getTaxAmount(
  cgstAmount?: number,
  sgstAmount?: number,
  igstAmount?: number,
  isInterState?: boolean
): number {
  if (isInterState) {
    return igstAmount || 0;
  }
  return (cgstAmount || 0) + (sgstAmount || 0);
}

/**
 * Generate PDF filename
 */
export function generatePDFFilename(invoiceNumber: string, invoiceType: string): string {
  const sanitizedNumber = invoiceNumber.replace(/[/\\?%*:|"<>]/g, '-');
  return `${sanitizedNumber}_${invoiceType}.pdf`;
}
