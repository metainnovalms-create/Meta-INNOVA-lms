// Database-aligned inventory types

export interface InventoryItem {
  id: string;
  institution_id: string;
  sl_no: number;
  name: string;
  description: string | null;
  unit_price: number;
  units: number;
  total_value: number;
  category: string;
  status: 'active' | 'inactive' | 'disposed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  institution_name?: string;
}

export interface PurchaseRequestItem {
  name: string;
  description?: string;
  quantity: number;
  estimated_unit_price: number;
  estimated_total: number;
}

export interface PurchaseRequest {
  id: string;
  request_code: string;
  institution_id: string;
  officer_id: string;
  requester_name: string;
  items: PurchaseRequestItem[];
  total_estimated_cost: number;
  justification: string | null;
  priority: 'low' | 'normal' | 'urgent';
  status: 'pending_institution' | 'approved_institution' | 'pending_ceo' | 'approved' | 'rejected' | 'cancelled';
  institution_approved_by: string | null;
  institution_approved_at: string | null;
  institution_comments: string | null;
  final_approved_by: string | null;
  final_approved_at: string | null;
  final_comments: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  institution_name?: string;
}

export interface InventoryIssue {
  id: string;
  issue_code: string;
  institution_id: string;
  inventory_item_id: string | null;
  item_name: string;
  reported_by: string;
  reporter_name: string;
  issue_type: 'damaged' | 'missing' | 'malfunction' | 'other';
  description: string;
  quantity_affected: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  institution_name?: string;
}

export interface PurchaseApprovalChain {
  id: string;
  institution_id: string;
  approver_user_id: string;
  approver_type: 'ceo' | 'position';
  position_id: string | null;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
  // Joined fields
  approver_name?: string;
  approver_email?: string;
  position_name?: string;
  institution_name?: string;
}

// Form data types
export interface AddInventoryItemData {
  name: string;
  description?: string;
  unit_price: number;
  units: number;
  category?: string;
}

export interface CreatePurchaseRequestData {
  institution_id: string;
  items: PurchaseRequestItem[];
  justification?: string;
  priority?: 'low' | 'normal' | 'urgent';
}

export interface ReportIssueData {
  institution_id: string;
  inventory_item_id?: string;
  item_name: string;
  issue_type: 'damaged' | 'missing' | 'malfunction' | 'other';
  description: string;
  quantity_affected?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Legacy types for backwards compatibility
export interface StockLocation {
  location_id: string;
  location_name: string;
  type: 'lab' | 'store' | 'workshop' | 'classroom';
  capacity: number;
  current_items: number;
  responsible_person: string;
}

export interface AuditRecord {
  audit_id: string;
  audit_date: string;
  audited_by: string;
  items_checked: number;
  discrepancies: number;
  missing_items: string[];
  damaged_items: string[];
  newly_added: string[];
  notes: string;
  status: 'completed' | 'in_progress' | 'pending_review';
}

export interface ProjectComponent {
  id: string;
  component_code: string;
  name: string;
  category: 'electronics' | 'sensors' | 'actuators' | 'mechanical' | 'software' | 'other';
  project_id?: string;
  project_name?: string;
  description: string;
  specifications?: string;
  manufacturer?: string;
  part_number?: string;
  required_quantity: number;
  unit: string;
  estimated_unit_price: number;
  estimated_total: number;
  status: 'needed' | 'requested' | 'approved' | 'purchased' | 'received';
  purchase_request_id?: string;
  purchase_request_code?: string;
  added_by_officer_id: string;
  added_by_officer_name: string;
  created_at: string;
  updated_at: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  justification?: string;
  notes?: string;
}
