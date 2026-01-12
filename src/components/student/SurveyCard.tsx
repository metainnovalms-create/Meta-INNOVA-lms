import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText } from "lucide-react";
import { Survey } from "@/data/mockSurveyData";
import { format, differenceInDays } from "date-fns";

interface SurveyCardProps {
  survey: Survey;
  isCompleted: boolean;
  onTakeSurvey: (survey: Survey) => void;
}

export function SurveyCard({ survey, isCompleted, onTakeSurvey }: SurveyCardProps) {
  const deadline = new Date(survey.deadline);
  const daysLeft = differenceInDays(deadline, new Date());
  const isOverdue = daysLeft < 0;

  return (
    <Card className={isCompleted ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{survey.title}</CardTitle>
            <CardDescription>{survey.description}</CardDescription>
          </div>
          <Badge variant={isCompleted ? "secondary" : isOverdue ? "destructive" : "default"}>
            {isCompleted ? "Completed" : isOverdue ? "Overdue" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{(survey as any).survey_questions?.length ?? survey.questions?.length ?? 0} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {format(deadline, 'MMM d, yyyy')}</span>
            </div>
            {!isCompleted && !isOverdue && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className={daysLeft <= 2 ? "text-destructive font-medium" : ""}>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              By {survey.created_by_name}
            </p>
            <Button
              onClick={() => onTakeSurvey(survey)}
              disabled={isCompleted || isOverdue}
              variant={isCompleted ? "secondary" : "default"}
            >
              {isCompleted ? "View Responses" : "Take Survey"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
