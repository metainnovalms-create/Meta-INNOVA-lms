import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyStockIssues } from '@/hooks/useCompanyInventory';
import { StockIssueDialog } from './StockIssueDialog';
import { exportStockIssues } from '@/utils/companyInventoryExport';

const ISSUE_TYPE_LABELS: Record<string, string> = {
  department: 'Department',
  project: 'Project',
  institution: 'Institution',
  branch: 'Branch',
  other: 'Other',
};

export function StockIssueTab() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: issues = [], isLoading } = useCompanyStockIssues();

  const handleExport = () => {
    exportStockIssues(issues);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Stock Issue (Outward)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Record stock issued to departments, projects, or institutions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No stock issues found. Record your first outward issue.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Issued To</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>{format(new Date(issue.issue_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{issue.item?.item_name}</span>
                      <span className="text-xs text-muted-foreground block">
                        {issue.item?.item_code}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{issue.quantity}</TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="mb-1">
                        {ISSUE_TYPE_LABELS[issue.issued_to_type]}
                      </Badge>
                      <span className="block text-sm">{issue.issued_to_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {issue.purpose || '-'}
                  </TableCell>
                  <TableCell>{issue.reference_number || '-'}</TableCell>
                  <TableCell>
                    {issue.admin_override && (
                      <Badge variant="destructive">Override</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <StockIssueDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}
