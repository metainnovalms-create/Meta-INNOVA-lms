import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Institution {
  id: string;
  name: string;
  code: string;
  type: string;
  location: string;
  established_year: number;
  contact_email: string;
  contact_phone: string;
  admin_name: string;
  admin_email: string;
  total_faculty: number;
  gps_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  attendance_radius_meters?: number;
  normal_working_hours?: number;
}

interface EditInstitutionDialogProps {
  institution: Institution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (institution: Partial<Institution>) => void;
}

export function EditInstitutionDialog({
  institution,
  open,
  onOpenChange,
  onSave,
}: EditInstitutionDialogProps) {
  const [formData, setFormData] = useState<Partial<Institution>>({});

  useEffect(() => {
    if (institution) {
      setFormData(institution);
    }
  }, [institution]);

  const handleSave = () => {
    // Basic validation
    if (!formData.name || formData.name.length < 3) {
      alert('Institution name must be at least 3 characters');
      return;
    }
    if (!formData.contact_email?.includes('@')) {
      alert('Please enter a valid contact email');
      return;
    }
    if (!formData.admin_email?.includes('@')) {
      alert('Please enter a valid admin email');
      return;
    }
    
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Institution Information</DialogTitle>
          <DialogDescription>
            Update institution details and contact information
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Institution Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter institution name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Institution Code</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., DPS-VK-001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="institute">Institute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State, Country"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="established_year">Established Year</Label>
              <Input
                id="established_year"
                type="number"
                value={formData.established_year || ''}
                onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) })}
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@institution.edu"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+91-11-2345-6789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="admin_name">Admin Name</Label>
              <Input
                id="admin_name"
                value={formData.admin_name || ''}
                onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                placeholder="Dr. John Doe"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="admin_email">Admin Email</Label>
              <Input
                id="admin_email"
                type="email"
                value={formData.admin_email || ''}
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                placeholder="admin@institution.edu"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="total_faculty">Total Faculty</Label>
            <Input
              id="total_faculty"
              type="number"
              value={formData.total_faculty || ''}
              onChange={(e) => setFormData({ ...formData, total_faculty: parseInt(e.target.value) })}
              min="0"
              placeholder="180"
            />
          </div>

          {/* GPS Configuration Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="font-semibold text-lg">GPS & Attendance Configuration</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gps_latitude">GPS Latitude *</Label>
                <Input
                  id="gps_latitude"
                  type="number"
                  step="0.000001"
                  value={formData.gps_location?.latitude || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    gps_location: { 
                      ...(formData.gps_location || { longitude: 0 }),
                      latitude: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="28.5244"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gps_longitude">GPS Longitude *</Label>
                <Input
                  id="gps_longitude"
                  type="number"
                  step="0.000001"
                  value={formData.gps_location?.longitude || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    gps_location: { 
                      ...(formData.gps_location || { latitude: 0 }),
                      longitude: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="77.1855"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gps_address">Address</Label>
              <Input
                id="gps_address"
                value={formData.gps_location?.address || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gps_location: { 
                    ...(formData.gps_location || { latitude: 0, longitude: 0 }),
                    address: e.target.value
                  }
                })}
                placeholder="Complete institution address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="attendance_radius">Attendance Radius (meters)</Label>
                <Input
                  id="attendance_radius"
                  type="number"
                  value={formData.attendance_radius_meters || 1500}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    attendance_radius_meters: parseInt(e.target.value) || 1500
                  })}
                  min="50"
                  max="5000"
                  placeholder="1500"
                />
                <p className="text-xs text-muted-foreground">Default: 1500m (1.5km)</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="normal_working_hours">Normal Working Hours/Day</Label>
                <Input
                  id="normal_working_hours"
                  type="number"
                  value={formData.normal_working_hours || 8}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    normal_working_hours: parseInt(e.target.value) || 8
                  })}
                  min="1"
                  max="24"
                  placeholder="8"
                />
                <p className="text-xs text-muted-foreground">Default: 8 hours/day</p>
              </div>
            </div>

            {formData.gps_location?.latitude && formData.gps_location?.longitude && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📍 <a 
                    href={`https://www.google.com/maps?q=${formData.gps_location.latitude},${formData.gps_location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    View on Google Maps
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
