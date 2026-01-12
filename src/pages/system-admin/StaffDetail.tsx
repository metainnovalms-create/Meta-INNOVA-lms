/**
 * Staff Detail Page
 * View and edit staff profile, salary structure, statutory information, banking, and leave allowances
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  IndianRupee,
  Calculator,
  Save,
  Briefcase,
  Building2,
  TreePalm,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface StaffSalaryStructure {
  basic_pay?: number;
  hra?: number;
  conveyance_allowance?: number;
  medical_allowance?: number;
  special_allowance?: number;
  da?: number;
  transport_allowance?: number;
}

interface StaffStatutoryInfo {
  pf_applicable?: boolean;
  pf_account_number?: string;
  esi_applicable?: boolean;
  esi_number?: string;
  pt_applicable?: boolean;
  pt_state?: string;
  uan_number?: string;
  pan_number?: string;
}

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  position_name?: string;
  institution_id?: string;
  designation?: string;
  employee_id?: string;
  department?: string;
  annual_salary?: number;
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  salary_structure?: StaffSalaryStructure;
  statutory_info?: StaffStatutoryInfo;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  casual_leave_allowance?: number;
  sick_leave_allowance?: number;
  annual_leave_allowance?: number;
}

export default function StaffDetail() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<StaffProfile>>({});

  useEffect(() => {
    if (staffId) {
      loadStaffProfile();
    }
  }, [staffId]);

  const loadStaffProfile = async () => {
    if (!staffId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', staffId)
        .single();
      
      if (error) throw error;
      
      const profile: StaffProfile = {
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        position_name: data.position_name || '',
        institution_id: data.institution_id || '',
        designation: data.designation || '',
        employee_id: data.employee_id || '',
        department: data.department || '',
        annual_salary: data.annual_salary || 0,
        hourly_rate: data.hourly_rate || 0,
        overtime_rate_multiplier: data.overtime_rate_multiplier || 1.5,
        salary_structure: (data.salary_structure as unknown as StaffSalaryStructure) || {},
        statutory_info: (data.statutory_info as unknown as StaffStatutoryInfo) || {
          pf_applicable: true,
          esi_applicable: false,
          pt_applicable: true,
        },
        bank_name: data.bank_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc: data.bank_ifsc || '',
        bank_branch: data.bank_branch || '',
        casual_leave_allowance: data.casual_leave_allowance || 12,
        sick_leave_allowance: data.sick_leave_allowance || 10,
        annual_leave_allowance: data.annual_leave_allowance || 22,
      };
      
      setStaff(profile);
      setFormData(profile);
    } catch (error) {
      console.error('Error loading staff profile:', error);
      toast.error('Failed to load staff profile');
      navigate('/system-admin/payroll');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof StaffProfile, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSalaryStructureChange = (field: keyof StaffSalaryStructure, value: number) => {
    setFormData(prev => ({
      ...prev,
      salary_structure: {
        ...prev.salary_structure,
        [field]: value,
      },
    }));
  };

  const handleStatutoryChange = (field: keyof StaffStatutoryInfo, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      statutory_info: {
        ...prev.statutory_info,
        [field]: value,
      },
    }));
  };

  const autoCalculateSalary = () => {
    const annualSalary = formData.annual_salary || 0;
    if (annualSalary <= 0) {
      toast.error('Please enter annual salary first');
      return;
    }
    
    const monthly = annualSalary / 12;
    const basic = monthly * 0.5;
    const hra = monthly * 0.2;
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, monthly - basic - hra - conveyance - medical);
    const hourlyRate = monthly / 22 / 8;
    
    setFormData(prev => ({
      ...prev,
      hourly_rate: Math.round(hourlyRate * 100) / 100,
      salary_structure: {
        basic_pay: Math.round(basic * 100) / 100,
        hra: Math.round(hra * 100) / 100,
        conveyance_allowance: conveyance,
        medical_allowance: medical,
        special_allowance: Math.round(special * 100) / 100,
        da: 0,
        transport_allowance: 0,
      },
    }));
    
    toast.success('Salary breakdown calculated from CTC');
  };

  const handleSave = async () => {
    if (!staffId) return;
    
    setIsSaving(true);
    try {
      // Auto-calculate annual leave
      const casualLeave = formData.casual_leave_allowance || 12;
      const sickLeave = formData.sick_leave_allowance || 10;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          designation: formData.designation,
          employee_id: formData.employee_id,
          department: formData.department,
          annual_salary: formData.annual_salary,
          hourly_rate: formData.hourly_rate,
          overtime_rate_multiplier: formData.overtime_rate_multiplier,
          salary_structure: formData.salary_structure as unknown as Json,
          statutory_info: formData.statutory_info as unknown as Json,
          bank_name: formData.bank_name,
          bank_account_number: formData.bank_account_number,
          bank_ifsc: formData.bank_ifsc,
          bank_branch: formData.bank_branch,
          casual_leave_allowance: casualLeave,
          sick_leave_allowance: sickLeave,
          annual_leave_allowance: casualLeave + sickLeave,
        })
        .eq('id', staffId);
      
      if (error) throw error;
      
      setStaff(formData as StaffProfile);
      toast.success('Staff profile updated successfully');
    } catch (error) {
      console.error('Error saving staff profile:', error);
      toast.error('Failed to save staff profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalMonthlySalary = () => {
    const ss = formData.salary_structure || {};
    return (
      (ss.basic_pay || 0) +
      (ss.hra || 0) +
      (ss.conveyance_allowance || 0) +
      (ss.medical_allowance || 0) +
      (ss.special_allowance || 0) +
      (ss.da || 0)
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!staff) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Staff member not found</p>
          <Button variant="outline" onClick={() => navigate('/system-admin/payroll')} className="mt-4">
            Back to Payroll
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{staff.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{staff.email}</span>
                {staff.position_name && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">{staff.position_name}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information & Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Staff profile and employment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation || ''}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    placeholder="e.g., Senior Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id || ''}
                    onChange={(e) => handleChange('employee_id', e.target.value)}
                    placeholder="e.g., EMP001"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="e.g., Administration"
                />
              </div>

              <Separator />

              {/* Banking Information */}
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Banking Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="e.g., HDFC Bank"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number || ''}
                    onChange={(e) => handleChange('bank_account_number', e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_ifsc">IFSC Code</Label>
                  <Input
                    id="bank_ifsc"
                    value={formData.bank_ifsc || ''}
                    onChange={(e) => handleChange('bank_ifsc', e.target.value)}
                    placeholder="e.g., HDFC0001234"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_branch">Branch</Label>
                  <Input
                    id="bank_branch"
                    value={formData.bank_branch || ''}
                    onChange={(e) => handleChange('bank_branch', e.target.value)}
                    placeholder="e.g., Mumbai Main"
                  />
                </div>
              </div>

              <Separator />

              {/* Leave Allowances */}
              <h4 className="font-medium flex items-center gap-2">
                <TreePalm className="h-4 w-4" />
                Leave Allowances
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="casual_leave">Casual Leave</Label>
                  <Input
                    id="casual_leave"
                    type="number"
                    value={formData.casual_leave_allowance || 12}
                    onChange={(e) => handleChange('casual_leave_allowance', Number(e.target.value))}
                    placeholder="12"
                  />
                </div>
                <div>
                  <Label htmlFor="sick_leave">Sick Leave</Label>
                  <Input
                    id="sick_leave"
                    type="number"
                    value={formData.sick_leave_allowance || 10}
                    onChange={(e) => handleChange('sick_leave_allowance', Number(e.target.value))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="annual_leave">Annual Leave</Label>
                  <Input
                    id="annual_leave"
                    type="number"
                    value={(formData.casual_leave_allowance || 12) + (formData.sick_leave_allowance || 10)}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Auto: Sick + Casual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Salary Configuration
                  </CardTitle>
                  <CardDescription>CTC and salary breakdown</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={autoCalculateSalary}>
                  <Calculator className="h-4 w-4 mr-1" />
                  Auto Calculate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annual_salary">Annual CTC (₹)</Label>
                  <Input
                    id="annual_salary"
                    type="number"
                    value={formData.annual_salary || ''}
                    onChange={(e) => handleChange('annual_salary', Number(e.target.value))}
                    placeholder="e.g., 600000"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => handleChange('hourly_rate', Number(e.target.value))}
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="overtime_multiplier">Overtime Multiplier</Label>
                <Input
                  id="overtime_multiplier"
                  type="number"
                  step="0.1"
                  value={formData.overtime_rate_multiplier || 1.5}
                  onChange={(e) => handleChange('overtime_rate_multiplier', Number(e.target.value))}
                  placeholder="1.5"
                />
              </div>

              <Separator />

              <h4 className="font-medium">Monthly Salary Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Basic Pay (50%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.basic_pay || ''}
                    onChange={(e) => handleSalaryStructureChange('basic_pay', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">HRA (20%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.hra || ''}
                    onChange={(e) => handleSalaryStructureChange('hra', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Conveyance</Label>
                  <Input
                    type="number"
                    value={formData.salary_structure?.conveyance_allowance || ''}
                    onChange={(e) => handleSalaryStructureChange('conveyance_allowance', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Medical</Label>
                  <Input
                    type="number"
                    value={formData.salary_structure?.medical_allowance || ''}
                    onChange={(e) => handleSalaryStructureChange('medical_allowance', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Special Allowance</Label>
                  <Input
                    type="number"
                    value={formData.salary_structure?.special_allowance || ''}
                    onChange={(e) => handleSalaryStructureChange('special_allowance', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">DA (Optional)</Label>
                  <Input
                    type="number"
                    value={formData.salary_structure?.da || ''}
                    onChange={(e) => handleSalaryStructureChange('da', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Monthly</span>
                  <span className="text-xl font-bold text-primary">
                    ₹{getTotalMonthlySalary().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statutory Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Statutory Information
              </CardTitle>
              <CardDescription>PF, ESI, and Professional Tax configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* PF */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pf_applicable"
                      checked={formData.statutory_info?.pf_applicable ?? true}
                      onCheckedChange={(checked) => handleStatutoryChange('pf_applicable', checked as boolean)}
                    />
                    <Label htmlFor="pf_applicable" className="font-medium">PF Applicable</Label>
                  </div>
                  {formData.statutory_info?.pf_applicable && (
                    <>
                      <div>
                        <Label className="text-xs">PF Account Number</Label>
                        <Input
                          value={formData.statutory_info?.pf_account_number || ''}
                          onChange={(e) => handleStatutoryChange('pf_account_number', e.target.value)}
                          placeholder="Enter PF A/C"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">UAN Number</Label>
                        <Input
                          value={formData.statutory_info?.uan_number || ''}
                          onChange={(e) => handleStatutoryChange('uan_number', e.target.value)}
                          placeholder="Enter UAN"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* ESI */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esi_applicable"
                      checked={formData.statutory_info?.esi_applicable ?? false}
                      onCheckedChange={(checked) => handleStatutoryChange('esi_applicable', checked as boolean)}
                    />
                    <Label htmlFor="esi_applicable" className="font-medium">ESI Applicable</Label>
                  </div>
                  {formData.statutory_info?.esi_applicable && (
                    <div>
                      <Label className="text-xs">ESI Number</Label>
                      <Input
                        value={formData.statutory_info?.esi_number || ''}
                        onChange={(e) => handleStatutoryChange('esi_number', e.target.value)}
                        placeholder="Enter ESI No."
                      />
                    </div>
                  )}
                </div>

                {/* PT */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pt_applicable"
                      checked={formData.statutory_info?.pt_applicable ?? true}
                      onCheckedChange={(checked) => handleStatutoryChange('pt_applicable', checked as boolean)}
                    />
                    <Label htmlFor="pt_applicable" className="font-medium">PT Applicable</Label>
                  </div>
                  {formData.statutory_info?.pt_applicable && (
                    <div>
                      <Label className="text-xs">PT State</Label>
                      <Input
                        value={formData.statutory_info?.pt_state || 'maharashtra'}
                        onChange={(e) => handleStatutoryChange('pt_state', e.target.value)}
                        placeholder="e.g., maharashtra"
                      />
                    </div>
                  )}
                </div>

                {/* PAN */}
                <div className="space-y-3">
                  <Label className="font-medium">PAN Number</Label>
                  <Input
                    value={formData.statutory_info?.pan_number || ''}
                    onChange={(e) => handleStatutoryChange('pan_number', e.target.value)}
                    placeholder="Enter PAN"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
