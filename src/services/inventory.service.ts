import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  InventoryItem,
  PurchaseRequest,
  InventoryIssue,
  PurchaseApprovalChain,
  AddInventoryItemData,
  CreatePurchaseRequestData,
  ReportIssueData,
  PurchaseRequestItem
} from "@/types/inventory";
import { getNotificationLink } from "./notificationLink.service";

// ==================== INVENTORY ITEMS ====================

export async function getInventoryItems(institutionId?: string): Promise<InventoryItem[]> {
  let query = supabase
    .from('inventory_items')
    .select(`
      *,
      institutions!inner(name)
    `)
    .eq('status', 'active')
    .order('sl_no', { ascending: true });

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    institution_name: item.institutions?.name
  })) as InventoryItem[];
}

export async function addInventoryItem(
  institutionId: string,
  itemData: AddInventoryItemData,
  userId: string
): Promise<InventoryItem> {
  // Check if there are any active inventory items for this institution
  const { count, error: countError } = await supabase
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .eq('status', 'active');

  if (countError) throw countError;

  // If no active items exist, reset the counter to 0 so next item gets sl_no 1
  if (count === 0) {
    await supabase
      .from('id_counters')
      .update({ current_counter: 0, updated_at: new Date().toISOString() })
      .eq('institution_id', institutionId)
      .eq('entity_type', 'inventory_item');
  }

  // Get the next sl_no for this institution using atomic counter
  const { data: nextSlNo, error: slNoError } = await supabase
    .rpc('get_next_id', { 
      p_institution_id: institutionId, 
      p_entity_type: 'inventory_item' 
    });

  if (slNoError) throw slNoError;

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      institution_id: institutionId,
      sl_no: nextSlNo,
      name: itemData.name,
      description: itemData.description || null,
      unit_price: itemData.unit_price,
      units: itemData.units,
      category: itemData.category || 'general',
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

export async function updateInventoryItem(
  itemId: string,
  itemData: Partial<AddInventoryItemData>
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      name: itemData.name,
      description: itemData.description,
      unit_price: itemData.unit_price,
      units: itemData.units,
      category: itemData.category
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .update({ status: 'disposed' })
    .eq('id', itemId);

  if (error) throw error;
}

// ==================== PURCHASE REQUESTS ====================

export async function getPurchaseRequests(institutionId?: string, officerId?: string): Promise<PurchaseRequest[]> {
  let query = supabase
    .from('purchase_requests')
    .select(`
      *,
      institutions!inner(name)
    `)
    .order('created_at', { ascending: false });

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  if (officerId) {
    query = query.eq('officer_id', officerId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(req => ({
    ...req,
    items: req.items as unknown as PurchaseRequestItem[],
    institution_name: req.institutions?.name
  })) as PurchaseRequest[];
}

export async function createPurchaseRequest(
  requestData: CreatePurchaseRequestData,
  officerId: string,
  requesterName: string
): Promise<PurchaseRequest> {
  // Generate request code
  const { data: codeData, error: codeError } = await supabase
    .rpc('generate_request_code', { prefix: 'PR', table_name: 'purchase_requests' });

  if (codeError) throw codeError;

  const totalCost = requestData.items.reduce((sum, item) => sum + item.estimated_total, 0);

  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      request_code: codeData as string,
      institution_id: requestData.institution_id,
      officer_id: officerId,
      requester_name: requesterName,
      items: requestData.items as unknown as Json,
      total_estimated_cost: totalCost,
      justification: requestData.justification || null,
      priority: requestData.priority || 'normal',
      status: 'pending_institution'
    })
    .select()
    .single();

  if (error) throw error;

  // Create notification for institution management
  await createNotification({
    recipientRole: 'management',
    institutionId: requestData.institution_id,
    type: 'purchase_request',
    title: 'New Purchase Request',
    message: `${requesterName} has submitted a purchase request (${codeData}) requiring your approval.`,
    link: getNotificationLink('management', '/inventory'),
    metadata: { request_id: data.id, request_code: codeData }
  });

  return { ...data, items: data.items as unknown as PurchaseRequestItem[] } as PurchaseRequest;
}

export async function approvePurchaseRequestByInstitution(
  requestId: string,
  approverId: string,
  comments?: string
): Promise<void> {
  const { data: request, error: fetchError } = await supabase
    .from('purchase_requests')
    .select('*, institutions(name)')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('purchase_requests')
    .update({
      status: 'pending_ceo',
      institution_approved_by: approverId,
      institution_approved_at: new Date().toISOString(),
      institution_comments: comments || null
    })
    .eq('id', requestId);

  if (error) throw error;

  // Notify CEO and assigned approvers
  await createNotification({
    recipientRole: 'system_admin',
    type: 'purchase_request',
    title: 'Purchase Request Needs Final Approval',
    message: `Purchase request ${request.request_code} from ${request.institutions?.name || 'institution'} has been approved by institution management and needs final approval.`,
    link: getNotificationLink('system_admin', '/inventory'),
    metadata: { request_id: requestId, request_code: request.request_code }
  });
}

export async function approvePurchaseRequestFinal(
  requestId: string,
  approverId: string,
  comments?: string
): Promise<void> {
  const { data: request, error: fetchError } = await supabase
    .from('purchase_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('purchase_requests')
    .update({
      status: 'approved',
      final_approved_by: approverId,
      final_approved_at: new Date().toISOString(),
      final_comments: comments || null
    })
    .eq('id', requestId);

  if (error) throw error;

  // Notify the officer who created the request
  await createNotification({
    recipientId: request.officer_id,
    recipientRole: 'officer',
    type: 'purchase_request',
    title: 'Purchase Request Approved',
    message: `Your purchase request ${request.request_code} has been fully approved!`,
    link: getNotificationLink('officer', '/inventory'),
    metadata: { request_id: requestId, request_code: request.request_code }
  });
}

export async function rejectPurchaseRequest(
  requestId: string,
  rejectorId: string,
  reason: string
): Promise<void> {
  const { data: request, error: fetchError } = await supabase
    .from('purchase_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('purchase_requests')
    .update({
      status: 'rejected',
      rejected_by: rejectorId,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', requestId);

  if (error) throw error;

  // Notify the officer
  await createNotification({
    recipientId: request.officer_id,
    recipientRole: 'officer',
    type: 'purchase_request',
    title: 'Purchase Request Rejected',
    message: `Your purchase request ${request.request_code} has been rejected. Reason: ${reason}`,
    link: getNotificationLink('officer', '/inventory'),
    metadata: { request_id: requestId, request_code: request.request_code }
  });
}

// ==================== INVENTORY ISSUES ====================

export async function getInventoryIssues(institutionId?: string, reportedBy?: string): Promise<InventoryIssue[]> {
  let query = supabase
    .from('inventory_issues')
    .select(`
      *,
      institutions!inner(name)
    `)
    .order('created_at', { ascending: false });

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  if (reportedBy) {
    query = query.eq('reported_by', reportedBy);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(issue => ({
    ...issue,
    institution_name: issue.institutions?.name
  })) as InventoryIssue[];
}

export async function reportInventoryIssue(
  issueData: ReportIssueData,
  reporterId: string,
  reporterName: string
): Promise<InventoryIssue> {
  // Generate issue code
  const { data: codeData, error: codeError } = await supabase
    .rpc('generate_request_code', { prefix: 'ISS', table_name: 'inventory_issues' });

  if (codeError) throw codeError;

  const { data, error } = await supabase
    .from('inventory_issues')
    .insert({
      issue_code: codeData,
      institution_id: issueData.institution_id,
      inventory_item_id: issueData.inventory_item_id || null,
      item_name: issueData.item_name,
      reported_by: reporterId,
      reporter_name: reporterName,
      issue_type: issueData.issue_type,
      description: issueData.description,
      quantity_affected: issueData.quantity_affected || 1,
      severity: issueData.severity || 'medium'
    })
    .select()
    .single();

  if (error) throw error;

  // Notify management and admins
  await createNotification({
    recipientRole: 'management',
    institutionId: issueData.institution_id,
    type: 'inventory_issue',
    title: `Inventory Issue Reported: ${issueData.issue_type}`,
    message: `${reporterName} reported a ${issueData.severity || 'medium'} severity ${issueData.issue_type} issue for "${issueData.item_name}".`,
    link: getNotificationLink('management', '/inventory'),
    metadata: { issue_id: data.id, issue_code: codeData }
  });

  await createNotification({
    recipientRole: 'system_admin',
    type: 'inventory_issue',
    title: `Inventory Issue: ${issueData.issue_type}`,
    message: `${reporterName} reported a ${issueData.severity || 'medium'} severity ${issueData.issue_type} issue for "${issueData.item_name}".`,
    link: getNotificationLink('system_admin', '/inventory'),
    metadata: { issue_id: data.id, issue_code: codeData }
  });

  return data as InventoryIssue;
}

export async function acknowledgeIssue(issueId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_issues')
    .update({
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', issueId);

  if (error) throw error;
}

export async function resolveIssue(issueId: string, userId: string, notes: string): Promise<void> {
  const { data: issue, error: fetchError } = await supabase
    .from('inventory_issues')
    .select('*')
    .eq('id', issueId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('inventory_issues')
    .update({
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes
    })
    .eq('id', issueId);

  if (error) throw error;

  // Notify the reporter
  await createNotification({
    recipientId: issue.reported_by,
    recipientRole: 'officer',
    type: 'inventory_issue',
    title: 'Issue Resolved',
    message: `Your reported issue (${issue.issue_code}) for "${issue.item_name}" has been resolved.`,
    link: getNotificationLink('officer', '/inventory'),
    metadata: { issue_id: issueId, issue_code: issue.issue_code }
  });
}

// ==================== APPROVAL CHAIN ====================

export async function getApprovalChain(institutionId?: string): Promise<PurchaseApprovalChain[]> {
  let query = supabase
    .from('purchase_approval_chain')
    .select(`
      *,
      institutions!inner(name),
      positions(display_name)
    `)
    .eq('is_active', true);

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Fetch approver profiles separately since there's no direct FK
  const approverIds = (data || []).map(chain => chain.approver_user_id).filter(Boolean);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', approverIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  return (data || []).map(chain => ({
    ...chain,
    institution_name: chain.institutions?.name,
    approver_name: profileMap.get(chain.approver_user_id)?.name,
    approver_email: profileMap.get(chain.approver_user_id)?.email,
    position_name: chain.positions?.display_name
  })) as PurchaseApprovalChain[];
}

export async function assignApprover(
  institutionId: string,
  approverUserId: string,
  approverType: 'ceo' | 'position',
  positionId: string | null,
  assignedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('purchase_approval_chain')
    .upsert({
      institution_id: institutionId,
      approver_user_id: approverUserId,
      approver_type: approverType,
      position_id: positionId,
      assigned_by: assignedBy,
      is_active: true
    }, {
      onConflict: 'institution_id,approver_user_id'
    });

  if (error) throw error;
}

export async function removeApprover(chainId: string): Promise<void> {
  const { error } = await supabase
    .from('purchase_approval_chain')
    .update({ is_active: false })
    .eq('id', chainId);

  if (error) throw error;
}

// ==================== NOTIFICATIONS HELPER ====================

interface NotificationData {
  recipientId?: string;
  recipientRole: string;
  institutionId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

async function createNotification(data: NotificationData): Promise<void> {
  try {
    const metadata = data.metadata ? (data.metadata as Json) : null;
    
    if (data.recipientId) {
      // Direct notification to a specific user
      await supabase.from('notifications').insert({
        recipient_id: data.recipientId,
        recipient_role: data.recipientRole,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata
      });
    } else {
      // Get users by role from user_roles table - this ensures only users with the correct role receive notifications
      type AppRole = 'management' | 'officer' | 'student' | 'super_admin' | 'system_admin' | 'teacher';
      let roleFilter: AppRole;
      
      // Map our notification roles to actual database roles
      switch (data.recipientRole) {
        case 'management':
          roleFilter = 'management';
          break;
        case 'system_admin':
          roleFilter = 'system_admin';
          break;
        case 'officer':
          roleFilter = 'officer';
          break;
        default:
          console.warn(`Unknown recipient role: ${data.recipientRole}`);
          return;
      }

      // Query user_roles to get only users with the correct role
      const { data: roleUsers, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', roleFilter);

      if (roleError) {
        console.error('Error fetching users by role:', roleError);
        return;
      }

      if (!roleUsers || roleUsers.length === 0) {
        console.log(`No users found with role: ${roleFilter}`);
        return;
      }

      const userIds = roleUsers.map(u => u.user_id);

      // For management role, also filter by institution
      if (data.recipientRole === 'management' && data.institutionId) {
        const { data: institutionProfiles } = await supabase
          .from('profiles')
          .select('id')
          .in('id', userIds)
          .eq('institution_id', data.institutionId);

        if (institutionProfiles && institutionProfiles.length > 0) {
          const notifications = institutionProfiles.map(profile => ({
            recipient_id: profile.id,
            recipient_role: data.recipientRole,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link || null,
            metadata
          }));

          await supabase.from('notifications').insert(notifications);
        }
      } else {
        // For system_admin and officer roles, send to all users with that role
        const notifications = userIds.map(userId => ({
          recipient_id: userId,
          recipient_role: data.recipientRole,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

// ==================== STATISTICS ====================

export async function getInventoryStats(institutionId?: string) {
  let itemsQuery = supabase
    .from('inventory_items')
    .select('total_value, units')
    .eq('status', 'active');

  let requestsQuery = supabase
    .from('purchase_requests')
    .select('status, total_estimated_cost');

  let issuesQuery = supabase
    .from('inventory_issues')
    .select('status, severity');

  if (institutionId) {
    itemsQuery = itemsQuery.eq('institution_id', institutionId);
    requestsQuery = requestsQuery.eq('institution_id', institutionId);
    issuesQuery = issuesQuery.eq('institution_id', institutionId);
  }

  const [itemsRes, requestsRes, issuesRes] = await Promise.all([
    itemsQuery,
    requestsQuery,
    issuesQuery
  ]);

  const items = itemsRes.data || [];
  const requests = requestsRes.data || [];
  const issues = issuesRes.data || [];

  return {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0),
    totalUnits: items.reduce((sum, item) => sum + (item.units || 0), 0),
    pendingRequests: requests.filter(r => r.status === 'pending_institution' || r.status === 'pending_ceo').length,
    approvedRequests: requests.filter(r => r.status === 'approved').length,
    openIssues: issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length,
    criticalIssues: issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length
  };
}
