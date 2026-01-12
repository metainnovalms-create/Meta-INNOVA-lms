import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchAssignees } from '@/services/task.service';

interface Assignee {
  id: string;
  userId?: string;
  name: string;
  position: string;
  avatar?: string;
  type: 'meta_employee' | 'officer';
}

interface AssigneeSelectorProps {
  value: string;
  onValueChange: (assignee: Assignee | null) => void;
}

export function AssigneeSelector({ value, onValueChange }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignees();
  }, []);

  const loadAssignees = async () => {
    try {
      setLoading(true);
      const { metaEmployees, officers } = await fetchAssignees();
      
      const combined: Assignee[] = [
        ...metaEmployees.map(emp => ({
          id: emp.id,
          name: emp.name,
          position: emp.position,
          avatar: emp.avatar,
          type: 'meta_employee' as const,
        })),
        ...officers.map(off => ({
          id: off.userId, // Use user_id for officers
          userId: off.userId,
          name: off.name,
          position: off.position,
          avatar: off.avatar,
          type: 'officer' as const,
        })),
      ];
      
      setAssignees(combined);
    } catch (error) {
      console.error('Error loading assignees:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssignee = assignees.find(a => a.id === value);
  const metaEmployees = assignees.filter(a => a.type === 'meta_employee');
  const officers = assignees.filter(a => a.type === 'officer');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedAssignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedAssignee.avatar} />
                <AvatarFallback>
                  {selectedAssignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedAssignee.name}</span>
              <span className="text-muted-foreground text-xs">
                - {selectedAssignee.position}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {loading ? 'Loading...' : 'Search and select assignee...'}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search employees..." />
          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>
            
            {metaEmployees.length > 0 && (
              <CommandGroup heading="Meta Employees">
                {metaEmployees.map((assignee) => (
                  <CommandItem
                    key={assignee.id}
                    value={`${assignee.name} ${assignee.position}`}
                    onSelect={() => {
                      onValueChange(assignee.id === value ? null : assignee);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === assignee.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={assignee.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{assignee.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {assignee.position}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {officers.length > 0 && (
              <CommandGroup heading="Innovation Officers">
                {officers.map((assignee) => (
                  <CommandItem
                    key={assignee.id}
                    value={`${assignee.name} ${assignee.position}`}
                    onSelect={() => {
                      onValueChange(assignee.id === value ? null : assignee);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === assignee.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={assignee.avatar} />
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{assignee.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {assignee.position}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
