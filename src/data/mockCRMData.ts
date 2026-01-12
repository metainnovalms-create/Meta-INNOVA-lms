export interface CommunicationLog {
  id: string;
  institution_id: string;
  institution_name: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'visit' | 'follow_up';
  subject: string;
  notes: string;
  contact_person: string;
  contact_role: string;
  conducted_by: string;
  next_action: string;
  next_action_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'pending' | 'follow_up_required';
  attachments?: string[];
}

export interface ContractDetail {
  id: string;
  institution_id: string;
  institution_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  renewal_date: string;
  contract_value: number;
  payment_terms: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'under_negotiation';
  auto_renew: boolean;
  documents: {
    name: string;
    url: string;
    uploaded_date: string;
  }[];
  renewal_status: 'auto_renew' | 'manual_renew' | 'needs_discussion';
  communication_history: string[];
}

export interface BillingRecord {
  id: string;
  institution_id: string;
  institution_name: string;
  invoice_number: string;
  billing_period: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  payment_method: string;
  notes: string;
}

export interface CRMTask {
  id: string;
  institution_id: string;
  institution_name: string;
  task_type: 'renewal_reminder' | 'follow_up' | 'payment_reminder' | 'meeting_scheduled' | 'support_ticket';
  description: string;
  due_date: string;
  assigned_to: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  related_contract?: string;
}

export const mockCommunicationLogs: CommunicationLog[] = [
  {
    id: 'comm-1',
    institution_id: 'modern-school-vv',
    institution_name: 'Modern School Vasant Vihar',
    date: '2024-11-20T10:30:00Z',
    type: 'meeting',
    subject: 'Q4 Performance Review',
    notes: 'Discussed current engagement metrics (85%). Principal very satisfied with platform. Mentioned interest in expanding to 2 more branches. Need to send expansion proposal by Nov 30.',
    contact_person: 'Dr. Meera Kapoor',
    contact_role: 'Principal',
    conducted_by: 'Rajesh Kumar',
    next_action: 'Send expansion proposal for 2 additional branches',
    next_action_date: '2024-11-30T00:00:00Z',
    priority: 'high',
    status: 'follow_up_required',
    attachments: ['meeting-notes-nov20.pdf']
  },
  {
    id: 'comm-2',
    institution_id: 'kga',
    institution_name: 'Kikani Global Academy',
    date: '2024-11-18T14:00:00Z',
    type: 'call',
    subject: 'Technical Support - Lab Equipment',
    notes: 'IT head reported 3D printer connectivity issues. Remote troubleshooting attempted. Need to schedule on-site visit. Also inquired about advanced robotics module.',
    contact_person: 'Amit Desai',
    contact_role: 'IT Head',
    conducted_by: 'Anita Desai',
    next_action: 'Schedule on-site technical visit',
    next_action_date: '2024-11-25T00:00:00Z',
    priority: 'medium',
    status: 'pending',
    attachments: []
  },
  {
    id: 'comm-3',
    institution_id: 'valley-view',
    institution_name: 'Valley View School',
    date: '2024-11-15T09:00:00Z',
    type: 'email',
    subject: 'Engagement Concerns - Follow Up',
    notes: 'Sent detailed email addressing low engagement (38%). Offered free training session and dedicated support. Awaiting response. Contract expires in 60 days - critical situation.',
    contact_person: 'Mr. Suresh Patel',
    contact_role: 'Director',
    conducted_by: 'Priya Sharma',
    next_action: 'Follow up call if no response by Nov 22',
    next_action_date: '2024-11-22T00:00:00Z',
    priority: 'high',
    status: 'follow_up_required',
    attachments: ['engagement-improvement-plan.pdf']
  }
];

