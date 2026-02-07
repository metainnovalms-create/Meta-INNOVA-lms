import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Percent } from 'lucide-react';
import { useClassAssessmentMapping, useClassAssignedAssessments } from '@/hooks/useClassAssessmentMapping';
import { WEIGHTAGE, getWeightageLabel } from '@/utils/assessmentWeightageCalculator';

interface ClassAssessmentMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  institutionId: string;
  academicYear?: string;
}

export function ClassAssessmentMappingDialog({
  open,
  onOpenChange,
  classId,
  className,
  institutionId,
  academicYear = '2024-25',
}: ClassAssessmentMappingDialogProps) {
  const { mapping, isLoading, saveMapping, isSaving } = useClassAssessmentMapping(classId, academicYear);
  const { data: availableAssessments, isLoading: isLoadingAssessments } = useClassAssignedAssessments(classId);

  const [fa1Id, setFa1Id] = useState<string | null>(null);
  const [fa2Id, setFa2Id] = useState<string | null>(null);
  const [finalId, setFinalId] = useState<string | null>(null);

  useEffect(() => {
    if (mapping) {
      setFa1Id(mapping.fa1_assessment_id);
      setFa2Id(mapping.fa2_assessment_id);
      setFinalId(mapping.final_assessment_id);
    }
  }, [mapping]);

  const handleSave = () => {
    saveMapping({
      class_id: classId,
      institution_id: institutionId,
      academic_year: academicYear,
      fa1_assessment_id: fa1Id,
      fa2_assessment_id: fa2Id,
      final_assessment_id: finalId,
    });
    onOpenChange(false);
  };

  const getAssessmentById = (id: string | null) => {
    if (!id || !availableAssessments) return null;
    return availableAssessments.find((a: any) => a.id === id);
  };

  if (isLoading || isLoadingAssessments) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assessment Mapping - {className}</DialogTitle>
          <DialogDescription>
            Map assessments to weightage categories for {academicYear}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Weightage Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Weightage Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="p-2 rounded bg-primary/10">
                  <div className="font-semibold text-primary">FA1</div>
                  <div className="text-muted-foreground">{WEIGHTAGE.FA1 * 100}%</div>
                </div>
                <div className="p-2 rounded bg-secondary">
                  <div className="font-semibold text-secondary-foreground">FA2</div>
                  <div className="text-muted-foreground">{WEIGHTAGE.FA2 * 100}%</div>
                </div>
                <div className="p-2 rounded bg-accent">
                  <div className="font-semibold text-accent-foreground">Final</div>
                  <div className="text-muted-foreground">{WEIGHTAGE.FINAL * 100}%</div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="font-semibold text-foreground">Internal</div>
                  <div className="text-muted-foreground">{WEIGHTAGE.INTERNAL * 100}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Selection */}
          <div className="space-y-4">
            {/* FA1 */}
            <div className="space-y-2">
              <Label>{getWeightageLabel('fa1')}</Label>
              <Select value={fa1Id || 'none'} onValueChange={(v) => setFa1Id(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment for FA1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Not Assigned --</SelectItem>
                  {availableAssessments?.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {assessment.title}
                        <Badge variant="outline" className="ml-2">
                          {assessment.total_points} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fa1Id && getAssessmentById(fa1Id) && (
                <p className="text-xs text-muted-foreground">
                  Total: {getAssessmentById(fa1Id)?.total_points} points → Weighted to 20%
                </p>
              )}
            </div>

            {/* FA2 */}
            <div className="space-y-2">
              <Label>{getWeightageLabel('fa2')}</Label>
              <Select value={fa2Id || 'none'} onValueChange={(v) => setFa2Id(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment for FA2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Not Assigned --</SelectItem>
                  {availableAssessments?.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {assessment.title}
                        <Badge variant="outline" className="ml-2">
                          {assessment.total_points} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fa2Id && getAssessmentById(fa2Id) && (
                <p className="text-xs text-muted-foreground">
                  Total: {getAssessmentById(fa2Id)?.total_points} points → Weighted to 20%
                </p>
              )}
            </div>

            {/* Final */}
            <div className="space-y-2">
              <Label>{getWeightageLabel('final')}</Label>
              <Select value={finalId || 'none'} onValueChange={(v) => setFinalId(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment for Final" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Not Assigned --</SelectItem>
                  {availableAssessments?.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {assessment.title}
                        <Badge variant="outline" className="ml-2">
                          {assessment.total_points} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {finalId && getAssessmentById(finalId) && (
                <p className="text-xs text-muted-foreground">
                  Total: {getAssessmentById(finalId)?.total_points} points → Weighted to 40%
                </p>
              )}
            </div>

            {/* Internal Note */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Internal Assessment (20%)</strong> marks are entered separately 
                via the "Internal Marks" option.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
