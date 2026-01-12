import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, Download, TrendingUp, DollarSign, Shield, Activity, 
  Users, GraduationCap, BarChart3, PieChart as PieChartIcon, 
  LineChart as LineChartIcon, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockInvoices, getInvoiceByMonthYear } from '@/data/mockInvoiceData';

// ============ System Reports Mock Data ============
const mockSystemReports = [
  {
    id: '1',
    title: 'Platform Usage Report',
    type: 'usage' as const,
    period: 'Q4 2024',
    generated_date: '2024-12-01',
    institutions_count: 48,
  },
  {
    id: '2',
    title: 'System Performance Analytics',
    type: 'performance' as const,
    period: 'November 2024',
    generated_date: '2024-11-30',
    institutions_count: 48,
  },
  {
    id: '3',
    title: 'Revenue & Billing Report',
    type: 'financial' as const,
    period: 'Q3 2024',
    generated_date: '2024-10-01',
    institutions_count: 45,
  },
  {
    id: '4',
    title: 'Compliance & Security Audit',
    type: 'compliance' as const,
    period: 'October 2024',
    generated_date: '2024-10-15',
    institutions_count: 48,
  },
];

// ============ Monthly Reports Mock Data ============
interface MonthlyReport {
  institution_id: string;
  institution_name: string;
  month: string;
  students: number;
  teachers: number;
  attendance_rate: number;
  revenue: number;
  courses_active: number;
  satisfaction_score: number;
}

const mockMonthlyReports: MonthlyReport[] = [
  {
    institution_id: 'inst1',
    institution_name: 'Springfield University',
    month: '2024-01',
    students: 5420,
    teachers: 248,
    attendance_rate: 87.5,
    revenue: 425000,
    courses_active: 156,
    satisfaction_score: 4.3,
  },
  {
    institution_id: 'inst2',
    institution_name: 'River College',
    month: '2024-01',
    students: 3200,
    teachers: 145,
    attendance_rate: 91.2,
    revenue: 285000,
    courses_active: 98,
    satisfaction_score: 4.5,
  },
  {
    institution_id: 'inst3',
    institution_name: 'Oakwood Institute',
    month: '2024-01',
    students: 2100,
    teachers: 92,
    attendance_rate: 84.8,
    revenue: 178000,
    courses_active: 67,
    satisfaction_score: 4.1,
  },
  {
    institution_id: 'inst4',
    institution_name: 'Tech Valley School',
    month: '2024-01',
    students: 1800,
    teachers: 78,
    attendance_rate: 89.3,
    revenue: 165000,
    courses_active: 54,
    satisfaction_score: 4.4,
  },
];

