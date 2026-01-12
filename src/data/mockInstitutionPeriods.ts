// This file is deprecated - data now comes from database
// Keeping exports for backward compatibility with existing imports

import { PeriodConfig } from '@/types/institution';

// Empty mock data - use database via useInstitutionPeriods hook instead
export const mockInstitutionPeriods: Record<string, PeriodConfig[]> = {};

// Deprecated functions - data should come from database hooks
export function loadInstitutionPeriods(): Record<string, PeriodConfig[]> {
  console.warn('loadInstitutionPeriods is deprecated. Use useInstitutionPeriods hook instead.');
  return {};
}

export function saveInstitutionPeriods(periods: Record<string, PeriodConfig[]>): void {
  console.warn('saveInstitutionPeriods is deprecated. Use useInstitutionPeriods hook mutations instead.');
}

export function getInstitutionPeriods(institutionId: string): PeriodConfig[] {
  console.warn('getInstitutionPeriods is deprecated. Use useInstitutionPeriods hook instead.');
  return [];
}

export function saveInstitutionPeriodsForInstitution(institutionId: string, periodConfigs: PeriodConfig[]): void {
  console.warn('saveInstitutionPeriodsForInstitution is deprecated. Use useInstitutionPeriods hook mutations instead.');
}

export function addPeriod(institutionId: string, period: PeriodConfig): void {
  console.warn('addPeriod is deprecated. Use useInstitutionPeriods hook mutations instead.');
}

export function updatePeriod(institutionId: string, periodId: string, updates: Partial<PeriodConfig>): void {
  console.warn('updatePeriod is deprecated. Use useInstitutionPeriods hook mutations instead.');
}

export function deletePeriod(institutionId: string, periodId: string): void {
  console.warn('deletePeriod is deprecated. Use useInstitutionPeriods hook mutations instead.');
}
