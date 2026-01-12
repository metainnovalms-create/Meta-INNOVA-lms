// This file is deprecated - data now comes from database
// Keeping exports for backward compatibility with existing imports

export interface InstitutionDetails {
  id: string;
  name: string;
  code: string;
  slug: string;
  type: 'school' | 'college' | 'university';
  established_year: string;
  location: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  total_students: number;
  total_faculty: number;
  total_departments: number;
  academic_year: string;
  status: 'active' | 'inactive';
  logo_url?: string;
  assigned_officers: {
    officer_id: string;
    officer_name: string;
  }[];
}

// Empty mock data - use database via useInstitutions hook instead
export const mockInstitutions: Record<string, InstitutionDetails> = {};

export const getInstitutionBySlug = (slug: string): InstitutionDetails | undefined => {
  // This is now deprecated - use useInstitutions hook and filter by slug
  console.warn('getInstitutionBySlug is deprecated. Use useInstitutions hook instead.');
  return undefined;
};

export const getInstitutionById = (id: string): InstitutionDetails | undefined => {
  // This is now deprecated - use useInstitutions hook and filter by id
  console.warn('getInstitutionById is deprecated. Use useInstitutions hook instead.');
  return undefined;
};
