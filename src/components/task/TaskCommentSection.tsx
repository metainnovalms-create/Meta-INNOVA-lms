import { useState, useEffect, useRef } from 'react';
import { TaskComment } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { useRealtimeTaskComments } from '@/hooks/useRealtimeTasks';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskCommentSectionProps {
  taskId: string;
  comments: TaskComment[];
  onAddComment: (comment: string) => Promise<void>;
}

export function TaskCommentSection({ taskId, comments: initialComments, onAddComment }: TaskCommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Use real-time comments hook
  const { comments } = useRealtimeTaskComments(taskId, initialComments);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = async () => {
    if (newComment.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onAddComment(newComment.trim());
        setNewComment('');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-[300px]" ref={scrollRef}>
        <div className="space-y-3 pr-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-in fade-in-50 duration-300">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {comment.user_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">{comment.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment... (Press Enter to send)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] resize-none"
          disabled={isSubmitting}
        />
        <Button 
          onClick={handleSubmit} 
          size="icon" 
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
