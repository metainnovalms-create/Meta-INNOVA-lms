import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Video, Link as LinkIcon, File, Upload, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';

const mockCourses = [
  { id: '1', code: 'CS301', name: 'AI & ML' },
  { id: '2', code: 'CS302', name: 'Data Structures' },
];

const mockMaterials = [
  {
    id: '1',
    course_id: '1',
    title: 'Introduction to Neural Networks',
    type: 'pdf' as const,
    description: 'Comprehensive guide to neural networks and deep learning',
    uploaded_date: '2024-12-01',
    size: '2.4 MB',
  },
  {
    id: '2',
    course_id: '1',
    title: 'Machine Learning Tutorial Video',
    type: 'video' as const,
    description: 'Video tutorial on supervised learning algorithms',
    uploaded_date: '2024-11-28',
    size: '156 MB',
  },
  {
    id: '3',
    course_id: '1',
    title: 'Python ML Libraries Documentation',
    type: 'link' as const,
    description: 'External link to official documentation',
    uploaded_date: '2024-11-25',
  },
  {
    id: '4',
    course_id: '2',
    title: 'Data Structures Lecture Notes',
    type: 'document' as const,
    description: 'Complete lecture notes for semester',
    uploaded_date: '2024-11-20',
    size: '1.8 MB',
  },
];

export default function TeacherMaterials() {
  const [selectedCourse, setSelectedCourse] = useState(mockCourses[0].id);
  const [materials, setMaterials] = useState(mockMaterials);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpload = () => {
    toast.success('Material uploaded successfully!');
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
    toast.success('Material deleted successfully!');
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      pdf: FileText,
      video: Video,
      link: LinkIcon,
      document: File,
    };
    return icons[type] || File;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-500/10 text-red-500',
      video: 'bg-purple-500/10 text-purple-500',
      link: 'bg-blue-500/10 text-blue-500',
      document: 'bg-green-500/10 text-green-500',
    };
    return colors[type] || colors.document;
  };

  const filteredMaterials = materials.filter((m) => m.course_id === selectedCourse);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Course Materials</h1>
            <p className="text-muted-foreground">Upload and manage teaching resources</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Course Material</DialogTitle>
                <DialogDescription>Add new learning resources for your students</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="course">Course</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Enter material title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the material" rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="file">Upload File</Label>
                  <Input id="file" type="file" />
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 100MB. Supported formats: PDF, DOC, PPT, MP4, etc.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload}>Upload Material</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Course Selector */}
        <Card>
          <CardContent className="pt-6">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {mockCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Materials List */}
        <div className="grid gap-4">
          {filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No materials uploaded for this course yet.</p>
              </CardContent>
            </Card>
          ) : (
            filteredMaterials.map((material) => {
              const Icon = getTypeIcon(material.type);
              return (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-3 rounded-lg ${getTypeColor(material.type).split(' ')[0]}`}>
                          <Icon className={`h-5 w-5 ${getTypeColor(material.type).split(' ')[1]}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{material.title}</CardTitle>
                            <Badge className={getTypeColor(material.type)}>{material.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {material.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Uploaded: {new Date(material.uploaded_date).toLocaleDateString()}
                            </span>
                            {material.size && <span>Size: {material.size}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
