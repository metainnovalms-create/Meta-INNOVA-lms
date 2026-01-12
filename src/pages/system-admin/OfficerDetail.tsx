import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Camera,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Clock,
  UserCheck,
  IndianRupee,
} from 'lucide-react';
import { OfficerDetails, OfficerDocument, OfficerActivityLog } from '@/services/systemadmin.service';
import DocumentUploadDialog from '@/components/officer/DocumentUploadDialog';
import EditOfficerDialog from '@/components/officer/EditOfficerDialog';
import DocumentCard from '@/components/officer/DocumentCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Officer } from '@/hooks/useOfficers';
import { useOfficer, useUpdateOfficer } from '@/hooks/useOfficers';
import { supabase } from '@/integrations/supabase/client';
import { downloadFile } from '@/utils/downloadFile';
import { useInstitutions } from '@/hooks/useInstitutions';

// Leave balance type for officer
interface OfficerLeaveBalance {
  sick_leave: number;
  casual_leave: number;
  annual_leave: number;
}

// Mock activity log
const mockActivityLog: OfficerActivityLog[] = [
  {
    id: '1',
    officer_id: '1',
    action_type: 'profile_update',
    action_description: 'Updated contact information',
    performed_by: 'Admin',
    performed_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    officer_id: '1',
    action_type: 'assignment',
    action_description: 'Assigned to River College',
    performed_by: 'System Admin',
    performed_at: '2024-01-10T14:20:00Z',
  },
  {
    id: '3',
    officer_id: '1',
    action_type: 'document_upload',
    action_description: 'Uploaded MBA Certificate',
    performed_by: 'John Smith',
    performed_at: '2024-01-05T09:15:00Z',
  },
];

// Convert database Officer to OfficerDetails format
function mapOfficerToDetails(officer: Officer): OfficerDetails {
  return {
    id: officer.id,
    name: officer.full_name,
    email: officer.email,
    phone: officer.phone || '',
    assigned_institutions: officer.assigned_institutions || [],
    employment_type: officer.employment_type as 'full_time' | 'part_time' | 'contract',
    salary: officer.annual_salary,
    join_date: officer.join_date || new Date().toISOString().split('T')[0],
    status: officer.status as 'active' | 'on_leave' | 'terminated',
    date_of_birth: officer.date_of_birth || '',
    address: officer.address || '',
    emergency_contact_name: officer.emergency_contact_name || '',
    emergency_contact_phone: officer.emergency_contact_phone || '',
    employee_id: officer.employee_id || '',
    department: officer.department || 'Innovation & STEM Education',
    bank_account_number: officer.bank_account_number || '',
    bank_name: officer.bank_name || '',
    bank_ifsc: officer.bank_ifsc || '',
    bank_branch: officer.bank_branch || '',
    hourly_rate: officer.hourly_rate || 0,
    overtime_rate_multiplier: officer.overtime_rate_multiplier || 1.5,
    normal_working_hours: officer.normal_working_hours || 8,
    statutory_info: {
      pf_applicable: true,
      esi_applicable: false,
      pt_applicable: true,
      ...officer.statutory_info,
    },
    salary_structure: {
      basic_pay: 0,
      hra: 0,
      da: 0,
      transport_allowance: 0,
      special_allowance: 0,
      medical_allowance: 0,
      ...officer.salary_structure,
    },
    qualifications: officer.qualifications || [],
    certifications: officer.certifications || [],
    skills: officer.skills || [],
    profile_photo_url: officer.profile_photo_url || '',
  };
}

// Get leave balance from officer database fields
function getOfficerLeaveBalance(officer: Officer): OfficerLeaveBalance {
  return {
    sick_leave: officer.sick_leave_allowance ?? 10,
    casual_leave: officer.casual_leave_allowance ?? 12,
    annual_leave: officer.annual_leave_allowance ?? 22,
  };
}

