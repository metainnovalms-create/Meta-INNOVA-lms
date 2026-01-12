import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchContracts, 
  createContract, 
  updateContract, 
  deleteContract,
  initiateRenewal,
  uploadContractDocument
} from '@/services/contractService';
import { ContractDetail } from '@/data/mockCRMData';
import { toast } from 'sonner';

const CONTRACTS_QUERY_KEY = ['crm-contracts'];

export function useContracts() {
  return useQuery({
    queryKey: CONTRACTS_QUERY_KEY,
    queryFn: fetchContracts,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      contract, 
      files 
    }: { 
      contract: Omit<ContractDetail, 'id' | 'documents' | 'communication_history'>; 
      files?: File[] 
    }) => createContract(contract, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      toast.success('Contract created successfully');
    },
    onError: (error) => {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Omit<ContractDetail, 'id' | 'documents' | 'communication_history'>> 
    }) => updateContract(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      toast.success('Contract updated successfully');
    },
    onError: (error) => {
      console.error('Error updating contract:', error);
      toast.error('Failed to update contract');
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      toast.success('Contract deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    },
  });
}

export function useRenewContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => initiateRenewal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      toast.success('Contract renewal initiated successfully');
    },
    onError: (error) => {
      console.error('Error initiating renewal:', error);
      toast.error('Failed to initiate contract renewal');
    },
  });
}

export function useUploadContractDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, file }: { contractId: string; file: File }) => 
      uploadContractDocument(contractId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    },
  });
}
