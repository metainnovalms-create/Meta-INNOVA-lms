import api from './api';

export interface DepartmentMetrics {
  id: string;
  departmentName: string;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  averageAttendance: number;
  averageGrade: number;
  activeProjects: number;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  coursesAssigned: number;
  studentsEnrolled: number;
  averageRating: number;
  status: 'active' | 'on_leave' | 'inactive';
  lastActive: string;
}

export interface PerformanceMetric {
  id: string;
  metricName: string;
  category: 'academic' | 'attendance' | 'engagement' | 'resource';
  currentValue: number;
  targetValue: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface DepartmentReport {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual';
  generatedDate: string;
  status: 'draft' | 'published' | 'archived';
  downloadUrl: string;
}

export interface ResourceAllocation {
  id: string;
  resourceType: string;
  department: string;
  allocated: number;
  used: number;
  available: number;
  unit: string;
}

export interface CriticalActionData {
  id: string;
  type: 'purchase' | 'payroll' | 'deadline' | 'approval';
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  deadline?: string;
  amount?: number;
  link: string;
}

export const managementService = {
  async getDepartmentMetrics(): Promise<DepartmentMetrics[]> {
    const response = await api.get('/management/metrics');
    return response.data;
  },

  async getFacultyMembers(): Promise<FacultyMember[]> {
    const response = await api.get('/management/faculty');
    return response.data;
  },

  async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    const response = await api.get('/management/performance');
    return response.data;
  },

  async getDepartmentReports(): Promise<DepartmentReport[]> {
    const response = await api.get('/management/reports');
    return response.data;
  },

  async getResourceAllocations(): Promise<ResourceAllocation[]> {
    const response = await api.get('/management/resources');
    return response.data;
  },

  async updateFacultyStatus(facultyId: string, status: string): Promise<void> {
    await api.patch(`/management/faculty/${facultyId}/status`, { status });
  },

  async generateReport(reportType: string, parameters: any): Promise<DepartmentReport> {
    const response = await api.post('/management/reports/generate', { reportType, parameters });
    return response.data;
  },

  async getCriticalActions(): Promise<CriticalActionData[]> {
    const response = await api.get('/management/critical-actions');
    return response.data;
  },
};
