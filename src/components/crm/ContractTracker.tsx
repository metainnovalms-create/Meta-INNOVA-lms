import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Calendar, DollarSign, AlertTriangle, CheckCircle, RefreshCw, Trash2 } from "lucide-react";
import { ContractDetail } from "@/data/mockCRMData";
import { format, differenceInDays } from "date-fns";

interface ContractTrackerProps {
  contract: ContractDetail;
  onViewDetails?: (contract: ContractDetail) => void;
  onEdit?: (contract: ContractDetail) => void;
  onRenew?: (contract: ContractDetail) => void;
  onDelete?: (contract: ContractDetail) => void;
}

const statusColors = {
  active: "bg-green-500/10 text-green-600",
  expiring_soon: "bg-yellow-500/10 text-yellow-600",
  expired: "bg-red-500/10 text-red-600",
  under_negotiation: "bg-blue-500/10 text-blue-600",
};

const renewalColors = {
  auto_renew: "bg-green-500/10 text-green-600",
  manual_renew: "bg-blue-500/10 text-blue-600",
  needs_discussion: "bg-orange-500/10 text-orange-600",
};

export function ContractTracker({ contract, onViewDetails, onEdit, onRenew, onDelete }: ContractTrackerProps) {
  const daysUntilRenewal = differenceInDays(new Date(contract.renewal_date), new Date());
  const contractDuration = differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
  const daysElapsed = differenceInDays(new Date(), new Date(contract.start_date));
  const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / contractDuration) * 100));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{contract.institution_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{contract.contract_type}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={statusColors[contract.status]}>
              {contract.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline" className={renewalColors[contract.renewal_status]}>
              {contract.renewal_status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contract Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Start Date</span>
            </div>
            <p className="text-sm font-medium">{format(new Date(contract.start_date), 'MMM dd, yyyy')}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>End Date</span>
            </div>
            <p className="text-sm font-medium">{format(new Date(contract.end_date), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Contract Value</p>
              <p className="text-lg font-bold">₹{(contract.contract_value / 100000).toFixed(1)}L</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Payment Terms</p>
            <p className="text-sm font-medium">{contract.payment_terms}</p>
          </div>
        </div>

        {daysUntilRenewal <= 60 && daysUntilRenewal >= 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600">Renewal Due Soon</p>
              <p className="text-xs text-yellow-600/80">
                {daysUntilRenewal} days until renewal date ({format(new Date(contract.renewal_date), 'MMM dd, yyyy')})
              </p>
            </div>
          </div>
        )}

        {contract.auto_renew && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Auto-renewal enabled</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{contract.documents.length} document(s) attached</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 min-w-[100px]"
            onClick={() => onViewDetails?.(contract)}
          >
            <FileText className="h-4 w-4 mr-2" />
            View
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 min-w-[100px]"
            onClick={() => onEdit?.(contract)}
          >
            Edit
          </Button>
          
          {!contract.auto_renew && contract.status === 'expiring_soon' && (
            <Button 
              size="sm" 
              className="flex-1 min-w-[100px]"
              onClick={() => onRenew?.(contract)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete?.(contract)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
