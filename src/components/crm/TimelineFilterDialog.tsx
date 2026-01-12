import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: TimelineFilters) => void;
  institutions: { id: string; name: string }[];
}

export interface TimelineFilters {
  startDate?: string;
  endDate?: string;
  institutionId?: string;
  eventTypes: string[];
}

const EVENT_TYPES = [
  { id: 'call', label: 'Phone Calls' },
  { id: 'email', label: 'Emails' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'visit', label: 'Site Visits' },
  { id: 'follow_up', label: 'Follow-ups' },
];

export function TimelineFilterDialog({ 
  open, 
  onOpenChange, 
  onApplyFilters,
  institutions 
}: TimelineFilterDialogProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    EVENT_TYPES.map(t => t.id)
  );

  const handleEventTypeToggle = (eventId: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleApply = () => {
    const filters: TimelineFilters = {
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      institutionId: selectedInstitution !== 'all' ? selectedInstitution : undefined,
      eventTypes: selectedEventTypes,
    };
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedInstitution('all');
    setSelectedEventTypes(EVENT_TYPES.map(t => t.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filter Timeline</DialogTitle>
          <DialogDescription>
            Apply filters to customize your timeline view
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="space-y-4">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Institution Filter */}
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
              <SelectTrigger>
                <SelectValue placeholder="All institutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Types */}
          <div className="space-y-3">
            <Label>Event Types</Label>
            <div className="space-y-2">
              {EVENT_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={selectedEventTypes.includes(type.id)}
                    onCheckedChange={() => handleEventTypeToggle(type.id)}
                  />
                  <Label
                    htmlFor={type.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset Filters
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
