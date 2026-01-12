import React, { createContext, useContext, ReactNode } from 'react';
import { useInstitutions, transformDbToApp } from '@/hooks/useInstitutions';

// Institution type from database
export interface Institution {
  id: string;
  name: string;
  slug: string;
  code: string;
  type: 'university' | 'college' | 'school' | 'institute';
  location: string;
  established_year: number;
  contact_email: string;
  contact_phone: string;
  admin_name: string;
  admin_email: string;
  total_students: number;
  total_faculty: number;
  total_users: number;
  storage_used_gb: number;
  subscription_status: 'active' | 'inactive' | 'suspended';
  subscription_plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  license_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  license_expiry: string;
  max_users: number;
  current_users: number;
  features: string[];
  contract_type: string;
  contract_start_date: string;
  contract_expiry_date: string;
  contract_value: number;
  mou_document_url?: string;
  created_at: string;
  student_id_prefix?: string;
  student_id_suffix?: string;
  gps_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  attendance_radius_meters?: number;
  normal_working_hours?: number;
  check_in_time?: string;
  check_out_time?: string;
  pricing_model?: {
    per_student_cost: number;
    lms_cost?: number;
    lap_setup_cost: number;
    monthly_recurring_cost: number;
    trainer_monthly_fee: number;
  };
}

// Inventory Summary type (kept for backward compatibility)
export interface InventorySummary {
  institution_id: string;
  institution_name: string;
  total_items: number;
  missing_items: number;
  damaged_items: number;
  last_audit_date: string;
  value: number;
  status: 'good' | 'needs_review' | 'critical';
  categories: {
    technology: { count: number; value: number };
    tools: { count: number; value: number };
    furniture: { count: number; value: number };
    equipment: { count: number; value: number };
    consumables: { count: number; value: number };
    other: { count: number; value: number };
  };
}

interface InstitutionDataContextType {
  institutions: Institution[];
  isLoading: boolean;
  inventorySummaries: Record<string, InventorySummary>;
  addInstitution: (institution: Institution) => void;
  updateInstitution: (id: string, updates: Partial<Institution>) => void;
  updateInventorySummary: (institutionId: string, summary: InventorySummary) => void;
}

const InstitutionDataContext = createContext<InstitutionDataContextType | undefined>(undefined);

export const InstitutionDataProvider = ({ children }: { children: ReactNode }) => {
  const { 
    institutions: dbInstitutions, 
    isLoading,
    createInstitution,
    updateInstitution: updateDbInstitution 
  } = useInstitutions();
  
  // Transform DB institutions to match the expected format
  const institutions = dbInstitutions as Institution[];

  // Initialize empty inventory summaries (will be populated from real data later)
  const [inventorySummaries, setInventorySummaries] = React.useState<Record<string, InventorySummary>>({});

  const addInstitution = async (institution: Institution) => {
    // This now just calls the DB create - the form data transformation happens in the hook
    console.log('addInstitution called - use createInstitution from useInstitutions hook directly');
  };

  const updateInstitution = async (id: string, updates: Partial<Institution>) => {
    try {
      await updateDbInstitution({ id, updates });
    } catch (error) {
      console.error('Failed to update institution:', error);
    }
  };

  const updateInventorySummary = (institutionId: string, summary: InventorySummary) => {
    setInventorySummaries((prev) => ({
      ...prev,
      [institutionId]: summary,
    }));
  };

  return (
    <InstitutionDataContext.Provider
      value={{
        institutions,
        isLoading,
        inventorySummaries,
        addInstitution,
        updateInstitution,
        updateInventorySummary,
      }}
    >
      {children}
    </InstitutionDataContext.Provider>
  );
};

export const useInstitutionData = () => {
  const context = useContext(InstitutionDataContext);
  if (context === undefined) {
    throw new Error('useInstitutionData must be used within an InstitutionDataProvider');
  }
  return context;
};
