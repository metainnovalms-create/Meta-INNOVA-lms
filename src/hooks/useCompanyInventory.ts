import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as companyInventoryService from '@/services/companyInventory.service';
import {
  CreateItemRequest,
  CreateSupplierRequest,
  CreateStockEntryRequest,
  CreateStockIssueRequest,
} from '@/types/companyInventory';

// ==================== ITEMS ====================

export function useCompanyItems() {
  return useQuery({
    queryKey: ['company-items'],
    queryFn: companyInventoryService.getItems,
  });
}

export function useCompanyItem(id: string) {
  return useQuery({
    queryKey: ['company-item', id],
    queryFn: () => companyInventoryService.getItemById(id),
    enabled: !!id,
  });
}

export function useCreateCompanyItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: CreateItemRequest) => companyInventoryService.createItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-items'] });
      queryClient.invalidateQueries({ queryKey: ['company-inventory-stats'] });
      toast.success('Item created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create item: ${error.message}`);
    },
  });
}

export function useUpdateCompanyItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateItemRequest> }) =>
      companyInventoryService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-items'] });
      toast.success('Item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useDeleteCompanyItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => companyInventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-items'] });
      queryClient.invalidateQueries({ queryKey: ['company-inventory-stats'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}

// ==================== SUPPLIERS ====================

export function useCompanySuppliers() {
  return useQuery({
    queryKey: ['company-suppliers'],
    queryFn: companyInventoryService.getSuppliers,
  });
}

export function useCompanySupplier(id: string) {
  return useQuery({
    queryKey: ['company-supplier', id],
    queryFn: () => companyInventoryService.getSupplierById(id),
    enabled: !!id,
  });
}

export function useCreateCompanySupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (supplier: CreateSupplierRequest) => companyInventoryService.createSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['company-inventory-stats'] });
      toast.success('Supplier created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });
}

export function useUpdateCompanySupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSupplierRequest & { status: 'active' | 'inactive' }> }) =>
      companyInventoryService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-suppliers'] });
      toast.success('Supplier updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
}

export function useDeleteCompanySupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => companyInventoryService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['company-inventory-stats'] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}

// ==================== STOCK ENTRIES ====================

export function useCompanyStockEntries() {
  return useQuery({
    queryKey: ['company-stock-entries'],
    queryFn: companyInventoryService.getStockEntries,
  });
}

export function useCompanyStockEntriesByItem(itemId: string) {
  return useQuery({
    queryKey: ['company-stock-entries', 'item', itemId],
    queryFn: () => companyInventoryService.getStockEntriesByItem(itemId),
    enabled: !!itemId,
  });
}

export function useCompanyStockEntriesBySupplier(supplierId: string) {
  return useQuery({
    queryKey: ['company-stock-entries', 'supplier', supplierId],
    queryFn: () => companyInventoryService.getStockEntriesBySupplier(supplierId),
    enabled: !!supplierId,
  });
}

export function useCreateCompanyStockEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (entry: CreateStockEntryRequest) => companyInventoryService.createStockEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-stock-entries'] });
      queryClient.invalidateQueries({ queryKey: ['company-items'] });
      queryClient.invalidateQueries({ queryKey: ['company-inventory-stats'] });
      toast.success('Stock entry recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record stock entry: ${error.message}`);
    },
  });
}

// ==================== STOCK ISSUES ====================

export function useCompanyStockIssues() {
  return useQuery({
    queryKey: ['company-stock-issues'],
    queryFn: companyInventoryService.getStockIssues,
  });
}

export function useCompanyStockIssuesByItem(itemId: string) {
  return useQuery({
    queryKey: ['company-stock-issues', 'item', itemId],
    queryFn: () => companyInventoryService.getStockIssuesByItem(itemId),
    enabled: !!itemId,
  });
}

export function useCreateCompanyStockIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (issue: CreateStockIssueRequest) => companyInventoryService.createStockIssue(issue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-stock-issues'] });
      queryClient.invalidateQueries({ queryKey: ['company-items'] });
      queryClient.invalidateQueries({ queryKey: ['company-inventory-stats'] });
      toast.success('Stock issue recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record stock issue: ${error.message}`);
    },
  });
}

// ==================== STATISTICS ====================

export function useCompanyInventoryStats() {
  return useQuery({
    queryKey: ['company-inventory-stats'],
    queryFn: companyInventoryService.getInventoryStats,
  });
}
