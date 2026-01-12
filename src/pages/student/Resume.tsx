import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { useStudentResume } from '@/hooks/useStudentResume';
import { ResumePDF } from '@/components/student/pdf/ResumePDF';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';

// SDG colors for badges
const SDG_COLORS: Record<string, string> = {
  'SDG1': '#E5243B', 'SDG2': '#DDA63A', 'SDG3': '#4C9F38', 'SDG4': '#C5192D',
  'SDG5': '#FF3A21', 'SDG6': '#26BDE2', 'SDG7': '#FCC30B', 'SDG8': '#A21942',
  'SDG9': '#FD6925', 'SDG10': '#DD1367', 'SDG11': '#FD9D24', 'SDG12': '#BF8B2E',
  'SDG13': '#3F7E44', 'SDG14': '#0A97D9', 'SDG15': '#56C02B', 'SDG16': '#00689D',
  'SDG17': '#19486A',
};

export default function Resume() {
  const { data: resumeData, isLoading, error } = useStudentResume();
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setCustomSkills([...customSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setCustomSkills(customSkills.filter((_, i) => i !== index));
  };

  const handleExport = async () => {
    if (!resumeData) {
      toast.error('Resume data not available');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await pdf(<ResumePDF data={resumeData} customSkills={customSkills} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeData.personal.name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Resume exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export resume. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !resumeData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load resume data</h2>
          <p className="text-muted-foreground">Please try again later or contact support.</p>
        </div>
      </Layout>
    );
  }

  const allSkills = [...resumeData.skills, ...customSkills];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-muted-foreground">Auto-filled from your LMS data</p>
          </div>
          <Button 
            onClick={handleExport} 
            className="bg-meta-dark hover:bg-meta-dark-lighter"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export as PDF
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Auto-filled from your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={resumeData.personal.name} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={resumeData.personal.email} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={resumeData.personal.phone || 'Not provided'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={resumeData.personal.address || 'Not provided'} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>From your institution records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="font-semibold">{resumeData.education.institution}</div>
                  <div className="text-sm text-muted-foreground">
                    {resumeData.education.className}
                    {resumeData.education.section && ` - Section ${resumeData.education.section}`}
                  </div>
                  {resumeData.education.academicYear && (
                    <div className="text-sm text-muted-foreground">
                      Academic Year: {resumeData.education.academicYear}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>Add custom skills to complement your courses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">From Courses</Label>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.length > 0 ? (
                      resumeData.skills.map((skill, index) => (
                        <div key={index} className="rounded-full bg-meta-dark px-3 py-1 text-sm text-white">
                          {skill}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Skills will appear as you complete courses
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="mb-2 block">Additional Skills</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <Button onClick={handleAddSkill} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customSkills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-full bg-meta-accent px-3 py-1 text-sm text-meta-dark">
                        {skill}
                        <button onClick={() => handleRemoveSkill(index)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects & SDG Contributions</CardTitle>
                <CardDescription>From your project portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeData.projects.length > 0 ? (
                  resumeData.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border p-4">
                      <div className="font-semibold">{project.title}</div>
                      {project.role && (
                        <div className="text-xs text-muted-foreground italic">Role: {project.role}</div>
                      )}
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      )}
                      {project.sdg_goals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.sdg_goals.map((goal, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-white px-2 py-0.5 rounded"
                              style={{ backgroundColor: SDG_COLORS[goal] || '#666666' }}
                            >
                              {goal.replace('SDG', 'SDG ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects yet</p>
                    <p className="text-xs">Projects will appear here as you participate in activities</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificates</CardTitle>
                <CardDescription>Your earned certificates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {resumeData.certificates.length > 0 ? (
                  resumeData.certificates.map((cert) => (
                    <div key={cert.id} className="flex items-start justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">{cert.activity_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {cert.grade && `Grade: ${cert.grade} • `}
                          {format(new Date(cert.issued_date), 'MMMM yyyy')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No certificates yet</p>
                    <p className="text-xs">Certificates will appear here as you earn them</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
                <CardDescription>How your resume looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-meta-dark">{resumeData.personal.name}</h2>
                    <p className="text-sm text-gray-600">{resumeData.personal.email}</p>
                    {resumeData.personal.phone && (
                      <p className="text-sm text-gray-600">{resumeData.personal.phone}</p>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h3 className="font-bold text-meta-dark mb-1">EDUCATION</h3>
                      <div className="text-xs text-gray-700">
                        <div className="font-semibold">{resumeData.education.institution}</div>
                        <div>
                          {resumeData.education.className}
                          {resumeData.education.section && ` - ${resumeData.education.section}`}
                          {resumeData.education.academicYear && ` • ${resumeData.education.academicYear}`}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-meta-dark mb-1">SKILLS</h3>
                      <div className="text-xs text-gray-700">
                        {allSkills.length > 0 ? allSkills.join(', ') : 'No skills added yet'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-meta-dark mb-1">PROJECTS</h3>
                      {resumeData.projects.length > 0 ? (
                        resumeData.projects.slice(0, 2).map((proj) => (
                          <div key={proj.id} className="text-xs text-gray-700 mb-1">
                            <div className="font-semibold">{proj.title}</div>
                            {proj.description && (
                              <div className="truncate">{proj.description}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 italic">No projects yet</div>
                      )}
                      {resumeData.projects.length > 2 && (
                        <div className="text-xs text-gray-500">+{resumeData.projects.length - 2} more</div>
                      )}
                    </div>
                    {resumeData.certificates.length > 0 && (
                      <div>
                        <h3 className="font-bold text-meta-dark mb-1">CERTIFICATES</h3>
                        {resumeData.certificates.slice(0, 2).map((cert) => (
                          <div key={cert.id} className="text-xs text-gray-700 mb-1">
                            {cert.activity_name}
                          </div>
                        ))}
                        {resumeData.certificates.length > 2 && (
                          <div className="text-xs text-gray-500">+{resumeData.certificates.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Download as PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
