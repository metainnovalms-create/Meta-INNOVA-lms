import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { OfficerDetails } from '@/services/systemadmin.service';
import { Calculator, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

// Leave balance type matching OfficerDetail component
interface OfficerLeaveBalance {
  sick_leave: number;
  casual_leave: number;
  annual_leave: number;
}

interface EditOfficerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  officer: OfficerDetails;
  leaveBalance?: OfficerLeaveBalance | null;
  onSaveSuccess: (updatedOfficer: Partial<OfficerDetails> & { casual_leave?: number; sick_leave?: number }) => void;
}

export default function EditOfficerDialog({
  isOpen,
  onOpenChange,
  officer,
  leaveBalance,
  onSaveSuccess,
}: EditOfficerDialogProps) {
  const [formData, setFormData] = useState<Partial<OfficerDetails> & { casual_leave?: number; sick_leave?: number }>({});
  const [newSkill, setNewSkill] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    if (officer) {
      setFormData({
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        date_of_birth: officer.date_of_birth,
        address: officer.address,
        emergency_contact_name: officer.emergency_contact_name,
        emergency_contact_phone: officer.emergency_contact_phone,
        employment_type: officer.employment_type,
        salary: officer.salary,
        department: officer.department,
        status: officer.status,
        hourly_rate: officer.hourly_rate,
        overtime_rate_multiplier: officer.overtime_rate_multiplier,
        normal_working_hours: officer.normal_working_hours,
        casual_leave: leaveBalance?.casual_leave,
        sick_leave: leaveBalance?.sick_leave,
        // Include salary structure and statutory info from officer
        salary_structure: officer.salary_structure ?? {
          basic_pay: 0,
          hra: 0,
          da: 0,
          transport_allowance: 0,
          special_allowance: 0,
          medical_allowance: 0,
        },
        statutory_info: officer.statutory_info ?? {
          pf_applicable: true,
          esi_applicable: false,
          pt_applicable: true,
        },
        bank_name: officer.bank_name,
        bank_account_number: officer.bank_account_number,
        bank_ifsc: officer.bank_ifsc,
        bank_branch: officer.bank_branch,
        skills: officer.skills || [],
        qualifications: officer.qualifications || [],
        certifications: officer.certifications || [],
      });
    }
  }, [officer, leaveBalance]);

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index)
    }));
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...(prev.qualifications || []), newQualification.trim()]
      }));
      setNewQualification('');
    }
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: (prev.qualifications || []).filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index)
    }));
  };

  const handleChange = (field: keyof OfficerDetails | 'casual_leave' | 'sick_leave', value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveSuccess(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Officer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Emergency Contact</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Employment Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.employment_type || ''}
                  onValueChange={(value) => handleChange('employment_type', value)}
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Annual Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ''}
                  onChange={(e) => handleChange('salary', Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || ''}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Salary Configuration Section */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">Salary Configuration</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const annualSalary = formData.salary || 0;
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
                  
                  handleChange('salary_structure', {
                    ...formData.salary_structure,
                    basic_pay: Math.round(basic * 100) / 100,
                    hra: Math.round(hra * 100) / 100,
                    transport_allowance: conveyance,
                    medical_allowance: medical,
                    special_allowance: Math.round(special * 100) / 100,
                    da: 0,
                  });
                  handleChange('hourly_rate', Math.round(hourlyRate * 100) / 100);
                  toast.success('Salary breakdown calculated from CTC');
                }}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Auto Calculate
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate || ''}
                  onChange={(e) => handleChange('hourly_rate', Number(e.target.value))}
                  placeholder="312.50"
                />
              </div>
              
              <div>
                <Label htmlFor="overtime_rate_multiplier">Overtime Multiplier</Label>
                <Input
                  id="overtime_rate_multiplier"
                  type="number"
                  step="0.1"
                  value={formData.overtime_rate_multiplier || ''}
                  onChange={(e) => handleChange('overtime_rate_multiplier', Number(e.target.value))}
                  placeholder="1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="normal_working_hours">Working Hours/Day</Label>
                <Input
                  id="normal_working_hours"
                  type="number"
                  value={formData.normal_working_hours || ''}
                  onChange={(e) => handleChange('normal_working_hours', Number(e.target.value))}
                  placeholder="8"
                />
              </div>
            </div>
            
            {/* Salary Structure Breakdown */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="text-sm font-medium">Salary Structure Breakdown (Monthly)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="basic_pay" className="text-xs">Basic Pay (50%)</Label>
                  <Input
                    id="basic_pay"
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.basic_pay || ''}
                    onChange={(e) => handleChange('salary_structure', {
                      ...formData.salary_structure,
                      basic_pay: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="hra" className="text-xs">HRA (20%)</Label>
                  <Input
                    id="hra"
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.hra || ''}
                    onChange={(e) => handleChange('salary_structure', {
                      ...formData.salary_structure,
                      hra: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="transport" className="text-xs">Transport/Conveyance</Label>
                  <Input
                    id="transport"
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.transport_allowance || ''}
                    onChange={(e) => handleChange('salary_structure', {
                      ...formData.salary_structure,
                      transport_allowance: Number(e.target.value)
                    })}
                    placeholder="1600"
                  />
                </div>
                <div>
                  <Label htmlFor="medical" className="text-xs">Medical</Label>
                  <Input
                    id="medical"
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.medical_allowance || ''}
                    onChange={(e) => handleChange('salary_structure', {
                      ...formData.salary_structure,
                      medical_allowance: Number(e.target.value)
                    })}
                    placeholder="1250"
                  />
                </div>
                <div>
                  <Label htmlFor="special" className="text-xs">Special Allowance</Label>
                  <Input
                    id="special"
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.special_allowance || ''}
                    onChange={(e) => handleChange('salary_structure', {
                      ...formData.salary_structure,
                      special_allowance: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="da" className="text-xs">DA (Optional)</Label>
                  <Input
                    id="da"
                    type="number"
                    step="0.01"
                    value={formData.salary_structure?.da || ''}
                    onChange={(e) => handleChange('salary_structure', {
                      ...formData.salary_structure,
                      da: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Total Monthly: ₹{(
                  (formData.salary_structure?.basic_pay || 0) +
                  (formData.salary_structure?.hra || 0) +
                  (formData.salary_structure?.transport_allowance || 0) +
                  (formData.salary_structure?.medical_allowance || 0) +
                  (formData.salary_structure?.special_allowance || 0) +
                  (formData.salary_structure?.da || 0)
                ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Leave Allowances Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Leave Allowances</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="casual_leave">Casual Leave (days)</Label>
                <Input
                  id="casual_leave"
                  type="number"
                  value={formData.casual_leave ?? ''}
                  onChange={(e) => handleChange('casual_leave', Number(e.target.value))}
                  placeholder="12"
                />
              </div>
              
              <div>
                <Label htmlFor="sick_leave">Sick Leave (days)</Label>
                <Input
                  id="sick_leave"
                  type="number"
                  value={formData.sick_leave ?? ''}
                  onChange={(e) => handleChange('sick_leave', Number(e.target.value))}
                  placeholder="10"
                />
              </div>
              
              <div>
                <Label htmlFor="annual_leave">Annual Leave (days)</Label>
                <Input
                  id="annual_leave"
                  type="number"
                  value={(formData.casual_leave ?? 0) + (formData.sick_leave ?? 0)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-calculated: Sick + Casual</p>
              </div>
            </div>
          </div>

          {/* Banking Information Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Banking Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_account_number">Bank Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number || ''}
                  onChange={(e) => handleChange('bank_account_number', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name || ''}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
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
                />
              </div>
              
              <div>
                <Label htmlFor="bank_branch">Branch</Label>
                <Input
                  id="bank_branch"
                  value={formData.bank_branch || ''}
                  onChange={(e) => handleChange('bank_branch', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Statutory Information Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Statutory Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pf_number">PF Number</Label>
                <Input
                  id="pf_number"
                  value={formData.statutory_info?.pf_number || ''}
                  onChange={(e) => handleChange('statutory_info', {
                    ...(formData.statutory_info || { pf_applicable: true, esi_applicable: false, pt_applicable: true }),
                    pf_number: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="uan_number">UAN Number</Label>
                <Input
                  id="uan_number"
                  value={formData.statutory_info?.uan_number || ''}
                  onChange={(e) => handleChange('statutory_info', {
                    ...(formData.statutory_info || { pf_applicable: true, esi_applicable: false, pt_applicable: true }),
                    uan_number: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="esi_number">ESI Number</Label>
                <Input
                  id="esi_number"
                  value={formData.statutory_info?.esi_number || ''}
                  onChange={(e) => handleChange('statutory_info', {
                    ...(formData.statutory_info || { pf_applicable: true, esi_applicable: false, pt_applicable: true }),
                    esi_number: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={formData.statutory_info?.pan_number || ''}
                  onChange={(e) => handleChange('statutory_info', {
                    ...(formData.statutory_info || { pf_applicable: true, esi_applicable: false, pt_applicable: true }),
                    pan_number: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicability</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pf_applicable"
                    checked={formData.statutory_info?.pf_applicable ?? true}
                    onCheckedChange={(checked) => handleChange('statutory_info', {
                      ...(formData.statutory_info || { esi_applicable: false, pt_applicable: true }),
                      pf_applicable: checked as boolean
                    })}
                  />
                  <Label htmlFor="pf_applicable" className="font-normal">PF Applicable</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="esi_applicable"
                    checked={formData.statutory_info?.esi_applicable ?? false}
                    onCheckedChange={(checked) => handleChange('statutory_info', {
                      ...(formData.statutory_info || { pf_applicable: true, pt_applicable: true }),
                      esi_applicable: checked as boolean
                    })}
                  />
                  <Label htmlFor="esi_applicable" className="font-normal">ESI Applicable</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pt_applicable"
                    checked={formData.statutory_info?.pt_applicable ?? true}
                    onCheckedChange={(checked) => handleChange('statutory_info', {
                      ...(formData.statutory_info || { pf_applicable: true, esi_applicable: false }),
                      pt_applicable: checked as boolean
                    })}
                  />
                  <Label htmlFor="pt_applicable" className="font-normal">PT Applicable</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Qualifications Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Skills & Qualifications</h3>
            
            {/* Skills */}
            <div>
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                {(formData.skills || []).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeSkill(index)} 
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add a skill (e.g., Python, Leadership)" 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" size="sm" variant="outline" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Qualifications */}
            <div>
              <Label>Educational Qualifications</Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                {(formData.qualifications || []).map((qual, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {qual}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeQualification(index)} 
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add qualification (e.g., MBA, B.Tech)" 
                  value={newQualification} 
                  onChange={(e) => setNewQualification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <Button type="button" size="sm" variant="outline" onClick={addQualification}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Certifications */}
            <div>
              <Label>Certifications</Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                {(formData.certifications || []).map((cert, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {cert}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeCertification(index)} 
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Add certification (e.g., PMP, AWS Certified)" 
                  value={newCertification} 
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" size="sm" variant="outline" onClick={addCertification}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
