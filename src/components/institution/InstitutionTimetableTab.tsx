import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Clock, Save, Calendar as CalendarIcon, Settings, User, Users } from 'lucide-react';
import { PeriodConfig, InstitutionTimetableAssignment, OfficerAssignment } from '@/types/institution';
import { InstitutionClass } from '@/types/student';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InstitutionTimetableTabProps {
  institutionId: string;
  institutionName: string;
  classes: InstitutionClass[];
  assignedOfficers: OfficerAssignment[];
  periods: PeriodConfig[];
  timetableData: InstitutionTimetableAssignment[];
  onSavePeriods: (periods: PeriodConfig[]) => Promise<PeriodConfig[]>;
  onSaveTimetable: (assignments: InstitutionTimetableAssignment[]) => Promise<void>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const InstitutionTimetableTab = ({
  institutionId,
  classes,
  assignedOfficers,
  periods: initialPeriods,
  timetableData: initialTimetableData,
  onSavePeriods,
  onSaveTimetable
}: InstitutionTimetableTabProps) => {
  const [periods, setPeriods] = useState<PeriodConfig[]>(initialPeriods);
  const [timetableData, setTimetableData] = useState<InstitutionTimetableAssignment[]>(initialTimetableData);
  const [isPeriodConfigOpen, setIsPeriodConfigOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodConfig | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: typeof DAYS[number]; periodId: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Assignment form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [selectedSecondaryOfficer, setSelectedSecondaryOfficer] = useState('');
  const [selectedBackupOfficer, setSelectedBackupOfficer] = useState('');

  // Period form state
  const [periodLabel, setPeriodLabel] = useState('');
  const [periodStartTime, setPeriodStartTime] = useState('');
  const [periodEndTime, setPeriodEndTime] = useState('');
  const [isBreak, setIsBreak] = useState(false);

  const handleAddPeriod = () => {
    if (!periodLabel || !periodStartTime || !periodEndTime) {
      toast.error('Please fill all period details');
      return;
    }

    const newPeriod: PeriodConfig = {
      id: crypto.randomUUID(),
      institution_id: institutionId,
      label: periodLabel,
      start_time: periodStartTime,
      end_time: periodEndTime,
      is_break: isBreak,
      display_order: periods.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setPeriods([...periods, newPeriod]);
    resetPeriodForm();
    toast.success('Period added');
  };

  const handleEditPeriod = (period: PeriodConfig) => {
    setEditingPeriod(period);
    setPeriodLabel(period.label);
    setPeriodStartTime(period.start_time);
    setPeriodEndTime(period.end_time);
    setIsBreak(period.is_break);
  };

  const handleUpdatePeriod = () => {
    if (!editingPeriod || !periodLabel || !periodStartTime || !periodEndTime) return;

    setPeriods(periods.map(p => 
      p.id === editingPeriod.id
        ? { ...p, label: periodLabel, start_time: periodStartTime, end_time: periodEndTime, is_break: isBreak, updated_at: new Date().toISOString() }
        : p
    ));
    setEditingPeriod(null);
    resetPeriodForm();
    toast.success('Period updated');
  };

  const handleDeletePeriod = (periodId: string) => {
    // Check if period is used in timetable
    const isUsed = timetableData.some(t => t.period_id === periodId);
    if (isUsed) {
      toast.error('Cannot delete period that is assigned in timetable');
      return;
    }

    setPeriods(periods.filter(p => p.id !== periodId));
    toast.success('Period deleted');
  };

  const resetPeriodForm = () => {
    setPeriodLabel('');
    setPeriodStartTime('');
    setPeriodEndTime('');
    setIsBreak(false);
  };

  const handleSavePeriodConfig = async () => {
    setIsSaving(true);
    try {
      // Save periods and get the new UUIDs back from database
      const savedPeriods = await onSavePeriods(periods);
      
      // Create a mapping from old temporary IDs to new database UUIDs
      const idMapping = new Map<string, string>();
      periods.forEach((oldPeriod, index) => {
        if (savedPeriods && savedPeriods[index]) {
          idMapping.set(oldPeriod.id, savedPeriods[index].id);
        }
      });
      
      // Update local periods with new UUIDs from database
      if (savedPeriods && savedPeriods.length > 0) {
        setPeriods(savedPeriods);
      }
      
      // Update timetable assignments to use new period UUIDs
      if (idMapping.size > 0) {
        setTimetableData(prevData => 
          prevData.map(assignment => ({
            ...assignment,
            period_id: idMapping.get(assignment.period_id) || assignment.period_id
          }))
        );
      }
      
      setIsPeriodConfigOpen(false);
    } catch (error) {
      toast.error('Failed to save period configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCellClick = (day: typeof DAYS[number], periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (period?.is_break) return; // Don't allow assignments during breaks

    setSelectedCell({ day, periodId });
    
    // Load existing assignment if any
    const existing = timetableData.find(t => t.day === day && t.period_id === periodId);
    if (existing) {
      setSelectedClass(existing.class_id);
      setSelectedOfficer(existing.teacher_id || '');
      setSelectedSecondaryOfficer(existing.secondary_officer_id || '');
      setSelectedBackupOfficer(existing.backup_officer_id || '');
    } else {
      setSelectedClass('');
      setSelectedOfficer('');
      setSelectedSecondaryOfficer('');
      setSelectedBackupOfficer('');
    }
    
    setIsAssignmentDialogOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!selectedCell || !selectedClass || !selectedOfficer) {
      toast.error('Please select a class and a primary officer');
      return;
    }

    const selectedClassData = classes.find(c => c.id === selectedClass);
    const selectedOfficerData = assignedOfficers.find(o => o.officer_id === selectedOfficer);
    const secondaryOfficerData = selectedSecondaryOfficer ? assignedOfficers.find(o => o.officer_id === selectedSecondaryOfficer) : null;
    const backupOfficerData = selectedBackupOfficer ? assignedOfficers.find(o => o.officer_id === selectedBackupOfficer) : null;
    
    if (!selectedClassData || !selectedOfficerData) return;

    const existingIndex = timetableData.findIndex(
      t => t.day === selectedCell.day && t.period_id === selectedCell.periodId
    );

    const assignment: InstitutionTimetableAssignment = {
      id: existingIndex >= 0 ? timetableData[existingIndex].id : crypto.randomUUID(),
      institution_id: institutionId,
      academic_year: '2024-25',
      day: selectedCell.day,
      period_id: selectedCell.periodId,
      class_id: selectedClass,
      class_name: selectedClassData.class_name,
      subject: selectedOfficerData.officer_name, // Use officer name as subject for compatibility
      teacher_id: selectedOfficer,
      teacher_name: selectedOfficerData.officer_name,
      secondary_officer_id: selectedSecondaryOfficer || undefined,
      secondary_officer_name: secondaryOfficerData?.officer_name,
      backup_officer_id: selectedBackupOfficer || undefined,
      backup_officer_name: backupOfficerData?.officer_name,
      created_at: existingIndex >= 0 ? timetableData[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      const updated = [...timetableData];
      updated[existingIndex] = assignment;
      setTimetableData(updated);
    } else {
      setTimetableData([...timetableData, assignment]);
    }

    setIsAssignmentDialogOpen(false);
    setSelectedCell(null);
    toast.success('Assignment saved');
  };

  const handleDeleteAssignment = (day: typeof DAYS[number], periodId: string) => {
    setTimetableData(timetableData.filter(t => !(t.day === day && t.period_id === periodId)));
    toast.success('Assignment removed');
  };

  const handleSaveTimetable = async () => {
    setIsSaving(true);
    try {
      await onSaveTimetable(timetableData);
      toast.success('Timetable saved successfully');
    } catch (error) {
      toast.error('Failed to save timetable');
    } finally {
      setIsSaving(false);
    }
  };

  const getAssignment = (day: typeof DAYS[number], periodId: string) => {
    return timetableData.find(t => t.day === day && t.period_id === periodId);
  };

  const getClassColor = (classId: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
    ];
    const index = classes.findIndex(c => c.id === classId);
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Institution Timetable</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage weekly timetable for all classes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPeriodConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Periods
          </Button>
          <Button onClick={handleSaveTimetable} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Timetable'}
          </Button>
        </div>
      </div>

      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Periods Configured</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Configure period timings before creating the timetable
            </p>
            <Button onClick={() => setIsPeriodConfigOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Periods
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Weekly Timetable
            </CardTitle>
            <CardDescription>Click on cells to assign classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 gap-2">
                  {/* Header */}
                  <div className="font-semibold text-sm p-2">Period / Day</div>
                  {DAYS.map(day => (
                    <div key={day} className="font-semibold text-sm p-2 text-center">
                      {day}
                    </div>
                  ))}

                  {/* Timetable Grid */}
                  {periods.sort((a, b) => a.display_order - b.display_order).map(period => (
                    <>
                      <div key={`${period.id}-label`} className="p-2 border rounded bg-muted/50">
                        <div className="font-medium text-sm">{period.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {period.start_time} - {period.end_time}
                        </div>
                        {period.is_break && (
                          <Badge variant="secondary" className="text-xs mt-1">Break</Badge>
                        )}
                      </div>
                      {DAYS.map(day => {
                        const assignment = getAssignment(day, period.id);
                        return (
                          <div
                            key={`${day}-${period.id}`}
                            onClick={() => !period.is_break && handleCellClick(day, period.id)}
                            className={cn(
                              "p-2 border rounded min-h-[80px] transition-colors",
                              period.is_break
                                ? "bg-muted/30 cursor-not-allowed"
                                : assignment
                                ? `${getClassColor(assignment.class_id)} cursor-pointer hover:shadow-md`
                                : "hover:bg-muted/50 cursor-pointer"
                            )}
                          >
                            {assignment && !period.is_break ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{assignment.class_name}</div>
                                <div className="flex items-center gap-1 text-xs">
                                  <User className="h-3 w-3" />
                                  {assignment.teacher_name || 'Unassigned'}
                                </div>
                                {(assignment.secondary_officer_name || assignment.backup_officer_name) && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {[assignment.secondary_officer_name, assignment.backup_officer_name].filter(Boolean).length}+ officers
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-full text-xs mt-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAssignment(day, period.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            ) : !period.is_break ? (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <Plus className="h-4 w-4" />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Period Configuration Dialog */}
      <Dialog open={isPeriodConfigOpen} onOpenChange={setIsPeriodConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Period Timings</DialogTitle>
            <DialogDescription>
              Set up the daily schedule with period timings and breaks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingPeriod ? 'Edit Period' : 'Add New Period'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period Label</Label>
                    <Input
                      placeholder="e.g., Period 1, Lunch Break"
                      value={periodLabel}
                      onChange={(e) => setPeriodLabel(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      checked={isBreak}
                      onCheckedChange={setIsBreak}
                      id="is-break"
                    />
                    <Label htmlFor="is-break">Mark as Break</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={periodStartTime}
                      onChange={(e) => setPeriodStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={periodEndTime}
                      onChange={(e) => setPeriodEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={editingPeriod ? handleUpdatePeriod : handleAddPeriod}
                  className="w-full"
                >
                  {editingPeriod ? 'Update Period' : 'Add Period'}
                </Button>
              </CardContent>
            </Card>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {periods.sort((a, b) => a.display_order - b.display_order).map(period => (
                  <Card key={period.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{period.label}</span>
                          {period.is_break && <Badge variant="secondary">Break</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {period.start_time} - {period.end_time}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPeriod(period)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePeriod(period.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setIsPeriodConfigOpen(false);
                setEditingPeriod(null);
                resetPeriodForm();
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSavePeriodConfig} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Officer to Class</DialogTitle>
            <DialogDescription>
              {selectedCell && `Assign an officer for ${selectedCell.day} - ${periods.find(p => p.id === selectedCell.periodId)?.label}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter(c => c.status === 'active').map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Primary Officer *</Label>
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary officer" />
                </SelectTrigger>
                <SelectContent>
                  {assignedOfficers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No officers assigned to this institution
                    </div>
                  ) : (
                    assignedOfficers.filter(o => o.status === 'active').map(officer => (
                      <SelectItem key={officer.officer_id} value={officer.officer_id}>
                        {officer.officer_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {assignedOfficers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Please assign officers to this institution first in the "Innovation Officers" tab.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Secondary Officer (Optional)</Label>
              <Select
                value={selectedSecondaryOfficer || 'none'}
                onValueChange={(v) => setSelectedSecondaryOfficer(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select secondary officer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {assignedOfficers
                    .filter(o => o.status === 'active' && o.officer_id !== selectedOfficer)
                    .map(officer => (
                      <SelectItem key={officer.officer_id} value={officer.officer_id}>
                        {officer.officer_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Co-instructor or alternate teacher</p>
            </div>

            <div className="space-y-2">
              <Label>Backup Officer (Optional)</Label>
              <Select
                value={selectedBackupOfficer || 'none'}
                onValueChange={(v) => setSelectedBackupOfficer(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select backup officer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {assignedOfficers
                    .filter(o => o.status === 'active' && o.officer_id !== selectedOfficer && o.officer_id !== selectedSecondaryOfficer)
                    .map(officer => (
                      <SelectItem key={officer.officer_id} value={officer.officer_id}>
                        {officer.officer_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Replacement when primary/secondary unavailable</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAssignmentDialogOpen(false);
                  setSelectedCell(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSaveAssignment}
                disabled={assignedOfficers.length === 0}
              >
                Save Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
