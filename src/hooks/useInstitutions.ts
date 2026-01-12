import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstitutionFormData {
  name: string;
  slug: string;
  type: 'school' | 'college' | 'university' | 'institute';
  location: string;
  established_year: number;
  contact_email: string;
  contact_phone: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  license_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_users: number;
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  student_id_prefix: string;
  student_id_suffix: string;
  pricing_model: {
    per_student_cost: number;
    lms_cost: number;
    lap_setup_cost: number;
    monthly_recurring_cost: number;
    trainer_monthly_fee: number;
  };
  gps_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  attendance_radius_meters: number;
  normal_working_hours: number;
  check_in_time: string;
  check_out_time: string;
}

export interface DbInstitution {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  type: string | null;
  status: string | null;
  address: Record<string, any> | null;
  contact_info: Record<string, any> | null;
  settings: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
  // New license columns
  max_users: number | null;
  license_expiry: string | null;
  current_users: number | null;
  license_type: string | null;
  contract_value: number | null;
  contract_expiry_date: string | null;
  admin_user_id: string | null;
}

// Transform DB institution to app format - use new DB columns when available
export function transformDbToApp(db: any) {
  const address = (typeof db.address === 'object' && db.address !== null ? db.address : {}) as Record<string, any>;
  const contact = (typeof db.contact_info === 'object' && db.contact_info !== null ? db.contact_info : {}) as Record<string, any>;
  const settings = (typeof db.settings === 'object' && db.settings !== null ? db.settings : {}) as Record<string, any>;
  
  // Use new DB columns directly, fallback to settings for legacy data
  const defaultExpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
  
  return {
    id: db.id,
    name: db.name,
    slug: db.slug,
    code: db.code || db.slug?.toUpperCase() || '',
    type: (db.type || 'school') as 'school' | 'college' | 'university' | 'institute',
    location: address.location || '',
    established_year: settings.established_year || new Date().getFullYear(),
    contact_email: contact.email || '',
    contact_phone: contact.phone || '',
    admin_name: contact.admin_name || '',
    admin_email: contact.admin_email || '',
    admin_user_id: db.admin_user_id || null,
    subscription_status: (db.status || 'active') as 'active' | 'inactive' | 'suspended',
    // Use new DB columns directly
    license_type: (db.license_type || settings.license_type || 'basic') as 'basic' | 'standard' | 'premium' | 'enterprise',
    license_expiry: db.license_expiry || settings.license_expiry || defaultExpiry,
    max_users: db.max_users ?? settings.max_users ?? 500,
    current_users: db.current_users ?? settings.current_users ?? 0,
    contract_value: db.contract_value ?? settings.contract_value ?? 150000,
    contract_expiry_date: db.contract_expiry_date || settings.contract_expiry_date || defaultExpiry,
    subscription_plan: (settings.subscription_plan || 'basic') as 'basic' | 'premium' | 'enterprise',
    student_id_prefix: settings.student_id_prefix || '',
    student_id_suffix: settings.student_id_suffix || '',
    pricing_model: settings.pricing_model || {
      per_student_cost: 0,
      lms_cost: 0,
      lap_setup_cost: 0,
      monthly_recurring_cost: 0,
      trainer_monthly_fee: 0,
    },
    gps_location: address.gps_location || { latitude: 0, longitude: 0, address: '' },
    attendance_radius_meters: settings.attendance_radius_meters || 1500,
    normal_working_hours: settings.normal_working_hours || 8,
    check_in_time: settings.check_in_time || '09:00',
    check_out_time: settings.check_out_time || '17:00',
    total_students: settings.total_students || 0,
    total_faculty: settings.total_faculty || 0,
    total_users: settings.total_users || 0,
    storage_used_gb: settings.storage_used_gb || 0,
    features: settings.features || ['Basic Features'],
    contract_type: settings.contract_type || 'Annual Contract',
    contract_start_date: settings.contract_start_date || new Date().toISOString().split('T')[0],
    created_at: db.created_at || new Date().toISOString(),
  };
}

