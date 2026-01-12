import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Feedback } from '@/data/mockFeedbackData';
import { Star, MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface FeedbackManagementCardProps {
  feedback: Feedback;
  onUpdate: (id: string, updates: Partial<Feedback>) => void;
}

export function FeedbackManagementCard({ feedback, onUpdate }: FeedbackManagementCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [response, setResponse] = useState('');

  const handleStatusChange = (status: Feedback['status']) => {
    onUpdate(feedback.id, {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'System Admin'
    });
    toast.success(`Feedback status updated to ${status}`);
  };

  const handleSendResponse = () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    onUpdate(feedback.id, {
      admin_response: response,
      admin_response_at: new Date().toISOString(),
      status: 'resolved'
    });
    
    setResponse('');
    setIsReplying(false);
    toast.success('Response sent to student');
  };

  const getStatusIcon = () => {
    switch (feedback.status) {
      case 'submitted':
        return <AlertCircle className="h-4 w-4" />;
      case 'under_review':
        return <MessageSquare className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (feedback.status) {
      case 'submitted':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'resolved':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'dismissed':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{feedback.subject}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{feedback.category}</Badge>
              <Badge className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1">{feedback.status.replace('_', ' ')}</span>
              </Badge>
              <Badge variant="secondary">{feedback.institution_name}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student Info */}
        <div className="text-sm">
          <p className="text-muted-foreground">
            From: <span className="font-medium text-foreground">
              {feedback.is_anonymous ? 'Anonymous' : feedback.student_name || feedback.student_id}
            </span>
          </p>
          <p className="text-muted-foreground">
            Submitted: {new Date(feedback.submitted_at).toLocaleDateString()} at {new Date(feedback.submitted_at).toLocaleTimeString()}
          </p>
        </div>

        {/* Rating */}
        {feedback.rating && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < feedback.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feedback Text */}
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm">{feedback.feedback_text}</p>
        </div>

        {/* Admin Response (if exists) */}
        {feedback.admin_response && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-sm font-medium mb-1">Admin Response:</p>
            <p className="text-sm">{feedback.admin_response}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Responded by {feedback.reviewed_by} on {feedback.admin_response_at && new Date(feedback.admin_response_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Select value={feedback.status} onValueChange={(value: any) => handleStatusChange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          {!feedback.admin_response && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isReplying ? 'Cancel Reply' : 'Reply to Student'}
            </Button>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="space-y-2 p-3 border rounded-md">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response to the student..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSendResponse}>
                Send Response
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
