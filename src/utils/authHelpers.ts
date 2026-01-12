export function canUploadStudents(userRole: string, userInstitutionId?: string, targetInstitutionId?: string): boolean {
  // System Admin can upload to any institution
  if (userRole === 'system_admin') {
    return true;
  }

  // Management can upload to their own institution
  if (userRole === 'management' && userInstitutionId && targetInstitutionId) {
    return userInstitutionId === targetInstitutionId;
  }

  return false;
}

export function canManageInstitution(userRole: string): boolean {
  return ['system_admin', 'management'].includes(userRole);
}
