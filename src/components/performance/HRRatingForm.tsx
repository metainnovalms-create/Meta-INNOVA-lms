import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Download, Loader2, Star } from 'lucide-react';
import { HRRating, HRRatingProject, useCreateHRRating, useUpdateHRRating, useCumulativeStars } from '@/hooks/useHRRatings';
import { useOfficers } from '@/hooks/useOfficers';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { pdf } from '@react-pdf/renderer';
import { HRRatingPDF } from './pdf/HRRatingPDF';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: HRRating | null;
  onSuccess: () => void;
}

const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface FormProject {
  id: string;
  project_title: string;
  competition_level: string;
  result: string;
  stars_earned: number;
  verified_by_hr: boolean;
}

export function HRRatingForm({ open, onOpenChange, rating, onSuccess }: Props) {
  const { user } = useAuth();
  const { data: officers = [], isLoading: isLoadingOfficers } = useOfficers();
  const createMutation = useCreateHRRating();
  const updateMutation = useUpdateHRRating();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [formData, setFormData] = useState({
    trainer_id: '',
    trainer_name: '',
    employee_id: '',
    period: 'Q1' as typeof PERIODS[number],
    year: CURRENT_YEAR,
    project_ratings: [] as FormProject[]
  });

  const { data: existingCumulativeStars = 0 } = useCumulativeStars(
    formData.trainer_id || null,
    formData.year || null
  );

  useEffect(() => {
    if (rating) {
      setFormData({
        trainer_id: rating.trainer_id,
        trainer_name: rating.trainer_name,
        employee_id: rating.employee_id,
        period: rating.period,
        year: rating.year,
        project_ratings: (rating.project_ratings || []).map(p => ({
          id: p.id,
          project_title: p.project_title,
          competition_level: p.competition_level || '',
          result: p.result || '',
          stars_earned: p.stars_earned,
          verified_by_hr: p.verified_by_hr
        }))
      });
    } else {
      setFormData({
        trainer_id: '',
        trainer_name: '',
        employee_id: '',
        period: 'Q1',
        year: CURRENT_YEAR,
        project_ratings: []
      });
    }
  }, [rating, open]);

  const handleOfficerChange = (officerId: string) => {
    const officer = officers.find(o => o.id === officerId);
    if (officer) {
      setFormData(prev => ({
        ...prev,
        trainer_id: officer.id,
        trainer_name: officer.full_name,
        employee_id: officer.employee_id || `EMP-${officer.id.slice(0, 8)}`
      }));
    }
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      project_ratings: [...prev.project_ratings, {
        id: `temp-${Date.now()}`,
        project_title: '',
        competition_level: '',
        result: '',
        stars_earned: 0,
        verified_by_hr: false
      }]
    }));
  };

  const updateProject = (index: number, field: keyof FormProject, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      project_ratings: prev.project_ratings.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      project_ratings: prev.project_ratings.filter((_, i) => i !== index)
    }));
  };

  const totalStarsQuarter = formData.project_ratings.reduce((sum, p) => sum + p.stars_earned, 0);
  
  // Calculate cumulative: existing stars + new quarter stars (minus existing rating's stars if editing)
  const cumulativeStarsYear = rating 
    ? existingCumulativeStars - (rating.total_stars_quarter || 0) + totalStarsQuarter
    : existingCumulativeStars + totalStarsQuarter;

  const handleSubmit = async () => {
    if (!formData.trainer_id) {
      toast({ title: 'Please select a trainer', variant: 'destructive' });
      return;
    }

    const projectData = formData.project_ratings.map(p => ({
      project_title: p.project_title,
      competition_level: p.competition_level || null,
      result: p.result || null,
      stars_earned: p.stars_earned,
      verified_by_hr: p.verified_by_hr,
      verified_date: p.verified_by_hr ? new Date().toISOString() : null,
      verified_by: p.verified_by_hr ? user?.id || null : null
    }));

    const data = {
      trainer_id: formData.trainer_id,
      trainer_name: formData.trainer_name,
      employee_id: formData.employee_id,
      period: formData.period,
      year: formData.year,
      total_stars_quarter: totalStarsQuarter,
      cumulative_stars_year: cumulativeStarsYear,
      created_by: user?.id || null,
      project_ratings: projectData
    };

    try {
      if (rating) {
        await updateMutation.mutateAsync({ id: rating.id, data });
        toast({ title: 'HR Rating updated successfully' });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: 'HR Rating created successfully' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Failed to save HR Rating', variant: 'destructive' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!rating) {
      toast({ title: 'Please save the rating first', variant: 'destructive' });
      return;
    }
    
    setIsDownloading(true);
    try {
      const blob = await pdf(<HRRatingPDF rating={rating} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HR_Rating_${rating.trainer_name.replace(/\s+/g, '_')}_${rating.period}_${rating.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF downloaded successfully' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {rating ? 'Edit HR Rating' : 'Create HR Rating'}
            {rating && (
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Download PDF
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Select Trainer</Label>
                <Select value={formData.trainer_id} onValueChange={handleOfficerChange} disabled={isLoadingOfficers}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingOfficers ? 'Loading...' : 'Select trainer'} />
                  </SelectTrigger>
                  <SelectContent>
                    {officers.map(officer => (
                      <SelectItem key={officer.id} value={officer.id}>
                        {officer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input value={formData.employee_id} disabled />
              </div>
              <div>
                <Label>Period</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(v: typeof PERIODS[number]) => setFormData(prev => ({ ...prev, period: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select 
                  value={String(formData.year)} 
                  onValueChange={v => setFormData(prev => ({ ...prev, year: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Ratings Table */}
            <div>
              <Label className="text-base font-semibold">Project Ratings</Label>
              <div className="mt-4 space-y-3">
                {formData.project_ratings.map((project, index) => (
                  <Card key={project.id} className="p-4">
                    <div className="grid grid-cols-6 gap-3 items-center">
                      <Input 
                        placeholder="Project Title"
                        className="col-span-2"
                        value={project.project_title}
                        onChange={e => updateProject(index, 'project_title', e.target.value)}
                      />
                      <Input 
                        placeholder="Competition Level"
                        value={project.competition_level}
                        onChange={e => updateProject(index, 'competition_level', e.target.value)}
                      />
                      <Input 
                        placeholder="Result"
                        value={project.result}
                        onChange={e => updateProject(index, 'result', e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <Input 
                          type="number"
                          min="0"
                          max="5"
                          placeholder="Stars"
                          value={project.stars_earned}
                          onChange={e => updateProject(index, 'stars_earned', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`verified-${index}`}
                          checked={project.verified_by_hr}
                          onCheckedChange={v => updateProject(index, 'verified_by_hr', !!v)}
                        />
                        <Label htmlFor={`verified-${index}`} className="text-xs">Verified</Label>
                        <Button variant="ghost" size="icon" onClick={() => removeProject(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" onClick={addProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="font-semibold">Total Stars This Quarter:</Label>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold">{totalStarsQuarter}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="font-semibold">Cumulative Stars This Year:</Label>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold">{cumulativeStarsYear}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {rating ? 'Update' : 'Create'} Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}