import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users, GraduationCap, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useAttendanceStatistics, DateRange } from "@/hooks/useAttendanceStatistics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface AttendanceStatisticsChartsProps {
  institutionId: string;
}

export function AttendanceStatisticsCharts({ institutionId }: AttendanceStatisticsChartsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [viewType, setViewType] = useState<'class' | 'officer'>('class');
  
  const { data: stats, isLoading } = useAttendanceStatistics(institutionId, dateRange);

  const getBarColor = (rate: number) => {
    if (rate >= 80) return 'hsl(var(--chart-2))'; // green
    if (rate >= 60) return 'hsl(var(--chart-4))'; // amber
    return 'hsl(var(--destructive))'; // red
  };

  const TrendIcon = stats?.summary.trend === 'up' 
    ? TrendingUp 
    : stats?.summary.trend === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColor = stats?.summary.trend === 'up' 
    ? 'text-green-500' 
    : stats?.summary.trend === 'down' 
      ? 'text-red-500' 
      : 'text-muted-foreground';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasData = stats && stats.dailyTrend.length > 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Attendance</p>
                <p className="text-3xl font-bold">{stats?.summary.averageRate || 0}%</p>
              </div>
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-5 w-5" />
                {stats?.summary.trendPercentage !== 0 && (
                  <span className="text-sm font-medium">{stats?.summary.trendPercentage}%</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold">{stats?.summary.totalSessions || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Top Performer</p>
              {viewType === 'class' ? (
                <>
                  <p className="text-lg font-semibold truncate">{stats?.summary.highestClass?.className || '-'}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {stats?.summary.highestClass?.attendanceRate || 0}%
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold truncate">{stats?.summary.highestOfficer?.officerName || '-'}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {stats?.summary.highestOfficer?.attendanceRate || 0}%
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Needs Attention</p>
              {viewType === 'class' ? (
                <>
                  <p className="text-lg font-semibold truncate">{stats?.summary.lowestClass?.className || '-'}</p>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {stats?.summary.lowestClass?.attendanceRate || 0}%
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold truncate">{stats?.summary.lowestOfficer?.officerName || '-'}</p>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {stats?.summary.lowestOfficer?.attendanceRate || 0}%
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <LineChartIcon className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No attendance data available</p>
            <p className="text-sm">Data will appear here once sessions are marked complete</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Trend Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Daily Attendance Trend
              </CardTitle>
              <CardDescription>
                Attendance rate over time across all sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="displayDate" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attendanceRate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Charts */}
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'class' | 'officer')} className="lg:col-span-2">
            <TabsList>
              <TabsTrigger value="class" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                By Class
              </TabsTrigger>
              <TabsTrigger value="officer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                By Officer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="class">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Attendance by Class
                  </CardTitle>
                  <CardDescription>
                    Compare attendance rates across different classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={stats.byClass} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]} 
                          className="text-xs fill-muted-foreground"
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="className" 
                          className="text-xs fill-muted-foreground"
                          width={90}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value}%`,
                            'Attendance Rate'
                          ]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="attendanceRate" radius={[0, 4, 4, 0]}>
                          {stats.byClass.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.attendanceRate)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="officer">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Attendance by Officer
                  </CardTitle>
                  <CardDescription>
                    Compare attendance rates by innovation officers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={stats.byOfficer} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]} 
                          className="text-xs fill-muted-foreground"
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="officerName" 
                          className="text-xs fill-muted-foreground"
                          width={90}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [
                            `${value}%`,
                            'Attendance Rate'
                          ]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="attendanceRate" radius={[0, 4, 4, 0]}>
                          {stats.byOfficer.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.attendanceRate)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
