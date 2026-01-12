import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserCheck, Calendar, Mail, Phone, Briefcase, Loader2, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { OfficerDetailsDialog } from "@/components/officer/OfficerDetailsDialog";
import { OfficersOnLeaveSection } from "@/components/management/OfficersOnLeaveSection";
import { useCurrentUserInstitutionDetails } from "@/hooks/useCurrentUserInstitution";
import { useOfficersByInstitution } from "@/hooks/useInstitutionOfficers";
import { useOfficer } from "@/hooks/useOfficers";
import { useOfficerTeachingHours } from "@/hooks/useOfficerTeachingHours";
import { useStudents } from "@/hooks/useStudents";
import { useOfficersOnLeave } from "@/hooks/useOfficersOnLeave";
import { useMonthlySessionsCount } from "@/hooks/useMonthlySessionsCount";
import { OfficerDetails } from "@/services/systemadmin.service";

const Officers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { institution, institutionId, isLoading: isLoadingInstitution } = useCurrentUserInstitutionDetails();
  const { officers, isLoading: isLoadingOfficers } = useOfficersByInstitution(institutionId || undefined);
  const { data: selectedOfficerDetails } = useOfficer(selectedOfficerId || '');
  const { data: teachingHoursMap = {} } = useOfficerTeachingHours(institutionId || undefined);
  const { students } = useStudents(institutionId || undefined);
  const { data: officersOnLeave = [], isLoading: isLoadingLeaves } = useOfficersOnLeave(institutionId || undefined);
  const { data: monthlySessionsCount = 0, isLoading: isLoadingMonthlySessions } = useMonthlySessionsCount(institutionId || undefined);

  const filteredOfficers = useMemo(() => {
    if (!searchQuery) return officers;
    const query = searchQuery.toLowerCase();
    return officers.filter((officer) =>
      officer.officer_name.toLowerCase().includes(query) ||
      officer.email.toLowerCase().includes(query) ||
      (officer.employee_id && officer.employee_id.toLowerCase().includes(query))
    );
  }, [officers, searchQuery]);

  const totalOfficers = officers.length;
  const activeOfficers = officers.filter(o => o.status === 'active').length;
  const totalStudents = students.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on_leave': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'secondary';
    }
  };

  const handleViewDetails = (officerId: string) => {
    setSelectedOfficerId(officerId);
    setDetailsDialogOpen(true);
  };

  const isLoading = isLoadingInstitution || isLoadingOfficers;
  const institutionSettings = institution?.settings as Record<string, any> || {};
  const institutionAddress = institution?.address as Record<string, any> || {};

  // Transform selected officer to OfficerDetails type
  const transformedOfficer: OfficerDetails | null = selectedOfficerDetails ? {
    id: selectedOfficerDetails.id,
    name: selectedOfficerDetails.full_name,
    email: selectedOfficerDetails.email,
    phone: selectedOfficerDetails.phone || '',
    assigned_institutions: selectedOfficerDetails.assigned_institutions || [],
    employment_type: selectedOfficerDetails.employment_type as any,
    salary: selectedOfficerDetails.annual_salary,
    join_date: selectedOfficerDetails.join_date || '',
    status: selectedOfficerDetails.status as any,
    date_of_birth: selectedOfficerDetails.date_of_birth || '',
    address: selectedOfficerDetails.address || '',
    emergency_contact_name: selectedOfficerDetails.emergency_contact_name || '',
    emergency_contact_phone: selectedOfficerDetails.emergency_contact_phone || '',
    employee_id: selectedOfficerDetails.employee_id || '',
    hourly_rate: selectedOfficerDetails.hourly_rate || 0,
    overtime_rate_multiplier: selectedOfficerDetails.overtime_rate_multiplier || 1.5,
    normal_working_hours: selectedOfficerDetails.normal_working_hours || 8,
    bank_account_number: selectedOfficerDetails.bank_account_number || '',
    bank_name: selectedOfficerDetails.bank_name || '',
    bank_ifsc: selectedOfficerDetails.bank_ifsc || '',
    bank_branch: selectedOfficerDetails.bank_branch || '',
    qualifications: Array.isArray(selectedOfficerDetails.qualifications) ? selectedOfficerDetails.qualifications.map(q => typeof q === 'string' ? q : '') : [],
    certifications: Array.isArray(selectedOfficerDetails.certifications) ? selectedOfficerDetails.certifications.map(c => typeof c === 'string' ? c : '') : [],
    skills: Array.isArray(selectedOfficerDetails.skills) ? selectedOfficerDetails.skills.map((s: any) => typeof s === 'string' ? s : s.name || '') : [],
    profile_photo_url: selectedOfficerDetails.profile_photo_url || undefined,
    statutory_info: {
      pf_applicable: (selectedOfficerDetails.statutory_info as any)?.pf_applicable || false,
      esi_applicable: (selectedOfficerDetails.statutory_info as any)?.esi_applicable || false,
      pt_applicable: (selectedOfficerDetails.statutory_info as any)?.pt_applicable || false,
    },
    salary_structure: {
      basic_pay: (selectedOfficerDetails.salary_structure as any)?.basic_pay || 0,
      hra: (selectedOfficerDetails.salary_structure as any)?.hra || 0,
      da: (selectedOfficerDetails.salary_structure as any)?.da || 0,
      transport_allowance: (selectedOfficerDetails.salary_structure as any)?.transport_allowance || 0,
      special_allowance: (selectedOfficerDetails.salary_structure as any)?.special_allowance || 0,
      medical_allowance: (selectedOfficerDetails.salary_structure as any)?.medical_allowance || 0,
    },
  } : null;

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institutionSettings.established_year || new Date().getFullYear()}
            location={institutionAddress.location || ''}
            totalStudents={totalStudents}
            academicYear={institutionSettings.academic_year || '2024-25'}
            userRole="Management Portal"
            assignedOfficers={officers.map(o => o.officer_name)}
          />
        )}
        
        <div>
          <h1 className="text-3xl font-bold">Innovation Officers</h1>
          <p className="text-muted-foreground">View assigned innovation officers and their activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Officers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : totalOfficers}</div>
              <p className="text-xs text-muted-foreground">Assigned to your institution</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : activeOfficers}</div>
              <p className="text-xs text-muted-foreground">{totalOfficers > 0 ? ((activeOfficers / totalOfficers) * 100).toFixed(0) : 0}% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoadingMonthlySessions ? '-' : monthlySessionsCount}</div>
              <p className="text-xs text-muted-foreground">Sessions conducted</p>
            </CardContent>
          </Card>
        </div>

        <OfficersOnLeaveSection leaves={officersOnLeave} isLoading={isLoadingLeaves} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assigned Officers</CardTitle>
                <CardDescription>{isLoading ? 'Loading...' : `${filteredOfficers.length} officers found`}</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search officers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading officers...</span>
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No officers found</p>
                <p className="text-muted-foreground">{officers.length === 0 ? 'No innovation officers have been assigned to your institution yet.' : 'No officers match your search criteria.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOfficers.map((officer) => (
                  <Card key={officer.officer_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={officer.avatar} alt={officer.officer_name} />
                            <AvatarFallback className="text-lg">{officer.officer_name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{officer.officer_name}</h3>
                                <Badge variant={getStatusBadge(officer.status)}>{officer.status.replace('_', ' ')}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />{officer.employee_id || 'No Employee ID'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-4 w-4" /><span>{officer.email}</span></div>
                              {officer.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-4 w-4" /><span>{officer.phone}</span></div>}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-green-500" />
                              <span className="text-muted-foreground">{teachingHoursMap[officer.officer_id] || 0}h Teaching</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(officer.officer_id)}>View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OfficerDetailsDialog officer={transformedOfficer} open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} viewerRole="management" />
    </Layout>
  );
};

export default Officers;
