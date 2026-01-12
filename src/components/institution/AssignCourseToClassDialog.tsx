import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { InstitutionClass } from '@/types/institution';
import { useCourses, useCourseById } from '@/hooks/useCourses';
import { useAssignCourseToClass, useClassCourseAssignments, UnlockMode } from '@/hooks/useClassCourseAssignments';
import { BookOpen, Check, ChevronRight, Lock, Unlock, Loader2, Link2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModuleConfig {
  moduleId: string;
  title: string;
  displayOrder: number;
  isSelected: boolean;
  isUnlocked: boolean;
  unlockMode: UnlockMode;
  isAlreadyAssigned: boolean;
  sessions: SessionConfig[];
}

interface SessionConfig {
  sessionId: string;
  title: string;
  displayOrder: number;
  isSelected: boolean;
  isUnlocked: boolean;
  unlockMode: UnlockMode;
  isAlreadyAssigned: boolean;
}

interface AssignCourseToClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classData: InstitutionClass;
  onAssignCourse: (assignment: any) => Promise<void>;
}

export function AssignCourseToClassDialog({
  isOpen,
  onOpenChange,
  classData,
  onAssignCourse
}: AssignCourseToClassDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>([]);
  const [globalUnlockMode, setGlobalUnlockMode] = useState<UnlockMode>('manual');

  const { data: courses = [], isLoading: isLoadingCourses } = useCourses();
  const { data: selectedCourse, isLoading: isLoadingCourse } = useCourseById(selectedCourseId);
  const { data: existingAssignments = [] } = useClassCourseAssignments(classData.id);
  const assignCourse = useAssignCourseToClass();

  // Build sets of already assigned module/session IDs for the selected course
  const existingAssignmentData = useMemo(() => {
    if (!selectedCourseId) return { moduleIds: new Set<string>(), sessionIds: new Set<string>() };
    
    const courseAssignment = existingAssignments.find(a => a.course_id === selectedCourseId);
    if (!courseAssignment) return { moduleIds: new Set<string>(), sessionIds: new Set<string>() };

    const moduleIds = new Set<string>();
    const sessionIds = new Set<string>();

    courseAssignment.module_assignments?.forEach(ma => {
      moduleIds.add(ma.module_id);
      ma.session_assignments?.forEach(sa => {
        sessionIds.add(sa.session_id);
      });
    });

    return { moduleIds, sessionIds };
  }, [selectedCourseId, existingAssignments]);

  // Initialize module configs when course is selected
  useEffect(() => {
    if (selectedCourse?.modules) {
      const configs: ModuleConfig[] = selectedCourse.modules.map((module, index) => {
        const isModuleAssigned = existingAssignmentData.moduleIds.has(module.id);
        return {
          moduleId: module.id,
          title: module.title,
          displayOrder: module.display_order,
          isSelected: true,
          isUnlocked: index === 0, // First module unlocked by default
          unlockMode: index === 0 ? 'manual' : globalUnlockMode,
          isAlreadyAssigned: isModuleAssigned,
          sessions: (module.sessions || []).map((session, sIndex) => ({
            sessionId: session.id,
            title: session.title,
            displayOrder: session.display_order,
            isSelected: true,
            isUnlocked: sIndex === 0, // First session unlocked by default
            unlockMode: sIndex === 0 ? 'manual' : globalUnlockMode,
            isAlreadyAssigned: existingAssignmentData.sessionIds.has(session.id),
          })),
        };
      });
      setModuleConfigs(configs);
    }
  }, [selectedCourse, globalUnlockMode, existingAssignmentData]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentStep(2);
  };

  const handleModuleToggle = (moduleId: string) => {
    setModuleConfigs(prev => prev.map(mod => 
      mod.moduleId === moduleId 
        ? { ...mod, isSelected: !mod.isSelected }
        : mod
    ));
  };

  const handleModuleUnlockToggle = (moduleId: string) => {
    setModuleConfigs(prev => prev.map(mod => 
      mod.moduleId === moduleId 
        ? { ...mod, isUnlocked: !mod.isUnlocked, unlockMode: !mod.isUnlocked ? 'manual' : mod.unlockMode }
        : mod
    ));
  };

  const handleModuleUnlockModeChange = (moduleId: string, mode: UnlockMode) => {
    setModuleConfigs(prev => prev.map(mod => 
      mod.moduleId === moduleId 
        ? { ...mod, unlockMode: mode, isUnlocked: mode === 'manual' ? mod.isUnlocked : false }
        : mod
    ));
  };

  const handleSessionToggle = (moduleId: string, sessionId: string) => {
    setModuleConfigs(prev => prev.map(mod => 
      mod.moduleId === moduleId 
        ? {
            ...mod,
            sessions: mod.sessions.map(sess =>
              sess.sessionId === sessionId
                ? { ...sess, isSelected: !sess.isSelected }
                : sess
            ),
          }
        : mod
    ));
  };

  const handleSessionUnlockToggle = (moduleId: string, sessionId: string) => {
    setModuleConfigs(prev => prev.map(mod => 
      mod.moduleId === moduleId 
        ? {
            ...mod,
            sessions: mod.sessions.map(sess =>
              sess.sessionId === sessionId
                ? { ...sess, isUnlocked: !sess.isUnlocked, unlockMode: !sess.isUnlocked ? 'manual' : sess.unlockMode }
                : sess
            ),
          }
        : mod
    ));
  };

  const handleSessionUnlockModeChange = (moduleId: string, sessionId: string, mode: UnlockMode) => {
    setModuleConfigs(prev => prev.map(mod => 
      mod.moduleId === moduleId 
        ? {
            ...mod,
            sessions: mod.sessions.map(sess =>
              sess.sessionId === sessionId
                ? { ...sess, unlockMode: mode, isUnlocked: mode === 'manual' ? sess.isUnlocked : false }
                : sess
            ),
          }
        : mod
    ));
  };

  const applyGlobalUnlockMode = (mode: UnlockMode) => {
    setGlobalUnlockMode(mode);
    setModuleConfigs(prev => prev.map((mod, index) => ({
      ...mod,
      unlockMode: index === 0 ? 'manual' : mode,
      isUnlocked: index === 0 ? true : (mode === 'manual' ? mod.isUnlocked : false),
      sessions: mod.sessions.map((sess, sIndex) => ({
        ...sess,
        unlockMode: sIndex === 0 ? 'manual' : mode,
        isUnlocked: sIndex === 0 ? true : (mode === 'manual' ? sess.isUnlocked : false),
      })),
    })));
  };

  const handleNext = () => {
    const selectedModules = moduleConfigs.filter(m => m.isSelected);
    if (currentStep === 2 && selectedModules.length === 0) {
      toast.error('Please select at least one level');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleAssign = async () => {
    if (!selectedCourse || !selectedCourseId) return;

    const selectedModules = moduleConfigs.filter(m => m.isSelected);

    try {
      await assignCourse.mutateAsync({
        classId: classData.id,
        courseId: selectedCourseId,
        institutionId: classData.institution_id,
        modules: selectedModules.map((mod, index) => ({
          moduleId: mod.moduleId,
          isUnlocked: mod.isUnlocked,
          unlockOrder: index + 1,
          unlockMode: mod.unlockMode,
          sessions: mod.sessions
            .filter(sess => sess.isSelected)
            .map((sess, sessIndex) => ({
              sessionId: sess.sessionId,
              isUnlocked: sess.isUnlocked,
              unlockOrder: sessIndex + 1,
              unlockMode: sess.unlockMode,
            })),
        })),
      });

      // Also call the parent callback for any additional handling
      await onAssignCourse({
        course_id: selectedCourseId,
        course_title: selectedCourse.title,
        course_category: selectedCourse.category,
        class_id: classData.id,
        assigned_modules: selectedModules.map((mod, index) => ({
          module_id: mod.moduleId,
          module_title: mod.title,
          module_order: index + 1,
          is_unlocked: mod.isUnlocked,
          unlock_mode: mod.isUnlocked ? 'immediate' : 'manual',
        })),
        status: 'active'
      });

      handleReset();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedCourseId(null);
    setModuleConfigs([]);
    setGlobalUnlockMode('manual');
    onOpenChange(false);
  };

  const selectedModules = moduleConfigs.filter(m => m.isSelected);
  const selectedCourseData = courses.find(c => c.id === selectedCourseId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Course to {classData.class_name} - Step {currentStep} of 3</DialogTitle>
          <DialogDescription>
            {currentStep === 1 && 'Select a course to assign'}
            {currentStep === 2 && 'Choose levels and sessions with lock/unlock settings'}
            {currentStep === 3 && 'Review and confirm'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(step => (
            <div 
              key={step} 
              className={`h-1 flex-1 rounded ${step <= currentStep ? 'bg-primary' : 'bg-muted'}`} 
            />
          ))}
        </div>

        {/* Step 1: Select Course */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {isLoadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No courses available to assign</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid gap-3">
                  {courses.map(course => (
                    <Card 
                      key={course.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleCourseSelect(course.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{course.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <Badge variant="outline">{course.course_code}</Badge>
                          <Badge variant="outline" className="capitalize">{course.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Step 2: Select Modules and Sessions with Lock/Unlock */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {isLoadingCourse ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* Global Unlock Mode Selector */}
                <Card className="bg-muted/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                      <div>
                          <p className="font-medium text-sm">Unlock Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Choose how levels and sessions are unlocked
                          </p>
                        </div>
                      </div>
                      <Select value={globalUnlockMode} onValueChange={(v) => applyGlobalUnlockMode(v as UnlockMode)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Unlock</SelectItem>
                          <SelectItem value="sequential">Auto Sequential</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {globalUnlockMode === 'sequential' && (
                      <p className="text-xs text-muted-foreground mt-2 pl-7">
                        Next level/session unlocks automatically when previous one is completed
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{selectedModules.length} of {moduleConfigs.length} levels selected</span>
                    {moduleConfigs.some(m => m.isAlreadyAssigned) && (
                      <span className="text-green-600 dark:text-green-400">
                        • {moduleConfigs.filter(m => m.isAlreadyAssigned).length} already assigned
                      </span>
                    )}
                    {moduleConfigs.some(m => !m.isAlreadyAssigned) && (
                      <span className="text-blue-600 dark:text-blue-400">
                        • {moduleConfigs.filter(m => !m.isAlreadyAssigned).length} new
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setModuleConfigs(prev => prev.map(m => ({ ...m, isSelected: true })))}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setModuleConfigs(prev => prev.map(m => ({ ...m, isSelected: false })))}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {moduleConfigs.map((module, moduleIndex) => (
                      <Card 
                        key={module.moduleId}
                        className={cn(
                          "transition-colors",
                          module.isSelected && "border-primary bg-primary/5"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={module.isSelected}
                                onCheckedChange={() => handleModuleToggle(module.moduleId)}
                              />
                              <div className="flex items-center gap-2">
                                <p className="font-medium">Level {moduleIndex + 1}: {module.title}</p>
                                {module.isAlreadyAssigned && (
                                  <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Already Assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {module.isSelected && (
                              <div className="flex items-center gap-3">
                                {module.unlockMode === 'sequential' && moduleIndex > 0 ? (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Link2 className="h-3 w-3" />
                                    Auto Unlock
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm text-muted-foreground">
                                      {module.isUnlocked ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                          <Unlock className="h-4 w-4" /> Unlocked
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <Lock className="h-4 w-4" /> Locked
                                        </span>
                                      )}
                                    </Label>
                                    <Switch
                                      checked={module.isUnlocked}
                                      onCheckedChange={() => handleModuleUnlockToggle(module.moduleId)}
                                    />
                                  </div>
                                )}
                                <Select 
                                  value={module.unlockMode} 
                                  onValueChange={(v) => handleModuleUnlockModeChange(module.moduleId, v as UnlockMode)}
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="sequential">Sequential</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        {module.isSelected && module.sessions.length > 0 && (
                          <CardContent className="pt-0">
                            <div className="pl-8 space-y-2">
                              <Label className="text-xs text-muted-foreground">Sessions:</Label>
                              {module.sessions.map((session, sessionIndex) => (
                                <div 
                                  key={session.sessionId}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded border",
                                    session.isSelected && "bg-muted/50"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox 
                                      checked={session.isSelected}
                                      onCheckedChange={() => handleSessionToggle(module.moduleId, session.sessionId)}
                                    />
                                    <span className="text-sm">
                                      Session {sessionIndex + 1}: {session.title}
                                    </span>
                                    {session.isAlreadyAssigned && (
                                      <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Assigned
                                      </Badge>
                                    )}
                                  </div>
                                  {session.isSelected && (
                                    <div className="flex items-center gap-2">
                                      {session.unlockMode === 'sequential' && sessionIndex > 0 ? (
                                        <Badge variant="outline" className="text-xs gap-1">
                                          <Link2 className="h-3 w-3" />
                                          Auto
                                        </Badge>
                                      ) : (
                                        <>
                                          <span className="text-xs text-muted-foreground">
                                            {session.isUnlocked ? 'Unlocked' : 'Locked'}
                                          </span>
                                          <Switch
                                            checked={session.isUnlocked}
                                            onCheckedChange={() => handleSessionUnlockToggle(module.moduleId, session.sessionId)}
                                            className="scale-75"
                                          />
                                        </>
                                      )}
                                      <Select 
                                        value={session.unlockMode} 
                                        onValueChange={(v) => handleSessionUnlockModeChange(module.moduleId, session.sessionId, v as UnlockMode)}
                                      >
                                        <SelectTrigger className="w-[100px] h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="manual">Manual</SelectItem>
                                          <SelectItem value="sequential">Sequential</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && selectedCourseData && (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assignment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Course:</span>
                    <span className="font-medium">{selectedCourseData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Class:</span>
                    <span className="font-medium">{classData.class_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Levels Selected:</span>
                    <span className="font-medium">{selectedModules.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Levels & Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedModules.map((module, index) => {
                      const selectedSessions = module.sessions.filter(s => s.isSelected);
                      return (
                        <div key={module.moduleId} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">Level {index + 1}: {module.title}</p>
                            <Badge variant={module.isUnlocked ? "default" : "secondary"}>
                              {module.isUnlocked ? (
                                <><Unlock className="h-3 w-3 mr-1" /> Unlocked</>
                              ) : (
                                <><Lock className="h-3 w-3 mr-1" /> Locked</>
                              )}
                            </Badge>
                          </div>
                          {selectedSessions.length > 0 && (
                            <div className="pl-4 space-y-1">
                              {selectedSessions.map((session, sIndex) => (
                                <div key={session.sessionId} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Session {sIndex + 1}: {session.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {session.isUnlocked ? 'Unlocked' : 'Locked'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => currentStep === 1 ? handleReset() : setCurrentStep(currentStep - 1)}
            disabled={assignCourse.isPending}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button 
            onClick={currentStep === 3 ? handleAssign : handleNext}
            disabled={assignCourse.isPending || (currentStep === 2 && selectedModules.length === 0)}
          >
            {assignCourse.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : currentStep === 3 ? (
              'Assign Course'
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
