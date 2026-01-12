import { User, AuthResponse } from '@/types';

export interface MockUser extends User {
  password: string;
}

// Create a properly formatted mock JWT token that can be decoded
const createMockJWT = (userId: string, role: string, tenantId?: string) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    role: role,
    tenant_id: tenantId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours from now
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

export const mockUsers: MockUser[] = [
  // System Admin accounts (CEO, MD, AGM, GM, Manager, Admin Staff)
  {
    id: '1',
    email: 'admin@metainnova.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'super_admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    email: 'system@metainnova.com',
    password: 'system123',
    name: 'System Admin CEO',
    role: 'system_admin',
    position_id: 'pos-ceo',
    position_name: 'ceo',
    is_ceo: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SystemAdmin',
    created_at: new Date().toISOString(),
    hourly_rate: 1500,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '7',
    email: 'md@metainnova.com',
    password: 'md123',
    name: 'Managing Director',
    role: 'system_admin',
    position_id: 'pos-md',
    position_name: 'md',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MD',
    created_at: new Date().toISOString(),
    hourly_rate: 1200,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '8',
    email: 'manager@metainnova.com',
    password: 'manager123',
    name: 'Operations Manager',
    role: 'system_admin',
    position_id: 'pos-manager',
    position_name: 'manager',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager',
    created_at: new Date().toISOString(),
    hourly_rate: 480,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '9',
    email: 'agm@metainnova.com',
    password: 'agm123',
    name: 'AGM Operations',
    role: 'system_admin',
    position_id: 'pos-agm',
    position_name: 'agm',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AGM',
    created_at: new Date().toISOString(),
    hourly_rate: 900,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '10',
    email: 'gm@metainnova.com',
    password: 'gm123',
    name: 'General Manager',
    role: 'system_admin',
    position_id: 'pos-gm',
    position_name: 'gm',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GM',
    created_at: new Date().toISOString(),
    hourly_rate: 720,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '11',
    email: 'adminstaff@metainnova.com',
    password: 'staff123',
    name: 'Admin Staff',
    role: 'system_admin',
    position_id: 'pos-admin-staff',
    position_name: 'admin_staff',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminStaff',
    created_at: new Date().toISOString(),
    hourly_rate: 300,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },

  // Modern School Vasant Vihar - Management
  {
    id: 'msd-mgmt-001',
    email: 'admin@modernschool.edu.in',
    password: 'modern123',
    name: 'Dr. Vijay Datta',
    role: 'management',
    tenant_id: 'modern-school',
    institution_id: 'inst-msd-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VijayDatta',
    created_at: new Date().toISOString(),
  },

  // Modern School Vasant Vihar - Innovation Officer
  {
    id: 'off-msd-001',
    email: 'atif.ansari@modernschool.edu.in',
    password: 'atif123',
    name: 'Mr. Atif Ansari',
    role: 'officer',
    tenant_id: 'modern-school',
    institution_id: 'inst-msd-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AtifAnsari',
    created_at: new Date().toISOString(),
  },

  // Modern School Vasant Vihar - Sample Students
  {
    id: 'stu-inst-msd-001-class-msd-9a-1',
    email: 'aarav.sharma.msd@student.com',
    password: 'student123',
    name: 'Aarav Sharma',
    role: 'student',
    tenant_id: 'modern-school',
    institution_id: 'inst-msd-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AaravSharma',
    created_at: new Date().toISOString(),
  },
  {
    id: 'stu-inst-msd-001-class-msd-10a-1',
    email: 'ananya.verma.msd@student.com',
    password: 'student123',
    name: 'Ananya Verma',
    role: 'student',
    tenant_id: 'modern-school',
    institution_id: 'inst-msd-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaVerma',
    created_at: new Date().toISOString(),
  },

  // Kikani Global Academy - Management
  {
    id: 'kga-mgmt-001',
    email: 'admin@kikaniacademy.com',
    password: 'kikani123',
    name: 'Mr. Rajesh Kikani',
    role: 'management',
    tenant_id: 'kikani-global',
    institution_id: 'inst-kga-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshKikani',
    created_at: new Date().toISOString(),
  },

  // Kikani Global Academy - Innovation Officers
  {
    id: 'off-kga-001',
    email: 'saran.t@kikaniacademy.com',
    password: 'saran123',
    name: 'Mr. Saran T',
    role: 'officer',
    tenant_id: 'kikani-global',
    institution_id: 'inst-kga-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaranT',
    created_at: new Date().toISOString(),
  },
  {
    id: 'off-kga-002',
    email: 'sreeram.r@kikaniacademy.com',
    password: 'sreeram123',
    name: 'Mr. Sreeram R',
    role: 'officer',
    tenant_id: 'kikani-global',
    institution_id: 'inst-kga-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SreeramR',
    created_at: new Date().toISOString(),
  },

  // Kikani Global Academy - Sample Students
  {
    id: 'stu-inst-kga-001-class-kga-9a-1',
    email: 'karthik.nair.kga@student.com',
    password: 'student123',
    name: 'Karthik Nair',
    role: 'student',
    tenant_id: 'kikani-global',
    institution_id: 'inst-kga-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KarthikNair',
    created_at: new Date().toISOString(),
  },
  {
    id: 'stu-inst-kga-001-class-kga-10a-1',
    email: 'priya.iyer.kga@student.com',
    password: 'student123',
    name: 'Priya Iyer',
    role: 'student',
    tenant_id: 'kikani-global',
    institution_id: 'inst-kga-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaIyer',
    created_at: new Date().toISOString(),
  },
];

export const mockTenants = [
  {
    id: 'modern-school',
    name: 'Modern School Vasant Vihar',
    slug: 'modern-school-vasant-vihar',
  },
  {
    id: 'kikani-global',
    name: 'Kikani Global Academy',
    slug: 'kikani-global-academy',
  },
];

export const mockAuthService = {
  login: (email: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(
          (u) => u.email === email && u.password === password
        );

        if (!user) {
          reject({
            response: {
              data: {
                message: 'Invalid email or password',
              },
            },
          });
          return;
        }

        const { password: _, ...userWithoutPassword } = user;
        const tenant = user.tenant_id 
          ? mockTenants.find(t => t.id === user.tenant_id)
          : undefined;

        resolve({
          success: true,
          token: createMockJWT(user.id, user.role, user.tenant_id),
          user: userWithoutPassword,
          tenant,
        });
      }, 500); // Simulate network delay
    });
  },
};