export const mockContracts: ContractDetail[] = [
  {
    id: 'cnt-1',
    institution_id: 'modern-school-vv',
    institution_name: 'Modern School Vasant Vihar',
    contract_type: 'Enterprise License',
    start_date: '2023-09-01',
    end_date: '2025-09-01',
    renewal_date: '2025-07-01',
    contract_value: 4200000,
    payment_terms: 'Quarterly',
    status: 'active',
    auto_renew: false,
    documents: [
      {
        name: 'Master Agreement 2023.pdf',
        url: '/contracts/modern-school-2023.pdf',
        uploaded_date: '2023-08-15'
      }
    ],
    renewal_status: 'manual_renew',
    communication_history: ['comm-1']
  },
  {
    id: 'cnt-2',
    institution_id: 'kga',
    institution_name: 'Kikani Global Academy',
    contract_type: 'Standard License',
    start_date: '2023-03-15',
    end_date: '2026-03-15',
    renewal_date: '2026-01-15',
    contract_value: 3000000,
    payment_terms: 'Annual',
    status: 'active',
    auto_renew: true,
    documents: [
      {
        name: 'KGA Contract 2023.pdf',
        url: '/contracts/kga-2023.pdf',
        uploaded_date: '2023-03-01'
      }
    ],
    renewal_status: 'auto_renew',
    communication_history: ['comm-2']
  },
  {
    id: 'cnt-3',
    institution_id: 'valley-view',
    institution_name: 'Valley View School',
    contract_type: 'Basic License',
    start_date: '2024-01-20',
    end_date: '2025-01-20',
    renewal_date: '2024-12-20',
    contract_value: 2000000,
    payment_terms: 'Semi-Annual',
    status: 'expiring_soon',
    auto_renew: false,
    documents: [
      {
        name: 'Valley View Agreement.pdf',
        url: '/contracts/valley-view-2024.pdf',
        uploaded_date: '2024-01-10'
      }
    ],
    renewal_status: 'needs_discussion',
    communication_history: ['comm-3']
  }
];

export const mockBillingRecords: BillingRecord[] = [
  {
    id: 'inv-1',
    institution_id: 'modern-school-vv',
    institution_name: 'Modern School Vasant Vihar',
    invoice_number: 'INV-2024-MS-Q4',
    billing_period: 'Oct-Dec 2024',
    amount: 1050000,
    due_date: '2024-12-03',
    paid_date: '2024-11-03',
    status: 'paid',
    payment_method: 'Bank Transfer',
    notes: 'Paid on time. Q4 2024.'
  },
  {
    id: 'inv-2',
    institution_id: 'kga',
    institution_name: 'Kikani Global Academy',
    invoice_number: 'INV-2024-KGA-001',
    billing_period: 'Nov 2024',
    amount: 250000,
    due_date: '2024-12-01',
    paid_date: '2024-11-01',
    status: 'paid',
    payment_method: 'Online Payment',
    notes: 'Early payment received.'
  },
  {
    id: 'inv-3',
    institution_id: 'valley-view',
    institution_name: 'Valley View School',
    invoice_number: 'INV-2024-VV-H2',
    billing_period: 'Jul-Dec 2024',
    amount: 1000000,
    due_date: '2024-11-15',
    status: 'overdue',
    payment_method: 'Pending',
    notes: '5 days overdue. Follow-up required.'
  }
];

export const mockCRMTasks: CRMTask[] = [
  {
    id: 'task-1',
    institution_id: 'modern-school-vv',
    institution_name: 'Modern School Vasant Vihar',
    task_type: 'follow_up',
    description: 'Send expansion proposal for 2 additional branches',
    due_date: '2024-11-30',
    assigned_to: 'Rajesh Kumar',
    priority: 'high',
    status: 'pending',
    related_contract: 'cnt-1'
  },
  {
    id: 'task-2',
    institution_id: 'kga',
    institution_name: 'Kikani Global Academy',
    task_type: 'support_ticket',
    description: 'Schedule on-site technical visit for 3D printer',
    due_date: '2024-11-25',
    assigned_to: 'Anita Desai',
    priority: 'medium',
    status: 'pending'
  },
  {
    id: 'task-3',
    institution_id: 'valley-view',
    institution_name: 'Valley View School',
    task_type: 'renewal_reminder',
    description: 'Follow up on engagement concerns and renewal discussion',
    due_date: '2024-11-22',
    assigned_to: 'Priya Sharma',
    priority: 'high',
    status: 'pending',
    related_contract: 'cnt-3'
  },
  {
    id: 'task-4',
    institution_id: 'valley-view',
    institution_name: 'Valley View School',
    task_type: 'payment_reminder',
    description: 'Collect overdue payment of ₹10L',
    due_date: '2024-11-21',
    assigned_to: 'Sneha Reddy',
    priority: 'high',
    status: 'in_progress',
    related_contract: 'cnt-3'
  }
];
