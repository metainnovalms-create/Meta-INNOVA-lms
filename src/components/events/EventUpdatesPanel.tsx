import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ExternalLink, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useEventUpdates, useAddEventUpdate, useDeleteEventUpdate } from '@/hooks/useEvents';
import { Event, EventUpdate } from '@/types/events';

interface EventUpdatesPanelProps {
  event: Event;
  canEdit?: boolean;
}

// Extended type for updates with targeting info
interface ExtendedEventUpdate extends EventUpdate {
  for_interested_only?: boolean;
}

export function EventUpdatesPanel({ event, canEdit = false }: EventUpdatesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');
  const [forInterestedOnly, setForInterestedOnly] = useState(false);

  const { data: updates, isLoading } = useEventUpdates(event.id);
  const addUpdate = useAddEventUpdate();
  const deleteUpdate = useDeleteEventUpdate();

  const handleAddUpdate = async () => {
    if (!newTitle.trim()) return;

    // Include targeting info in content if for interested students only
    const contentWithMeta = forInterestedOnly 
      ? `[FOR_INTERESTED_ONLY]\n${newContent || ''}`
      : newContent;

    await addUpdate.mutateAsync({
      eventId: event.id,
      update: {
        title: newTitle,
        content: contentWithMeta || undefined,
        link_url: newLink || undefined,
      },
    });

    setNewTitle('');
    setNewContent('');
    setNewLink('');
    setForInterestedOnly(false);
    setShowAddForm(false);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    await deleteUpdate.mutateAsync({ updateId, eventId: event.id });
  };

  // Check if update is for interested students only
  const isForInterestedOnly = (update: EventUpdate): boolean => {
    return update.content?.startsWith('[FOR_INTERESTED_ONLY]') || false;
  };

  // Get clean content without the meta tag
  const getCleanContent = (update: EventUpdate): string | undefined => {
    if (!update.content) return undefined;
    return update.content.replace('[FOR_INTERESTED_ONLY]\n', '').replace('[FOR_INTERESTED_ONLY]', '');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Event Updates</CardTitle>
        {canEdit && !showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showAddForm && canEdit && (
          <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Update Title *</Label>
              <Input
                placeholder="e.g., Registration deadline extended"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Optional)</Label>
              <Textarea
                placeholder="Additional details..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL (Optional)</Label>
              <Input
                placeholder="https://..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="forInterestedOnly"
                checked={forInterestedOnly}
                onCheckedChange={(checked) => setForInterestedOnly(checked === true)}
              />
              <Label htmlFor="forInterestedOnly" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                <Users className="h-4 w-4" />
                Send to interested students only
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddUpdate}
                disabled={addUpdate.isPending || !newTitle.trim()}
              >
                {addUpdate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Update
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : updates && updates.length > 0 ? (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{update.title}</h4>
                        {isForInterestedOnly(update) && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Interested Only
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(update.created_at), 'PPP p')}
                      </p>
                      {getCleanContent(update) && (
                        <p className="text-sm text-muted-foreground mt-2">{getCleanContent(update)}</p>
                      )}
                      {update.link_url && (
                        <a
                          href={update.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Link
                        </a>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDeleteUpdate(update.id)}
                        disabled={deleteUpdate.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No updates yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
