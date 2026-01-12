import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as inventoryService from "@/services/inventory.service";
import type {
  AddInventoryItemData,
  CreatePurchaseRequestData,
  ReportIssueData
} from "@/types/inventory";

// ==================== INVENTORY ITEMS ====================

export function useInventoryItems(institutionId?: string) {
  return useQuery({
    queryKey: ['inventory-items', institutionId],
    queryFn: () => inventoryService.getInventoryItems(institutionId),
    enabled: true
  });
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ institutionId, itemData, userId }: {
      institutionId: string;
      itemData: AddInventoryItemData;
      userId: string;
    }) => inventoryService.addInventoryItem(institutionId, itemData, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add item", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ itemId, itemData }: {
      itemId: string;
      itemData: Partial<AddInventoryItemData>;
    }) => inventoryService.updateInventoryItem(itemId, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update item", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (itemId: string) => inventoryService.deleteInventoryItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove item", description: error.message, variant: "destructive" });
    }
  });
}

// ==================== PURCHASE REQUESTS ====================

export function usePurchaseRequests(institutionId?: string, officerId?: string) {
  return useQuery({
    queryKey: ['purchase-requests', institutionId, officerId],
    queryFn: () => inventoryService.getPurchaseRequests(institutionId, officerId),
    enabled: true
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestData, officerId, requesterName }: {
      requestData: CreatePurchaseRequestData;
      officerId: string;
      requesterName: string;
    }) => inventoryService.createPurchaseRequest(requestData, officerId, requesterName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({ title: "Purchase request submitted", description: `Request ${data.request_code} created` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit request", description: error.message, variant: "destructive" });
    }
  });
}

export function useApprovePurchaseRequestByInstitution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, approverId, comments }: {
      requestId: string;
      approverId: string;
      comments?: string;
    }) => inventoryService.approvePurchaseRequestByInstitution(requestId, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({ title: "Request approved", description: "Forwarded to CEO for final approval" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    }
  });
}

// Alias for simpler usage - now requires approverId
export function useApprovePurchaseRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, approverId, approverType, comments }: {
      requestId: string;
      approverId: string;
      approverType: 'institution' | 'ceo';
      comments?: string;
    }) => approverType === 'institution' 
      ? inventoryService.approvePurchaseRequestByInstitution(requestId, approverId, comments)
      : inventoryService.approvePurchaseRequestFinal(requestId, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({ title: "Request approved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    }
  });
}

export function useReportIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (issueData: ReportIssueData) => 
      inventoryService.reportInventoryIssue(issueData, '', ''),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-issues'] });
      toast({ title: "Issue reported", description: `Issue ${data.issue_code} submitted` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to report issue", description: error.message, variant: "destructive" });
    }
  });
}

export function useApprovePurchaseRequestFinal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, approverId, comments }: {
      requestId: string;
      approverId: string;
      comments?: string;
    }) => inventoryService.approvePurchaseRequestFinal(requestId, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({ title: "Request fully approved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve", description: error.message, variant: "destructive" });
    }
  });
}

export function useRejectPurchaseRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, rejectorId, reason }: {
      requestId: string;
      rejectorId: string;
      reason: string;
    }) => inventoryService.rejectPurchaseRequest(requestId, rejectorId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast({ title: "Request rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
    }
  });
}

// ==================== INVENTORY ISSUES ====================

export function useInventoryIssues(institutionId?: string, reportedBy?: string) {
  return useQuery({
    queryKey: ['inventory-issues', institutionId, reportedBy],
    queryFn: () => inventoryService.getInventoryIssues(institutionId, reportedBy),
    enabled: true
  });
}

export function useReportInventoryIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ issueData, reporterId, reporterName }: {
      issueData: ReportIssueData;
      reporterId: string;
      reporterName: string;
    }) => inventoryService.reportInventoryIssue(issueData, reporterId, reporterName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-issues'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Issue reported", description: `Issue ${data.issue_code} submitted` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to report issue", description: error.message, variant: "destructive" });
    }
  });
}

export function useAcknowledgeIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ issueId, userId }: { issueId: string; userId: string }) =>
      inventoryService.acknowledgeIssue(issueId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-issues'] });
      toast({ title: "Issue acknowledged" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to acknowledge", description: error.message, variant: "destructive" });
    }
  });
}

export function useResolveIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ issueId, userId, notes }: {
      issueId: string;
      userId: string;
      notes: string;
    }) => inventoryService.resolveIssue(issueId, userId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-issues'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Issue resolved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to resolve", description: error.message, variant: "destructive" });
    }
  });
}

// ==================== APPROVAL CHAIN ====================

export function useApprovalChain(institutionId?: string) {
  return useQuery({
    queryKey: ['approval-chain', institutionId],
    queryFn: () => inventoryService.getApprovalChain(institutionId),
    enabled: true
  });
}

export function useAssignApprover() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ institutionId, approverUserId, approverType, positionId, assignedBy }: {
      institutionId: string;
      approverUserId: string;
      approverType: 'ceo' | 'position';
      positionId: string | null;
      assignedBy: string;
    }) => inventoryService.assignApprover(institutionId, approverUserId, approverType, positionId, assignedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chain'] });
      toast({ title: "Approver assigned" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to assign approver", description: error.message, variant: "destructive" });
    }
  });
}

export function useRemoveApprover() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (chainId: string) => inventoryService.removeApprover(chainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chain'] });
      toast({ title: "Approver removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove approver", description: error.message, variant: "destructive" });
    }
  });
}

// ==================== STATISTICS ====================

export function useInventoryStats(institutionId?: string) {
  return useQuery({
    queryKey: ['inventory-stats', institutionId],
    queryFn: () => inventoryService.getInventoryStats(institutionId),
    enabled: true
  });
}
