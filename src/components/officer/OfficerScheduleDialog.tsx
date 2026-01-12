import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OfficerDetails } from "@/services/systemadmin.service";
import { getOfficerTimetable } from "@/data/mockOfficerTimetable";
import { OfficerTimetablePreview } from "./OfficerTimetablePreview";
import { OfficerTimetableAssignmentDialog } from "./OfficerTimetableAssignmentDialog";
import { OfficerTimetableSlot } from "@/types/officer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit } from "lucide-react";
import { useState } from "react";

interface OfficerScheduleDialogProps {
  officer: OfficerDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (officerId: string, slots: OfficerTimetableSlot[]) => void;
}

export function OfficerScheduleDialog({
  officer,
  open,
  onOpenChange,
  onSave,
}: OfficerScheduleDialogProps) {
  const [editMode, setEditMode] = useState(false);

  if (!officer) return null;

  const timetable = getOfficerTimetable(officer.id);

  const handleSave = (slots: OfficerTimetableSlot[]) => {
    if (officer && onSave) {
      onSave(officer.id, slots);
    }
    setEditMode(false);
  };

  // If in edit mode, show the assignment dialog
  if (editMode) {
    return (
      <OfficerTimetableAssignmentDialog
        open={open}
        onOpenChange={(open) => {
          if (!open) setEditMode(false);
          onOpenChange(open);
        }}
        officer={officer}
        existingSlots={timetable?.slots || []}
        onSave={handleSave}
      />
    );
  }

  if (!timetable || timetable.slots.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Officer Schedule - {officer.name}</DialogTitle>
          </DialogHeader>
          <div className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No schedule assigned yet.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'not_assigned':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>STEM Class Schedule - {officer.name}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-normal">
                <Clock className="h-4 w-4" />
                <span className="text-muted-foreground">
                  Total: {timetable.total_hours} hrs/week
                </span>
              </div>
              <Badge variant={getStatusColor(timetable.status)}>
                {timetable.status.replace('_', ' ')}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditMode(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Weekly Timetable Grid */}
          <Card>
            <CardContent className="pt-6">
              <OfficerTimetablePreview slots={timetable.slots} />
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Activity Types</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border border-blue-300" />
                    <span className="text-sm">Workshop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 border border-green-300" />
                    <span className="text-sm">Lab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-300" />
                    <span className="text-sm">Mentoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900 border border-purple-300" />
                    <span className="text-sm">Project Review</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-xs text-muted-foreground text-right">
            Last updated: {new Date(timetable.last_updated).toLocaleDateString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
