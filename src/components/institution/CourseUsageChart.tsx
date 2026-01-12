import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstitutionEngagement } from "@/data/mockInstitutionEngagement";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CourseUsageChartProps {
  data: InstitutionEngagement[];
}

export function CourseUsageChart({ data }: CourseUsageChartProps) {
  const chartData = data.map(inst => ({
    name: inst.institution_name.split(' ').slice(0, 2).join(' '),
    assigned: inst.course_metrics.total_courses_assigned,
    active: inst.course_metrics.courses_in_use,
    completion: inst.course_metrics.average_completion_rate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Usage Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="assigned" fill="#3b82f6" name="Total Courses" />
            <Bar dataKey="active" fill="#10b981" name="Active Courses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
