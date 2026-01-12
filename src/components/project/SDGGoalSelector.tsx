import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const SDG_GOALS = [
  { id: 1, name: 'No Poverty', color: '#E5243B' },
  { id: 2, name: 'Zero Hunger', color: '#DDA63A' },
  { id: 3, name: 'Good Health and Well-being', color: '#4C9F38' },
  { id: 4, name: 'Quality Education', color: '#C5192D' },
  { id: 5, name: 'Gender Equality', color: '#FF3A21' },
  { id: 6, name: 'Clean Water and Sanitation', color: '#26BDE2' },
  { id: 7, name: 'Affordable and Clean Energy', color: '#FCC30B' },
  { id: 8, name: 'Decent Work and Economic Growth', color: '#A21942' },
  { id: 9, name: 'Industry, Innovation and Infrastructure', color: '#FD6925' },
  { id: 10, name: 'Reduced Inequalities', color: '#DD1367' },
  { id: 11, name: 'Sustainable Cities and Communities', color: '#FD9D24' },
  { id: 12, name: 'Responsible Consumption and Production', color: '#BF8B2E' },
  { id: 13, name: 'Climate Action', color: '#3F7E44' },
  { id: 14, name: 'Life Below Water', color: '#0A97D9' },
  { id: 15, name: 'Life on Land', color: '#56C02B' },
  { id: 16, name: 'Peace, Justice and Strong Institutions', color: '#00689D' },
  { id: 17, name: 'Partnerships for the Goals', color: '#19486A' },
];

interface SDGGoalSelectorProps {
  selectedGoals: number[];
  onChange: (goals: number[]) => void;
  compact?: boolean;
}

export function SDGGoalSelector({ selectedGoals, onChange, compact = false }: SDGGoalSelectorProps) {
  const handleToggle = (goalId: number) => {
    if (selectedGoals.includes(goalId)) {
      onChange(selectedGoals.filter(id => id !== goalId));
    } else {
      onChange([...selectedGoals, goalId]);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {SDG_GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <Badge
              key={goal.id}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all text-xs px-2 py-0.5',
                isSelected && 'text-white'
              )}
              style={isSelected ? { backgroundColor: goal.color, borderColor: goal.color } : {}}
              onClick={() => handleToggle(goal.id)}
            >
              SDG {goal.id}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
      {SDG_GOALS.map((goal) => {
        const isSelected = selectedGoals.includes(goal.id);
        return (
          <div
            key={goal.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-all',
              isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
            )}
            onClick={() => handleToggle(goal.id)}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleToggle(goal.id)}
              className="pointer-events-none"
            />
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: goal.color }}
            >
              {goal.id}
            </div>
            <Label className="text-xs cursor-pointer line-clamp-1">{goal.name}</Label>
          </div>
        );
      })}
    </div>
  );
}

interface SDGGoalBadgesProps {
  goals: number[];
  maxDisplay?: number;
}

export function SDGGoalBadges({ goals, maxDisplay = 5 }: SDGGoalBadgesProps) {
  const displayGoals = goals.slice(0, maxDisplay);
  const remaining = goals.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayGoals.map((goalId) => {
        const goal = SDG_GOALS.find(g => g.id === goalId);
        if (!goal) return null;
        return (
          <Badge
            key={goalId}
            className="text-white text-xs px-1.5 py-0"
            style={{ backgroundColor: goal.color }}
            title={goal.name}
          >
            SDG {goal.id}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs px-1.5 py-0">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}
