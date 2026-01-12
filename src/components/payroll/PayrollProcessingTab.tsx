import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Download, FileText, CheckCircle, Play, 
  DollarSign, User, Calculator, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { 
  fetchAllEmployees, 
  fetchPayrollRecords,
  generateMonthlyPayroll,
  calculateLOPDeduction,
  EmployeePayrollSummary,
  STANDARD_DAYS_PER_MONTH
} from '@/services/payroll.service';

interface PayrollProcessingTabProps {
  month: number;
  year: number;
}

export function PayrollProcessingTab({ month, year }: PayrollProcessingTabProps) {
  const [employees, setEmployees] = useState<EmployeePayrollSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllEmployees(month, year);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!emp.name.toLowerCase().includes(query) && !emp.email.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && emp.payroll_status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      const total = employees.length;
      let completed = 0;
      
      for (const employee of employees) {
        await generateMonthlyPayroll(
          employee.user_id,
          employee.user_type,
          month,
          year,
          employee.monthly_salary
        );
        completed++;
        setGenerationProgress((completed / total) * 100);
      }
      
      toast.success(`Generated payroll for ${total} employees`);
      loadData();
    } catch (error) {
      toast.error('Failed to generate payroll');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleGenerateSingle = async (employee: EmployeePayrollSummary) => {
    try {
      await generateMonthlyPayroll(
        employee.user_id,
        employee.user_type,
        month,
        year,
        employee.monthly_salary
      );
      toast.success(`Generated payroll for ${employee.name}`);
      loadData();
    } catch (error) {
      toast.error('Failed to generate payroll');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const exportPayroll = () => {
    const headers = [
      'Name', 'Email', 'Type', 'Position', 'Monthly Salary', 
      'Per Day Salary', 'Days LOP', 'LOP Deduction', 'Gross', 
      'Deductions', 'Net Pay', 'Status'
    ];
    
    const rows = filteredEmployees.map(e => {
      const lopDeduction = calculateLOPDeduction(e.monthly_salary, e.days_lop);
      const netPay = e.monthly_salary - lopDeduction;
      return [
        e.name,
        e.email,
        e.user_type,
        e.position_name || e.department || '-',
        e.monthly_salary.toFixed(2),
        e.per_day_salary.toFixed(2),
        e.days_lop,
        lopDeduction.toFixed(2),
        e.monthly_salary.toFixed(2),
        lopDeduction.toFixed(2),
        netPay.toFixed(2),
        e.payroll_status
      ];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    
    toast.success('Payroll exported successfully');
  };

  // Calculate totals
  const totalGross = filteredEmployees.reduce((sum, e) => sum + e.monthly_salary, 0);
  const totalDeductions = filteredEmployees.reduce((sum, e) => sum + calculateLOPDeduction(e.monthly_salary, e.days_lop), 0);
  const totalNet = totalGross - totalDeductions;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Payroll Processing</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and manage monthly payroll for {format(new Date(year, month - 1), 'MMMM yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportPayroll} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {isGenerating && (
          <div className="mt-4">
            <Progress value={generationProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Generating payroll... {Math.round(generationProgress)}%
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{filteredEmployees.length}</p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalGross)}</p>
                <p className="text-xs text-muted-foreground">Total Gross</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</p>
                <p className="text-xs text-muted-foreground">Total Deductions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNet)}</p>
                <p className="text-xs text-muted-foreground">Total Net Pay</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
                <TableHead className="text-center">LOP Days</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => {
                  const lopDeduction = calculateLOPDeduction(employee.monthly_salary, employee.days_lop);
                  const netPay = employee.monthly_salary - lopDeduction;
                  
                  return (
                    <TableRow key={employee.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {employee.position_name || employee.department || '-'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.user_type === 'officer' ? 'default' : 'secondary'}>
                          {employee.user_type === 'officer' ? 'Officer' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(employee.monthly_salary)}
                      </TableCell>
                      <TableCell className="text-center">
                        {employee.days_lop > 0 ? (
                          <span className="text-red-600 font-medium">{employee.days_lop}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {lopDeduction > 0 ? (
                          <span className="text-red-600">-{formatCurrency(lopDeduction)}</span>
                        ) : (
                          <span className="text-muted-foreground">₹0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(netPay)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(employee.payroll_status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleGenerateSingle(employee)}
                            title="Generate Payroll"
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="View Payslip"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* LOP Calculation Note */}
        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <Calculator className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">LOP Calculation Formula</p>
              <p className="text-muted-foreground">
                Per Day Salary = Monthly Salary ÷ {STANDARD_DAYS_PER_MONTH} (standard days)
              </p>
              <p className="text-muted-foreground">
                LOP Deduction = Per Day Salary × Number of LOP Days
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
