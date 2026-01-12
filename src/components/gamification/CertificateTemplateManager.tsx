import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CertificateTemplateDialog } from './CertificateTemplateDialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template_image_url: string | null;
  default_width: number | null;
  default_height: number | null;
  name_position: any;
  date_position: any;
  course_name_position?: any;
  level_title_position?: any;
  is_active: boolean | null;
  created_at: string | null;
  created_by: string | null;
}

export function CertificateTemplateManager() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | undefined>();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: Partial<CertificateTemplate>) => {
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('certificate_templates')
          .update({
            name: template.name,
            description: template.description,
            category: template.category,
            template_image_url: template.template_image_url,
            default_width: template.default_width,
            default_height: template.default_height,
            name_position: template.name_position,
            date_position: template.date_position,
            course_name_position: template.course_name_position,
            level_title_position: template.level_title_position,
            is_active: template.is_active
          })
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast.success('Certificate template updated');
      } else {
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('certificate_templates')
          .insert({
            name: template.name || '',
            description: template.description,
            category: template.category || 'course',
            template_image_url: template.template_image_url,
            default_width: template.default_width || 1200,
            default_height: template.default_height || 900,
            name_position: template.name_position || { x: 600, y: 450, fontSize: 48, color: '#1e3a8a', fontFamily: 'serif' },
            date_position: template.date_position,
            course_name_position: template.course_name_position,
            level_title_position: template.level_title_position,
            is_active: template.is_active ?? true,
            created_by: user?.user?.id
          });
        
        if (error) throw error;
        toast.success('Certificate template created');
      }
      
      loadTemplates();
      setEditingTemplate(undefined);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save certificate template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Certificate template deleted');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete certificate template');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'course': return 'bg-blue-100 text-blue-800';
      case 'module': 
      case 'level': return 'bg-cyan-100 text-cyan-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'assessment': return 'bg-purple-100 text-purple-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Certificate Templates</CardTitle>
              <CardDescription>
                Upload and manage certificate templates for courses, levels, assessments, and events
              </CardDescription>
            </div>
            <Button onClick={() => { setEditingTemplate(undefined); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No certificate templates yet. Upload your first template to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        {template.template_image_url ? (
                          <img 
                            src={template.template_image_url} 
                            alt={template.name}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(template.category)} variant="secondary">
                          {template.category === 'module' ? 'level' : template.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.default_width || 1200}×{template.default_height || 900}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {template.template_image_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(template.template_image_url!, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingTemplate(template); setDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CertificateTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
