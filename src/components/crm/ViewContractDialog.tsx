import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ContractDetail } from "@/data/mockCRMData";
import { Calendar, DollarSign, FileText, RefreshCw, CheckCircle, Clock, Paperclip, Loader2, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ViewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetail | null;
  onEdit?: () => void;
  onInitiateRenewal?: () => void;
}

const statusColors = {
  active: "bg-green-500/10 text-green-600",
  expiring_soon: "bg-yellow-500/10 text-yellow-600",
  expired: "bg-red-500/10 text-red-600",
  under_negotiation: "bg-blue-500/10 text-blue-600",
};

const renewalColors = {
  auto_renew: "bg-green-500/10 text-green-600",
  manual_renew: "bg-yellow-500/10 text-yellow-600",
  needs_discussion: "bg-orange-500/10 text-orange-600",
};

export function ViewContractDialog({ 
  open, 
  onOpenChange, 
  contract, 
  onEdit,
  onInitiateRenewal 
}: ViewContractDialogProps) {
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  if (!contract) return null;

  const daysUntilRenewal = differenceInDays(new Date(contract.renewal_date), new Date());
  const contractDuration = differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
  const daysElapsed = differenceInDays(new Date(), new Date(contract.start_date));
  const progressPercentage = Math.min(Math.round((daysElapsed / contractDuration) * 100), 100);

  const handleDownloadDocument = async (doc: { name: string; url: string }) => {
    try {
      setDownloadingDoc(doc.name);
      
      // Extract the storage path from the URL
      const urlParts = doc.url.split('/crm-attachments/');
      const storagePath = urlParts[1];
      
      if (!storagePath) {
        throw new Error('Invalid document URL');
      }

      // Create signed URL for private bucket access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('crm-attachments')
        .createSignedUrl(storagePath, 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError || new Error('Failed to generate download URL');
      }

      // Download the file
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download document');
    } finally {
      setDownloadingDoc(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Contract Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Institution & Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{contract.institution_name}</h3>
              <p className="text-muted-foreground">{contract.contract_type}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={statusColors[contract.status]}>
                {contract.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <Badge variant="outline" className={renewalColors[contract.renewal_status]}>
                {contract.renewal_status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contract Timeline */}
          <div>
            <h4 className="font-semibold mb-3">Contract Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Start Date</p>
                  <p className="font-medium">{format(new Date(contract.start_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">End Date</p>
                  <p className="font-medium">{format(new Date(contract.end_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Renewal Date</p>
                  <p className="font-medium">{format(new Date(contract.renewal_date), 'MMM dd, yyyy')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {daysUntilRenewal > 0 ? `${daysUntilRenewal} days remaining` : 'Overdue'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Details */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Contract Value</p>
                <p className="text-2xl font-bold">₹{(contract.contract_value / 10000000).toFixed(1)}Cr</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                <p className="text-xl font-semibold">{contract.payment_terms}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Auto-Renew Status */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              {contract.auto_renew ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold">Auto-Renewal Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      This contract will automatically renew on {format(new Date(contract.renewal_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold">Manual Renewal Required</p>
                    <p className="text-sm text-muted-foreground">
                      Action required before {format(new Date(contract.renewal_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Documents */}
          {contract.documents && contract.documents.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Contract Documents
                </h4>
                <div className="space-y-2">
                  {contract.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {format(new Date(doc.uploaded_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                        disabled={downloadingDoc === doc.name}
                      >
                        {downloadingDoc === doc.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Renewal Alert */}
          {contract.status === 'expiring_soon' && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-600 mb-1">Contract Renewal Action Required</h4>
                  <p className="text-sm">
                    This contract expires in {daysUntilRenewal} days. Initiate renewal process to avoid service disruption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={onEdit}>
            Edit Contract
          </Button>
          {!contract.auto_renew && (
            <Button onClick={onInitiateRenewal}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Initiate Renewal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
