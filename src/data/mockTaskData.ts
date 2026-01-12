import { Task, TaskStats } from '@/types/task';

const TASKS_KEY = 'meta_innova_tasks';

// Initial mock tasks
const initialMockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Prepare Q1 Budget Report',
    description: 'Compile and analyze all Q1 expenses across departments. Include detailed breakdown by category and comparison with previous quarters.',
    category: 'administrative',
    priority: 'high',
    status: 'in_progress',
    created_by_id: 'sys-admin-001',
    created_by_name: 'John Doe',
    created_by_position: 'CEO',
    assigned_to_id: 'sys-admin-002',
    assigned_to_name: 'Jane Smith',
    assigned_to_position: 'GM',
    assigned_to_role: 'system_admin',
    created_at: '2025-01-10T10:00:00Z',
    due_date: '2025-02-01T17:00:00Z',
    progress_percentage: 60,
    comments: [
      {
        id: 'comment-001',
        task_id: 'task-001',
        user_id: 'sys-admin-002',
        user_name: 'Jane Smith',
        comment: 'Started working on the departmental breakdown. Will have initial draft by Friday.',
        created_at: '2025-01-15T14:30:00Z'
      }
    ]
  },
  {
    id: 'task-002',
    title: 'Update Inventory Management System',
    description: 'Review and update the inventory tracking procedures. Implement new categorization system.',
    category: 'operational',
    priority: 'medium',
    status: 'pending',
    created_by_id: 'sys-admin-001',
    created_by_name: 'John Doe',
    created_by_position: 'MD',
    assigned_to_id: 'sys-admin-003',
    assigned_to_name: 'Robert Johnson',
    assigned_to_position: 'Manager',
    assigned_to_role: 'system_admin',
    created_at: '2025-01-12T09:00:00Z',
    due_date: '2025-02-15T17:00:00Z',
    progress_percentage: 0,
    comments: []
  },
  {
    id: 'task-003',
    title: 'Develop Training Module Content',
    description: 'Create comprehensive training materials for new innovation programs. Include presentation slides, handouts, and assessment materials.',
    category: 'strategic',
    priority: 'urgent',
    status: 'in_progress',
    created_by_id: 'sys-admin-001',
    created_by_name: 'John Doe',
    created_by_position: 'CEO',
    assigned_to_id: 'off-msd-001',
    assigned_to_name: 'Mr. Atif Ansari',
    assigned_to_position: 'Innovation Officer',
    assigned_to_role: 'officer',
    created_at: '2025-01-08T11:00:00Z',
    due_date: '2025-01-25T17:00:00Z',
    progress_percentage: 75,
    comments: [
      {
        id: 'comment-002',
        task_id: 'task-003',
        user_id: 'off-msd-001',
        user_name: 'Mr. Atif Ansari',
        comment: 'Completed the presentation slides. Working on the assessment materials now.',
        created_at: '2025-01-20T10:15:00Z'
      }
    ]
  },
  {
    id: 'task-004',
    title: 'Audit System Documentation',
    description: 'Review and update all system documentation to ensure accuracy and completeness.',
    category: 'technical',
    priority: 'low',
    status: 'pending',
    created_by_id: 'sys-admin-004',
    created_by_name: 'Michael Brown',
    created_by_position: 'AGM',
    assigned_to_id: 'sys-admin-005',
    assigned_to_name: 'Emily Davis',
    assigned_to_position: 'Admin Staff',
    assigned_to_role: 'system_admin',
    created_at: '2025-01-14T13:00:00Z',
    due_date: '2025-03-01T17:00:00Z',
    progress_percentage: 0,
    comments: []
  },
  {
    id: 'task-005',
    title: 'Organize Community Outreach Event',
    description: 'Plan and coordinate upcoming community innovation showcase. Handle venue, logistics, and participant coordination.',
    category: 'other',
    priority: 'high',
    status: 'in_progress',
    created_by_id: 'sys-admin-004',
    created_by_name: 'Michael Brown',
    created_by_position: 'MD',
    assigned_to_id: 'off-kga-001',
    assigned_to_name: 'Mr. Saran T',
    assigned_to_position: 'Senior Innovation Officer',
    assigned_to_role: 'officer',
    created_at: '2025-01-11T08:30:00Z',
    due_date: '2025-02-10T17:00:00Z',
    progress_percentage: 40,
    comments: []
  },
  {
    id: 'task-007',
    title: 'Update Innovation Lab Equipment Inventory',
    description: 'Conduct comprehensive audit of all innovation lab equipment. Update inventory system with current status and maintenance needs.',
    category: 'operational',
    priority: 'medium',
    status: 'pending',
    created_by_id: 'sys-admin-004',
    created_by_name: 'Michael Brown',
    created_by_position: 'AGM',
    assigned_to_id: 'off-kga-002',
    assigned_to_name: 'Mr. Sreeram R',
    assigned_to_position: 'Innovation Officer',
    assigned_to_role: 'officer',
    created_at: '2025-01-14T09:00:00Z',
    due_date: '2025-02-20T17:00:00Z',
    progress_percentage: 0,
    comments: []
  },
  {
    id: 'task-006',
    title: 'Review Compliance Procedures',
    description: 'Conduct thorough review of all compliance and regulatory procedures. Update as necessary.',
    category: 'administrative',
    priority: 'medium',
    status: 'completed',
    created_by_id: 'sys-admin-004',
    created_by_name: 'Michael Brown',
    created_by_position: 'AGM',
    assigned_to_id: 'sys-admin-002',
    assigned_to_name: 'Jane Smith',
    assigned_to_position: 'GM',
    assigned_to_role: 'system_admin',
    created_at: '2025-01-05T10:00:00Z',
    due_date: '2025-01-20T17:00:00Z',
    completed_at: '2025-01-19T16:30:00Z',
    progress_percentage: 100,
    comments: []
  }
];

// Initialize localStorage with mock data if empty
function initializeTasksStorage(): void {
  if (!localStorage.getItem(TASKS_KEY)) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(initialMockTasks));
  }
}

// Load tasks from localStorage
export function loadTasks(): Task[] {
  initializeTasksStorage();
  const stored = localStorage.getItem(TASKS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save tasks to localStorage
export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// Add new task
export function addTask(task: Task): void {
  const tasks = loadTasks();
  tasks.unshift(task);
  saveTasks(tasks);
}

// Update task
export function updateTask(taskId: string, updates: Partial<Task>): void {
  const tasks = loadTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
  }
}

// Delete task
export function deleteTask(taskId: string): void {
  const tasks = loadTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
}

// Get tasks assigned to a specific user
export function getTasksByAssignee(userId: string): Task[] {
  return loadTasks().filter(task => task.assigned_to_id === userId);
}

// Get tasks created by a specific user
export function getTasksByCreator(userId: string): Task[] {
  return loadTasks().filter(task => task.created_by_id === userId);
}

// Get tasks pending approval by creator
export function getTasksPendingApproval(creatorId: string): Task[] {
  return loadTasks().filter(
    task => task.created_by_id === creatorId && task.status === 'submitted_for_approval'
  );
}

// Get task statistics
export function getTaskStats(userId?: string): TaskStats {
  const tasks = userId ? getTasksByAssignee(userId) : loadTasks();
  const now = new Date();
  
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => 
      t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.due_date) < now
    ).length,
  };
}

// Legacy export for backward compatibility
export const mockTasks = initialMockTasks;
