import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, MessageSquare } from "lucide-react";
import { Feedback } from "@/data/mockFeedbackData";
import { format } from "date-fns";

interface FeedbackItemProps {
  feedback: Feedback;
}

export function FeedbackItem({ feedback }: FeedbackItemProps) {
  const getStatusColor = (status: Feedback['status']) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'under_review':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'dismissed':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryLabel = (category: Feedback['category']) => {
    switch (category) {
      case 'course':
        return 'Course';
      case 'officer':
        return 'Officer';
      case 'facility':
        return 'Facility';
      case 'general':
        return 'General';
      case 'other':
        return 'Other';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{getCategoryLabel(feedback.category)}</Badge>
              <Badge className={getStatusColor(feedback.status)}>
                {feedback.status.replace('_', ' ')}
              </Badge>
              {feedback.is_anonymous && (
                <Badge variant="secondary">Anonymous</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg">{feedback.subject}</h3>
            {feedback.related_course_id && (
              <p className="text-sm text-muted-foreground mt-1">
                Related to Course ID: {feedback.related_course_id}
              </p>
            )}
            {feedback.related_officer_id && (
              <p className="text-sm text-muted-foreground mt-1">
                Related to Officer ID: {feedback.related_officer_id}
              </p>
            )}
          </div>
          {feedback.rating && (
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < feedback.rating!
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {feedback.feedback_text}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Submitted {format(new Date(feedback.submitted_at), 'MMM d, yyyy')}</span>
          </div>
          {feedback.admin_response_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Responded {format(new Date(feedback.admin_response_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {feedback.admin_response && (
          <div className="bg-muted rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Admin Response</span>
            </div>
            <p className="text-sm text-muted-foreground">{feedback.admin_response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
