import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { InstitutionEngagement } from "@/data/mockInstitutionEngagement";
import { toast } from "sonner";

interface InstitutionComparisonTableProps {
  data: InstitutionEngagement[];
}

type SortKey = 'name' | 'engagement' | 'courses' | 'assessments' | 'users' | 'risk';
type SortOrder = 'asc' | 'desc';

const riskColors = {
  low: "bg-green-500/10 text-green-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-red-500/10 text-red-600",
};

const trendIcons = {
  increasing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const trendColors = {
  increasing: "text-green-600",
  stable: "text-blue-600",
  declining: "text-red-600",
};

export function InstitutionComparisonTable({ data }: InstitutionComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('engagement');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortKey) {
      case 'name':
        aVal = a.institution_name;
        bVal = b.institution_name;
        break;
      case 'engagement':
        aVal = a.engagement_score;
        bVal = b.engagement_score;
        break;
      case 'courses':
        aVal = a.course_metrics.average_completion_rate;
        bVal = b.course_metrics.average_completion_rate;
        break;
      case 'assessments':
        aVal = a.assessment_metrics.average_participation_rate;
        bVal = b.assessment_metrics.average_participation_rate;
        break;
      case 'users':
        aVal = a.course_metrics.daily_active_users;
        bVal = b.course_metrics.daily_active_users;
        break;
      case 'risk':
        const riskOrder = { low: 0, medium: 1, high: 2 };
        aVal = riskOrder[a.risk_level];
        bVal = riskOrder[b.risk_level];
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleExport = () => {
    toast.success("Exporting data to CSV...");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Institution Performance Comparison</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="font-semibold">
                    Institution <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('engagement')} className="font-semibold">
                    Engagement <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('users')} className="font-semibold">
                    Active Users <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('courses')} className="font-semibold">
                    Course Usage <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('assessments')} className="font-semibold">
                    Assessment Rate <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('risk')} className="font-semibold">
                    Risk Level <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((institution) => {
                const TrendIcon = trendIcons[institution.engagement_trend];
                const totalStudents = institution.course_metrics.active_students + institution.course_metrics.inactive_students;

                return (
                  <TableRow key={institution.institution_id}>
                    <TableCell className="font-medium">{institution.institution_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold">{institution.engagement_score}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-semibold">{institution.course_metrics.daily_active_users}</p>
                        <p className="text-muted-foreground text-xs">of {totalStudents}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-semibold">{institution.course_metrics.average_completion_rate}%</p>
                        <p className="text-muted-foreground text-xs">
                          {institution.course_metrics.courses_in_use}/{institution.course_metrics.total_courses_assigned} active
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-semibold">{institution.assessment_metrics.average_participation_rate}%</p>
                        <p className="text-muted-foreground text-xs">
                          {institution.assessment_metrics.assessments_completed}/{institution.assessment_metrics.total_assessments_created} completed
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${trendColors[institution.engagement_trend]}`}>
                        <TrendIcon className="h-4 w-4" />
                        <span className="text-sm capitalize">{institution.engagement_trend}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskColors[institution.risk_level]}>
                        {institution.risk_level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info(`Viewing details for ${institution.institution_name}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