// Transform form data to DB format
export function transformFormToDb(form: InstitutionFormData, existingCount: number) {
  const code = `${form.type.toUpperCase()}-${form.slug.toUpperCase()}-${String(existingCount + 1).padStart(3, '0')}`;
  
  return {
    name: form.name,
    slug: form.slug,
    code,
    type: form.type,
    status: 'active',
    address: {
      location: form.location,
      gps_location: form.gps_location,
    },
    contact_info: {
      email: form.contact_email,
      phone: form.contact_phone,
      admin_name: form.admin_name,
      admin_email: form.admin_email,
    },
    settings: {
      established_year: form.established_year,
      license_type: form.license_type,
      max_users: form.max_users,
      current_users: 0,
      subscription_plan: form.subscription_plan,
      student_id_prefix: form.student_id_prefix,
      student_id_suffix: form.student_id_suffix,
      pricing_model: form.pricing_model,
      attendance_radius_meters: form.attendance_radius_meters,
      normal_working_hours: form.normal_working_hours,
      check_in_time: form.check_in_time,
      check_out_time: form.check_out_time,
      total_students: 0,
      total_faculty: 0,
      total_users: 0,
      storage_used_gb: 0,
      features: form.license_type === 'enterprise' ? ['All Features'] : 
                form.license_type === 'premium' ? ['Innovation Lab', 'Analytics'] : 
                ['Basic Features'],
      contract_type: 'Annual Contract',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      contract_value: form.license_type === 'enterprise' ? 1000000 : 
                      form.license_type === 'premium' ? 500000 : 150000,
      license_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
  };
}

// Helper to check authentication and role
async function verifyAuthAndRole(requiredRole?: string): Promise<{ userId: string; isValid: boolean; error?: string }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    console.error('[Auth] No active session:', sessionError);
    return { userId: '', isValid: false, error: 'You must be logged in to perform this action' };
  }

  const userId = session.user.id;
  console.log('[Auth] User authenticated:', userId);

  if (requiredRole) {
    // Fetch ALL roles for the user (they may have multiple roles like CEO)
    const { data: rolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (roleError) {
      console.error('[Auth] Role check failed:', roleError);
      return { userId, isValid: false, error: 'Failed to verify permissions' };
    }

    if (!rolesData || rolesData.length === 0) {
      return { userId, isValid: false, error: 'No roles assigned to your account' };
    }

    const userRoles = rolesData.map(r => r.role);
    console.log('[Auth] User roles:', userRoles);

    // Check if ANY of the user's roles meets the required role level
    const roleHierarchy = ['student', 'teacher', 'officer', 'management', 'system_admin', 'super_admin'];
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    const hasRequiredRole = userRoles.some(role => {
      const userRoleIndex = roleHierarchy.indexOf(role);
      return userRoleIndex >= requiredRoleIndex;
    });

    if (!hasRequiredRole) {
      return { userId, isValid: false, error: `Insufficient permissions. Required: ${requiredRole}` };
    }
  }

  return { userId, isValid: true };
}

