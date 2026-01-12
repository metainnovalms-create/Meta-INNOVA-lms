import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstitutionEventsCalendar } from './InstitutionEventsCalendar';
import { mockInstitutions } from '@/data/mockInstitutionData';
import { Building2 } from 'lucide-react';

export function InstitutionSpecificCalendar() {
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  
  // Convert mockInstitutions object to array
  const institutionsArray = Object.values(mockInstitutions);

  // Initialize with first institution
  useEffect(() => {
    if (institutionsArray.length > 0 && !selectedInstitution) {
      setSelectedInstitution(institutionsArray[0].id);
    }
  }, [selectedInstitution, institutionsArray.length]);

  return (
    <div className="space-y-6">
      {/* Institution Selector */}
      <div className="flex items-center gap-4 p-4 bg-card border rounded-lg">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <Label htmlFor="institution-select" className="text-sm font-medium">
          Select Institution:
        </Label>
        <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
          <SelectTrigger id="institution-select" className="w-[450px]">
            <SelectValue placeholder="Choose an institution" />
          </SelectTrigger>
          <SelectContent>
            {institutionsArray.map(inst => (
              <SelectItem key={inst.id} value={inst.id}>
                <div className="flex flex-col py-1">
                  <span className="font-medium">{inst.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {inst.code} • {inst.location}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar for selected institution */}
      {selectedInstitution && (
        <InstitutionEventsCalendar 
          mode="institution" 
          institutionId={selectedInstitution}
        />
      )}
    </div>
  );
}
