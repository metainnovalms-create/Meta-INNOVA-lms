import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Institution } from '@/contexts/InstitutionDataContext';
import { Download, FileText, Calendar, DollarSign, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface ViewMouDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: Institution | null;
}

export default function ViewMouDialog({ open, onOpenChange, institution }: ViewMouDialogProps) {
  if (!institution) return null;

  const hasMouDocument = institution.mou_document_url;

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getContractStatus = (expiryDate: string) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (daysLeft <= 30) return { label: 'Expiring Soon', variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const contractStatus = getContractStatus(institution.contract_expiry_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Memorandum of Understanding
          </DialogTitle>
          <DialogDescription>
            Contract details and document for {institution.name}
          </DialogDescription>
        </DialogHeader>

        {/* Contract Metadata */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Institution
              </div>
              <p className="font-medium">{institution.name}</p>
              <p className="text-sm text-muted-foreground">{institution.code}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Contract Type
              </div>
              <p className="font-medium">{institution.contract_type}</p>
              <Badge variant={contractStatus.variant}>{contractStatus.label}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Start Date
              </div>
              <p className="font-medium">
                {format(new Date(institution.contract_start_date), 'MMM dd, yyyy')}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Expiry Date
              </div>
              <p className="font-medium">
                {format(new Date(institution.contract_expiry_date), 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {getDaysUntilExpiry(institution.contract_expiry_date)} days remaining
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Contract Value
              </div>
              <p className="font-medium">₹{(institution.contract_value / 100000).toFixed(1)}L</p>
            </div>
          </div>

          <Separator />

          {/* Document Viewer */}
          {hasMouDocument ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">MoU Document</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(institution.mou_document_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              
              {/* PDF Viewer */}
              <div className="border rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={`${institution.mou_document_url}#toolbar=0`}
                  className="w-full h-[500px]"
                  title="MoU Document"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">No MoU Document Available</h4>
              <p className="text-sm text-muted-foreground max-w-md">
                The Memorandum of Understanding document has not been uploaded for this institution yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
