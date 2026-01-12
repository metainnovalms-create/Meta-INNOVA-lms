import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, Clock, Phone, Mail } from "lucide-react";
import { InstitutionEngagement } from "@/data/mockInstitutionEngagement";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";

interface AtRiskInstitutionsProps {
  data: InstitutionEngagement[];
}

export function AtRiskInstitutions({ data }: AtRiskInstitutionsProps) {
  const atRiskInstitutions = data
    .filter(inst => inst.risk_level === 'high' || inst.engagement_score < 60)
    .sort((a, b) => a.engagement_score - b.engagement_score);

  const handleContactInstitution = (name: string) => {
    toast.info(`Opening communication dialog for ${name}`);
  };

  const handleScheduleMeeting = (name: string) => {
    toast.info(`Scheduling intervention meeting with ${name}`);
  };

  return (
    <Card className="border-red-500/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-600">At-Risk Institutions</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Institutions requiring immediate attention and intervention
        </p>
      </CardHeader>
      <CardContent>
        {atRiskInstitutions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No institutions at risk - great work! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atRiskInstitutions.map((institution) => (
              <Card key={institution.institution_id} className="border-red-500/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{institution.institution_name}</h4>
                        <p className="text-sm text-muted-foreground">Period: {institution.period}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                          {institution.risk_level.toUpperCase()} RISK
                        </Badge>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{institution.engagement_score}%</p>
                          <p className="text-xs text-muted-foreground">Engagement Score</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Issues */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600">Critical Issues:</p>
                      <div className="grid gap-2">
                        {institution.course_metrics.average_completion_rate < 50 && (
                          <div className="flex items-center gap-2 text-sm bg-red-500/10 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span>Low course completion: {institution.course_metrics.average_completion_rate}%</span>
                          </div>
                        )}
                        {institution.course_metrics.inactive_students > institution.course_metrics.active_students * 0.3 && (
                          <div className="flex items-center gap-2 text-sm bg-red-500/10 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span>High inactive students: {institution.course_metrics.inactive_students}</span>
                          </div>
                        )}
                        {institution.assessment_metrics.average_participation_rate < 50 && (
                          <div className="flex items-center gap-2 text-sm bg-red-500/10 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span>Low assessment participation: {institution.assessment_metrics.average_participation_rate}%</span>
                          </div>
                        )}
                        {institution.days_since_last_activity > 7 && (
                          <div className="flex items-center gap-2 text-sm bg-red-500/10 p-2 rounded">
                            <Clock className="h-4 w-4 text-red-600" />
                            <span>No activity for {institution.days_since_last_activity} days (Last: {format(new Date(institution.last_login_date), 'MMM dd')})</span>
                          </div>
                        )}
                        {institution.engagement_trend === 'declining' && (
                          <div className="flex items-center gap-2 text-sm bg-red-500/10 p-2 rounded">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span>Declining engagement trend</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Active Users</p>
                        <p className="text-lg font-semibold">
                          {institution.course_metrics.daily_active_users}/{institution.course_metrics.active_students + institution.course_metrics.inactive_students}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Course Usage</p>
                        <p className="text-lg font-semibold">
                          {institution.course_metrics.courses_in_use}/{institution.course_metrics.total_courses_assigned}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Open Tickets</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {institution.support_tickets.open}
                        </p>
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-600 mb-2">Recommended Actions:</p>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Schedule urgent intervention meeting with institution leadership</li>
                        <li>Provide additional training and onboarding support</li>
                        <li>Review and address open support tickets</li>
                        <li>Offer dedicated success manager assistance</li>
                        {institution.days_since_last_activity > 7 && (
                          <li>Immediate follow-up required - no activity for {institution.days_since_last_activity} days</li>
                        )}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleContactInstitution(institution.institution_name)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Now
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleScheduleMeeting(institution.institution_name)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
