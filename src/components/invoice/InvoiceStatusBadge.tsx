import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  issued: { label: 'Issued', className: 'bg-blue-500/10 text-blue-600' },
  paid: { label: 'Paid', className: 'bg-green-500/10 text-green-600' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
  overdue: { label: 'Overdue', className: 'bg-orange-500/10 text-orange-600' },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
