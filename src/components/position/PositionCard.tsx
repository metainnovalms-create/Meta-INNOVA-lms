import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomPosition } from '@/types/permissions';
import { Users, Edit, Trash2, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PositionCardProps {
  position: CustomPosition;
  isSelected: boolean;
  userCount: number;
  isCEO: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PositionCard({
  position,
  isSelected,
  userCount,
  isCEO,
  onSelect,
  onEdit,
  onDelete
}: PositionCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {position.is_ceo_position ? (
              <Crown className="h-4 w-4 text-yellow-600" />
            ) : (
              <Shield className="h-4 w-4 text-primary" />
            )}
            <span className="line-clamp-1">{position.display_name}</span>
          </div>
          {position.is_ceo_position && isCEO && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 text-xs">
              You
            </Badge>
          )}
        </CardTitle>
        {position.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {position.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">Users</span>
          </div>
          <Badge variant="secondary">{userCount}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Menus</span>
          <Badge variant="secondary">{position.visible_features.length}</Badge>
        </div>
        <div className="flex gap-1 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onEdit}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {!position.is_ceo_position && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