export default function OfficerDetail() {
  const { officerId } = useParams<{ officerId: string }>();
  const navigate = useNavigate();
  
  // Fetch officer from database
  const { data: officerData, isLoading, error } = useOfficer(officerId || '');
  const updateOfficer = useUpdateOfficer();
  
  // Fetch institutions for assignments
  const { institutions = [] } = useInstitutions();
  
  // Helper to get institution name from ID
  const getInstitutionName = (institutionId: string) => {
    const institution = institutions.find(i => i.id === institutionId);
    return institution?.name || institutionId;
  };
  
  const [officer, setOfficer] = useState<OfficerDetails | null>(null);
  const [documents, setDocuments] = useState<OfficerDocument[]>([]);
  const [activityLog, setActivityLog] = useState<OfficerActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [isAssignInstitutionOpen, setIsAssignInstitutionOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [leaveBalance, setLeaveBalance] = useState<OfficerLeaveBalance | null>(null);

  // Fetch documents from database
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!officerId) return;
      
      const { data: docs, error } = await supabase
        .from('officer_documents')
        .select('*')
        .eq('officer_id', officerId);
      
      if (!error && docs) {
        const mappedDocs: OfficerDocument[] = docs.map(doc => ({
          id: doc.id,
          officer_id: doc.officer_id,
          document_type: doc.document_type as any,
          document_name: doc.document_name,
          file_url: doc.file_url,
          file_size_mb: doc.file_size_mb || 0,
          file_type: doc.file_type || '',
          uploaded_by: doc.uploaded_by || '',
          uploaded_date: doc.created_at?.split('T')[0] || '',
          description: doc.description || '',
        }));
        setDocuments(mappedDocs);
      }
    };
    
    fetchDocuments();
  }, [officerId]);

  // Map officer data when loaded
  useEffect(() => {
    if (officerData) {
      setOfficer(mapOfficerToDetails(officerData));
      setActivityLog(mockActivityLog);
      
      // Get leave balance from database fields
      setLeaveBalance(getOfficerLeaveBalance(officerData));
    }
  }, [officerData, officerId]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast.error('Officer not found');
      navigate('/system-admin/officers');
    }
  }, [error, navigate]);

  const handleProfileUpdate = async (updatedData: Partial<OfficerDetails> & { casual_leave?: number; sick_leave?: number }) => {
    if (!officerId || !officerData) return;
    
    try {
      toast.loading('Updating profile...', { id: 'update' });
      
      const { casual_leave, sick_leave, ...officerDetailsData } = updatedData;
      
      // Map OfficerDetails fields back to database Officer fields
      const updatePayload: Partial<Officer> = {};
      if (officerDetailsData.name) updatePayload.full_name = officerDetailsData.name;
      if (officerDetailsData.email) updatePayload.email = officerDetailsData.email;
      if (officerDetailsData.phone !== undefined) updatePayload.phone = officerDetailsData.phone || null;
      if (officerDetailsData.address !== undefined) updatePayload.address = officerDetailsData.address || null;
      if (officerDetailsData.date_of_birth) updatePayload.date_of_birth = officerDetailsData.date_of_birth;
      if (officerDetailsData.emergency_contact_name !== undefined) updatePayload.emergency_contact_name = officerDetailsData.emergency_contact_name || null;
      if (officerDetailsData.emergency_contact_phone !== undefined) updatePayload.emergency_contact_phone = officerDetailsData.emergency_contact_phone || null;
      if (officerDetailsData.bank_name !== undefined) updatePayload.bank_name = officerDetailsData.bank_name || null;
      if (officerDetailsData.bank_account_number !== undefined) updatePayload.bank_account_number = officerDetailsData.bank_account_number || null;
      if (officerDetailsData.bank_ifsc !== undefined) updatePayload.bank_ifsc = officerDetailsData.bank_ifsc || null;
      if (officerDetailsData.bank_branch !== undefined) updatePayload.bank_branch = officerDetailsData.bank_branch || null;
      if (officerDetailsData.salary !== undefined) updatePayload.annual_salary = officerDetailsData.salary;
      if (officerDetailsData.hourly_rate !== undefined) updatePayload.hourly_rate = officerDetailsData.hourly_rate;
      if (officerDetailsData.overtime_rate_multiplier !== undefined) updatePayload.overtime_rate_multiplier = officerDetailsData.overtime_rate_multiplier;
      if (officerDetailsData.employment_type) updatePayload.employment_type = officerDetailsData.employment_type;
      if (officerDetailsData.status) updatePayload.status = officerDetailsData.status;
      if (officerDetailsData.department !== undefined) updatePayload.department = officerDetailsData.department;
      if (officerDetailsData.normal_working_hours !== undefined) updatePayload.normal_working_hours = officerDetailsData.normal_working_hours;
      if (officerDetailsData.qualifications) updatePayload.qualifications = officerDetailsData.qualifications;
      if (officerDetailsData.certifications) updatePayload.certifications = officerDetailsData.certifications;
      if (officerDetailsData.skills) updatePayload.skills = officerDetailsData.skills;
      if (officerDetailsData.statutory_info) updatePayload.statutory_info = officerDetailsData.statutory_info;
      if (officerDetailsData.salary_structure) updatePayload.salary_structure = officerDetailsData.salary_structure;
      
      // Map leave fields to database columns
      if (sick_leave !== undefined) updatePayload.sick_leave_allowance = sick_leave;
      if (casual_leave !== undefined) updatePayload.casual_leave_allowance = casual_leave;
      
      // Auto-calculate annual leave as sick + casual
      const newSickLeave = sick_leave ?? leaveBalance?.sick_leave ?? 10;
      const newCasualLeave = casual_leave ?? leaveBalance?.casual_leave ?? 12;
      updatePayload.annual_leave_allowance = newSickLeave + newCasualLeave;
      
      // Update in database
      await updateOfficer.mutateAsync({ id: officerId, data: updatePayload });
      
      // Update local state
      setOfficer(prev => prev ? { ...prev, ...officerDetailsData } : null);
      
      // Update leave balance in local state
      setLeaveBalance({
        sick_leave: newSickLeave,
        casual_leave: newCasualLeave,
        annual_leave: newSickLeave + newCasualLeave,
      });
      
      setIsEditProfileOpen(false);
      toast.success('Profile updated successfully', { id: 'update' });
    } catch (error) {
      toast.error('Failed to update profile', { id: 'update' });
    }
  };

  const handleDocumentUpload = async (
    file: File,
    documentType: string,
    documentName: string,
    description?: string
  ) => {
    if (!officerId) return;
    
    try {
      toast.loading('Uploading document...', { id: 'upload' });
      
      // Upload file to storage
      const filePath = `${officerId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('officer-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('officer-documents')
        .getPublicUrl(filePath);
      
      // Insert document record
      const { data: docData, error: docError } = await supabase
        .from('officer_documents')
        .insert({
          officer_id: officerId,
          document_type: documentType,
          document_name: documentName,
          file_url: urlData.publicUrl,
          file_size_mb: file.size / (1024 * 1024),
          file_type: file.type.split('/')[1],
          description,
        })
        .select()
        .single();
      
      if (docError) throw docError;
      
      const newDoc: OfficerDocument = {
        id: docData.id,
        officer_id: officerId,
        document_type: documentType as any,
        document_name: documentName,
        file_url: urlData.publicUrl,
        file_size_mb: file.size / (1024 * 1024),
        file_type: file.type.split('/')[1],
        uploaded_by: 'Current User',
        uploaded_date: new Date().toISOString().split('T')[0],
        description,
      };
      
      setDocuments([...documents, newDoc]);
      setIsUploadDocumentOpen(false);
      toast.success('Document uploaded successfully', { id: 'upload' });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document', { id: 'upload' });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !officerId) return;
    
    try {
      toast.loading('Uploading photo...', { id: 'photo' });
      
      // Upload to storage
      const filePath = `${officerId}/profile_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('officer-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('officer-documents')
        .getPublicUrl(filePath);
      
      // Update officer record
      await updateOfficer.mutateAsync({
        id: officerId,
        data: { profile_photo_url: urlData.publicUrl }
      });
      
      setOfficer(prev => prev ? { ...prev, profile_photo_url: urlData.publicUrl } : null);
      toast.success('Photo updated successfully', { id: 'photo' });
    } catch (error) {
      toast.error('Failed to upload photo', { id: 'photo' });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!officerId) return;
    
    try {
      toast.loading('Deleting document...', { id: 'delete' });
      
      const { error } = await supabase
        .from('officer_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      
      setDocuments(documents.filter(d => d.id !== documentId));
      toast.success('Document deleted successfully', { id: 'delete' });
    } catch (error) {
      toast.error('Failed to delete document', { id: 'delete' });
    }
  };

  const handleAddInstitution = async () => {
    if (!selectedInstitution || !officerId) {
      toast.error('Please select an institution');
      return;
    }
    
    try {
      toast.loading('Adding assignment...', { id: 'assign' });
      const institution = institutions.find(i => i.id === selectedInstitution);
      
      if (institution && officer && officerData) {
        // Store institution IDs, not names
        const newInstitutions = [...(officerData.assigned_institutions || []), institution.id];
        
        await updateOfficer.mutateAsync({
          id: officerId,
          data: { assigned_institutions: newInstitutions }
        });
        
        setOfficer({
          ...officer,
          assigned_institutions: newInstitutions,
        });
        setIsAssignInstitutionOpen(false);
        setSelectedInstitution('');
        toast.success('Institution assigned successfully', { id: 'assign' });
      }
    } catch (error) {
      toast.error('Failed to assign institution', { id: 'assign' });
    }
  };

  const handleRemoveInstitution = async (institutionName: string) => {
    if (!officerId || !officer || !officerData) return;
    
    try {
      toast.loading('Removing assignment...', { id: 'remove' });
      
      const newInstitutions = (officerData.assigned_institutions || []).filter(i => i !== institutionName);
      
      await updateOfficer.mutateAsync({
        id: officerId,
        data: { assigned_institutions: newInstitutions }
      });
      
      setOfficer({
        ...officer,
        assigned_institutions: newInstitutions,
      });
      toast.success('Institution removed successfully', { id: 'remove' });
    } catch (error) {
      toast.error('Failed to remove institution', { id: 'remove' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      on_leave: 'secondary',
      terminated: 'destructive',
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status.replace('_', ' ')}</Badge>;
  };

  const getEmploymentBadge = (type: string) => {
    return <Badge variant="outline">{type.replace('_', ' ')}</Badge>;
  };

  const openUploadDialog = (docType: string) => {
    setSelectedDocumentType(docType);
    setIsUploadDocumentOpen(true);
  };

  const getDocumentsByType = (type: string) => {
    return documents.filter(d => d.document_type === type);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!officer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Officer not found</p>
          <Button onClick={() => navigate('/system-admin/officers')} className="mt-4">
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/system-admin/officers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Officers
          </Button>
        </div>

        {/* Hero Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Profile Photo */}
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={officer.profile_photo_url} />
                  <AvatarFallback className="text-4xl">
                    {officer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="photo-upload">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 cursor-pointer"
                    asChild
                  >
                    <span>
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
              </div>

              {/* Officer Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{officer.name}</h1>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {getStatusBadge(officer.status)}
                  {getEmploymentBadge(officer.employment_type)}
                  {officer.employee_id && (
                    <Badge variant="outline">ID: {officer.employee_id}</Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Join Date</p>
                    <p className="font-semibold">{formatDate(officer.join_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Salary</p>
                    <p className="font-semibold">₹{officer.salary.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Institutions</p>
                    <p className="font-semibold">{officer.assigned_institutions.length}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditProfileOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{officer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{officer.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {officer.date_of_birth ? formatDate(officer.date_of_birth) : 'Not provided'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{officer.address || 'Address not provided'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Emergency Contact</h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Name: </span>
                      <span>{officer.emergency_contact_name || 'Not provided'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Phone: </span>
                      <span>{officer.emergency_contact_phone || 'Not provided'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Bank Details</h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Bank Name: </span>
                      <span>{officer.bank_name || 'Not provided'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Account Number: </span>
                      <span>{officer.bank_account_number || 'Not provided'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">IFSC Code: </span>
                      <span>{officer.bank_ifsc || 'Not provided'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Branch: </span>
                      <span>{officer.bank_branch || 'Not provided'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Qualifications */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Qualifications & Skills</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Qualifications</p>
                      <div className="flex flex-wrap gap-1">
                        {officer.qualifications?.length > 0 ? (
                          officer.qualifications.map((q, i) => (
                            <Badge key={i} variant="secondary">{String(q)}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No qualifications added</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {officer.certifications?.length > 0 ? (
                          officer.certifications.map((c, i) => (
                            <Badge key={i} variant="outline">{String(c)}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No certifications added</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {officer.skills?.length > 0 ? (
                          officer.skills.map((s, i) => (
                            <Badge key={i} variant="outline">{String(s)}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No skills added</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Salary Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Salary & Payroll
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Salary</span>
                      <span className="font-semibold">₹{officer.salary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span>₹{(officer.hourly_rate || 0).toLocaleString('en-IN')}/hr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overtime Rate Multiplier</span>
                      <span>{officer.overtime_rate_multiplier}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Normal Working Hours</span>
                      <span>{officer.normal_working_hours} hrs/day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Balance */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Leave Allowance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sick Leave</span>
                      <span>{officerData?.sick_leave_allowance || 10} days/year</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Casual Leave</span>
                      <span>{officerData?.casual_leave_allowance || 12} days/year</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground font-medium">Annual Leave (Total)</span>
                      <span className="font-semibold">{officerData?.annual_leave_allowance || 22} days/year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statutory Info */}
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Statutory Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">PF Number</span>
                      <p>{officer.statutory_info?.pf_number || 'Not provided'}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">UAN Number</span>
                      <p>{officer.statutory_info?.uan_number || 'Not provided'}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">PAN Number</span>
                      <p>{officer.statutory_info?.pan_number || 'Not provided'}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">PT Registration</span>
                      <p>{officer.statutory_info?.pt_registration || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openUploadDialog('other')}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Appointment Letter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Appointment Letter</h4>
                    <Button size="sm" variant="outline" onClick={() => openUploadDialog('appointment_letter')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {getDocumentsByType('appointment_letter').length > 0 ? (
                    <div className="space-y-2">
                      {getDocumentsByType('appointment_letter').map(doc => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDownload={() => downloadFile(doc.file_url, doc.document_name)}
                          onDelete={() => handleDeleteDocument(doc.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No appointment letter uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Certificates */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Certificates</h4>
                    <Button size="sm" variant="outline" onClick={() => openUploadDialog('certificate')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {getDocumentsByType('certificate').length > 0 ? (
                    <div className="space-y-2">
                      {getDocumentsByType('certificate').map(doc => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDownload={() => downloadFile(doc.file_url, doc.document_name)}
                          onDelete={() => handleDeleteDocument(doc.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No certificates uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* ID Cards */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">ID Cards</h4>
                    <Button size="sm" variant="outline" onClick={() => openUploadDialog('id_card')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {getDocumentsByType('id_card').length > 0 ? (
                    <div className="space-y-2">
                      {getDocumentsByType('id_card').map(doc => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDownload={() => downloadFile(doc.file_url, doc.document_name)}
                          onDelete={() => handleDeleteDocument(doc.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No ID cards uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Other Documents */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Other Documents</h4>
                    <Button size="sm" variant="outline" onClick={() => openUploadDialog('other')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {getDocumentsByType('other').length > 0 || getDocumentsByType('contract').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[...getDocumentsByType('other'), ...getDocumentsByType('contract')].map(doc => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDownload={() => downloadFile(doc.file_url, doc.document_name)}
                          onDelete={() => handleDeleteDocument(doc.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No other documents uploaded</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Institution Assignments</h3>
              <Button onClick={() => setIsAssignInstitutionOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Institution
              </Button>
            </div>

            {officer.assigned_institutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {officer.assigned_institutions.map((instId, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{getInstitutionName(instId)}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveInstitution(instId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No institutions assigned yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </h3>
                {activityLog.length > 0 ? (
                  <div className="space-y-4">
                    {activityLog.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.action_description}</p>
                          <p className="text-xs text-muted-foreground">
                            by {log.performed_by} • {formatDate(log.performed_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No activity recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <EditOfficerDialog
          isOpen={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          officer={officer}
          leaveBalance={leaveBalance}
          onSaveSuccess={handleProfileUpdate}
        />

        {/* Upload Document Dialog */}
        <DocumentUploadDialog
          isOpen={isUploadDocumentOpen}
          onOpenChange={setIsUploadDocumentOpen}
          officerId={officerId || ''}
          documentType={selectedDocumentType}
          onUploadSuccess={handleDocumentUpload}
        />

        {/* Assign Institution Dialog */}
        <Dialog open={isAssignInstitutionOpen} onOpenChange={setIsAssignInstitutionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Institution</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Select Institution</Label>
                <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions
                      .filter(inst => !officer.assigned_institutions.includes(inst.id))
                      .map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddInstitution} className="w-full">
                Assign Institution
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
