import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  IndianRupee,
  Save,
  Calculator,
  User,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { downloadFile } from '@/utils/downloadFile';

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  status: string | null;
  profile_photo_url: string | null;
  position_id: string | null;
  position_name: string | null;
  hourly_rate: number | null;
  overtime_rate_multiplier: number | null;
  join_date: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  casual_leave_allowance: number | null;
  sick_leave_allowance: number | null;
  annual_leave_allowance: number | null;
  salary_structure: any;
  statutory_info: any;
}

interface StaffDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size_mb: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string | null;
}

const documentTypes = [
  { value: 'id_proof', label: 'ID Proof (Aadhar/PAN)' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'education', label: 'Education Certificate' },
  { value: 'experience', label: 'Experience Certificate' },
  { value: 'resume', label: 'Resume/CV' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'contract', label: 'Employment Contract' },
  { value: 'bank_details', label: 'Bank Details' },
  { value: 'photo', label: 'Passport Photo' },
  { value: 'other', label: 'Other' },
];

export default function MetaStaffDetail() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<StaffProfile>>({});

  // Document upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: '',
    document_name: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (staffId) {
      fetchProfile();
      fetchDocuments();
    }
  }, [staffId]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', staffId)
        .single();

      if (error) throw error;

      // Fetch position name separately using raw query to avoid type issues
      let positionName = 'Unknown Position';
      if (data.position_id) {
        const { data: posData } = await supabase
          .from('positions')
          .select('display_name')
          .eq('id', data.position_id)
          .maybeSingle();
        if (posData) positionName = (posData as any).display_name || 'Unknown Position';
      }

      const profileData: StaffProfile = {
        ...data,
        position_name: positionName,
      };

      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      navigate('/system-admin/position-management');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSave = async () => {
    if (!staffId || !formData) return;

    try {
      setIsSaving(true);

      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        employee_id: formData.employee_id,
        designation: formData.designation,
        department: formData.department,
        status: formData.status,
        join_date: formData.join_date,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc,
        bank_branch: formData.bank_branch,
        casual_leave_allowance: formData.casual_leave_allowance,
        sick_leave_allowance: formData.sick_leave_allowance,
        annual_leave_allowance: formData.annual_leave_allowance,
        hourly_rate: formData.hourly_rate,
        overtime_rate_multiplier: formData.overtime_rate_multiplier,
        salary_structure: formData.salary_structure,
        statutory_info: formData.statutory_info,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', staffId);

      if (error) throw error;

      setProfile({ ...profile!, ...updateData });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !staffId) return;

    try {
      toast.loading('Uploading photo...', { id: 'photo' });

      const filePath = `${staffId}/profile_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('staff-documents')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: urlData.publicUrl })
        .eq('id', staffId);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, profile_photo_url: urlData.publicUrl } : null));
      setFormData((prev) => ({ ...prev, profile_photo_url: urlData.publicUrl }));
      toast.success('Photo updated successfully', { id: 'photo' });
    } catch (error) {
      toast.error('Failed to upload photo', { id: 'photo' });
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadData.file || !uploadData.document_type || !uploadData.document_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      toast.loading('Uploading document...', { id: 'upload' });

      const filePath = `${staffId}/${Date.now()}_${uploadData.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('staff-documents')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('staff_documents')
        .insert({
          staff_id: staffId,
          document_type: uploadData.document_type,
          document_name: uploadData.document_name,
          file_url: urlData.publicUrl,
          file_size_mb: uploadData.file.size / (1024 * 1024),
          file_type: uploadData.file.type.split('/')[1],
          description: uploadData.description,
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setIsUploadOpen(false);
      setUploadData({ document_type: '', document_name: '', description: '', file: null });
      toast.success('Document uploaded successfully', { id: 'upload' });
    } catch (error) {
      toast.error('Failed to upload document', { id: 'upload' });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      toast.loading('Deleting document...', { id: 'delete' });

      const { error } = await supabase
        .from('staff_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setDocuments(documents.filter((d) => d.id !== docId));
      toast.success('Document deleted', { id: 'delete' });
    } catch (error) {
      toast.error('Failed to delete document', { id: 'delete' });
    }
  };

  const calculateSalary = () => {
    const annualSalary = formData.salary_structure?.annual_ctc || 0;
    if (annualSalary <= 0) {
      toast.error('Please enter annual CTC first');
      return;
    }

    const monthly = annualSalary / 12;
    const basic = monthly * 0.5;
    const hra = monthly * 0.2;
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, monthly - basic - hra - conveyance - medical);
    const hourlyRate = monthly / 22 / 8;

    setFormData((prev) => ({
      ...prev,
      hourly_rate: Math.round(hourlyRate * 100) / 100,
      salary_structure: {
        ...prev.salary_structure,
        annual_ctc: annualSalary,
        basic_pay: Math.round(basic * 100) / 100,
        hra: Math.round(hra * 100) / 100,
        transport_allowance: conveyance,
        medical_allowance: medical,
        special_allowance: Math.round(special * 100) / 100,
        da: 0,
      },
    }));
    toast.success('Salary breakdown calculated');
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      on_leave: { variant: 'secondary', label: 'On Leave' },
      terminated: { variant: 'destructive', label: 'Terminated' },
    };
    const config = statusMap[status || 'active'] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Staff member not found</p>
          <Button onClick={() => navigate('/system-admin/position-management')} className="mt-4">
            Back to RBAC Management
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/system-admin/position-management')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">{profile.position_name}</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Photo */}
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile_photo_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.position_name}</span>
                </div>
                {profile.join_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(profile.join_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div>{getStatusBadge(profile.status)}</div>
                {profile.employee_id && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">ID: {profile.employee_id}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    {isEditing ? (
                      <Input
                        value={formData.employee_id || ''}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        placeholder="e.g., EMP001"
                      />
                    ) : (
                      <p className="text-sm mt-1 font-mono">{profile.employee_id || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Designation</Label>
                    {isEditing ? (
                      <Input
                        value={formData.designation || ''}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g., Senior Manager"
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.designation || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Department</Label>
                    {isEditing ? (
                      <Input
                        value={formData.department || ''}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g., Operations"
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.department || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Phone</Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.phone || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">
                        {profile.date_of_birth
                          ? new Date(profile.date_of_birth).toLocaleDateString()
                          : '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Status</Label>
                    {isEditing ? (
                      <Select
                        value={formData.status || 'active'}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">{getStatusBadge(profile.status)}</div>
                    )}
                  </div>
                  <div>
                    <Label>Join Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.join_date || ''}
                        onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">
                        {profile.join_date
                          ? new Date(profile.join_date).toLocaleDateString()
                          : '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Check-in Time</Label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={formData.check_in_time || '09:00'}
                        onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.check_in_time || '09:00'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Check-out Time</Label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={formData.check_out_time || '17:00'}
                        onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.check_out_time || '17:00'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm mt-1">{profile.address || '-'}</p>
                  )}
                </div>

                <Separator />

                <h4 className="font-medium">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.emergency_contact_name || ''}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.emergency_contact_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    {isEditing ? (
                      <Input
                        value={formData.emergency_contact_phone || ''}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.emergency_contact_phone || '-'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Banking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Bank Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.bank_name || ''}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.bank_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.bank_account_number || ''}
                        onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1 font-mono">{profile.bank_account_number || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    {isEditing ? (
                      <Input
                        value={formData.bank_ifsc || ''}
                        onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1 font-mono">{profile.bank_ifsc || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Branch</Label>
                    {isEditing ? (
                      <Input
                        value={formData.bank_branch || ''}
                        onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.bank_branch || '-'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Documents</h3>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.document_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {documentTypes.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                          </p>
                          {doc.file_size_mb && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {doc.file_size_mb.toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadFile(doc.file_url, doc.document_name)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            {/* Salary Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Salary Configuration
                  </CardTitle>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={calculateSalary}>
                      <Calculator className="h-4 w-4 mr-1" />
                      Auto Calculate
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Annual CTC (₹)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.salary_structure?.annual_ctc || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salary_structure: {
                              ...formData.salary_structure,
                              annual_ctc: Number(e.target.value),
                            },
                          })
                        }
                        placeholder="e.g., 600000"
                      />
                    ) : (
                      <p className="text-sm mt-1">
                        ₹{(profile.salary_structure?.annual_ctc || 0).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Hourly Rate (₹)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate || ''}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                      />
                    ) : (
                      <p className="text-sm mt-1">₹{profile.hourly_rate || 0}/hr</p>
                    )}
                  </div>
                  <div>
                    <Label>Overtime Multiplier</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.overtime_rate_multiplier || 1.5}
                        onChange={(e) =>
                          setFormData({ ...formData, overtime_rate_multiplier: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.overtime_rate_multiplier || 1.5}x</p>
                    )}
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Salary Breakdown (Monthly)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['basic_pay', 'hra', 'transport_allowance', 'medical_allowance', 'special_allowance', 'da'].map(
                      (field) => (
                        <div key={field}>
                          <Label className="text-xs capitalize">{field.replace(/_/g, ' ')}</Label>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.salary_structure?.[field] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  salary_structure: {
                                    ...formData.salary_structure,
                                    [field]: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          ) : (
                            <p className="text-sm mt-1">
                              ₹{(profile.salary_structure?.[field] || 0).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Allowances */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leave Allowances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Casual Leave (days/year)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.casual_leave_allowance ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, casual_leave_allowance: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.casual_leave_allowance ?? 12} days</p>
                    )}
                  </div>
                  <div>
                    <Label>Sick Leave (days/year)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.sick_leave_allowance ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, sick_leave_allowance: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.sick_leave_allowance ?? 10} days</p>
                    )}
                  </div>
                  <div>
                    <Label>Annual Leave (days/year)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.annual_leave_allowance ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, annual_leave_allowance: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.annual_leave_allowance ?? 22} days</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statutory Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Statutory Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Checkbox
                        checked={formData.statutory_info?.pf_applicable ?? true}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            statutory_info: { ...formData.statutory_info, pf_applicable: checked },
                          })
                        }
                      />
                    ) : (
                      <Badge variant={profile.statutory_info?.pf_applicable ? 'default' : 'secondary'}>
                        {profile.statutory_info?.pf_applicable ? 'Yes' : 'No'}
                      </Badge>
                    )}
                    <Label>PF Applicable</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Checkbox
                        checked={formData.statutory_info?.esi_applicable ?? false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            statutory_info: { ...formData.statutory_info, esi_applicable: checked },
                          })
                        }
                      />
                    ) : (
                      <Badge variant={profile.statutory_info?.esi_applicable ? 'default' : 'secondary'}>
                        {profile.statutory_info?.esi_applicable ? 'Yes' : 'No'}
                      </Badge>
                    )}
                    <Label>ESI Applicable</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Checkbox
                        checked={formData.statutory_info?.pt_applicable ?? true}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            statutory_info: { ...formData.statutory_info, pt_applicable: checked },
                          })
                        }
                      />
                    ) : (
                      <Badge variant={profile.statutory_info?.pt_applicable ? 'default' : 'secondary'}>
                        {profile.statutory_info?.pt_applicable ? 'Yes' : 'No'}
                      </Badge>
                    )}
                    <Label>PT Applicable</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>PAN Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.statutory_info?.pan_number || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            statutory_info: { ...formData.statutory_info, pan_number: e.target.value },
                          })
                        }
                        placeholder="e.g., ABCDE1234F"
                      />
                    ) : (
                      <p className="text-sm mt-1 font-mono">{profile.statutory_info?.pan_number || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>UAN Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.statutory_info?.uan_number || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            statutory_info: { ...formData.statutory_info, uan_number: e.target.value },
                          })
                        }
                        placeholder="UAN Number"
                      />
                    ) : (
                      <p className="text-sm mt-1 font-mono">{profile.statutory_info?.uan_number || '-'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Type *</Label>
              <Select
                value={uploadData.document_type}
                onValueChange={(value) => setUploadData({ ...uploadData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Name *</Label>
              <Input
                value={uploadData.document_name}
                onChange={(e) => setUploadData({ ...uploadData, document_name: e.target.value })}
                placeholder="e.g., Aadhar Card"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div>
              <Label>File *</Label>
              <Input
                type="file"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDocumentUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