// ============ Custom Analytics Mock Data ============
const mockAnalyticsData = [
  { name: 'Springfield Univ', students: 5420, teachers: 248, revenue: 425000 },
  { name: 'River College', students: 3200, teachers: 145, revenue: 285000 },
  { name: 'Oakwood Inst', students: 2100, teachers: 92, revenue: 178000 },
  { name: 'Tech Valley', students: 1800, teachers: 78, revenue: 165000 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const reportTypes = [
  {
    value: 'usage',
    label: 'Platform Usage',
    description: 'User activity, feature adoption, and engagement metrics',
    icon: Activity,
  },
  {
    value: 'performance',
    label: 'System Performance',
    description: 'Uptime, response times, and system health metrics',
    icon: TrendingUp,
  },
  {
    value: 'financial',
    label: 'Revenue & Billing',
    description: 'Financial reports, billing, and subscription analytics',
    icon: DollarSign,
  },
  {
    value: 'compliance',
    label: 'Compliance & Security',
    description: 'Security audits, data privacy, and compliance reports',
    icon: Shield,
  },
];

export default function SystemAdminReports() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // System Reports state
  const [systemReports] = useState(mockSystemReports);
  const [selectedType, setSelectedType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Monthly Reports state
  const [monthlyReports] = useState<MonthlyReport[]>(mockMonthlyReports);
  const [selectedMonth, setSelectedMonth] = useState('2024-01');

  // Custom Analytics state
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['students', 'teachers']);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [dateRange, setDateRange] = useState('month');

  // Invoice Generation state
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Tab management
  const [activeTab, setActiveTab] = useState('system');

  // Handle URL hash for deep linking
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'monthly' || hash === 'custom') {
      setActiveTab(hash);
    } else {
      setActiveTab('system');
    }
  }, [location.hash]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`#${value}`, { replace: true });
  };

  // System Reports handlers
  const handleGenerateReport = () => {
    if (!selectedType || !selectedPeriod) {
      toast.error('Please select report type and period');
      return;
    }
    toast.success('Report generation started! You will be notified when ready.');
  };

  const handleDownloadReport = (reportTitle: string) => {
    toast.success(`Downloading ${reportTitle}...`);
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      usage: 'bg-blue-500/10 text-blue-500',
      performance: 'bg-green-500/10 text-green-500',
      financial: 'bg-purple-500/10 text-purple-500',
      compliance: 'bg-orange-500/10 text-orange-500',
    };
    return variants[type] || variants.usage;
  };

  // Monthly Reports calculations
  const totalStudents = monthlyReports.reduce((sum, r) => sum + r.students, 0);
  const totalTeachers = monthlyReports.reduce((sum, r) => sum + r.teachers, 0);
  const totalRevenue = monthlyReports.reduce((sum, r) => sum + r.revenue, 0);
  const avgAttendance = monthlyReports.reduce((sum, r) => sum + r.attendance_rate, 0) / monthlyReports.length;

  const handleExportPDF = () => {
    toast.success('Exporting report to PDF...');
  };

  const handleExportExcel = () => {
    toast.success('Exporting report to Excel...');
  };

  // Custom Analytics handlers
  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    toast.success(`Exporting custom report as ${format.toUpperCase()}...`);
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={mockAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.includes('students') && <Bar dataKey="students" fill={COLORS[0]} />}
              {selectedMetrics.includes('teachers') && <Bar dataKey="teachers" fill={COLORS[1]} />}
              {selectedMetrics.includes('revenue') && (
                <Bar dataKey="revenue" fill={COLORS[2]} name="Revenue ($)" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mockAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.includes('students') && (
                <Line type="monotone" dataKey="students" stroke={COLORS[0]} strokeWidth={2} />
              )}
              {selectedMetrics.includes('teachers') && (
                <Line type="monotone" dataKey="teachers" stroke={COLORS[1]} strokeWidth={2} />
              )}
              {selectedMetrics.includes('revenue') && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS[2]}
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieMetric = selectedMetrics[0] || 'students';
        const pieData = mockAnalyticsData.map((item) => ({
          name: item.name,
          value: item[pieMetric as keyof typeof item] as number,
        }));
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Invoice</h1>
          <p className="text-muted-foreground">System reports, monthly insights, custom analytics, and invoice generation</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="system">System Reports</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Reports</TabsTrigger>
            <TabsTrigger value="custom">Custom Analytics</TabsTrigger>
            <TabsTrigger value="invoices">Invoice Generation</TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: SYSTEM REPORTS ==================== */}
          <TabsContent value="system" className="space-y-6">
            {/* Generate New Report */}
            <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-q4">Q4 2024</SelectItem>
                    <SelectItem value="2024-q3">Q3 2024</SelectItem>
                    <SelectItem value="nov-2024">November 2024</SelectItem>
                    <SelectItem value="oct-2024">October 2024</SelectItem>
                    <SelectItem value="sep-2024">September 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Report Templates */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className="hover:border-primary cursor-pointer transition-colors"
                      onClick={() => setSelectedType(type.value)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
              <div className="grid gap-4">
                {systemReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{report.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTypeBadge(report.type)}>{report.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Period: {report.period}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Generated on {new Date(report.generated_date).toLocaleDateString()} •{' '}
                              {report.institutions_count} institutions
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report.title)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ==================== TAB 2: MONTHLY REPORTS ==================== */}
          <TabsContent value="monthly" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">Monthly Reports</h2>
                <p className="text-muted-foreground mt-1">
                  Consolidated monthly reports per institution
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportExcel}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Across all institutions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">Active teachers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgAttendance.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Platform average</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Institution Performance</CardTitle>
                    <CardDescription>Detailed metrics by institution</CardDescription>
                  </div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-01">January 2024</SelectItem>
                      <SelectItem value="2023-12">December 2023</SelectItem>
                      <SelectItem value="2023-11">November 2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Teachers</TableHead>
                      <TableHead className="text-right">Active Courses</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                      <TableHead className="text-right">Satisfaction</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReports.map((report) => (
                      <TableRow key={report.institution_id}>
                        <TableCell className="font-medium">{report.institution_name}</TableCell>
                        <TableCell className="text-right">{report.students.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{report.teachers}</TableCell>
                        <TableCell className="text-right">{report.courses_active}</TableCell>
                        <TableCell className="text-right font-medium">
                          {report.attendance_rate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{report.satisfaction_score}/5.0</TableCell>
                        <TableCell className="text-right font-bold">
                          ${report.revenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{totalStudents.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{totalTeachers}</TableCell>
                      <TableCell className="text-right">
                        {monthlyReports.reduce((sum, r) => sum + r.courses_active, 0)}
                      </TableCell>
                      <TableCell className="text-right">{avgAttendance.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        {(monthlyReports.reduce((sum, r) => sum + r.satisfaction_score, 0) / monthlyReports.length).toFixed(1)}/5.0
                      </TableCell>
                      <TableCell className="text-right">${totalRevenue.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 3: CUSTOM ANALYTICS ==================== */}
          <TabsContent value="custom" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">Custom Analytics</h2>
                <p className="text-muted-foreground mt-1">
                  Build and export custom reports with selected metrics
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('excel')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button onClick={() => handleExport('pdf')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Customize your analytics report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Select Metrics</Label>
                    <div className="space-y-3">
                      {[
                        { id: 'students', label: 'Student Count' },
                        { id: 'teachers', label: 'Teacher Count' },
                        { id: 'revenue', label: 'Revenue' },
                      ].map((metric) => (
                        <div key={metric.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={metric.id}
                            checked={selectedMetrics.includes(metric.id)}
                            onCheckedChange={() => handleMetricToggle(metric.id)}
                          />
                          <label
                            htmlFor={metric.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {metric.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
                      <SelectTrigger id="chart-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Bar Chart
                          </div>
                        </SelectItem>
                        <SelectItem value="line">
                          <div className="flex items-center gap-2">
                            <LineChartIcon className="h-4 w-4" />
                            Line Chart
                          </div>
                        </SelectItem>
                        <SelectItem value="pie">
                          <div className="flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4" />
                            Pie Chart
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-range">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger id="date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last Quarter</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Analytics Visualization</CardTitle>
                  <CardDescription>
                    {selectedMetrics.length > 0
                      ? `Showing ${selectedMetrics.join(', ')} data`
                      : 'Select metrics to visualize'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedMetrics.length > 0 ? (
                    renderChart()
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Select at least one metric to display the chart
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Data Summary</CardTitle>
                <CardDescription>Raw data for selected metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Institution</th>
                        {selectedMetrics.includes('students') && (
                          <th className="text-right py-2 px-4">Students</th>
                        )}
                        {selectedMetrics.includes('teachers') && (
                          <th className="text-right py-2 px-4">Teachers</th>
                        )}
                        {selectedMetrics.includes('revenue') && (
                          <th className="text-right py-2 px-4">Revenue</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {mockAnalyticsData.map((row) => (
                        <tr key={row.name} className="border-b">
                          <td className="py-2 px-4 font-medium">{row.name}</td>
                          {selectedMetrics.includes('students') && (
                            <td className="text-right py-2 px-4">{row.students.toLocaleString()}</td>
                          )}
                          {selectedMetrics.includes('teachers') && (
                            <td className="text-right py-2 px-4">{row.teachers}</td>
                          )}
                          {selectedMetrics.includes('revenue') && (
                            <td className="text-right py-2 px-4">${row.revenue.toLocaleString()}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 4: INVOICE GENERATION ==================== */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Monthly Invoice</CardTitle>
                <CardDescription>
                  Create monthly trainer activity reports and invoices for institutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Institution and Month Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Select Institution</Label>
                    <Select 
                      value={selectedInstitution} 
                      onValueChange={(value) => {
                        setSelectedInstitution(value);
                        setSelectedInvoice(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose institution..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inst-msd-001">Modern School Vasant Vihar</SelectItem>
                        <SelectItem value="inst-kga-001">Kikani Global Academy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Select Month</Label>
                    <Select 
                      value={selectedInvoiceMonth} 
                      onValueChange={(value) => {
                        setSelectedInvoiceMonth(value);
                        setSelectedInvoice(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose month..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="August-2025">August 2025</SelectItem>
                        <SelectItem value="September-2025">September 2025</SelectItem>
                        <SelectItem value="October-2025">October 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Invoice Button */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      if (!selectedInstitution || !selectedInvoiceMonth) {
                        toast.error('Please select both institution and month');
                        return;
                      }
                      const [month, year] = selectedInvoiceMonth.split('-');
                      const invoice = getInvoiceByMonthYear(selectedInstitution, month, year);
                      if (invoice) {
                        setSelectedInvoice(invoice);
                        toast.success('Invoice generated successfully!');
                      } else {
                        toast.error('No invoice data found for selected period');
                      }
                    }}
                    disabled={!selectedInstitution || !selectedInvoiceMonth}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (selectedInvoice) {
                        window.print();
                        toast.success('Opening print dialog...');
                      }
                    }}
                    disabled={!selectedInvoice}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice
                  </Button>
                </div>

                {/* Invoice Preview */}
                {selectedInvoice && (
                  <div className="border rounded-lg p-8 bg-white" id="invoice-content">
                    {/* Invoice Header */}
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {selectedInvoice.month.toUpperCase()}&apos;{selectedInvoice.year.slice(-2)} Activity Report
                      </h2>
                      <p className="text-lg text-gray-700">
                        <span className="font-semibold">Client Name:</span> {selectedInvoice.institution_name}, {selectedInvoice.institution_location}
                      </p>
                    </div>

                    {/* Trainers Table */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg">Trainer(s) Name and Designation</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Designation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedInvoice.trainers.map((trainer: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{trainer.name}</TableCell>
                              <TableCell>{trainer.designation}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Attendance Table */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg">Trainer(s) Attendance</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Attendance %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedInvoice.trainers.map((trainer: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{trainer.name}</TableCell>
                              <TableCell>
                                <Badge variant={trainer.attendance_percentage >= 95 ? 'default' : 'secondary'}>
                                  {trainer.attendance_percentage}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Metrics Section */}
                    <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">No. of hours handled in this month:</span>
                        <span className="font-bold text-gray-900">{selectedInvoice.hours_handled} Hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Percentage of portion covered:</span>
                        <span className="font-bold text-gray-900">{selectedInvoice.portion_covered_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">No. of Assessment completed:</span>
                        <span className="font-bold text-gray-900">{selectedInvoice.assessments_completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Results of assessment:</span>
                        <span className="text-gray-900">{selectedInvoice.assessment_results}</span>
                      </div>
                    </div>

                    {/* Activities Table */}
                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg">Details of other activities completed</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedInvoice.activities.map((activity: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{activity.activity}</TableCell>
                              <TableCell>{activity.remarks}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Signature Section */}
                    <div className="text-right mt-12 pt-8 border-t">
                      <p className="font-bold text-gray-900 mb-1">-SD-</p>
                      <p className="text-gray-700 font-semibold">{selectedInvoice.signed_by}</p>
                      <p className="text-gray-700">{selectedInvoice.signed_name}</p>
                      <p className="text-sm text-gray-500 mt-2">Generated on: {selectedInvoice.generation_date}</p>
                    </div>
                  </div>
                )}

                {!selectedInvoice && (selectedInstitution || selectedInvoiceMonth) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select institution and month, then click "Generate Invoice" to view the report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
