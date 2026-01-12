import { useQuery } from '@tanstack/react-query';
import { credentialService } from '@/services/credentialService';

export function useMetaEmployees() {
  return useQuery({
    queryKey: ['credential-meta-employees'],
    queryFn: () => credentialService.fetchMetaEmployees(),
    staleTime: 30000, // 30 seconds
  });
}

export function useOfficers() {
  return useQuery({
    queryKey: ['credential-officers'],
    queryFn: () => credentialService.fetchOfficers(),
    staleTime: 30000,
  });
}

export function useInstitutionsWithAdmins() {
  return useQuery({
    queryKey: ['credential-institutions-with-admins'],
    queryFn: () => credentialService.fetchInstitutionsWithAdmins(),
    staleTime: 30000,
  });
}

export function useStudentsByInstitution(institutionId: string | null) {
  return useQuery({
    queryKey: ['credential-students', institutionId],
    queryFn: () => credentialService.fetchStudentsByInstitution(institutionId!),
    enabled: !!institutionId,
    staleTime: 30000,
  });
}

export function useInstitutionsList() {
  return useQuery({
    queryKey: ['institutions-list'],
    queryFn: () => credentialService.fetchInstitutionsList(),
    staleTime: 60000, // 1 minute
  });
}
