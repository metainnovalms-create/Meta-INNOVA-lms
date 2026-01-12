import { supabase } from "@/integrations/supabase/client";
import { ContractDetail } from "@/data/mockCRMData";

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface DBContract {
  id: string;
  institution_id: string;
  institution_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  renewal_date: string;
  contract_value: number;
  payment_terms: string;
  status: string;
  auto_renew: boolean;
  renewal_status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Transform DB contract to UI format
const transformToContractDetail = (
  dbContract: DBContract,
  documents: ContractDocument[] = []
): ContractDetail => ({
  id: dbContract.id,
  institution_id: dbContract.institution_id,
  institution_name: dbContract.institution_name,
  contract_type: dbContract.contract_type,
  start_date: dbContract.start_date,
  end_date: dbContract.end_date,
  renewal_date: dbContract.renewal_date,
  contract_value: dbContract.contract_value,
  payment_terms: dbContract.payment_terms,
  status: dbContract.status as ContractDetail['status'],
  auto_renew: dbContract.auto_renew,
  documents: documents.map(doc => ({
    name: doc.file_name,
    url: doc.public_url,
    uploaded_date: doc.uploaded_at.split('T')[0],
  })),
  renewal_status: dbContract.renewal_status as ContractDetail['renewal_status'],
  communication_history: [],
});

// Fetch all contracts
export async function fetchContracts(): Promise<ContractDetail[]> {
  const { data: contracts, error } = await supabase
    .from('crm_contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch documents for all contracts
  const contractIds = contracts?.map(c => c.id) || [];
  
  let documents: ContractDocument[] = [];
  if (contractIds.length > 0) {
    const { data: docs } = await supabase
      .from('crm_contract_documents')
      .select('*')
      .in('contract_id', contractIds);
    documents = (docs || []) as ContractDocument[];
  }

  // Group documents by contract
  const docsByContract = documents.reduce((acc, doc) => {
    if (!acc[doc.contract_id]) acc[doc.contract_id] = [];
    acc[doc.contract_id].push(doc);
    return acc;
  }, {} as Record<string, ContractDocument[]>);

  return (contracts || []).map(c => 
    transformToContractDetail(c as DBContract, docsByContract[c.id] || [])
  );
}

// Create a new contract
export async function createContract(
  contract: Omit<ContractDetail, 'id' | 'documents' | 'communication_history'>,
  files?: File[]
): Promise<ContractDetail> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: newContract, error } = await supabase
    .from('crm_contracts')
    .insert({
      institution_id: contract.institution_id,
      institution_name: contract.institution_name,
      contract_type: contract.contract_type,
      start_date: contract.start_date,
      end_date: contract.end_date,
      renewal_date: contract.renewal_date,
      contract_value: contract.contract_value,
      payment_terms: contract.payment_terms,
      status: contract.status,
      auto_renew: contract.auto_renew,
      renewal_status: contract.renewal_status,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Upload documents if provided
  const uploadedDocs: ContractDocument[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const doc = await uploadContractDocument(newContract.id, file);
      uploadedDocs.push(doc);
    }
  }

  return transformToContractDetail(newContract as DBContract, uploadedDocs);
}

// Update an existing contract
export async function updateContract(
  id: string,
  updates: Partial<Omit<ContractDetail, 'id' | 'documents' | 'communication_history'>>
): Promise<ContractDetail> {
  const { data: updatedContract, error } = await supabase
    .from('crm_contracts')
    .update({
      institution_id: updates.institution_id,
      institution_name: updates.institution_name,
      contract_type: updates.contract_type,
      start_date: updates.start_date,
      end_date: updates.end_date,
      renewal_date: updates.renewal_date,
      contract_value: updates.contract_value,
      payment_terms: updates.payment_terms,
      status: updates.status,
      auto_renew: updates.auto_renew,
      renewal_status: updates.renewal_status,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Fetch associated documents
  const { data: docs } = await supabase
    .from('crm_contract_documents')
    .select('*')
    .eq('contract_id', id);

  return transformToContractDetail(
    updatedContract as DBContract,
    (docs || []) as ContractDocument[]
  );
}

// Delete a contract
export async function deleteContract(id: string): Promise<void> {
  // First delete associated documents from storage
  const { data: docs } = await supabase
    .from('crm_contract_documents')
    .select('storage_path')
    .eq('contract_id', id);

  if (docs && docs.length > 0) {
    const paths = docs.map(d => d.storage_path);
    await supabase.storage.from('crm-attachments').remove(paths);
  }

  const { error } = await supabase
    .from('crm_contracts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Initiate renewal - updates status to under_negotiation
export async function initiateRenewal(id: string): Promise<ContractDetail> {
  const { data: updatedContract, error } = await supabase
    .from('crm_contracts')
    .update({
      status: 'under_negotiation',
      renewal_status: 'needs_discussion',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const { data: docs } = await supabase
    .from('crm_contract_documents')
    .select('*')
    .eq('contract_id', id);

  return transformToContractDetail(
    updatedContract as DBContract,
    (docs || []) as ContractDocument[]
  );
}

// Upload a contract document
export async function uploadContractDocument(
  contractId: string,
  file: File
): Promise<ContractDocument> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `contracts/${contractId}/${timestamp}_${sanitizedName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('crm-attachments')
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('crm-attachments')
    .getPublicUrl(storagePath);

  // Insert document record
  const { data: doc, error: insertError } = await supabase
    .from('crm_contract_documents')
    .insert({
      contract_id: contractId,
      file_name: file.name,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      file_size: file.size,
      uploaded_by: user?.id,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return doc as ContractDocument;
}

// Delete a contract document
export async function deleteContractDocument(documentId: string): Promise<void> {
  // Get storage path first
  const { data: doc } = await supabase
    .from('crm_contract_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (doc) {
    await supabase.storage.from('crm-attachments').remove([doc.storage_path]);
  }

  const { error } = await supabase
    .from('crm_contract_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

// Get signed URL for document download
export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('crm-attachments')
    .createSignedUrl(storagePath, 60);

  if (error) throw error;
  return data.signedUrl;
}
