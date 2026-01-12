import { ShoppingCart, DollarSign, Calendar, ClipboardCheck } from "lucide-react";
import { CriticalAction } from "@/components/management/CriticalActionsCard";

export const mockCriticalActions: CriticalAction[] = [
  {
    id: '1',
    type: 'purchase',
    title: 'Purchase Requests',
    description: 'Pending approval for lab equipment and supplies',
    count: 12,
    urgency: 'high',
    deadline: 'Due in 2 days',
    amount: 450000,
    link: '/tenant/springfield/management/inventory-purchase',
    icon: ShoppingCart
  },
  {
    id: '2',
    type: 'payroll',
    title: 'Payroll Reviews',
    description: 'Officer payslips awaiting verification and approval',
    count: 8,
    urgency: 'high',
    deadline: 'Due tomorrow',
    link: '/tenant/springfield/management/attendance-payroll',
    icon: DollarSign
  },
  {
    id: '3',
    type: 'deadline',
    title: 'Exam Schedule',
    description: 'Semester examination schedule pending finalization',
    count: 1,
    urgency: 'medium',
    deadline: '7 days remaining',
    link: '/tenant/springfield/management/settings',
    icon: Calendar
  },
  {
    id: '4',
    type: 'info',
    title: 'Officers on Leave',
    description: 'Staff members currently on approved leave',
    count: 2,
    urgency: 'low',
    deadline: 'Returns this week',
    link: '/tenant/springfield/management/teachers',
    icon: ClipboardCheck
  }
];
