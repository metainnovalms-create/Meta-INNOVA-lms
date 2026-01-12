import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from "lucide-react";
import { InstitutionEngagement } from "@/data/mockInstitutionEngagement";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface EngagementDashboardProps {
  data: InstitutionEngagement[];
}

const COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
};

const TREND_COLORS = {
  increasing: '#10b981',
  stable: '#3b82f6',
  declining: '#ef4444',
};

export function EngagementDashboard({ data }: EngagementDashboardProps) {
  const avgEngagement = Math.round(
    data.reduce((sum, inst) => sum + inst.engagement_score, 0) / data.length
  );

  const riskCounts = {
    low: data.filter(d => d.risk_level === 'low').length,
    medium: data.filter(d => d.risk_level === 'medium').length,
    high: data.filter(d => d.risk_level === 'high').length,
  };

  const pieData = [
    { name: 'Low Risk', value: riskCounts.low, color: COLORS.high },
    { name: 'Medium Risk', value: riskCounts.medium, color: COLORS.medium },
    { name: 'High Risk', value: riskCounts.high, color: COLORS.low },
  ];

  const engagementData = data.map(inst => ({
    name: inst.institution_name.split(' ').slice(0, 2).join(' '),
    engagement: inst.engagement_score,
    courses: inst.course_metrics.average_completion_rate,
    assessments: inst.assessment_metrics.average_participation_rate,
  }));

  const trendCounts = {
    increasing: data.filter(d => d.engagement_trend === 'increasing').length,
    stable: data.filter(d => d.engagement_trend === 'stable').length,
    declining: data.filter(d => d.engagement_trend === 'declining').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active partnerships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all institutions</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">High Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.filter(d => d.engagement_score >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Engagement ≥ 80%</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskCounts.high}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold">{riskCounts.low}</span>
                </div>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Minus className="h-4 w-4 text-yellow-600" />
                  <span className="text-2xl font-bold">{riskCounts.medium}</span>
                </div>
                <p className="text-xs text-muted-foreground">Medium Risk</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-2xl font-bold">{riskCounts.high}</span>
                </div>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{trendCounts.increasing}</p>
                    <p className="text-sm text-muted-foreground">Increasing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {((trendCounts.increasing / data.length) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">of total</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Minus className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{trendCounts.stable}</p>
                    <p className="text-sm text-muted-foreground">Stable</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {((trendCounts.stable / data.length) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">of total</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{trendCounts.declining}</p>
                    <p className="text-sm text-muted-foreground">Declining</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {((trendCounts.declining / data.length) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">of total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Engagement Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="engagement" fill="#3b82f6" name="Overall Engagement" />
              <Bar dataKey="courses" fill="#10b981" name="Course Completion" />
              <Bar dataKey="assessments" fill="#f59e0b" name="Assessment Participation" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
