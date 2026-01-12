import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContractDetail } from "@/data/mockCRMData";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RenewalWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetail | null;
  onComplete: () => void;
}

export function RenewalWorkflowDialog({ 
  open, 
  onOpenChange, 
  contract,
  onComplete 
}: RenewalWorkflowDialogProps) {
  const [step, setStep] = useState(1);

  if (!contract) return null;

  const handleComplete = () => {
    toast.success("Contract renewal initiated successfully");
    onComplete();
    onOpenChange(false);
    setStep(1);
  };

  const steps = [
    {
      number: 1,
      title: "Review Current Contract",
      description: "Verify all details of the existing contract before proceeding.",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Institution</p>
              <p className="font-semibold">{contract.institution_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contract Type</p>
              <p className="font-semibold">{contract.contract_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="font-semibold">₹{(contract.contract_value / 10000000).toFixed(1)}Cr</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Terms</p>
              <p className="font-semibold">{contract.payment_terms}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: "Confirm Renewal Terms",
      description: "Update contract terms if needed, or proceed with current terms.",
      content: (
        <div className="space-y-4">
          <p className="text-sm">The contract will be renewed with the following terms:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Same contract value and payment terms
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              New 2-year contract period
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              All services and features included
            </li>
          </ul>
        </div>
      ),
    },
    {
      number: 3,
      title: "Create Renewal Task",
      description: "A follow-up task will be created to finalize the renewal.",
      content: (
        <div className="space-y-4">
          <p className="text-sm">The following actions will be completed:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Update contract status to "Under Negotiation"
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Create renewal discussion task
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Send notification to institution contact
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Contract Renewal Workflow
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step > s.number
                        ? 'bg-green-500 text-white'
                        : step === s.number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s.number ? <CheckCircle className="h-5 w-5" /> : s.number}
                  </div>
                  <p className="text-xs mt-2 text-center max-w-[100px]">{s.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      step > s.number ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{currentStep.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>
            {currentStep.content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            >
              {step > 1 ? 'Previous' : 'Cancel'}
            </Button>
            <Button
              onClick={() => step < 3 ? setStep(step + 1) : handleComplete()}
            >
              {step < 3 ? 'Next' : 'Complete Renewal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
