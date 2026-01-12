import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OfficerDetails } from "@/services/systemadmin.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Building2,
  IdCard,
} from "lucide-react";

interface OfficerDetailsDialogProps {
  officer: OfficerDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerRole?: string; // Role of the person viewing (management, system_admin, super_admin)
}

export function OfficerDetailsDialog({
  officer,
  open,
  onOpenChange,
  viewerRole,
}: OfficerDetailsDialogProps) {
  if (!officer) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "on_leave":
        return "secondary";
      case "terminated":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getEmploymentVariant = (type: string) => {
    switch (type) {
      case "full_time":
        return "default";
      case "part_time":
        return "secondary";
      case "contract":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Officer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section with Avatar */}
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={officer.profile_photo_url} alt={officer.name} />
              <AvatarFallback className="text-2xl">
                {officer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{officer.name}</h2>
                <Badge variant={getStatusVariant(officer.status)}>
                  {officer.status.replace("_", " ")}
                </Badge>
              </div>
              {officer.employee_id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span>{officer.employee_id}</span>
                </div>
              )}
              {officer.department && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{officer.department}</span>
                </div>
              )}
              <Badge variant={getEmploymentVariant(officer.employment_type)}>
                {officer.employment_type.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Tabs Section */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{officer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{officer.phone}</p>
                    </div>
                  </div>
                  {officer.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {new Date(officer.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {officer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{officer.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {officer.emergency_contact_name && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{officer.emergency_contact_name}</p>
                      </div>
                    </div>
                    {officer.emergency_contact_phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{officer.emergency_contact_phone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">
                        {new Date(officer.join_date).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Only show salary to System Admin and Super Admin */}
                    {(viewerRole === 'system_admin' || viewerRole === 'super_admin') && (
                      <div>
                        <p className="text-sm text-muted-foreground">Salary</p>
                        <p className="font-medium">₹{officer.salary.toLocaleString()}/month</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Assigned Institutions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {officer.assigned_institutions.map((inst) => (
                      <Badge key={inst} variant="secondary">
                        {inst}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Salary Structure - Only visible to System Admin and Super Admin */}
              {(viewerRole === 'system_admin' || viewerRole === 'super_admin') && 
                officer.salary_structure && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Salary Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Basic Pay</p>
                        <p className="font-medium">₹{officer.salary_structure.basic_pay}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">HRA</p>
                        <p className="font-medium">₹{officer.salary_structure.hra}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">DA</p>
                        <p className="font-medium">₹{officer.salary_structure.da}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Transport Allowance</p>
                        <p className="font-medium">₹{officer.salary_structure.transport_allowance}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Special Allowance</p>
                        <p className="font-medium">₹{officer.salary_structure.special_allowance}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Medical Allowance</p>
                        <p className="font-medium">₹{officer.salary_structure.medical_allowance}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Qualifications Tab */}
            <TabsContent value="qualifications" className="space-y-4">
              {officer.qualifications && officer.qualifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Educational Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {officer.qualifications.map((qual, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {officer.certifications && officer.certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {officer.certifications.map((cert, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {officer.skills && officer.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {officer.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