export function useInstitutions() {
  const queryClient = useQueryClient();

  // Fetch all institutions with actual user counts
  const { data: institutions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      console.log('[Institutions] Fetching institutions...');
      
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[Institutions] Fetch error:', error);
        throw error;
      }
      
      // Fetch actual student counts directly from students table
      const institutionIds = (data || []).map(i => i.id);
      
      // Count students per institution directly from students table
      const studentCountPromises = institutionIds.map(async (instId) => {
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', instId);
        
        return { institutionId: instId, count: count || 0 };
      });
      
      const studentCounts = await Promise.all(studentCountPromises);
      const institutionStudentCounts: Record<string, number> = {};
      studentCounts.forEach(({ institutionId, count }) => {
        institutionStudentCounts[institutionId] = count;
      });
      
      console.log('[Institutions] Fetched:', data?.length || 0, 'institutions');
      console.log('[Institutions] Student counts:', institutionStudentCounts);
      
      return (data || []).map(db => {
        const transformed = transformDbToApp(db);
        // Override current_users with actual student count
        transformed.current_users = institutionStudentCounts[db.id] || 0;
        return transformed;
      });
    },
    staleTime: 30000,
  });

  // Create institution mutation with improved error handling
  const createMutation = useMutation({
    mutationFn: async (formData: InstitutionFormData) => {
      console.log('[Institutions] Creating institution:', formData.name);
      
      // Verify authentication and super_admin role
      const authCheck = await verifyAuthAndRole('super_admin');
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const dbData = transformFormToDb(formData, institutions.length);
      console.log('[Institutions] DB data prepared:', dbData);
      
      // Create the institution
      const { data: institutionData, error: institutionError } = await supabase
        .from('institutions')
        .insert(dbData)
        .select()
        .single();
      
      if (institutionError) {
        console.error('[Institutions] Create error:', institutionError);
        throw new Error(`Database error: ${institutionError.message}`);
      }

      console.log('[Institutions] Created successfully:', institutionData.id);

      // Create the institution admin user via edge function
      if (formData.admin_email && formData.admin_password) {
        console.log('[Institutions] Creating admin user via edge function...');
        
        const { data: adminResult, error: adminError } = await supabase.functions.invoke(
          'create-institution-admin',
          {
            body: {
              admin_email: formData.admin_email,
              admin_name: formData.admin_name || formData.name + ' Admin',
              admin_password: formData.admin_password,
              institution_id: institutionData.id,
            },
          }
        );

        if (adminError) {
          console.error('[Institutions] Admin creation failed:', adminError);
          // Don't throw - institution was created successfully, admin can be added later
          toast.error(`Institution created but admin setup failed: ${adminError.message}`);
        } else {
          console.log('[Institutions] Admin created successfully:', adminResult);
        }
      }
      
      return { data: institutionData, formData };
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ['institutions'] });
      const previousInstitutions = queryClient.getQueryData(['institutions']);
      
      // Optimistically add new institution
      const optimisticInstitution = {
        id: `temp-${Date.now()}`,
        ...formData,
        code: `${formData.type.toUpperCase()}-${formData.slug.toUpperCase()}-${String(institutions.length + 1).padStart(3, '0')}`,
        total_students: 0,
        total_faculty: 0,
        total_users: 0,
        storage_used_gb: 0,
        subscription_status: 'active' as const,
        license_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        current_users: 0,
        features: formData.license_type === 'enterprise' ? ['All Features'] : 
                  formData.license_type === 'premium' ? ['Innovation Lab', 'Analytics'] : 
                  ['Basic Features'],
        contract_type: 'Annual Contract',
        contract_start_date: new Date().toISOString().split('T')[0],
        contract_expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        contract_value: formData.license_type === 'enterprise' ? 1000000 : 
                        formData.license_type === 'premium' ? 500000 : 150000,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['institutions'], (old: any) => [optimisticInstitution, ...(old || [])]);
      
      return { previousInstitutions };
    },
    onError: (err: Error, formData, context) => {
      console.error('[Institutions] Mutation error:', err);
      // Rollback on error
      if (context?.previousInstitutions) {
        queryClient.setQueryData(['institutions'], context.previousInstitutions);
      }
      toast.error(err.message || 'Failed to create institution');
    },
    onSuccess: (result) => {
      console.log('[Institutions] Mutation success, refetching...');
      toast.success(`Institution "${result.formData.name}" created successfully`);
      // Refetch to get actual data
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });

  // Update institution mutation with improved error handling
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<any> }) => {
      console.log('[Institutions] Updating institution:', id, updates);
      
      // Verify authentication
      const authCheck = await verifyAuthAndRole('system_admin');
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      // Fetch current institution data to merge with updates
      const { data: current, error: fetchError } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('[Institutions] Fetch for update failed:', fetchError);
        throw new Error(`Failed to fetch institution: ${fetchError.message}`);
      }

      const currentAddress = (current?.address || {}) as Record<string, any>;
      const currentContact = (current?.contact_info || {}) as Record<string, any>;
      const currentSettings = (current?.settings || {}) as Record<string, any>;

      // Build the database update object
      const dbUpdates: Record<string, any> = {};
      
      // Direct DB columns
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.code !== undefined) dbUpdates.code = updates.code; // Make code editable
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.subscription_status !== undefined) dbUpdates.status = updates.subscription_status;
      if (updates.max_users !== undefined) dbUpdates.max_users = updates.max_users;
      if (updates.current_users !== undefined) dbUpdates.current_users = updates.current_users;
      if (updates.license_type !== undefined) dbUpdates.license_type = updates.license_type;
      if (updates.license_expiry !== undefined) dbUpdates.license_expiry = updates.license_expiry || null;
      if (updates.contract_value !== undefined) dbUpdates.contract_value = updates.contract_value;
      if (updates.contract_expiry_date !== undefined) dbUpdates.contract_expiry_date = updates.contract_expiry_date || null;
      
      // Update address JSONB (location, gps_location)
      if (updates.location !== undefined || updates.gps_location !== undefined) {
        dbUpdates.address = {
          ...currentAddress,
          ...(updates.location !== undefined && { location: updates.location }),
          ...(updates.gps_location !== undefined && { gps_location: updates.gps_location }),
        };
      }
      
      // Update contact_info JSONB
      if (updates.contact_email !== undefined || updates.contact_phone !== undefined || 
          updates.admin_name !== undefined || updates.admin_email !== undefined) {
        dbUpdates.contact_info = {
          ...currentContact,
          ...(updates.contact_email !== undefined && { email: updates.contact_email }),
          ...(updates.contact_phone !== undefined && { phone: updates.contact_phone }),
          ...(updates.admin_name !== undefined && { admin_name: updates.admin_name }),
          ...(updates.admin_email !== undefined && { admin_email: updates.admin_email }),
        };
      }
      
      // Update settings JSONB
      const settingsUpdates: Record<string, any> = {};
      if (updates.established_year !== undefined) settingsUpdates.established_year = updates.established_year;
      if (updates.total_faculty !== undefined) settingsUpdates.total_faculty = updates.total_faculty;
      if (updates.total_students !== undefined) settingsUpdates.total_students = updates.total_students;
      if (updates.attendance_radius_meters !== undefined) settingsUpdates.attendance_radius_meters = updates.attendance_radius_meters;
      if (updates.normal_working_hours !== undefined) settingsUpdates.normal_working_hours = updates.normal_working_hours;
      if (updates.check_in_time !== undefined) settingsUpdates.check_in_time = updates.check_in_time;
      if (updates.check_out_time !== undefined) settingsUpdates.check_out_time = updates.check_out_time;
      if (updates.subscription_plan !== undefined) settingsUpdates.subscription_plan = updates.subscription_plan;
      if (updates.student_id_prefix !== undefined) settingsUpdates.student_id_prefix = updates.student_id_prefix;
      if (updates.student_id_suffix !== undefined) settingsUpdates.student_id_suffix = updates.student_id_suffix;
      if (updates.pricing_model !== undefined) settingsUpdates.pricing_model = updates.pricing_model;
      
      if (Object.keys(settingsUpdates).length > 0) {
        dbUpdates.settings = {
          ...currentSettings,
          ...settingsUpdates,
        };
      }

      console.log('[Institutions] DB updates prepared:', dbUpdates);
      
      const { error } = await supabase
        .from('institutions')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('[Institutions] Update error:', error);
        throw new Error(`Update failed: ${error.message}`);
      }
      
      console.log('[Institutions] Updated successfully');
      return { id, updates };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['institutions'] });
      const previousInstitutions = queryClient.getQueryData(['institutions']);
      
      queryClient.setQueryData(['institutions'], (old: any[]) => 
        old?.map(inst => inst.id === id ? { ...inst, ...updates } : inst) || []
      );
      
      return { previousInstitutions };
    },
    onError: (err: Error, vars, context) => {
      console.error('[Institutions] Update mutation error:', err);
      if (context?.previousInstitutions) {
        queryClient.setQueryData(['institutions'], context.previousInstitutions);
      }
      toast.error(err.message || 'Failed to update institution');
    },
    onSuccess: () => {
      toast.success('Institution updated successfully');
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });

  // Delete institution mutation - using cascade delete edge function
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[Institutions] Deleting institution with cascade:', id);
      
      // Verify authentication
      const authCheck = await verifyAuthAndRole('super_admin');
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-institution-cascade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ institutionId: id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Institutions] Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete institution');
      }

      const result = await response.json();
      console.log('[Institutions] Cascade delete completed:', result);
      return { id, ...result };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['institutions'] });
      const previousInstitutions = queryClient.getQueryData(['institutions']);
      
      queryClient.setQueryData(['institutions'], (old: any[]) => 
        old?.filter(inst => inst.id !== id) || []
      );
      
      return { previousInstitutions };
    },
    onError: (err: Error, id, context) => {
      console.error('[Institutions] Delete mutation error:', err);
      if (context?.previousInstitutions) {
        queryClient.setQueryData(['institutions'], context.previousInstitutions);
      }
      toast.error(err.message || 'Failed to delete institution');
    },
    onSuccess: (result) => {
      const message = result.studentsDeleted 
        ? `Institution deleted with ${result.studentsDeleted} students and ${result.classesDeleted} classes`
        : 'Institution deleted successfully';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });

  return {
    institutions,
    isLoading,
    error,
    refetch,
    createInstitution: createMutation.mutateAsync,
    updateInstitution: updateMutation.mutateAsync,
    deleteInstitution: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
