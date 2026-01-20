import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useBulkImportInventory, BulkInventoryImportResult } from '@/hooks/useBulkImportInventory';
import {
  parseInventoryCSV,
  transformInventoryRow,
  validateInventoryRow,
  findInventoryDuplicates,
  generateInventoryTemplate,
  ParsedInventoryRow,
  InventoryValidationResult
} from '@/utils/inventoryCsvParser';

interface BulkImportInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
  userId: string;
}

interface ParsedItemWithValidation extends ParsedInventoryRow {
  rowIndex: number;
  validation: InventoryValidationResult;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function BulkImportInventoryDialog({
  open,
  onOpenChange,
  institutionId,
  userId
}: BulkImportInventoryDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedItems, setParsedItems] = useState<ParsedItemWithValidation[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<BulkInventoryImportResult | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const { bulkImportAsync, isImporting, progress, reset } = useBulkImportInventory(institutionId);

  const handleClose = useCallback(() => {
    if (!isImporting) {
      setStep('upload');
      setParsedItems([]);
      setImportResult(null);
      setShowOnlyErrors(false);
      reset();
      onOpenChange(false);
    }
  }, [isImporting, onOpenChange, reset]);

  const handleDownloadTemplate = () => {
    const blob = generateInventoryTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawData = await parseInventoryCSV(file);
      const items: ParsedItemWithValidation[] = rawData.map((row, index) => {
        const transformedRow = transformInventoryRow(row);
        return {
          ...transformedRow,
          rowIndex: index + 1,
          validation: validateInventoryRow(transformedRow, index)
        };
      });

      setParsedItems(items);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    
    try {
      const result = await bulkImportAsync({
        items: parsedItems.filter(item => item.validation.isValid),
        userId,
        options: { skipDuplicates }
      });
      
      setImportResult(result);
      setStep('complete');
    } catch (error) {
      console.error('Import error:', error);
      setStep('preview');
    }
  };

  const validItems = parsedItems.filter(item => item.validation.isValid);
  const invalidItems = parsedItems.filter(item => !item.validation.isValid);
  const displayItems = showOnlyErrors ? invalidItems : parsedItems;
  const duplicates = findInventoryDuplicates(parsedItems);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Inventory Items</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import multiple inventory items at once'}
            {step === 'preview' && 'Review the parsed data before importing'}
            {step === 'importing' && 'Importing items...'}
            {step === 'complete' && 'Import complete'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with inventory items
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    Select CSV File
                  </span>
                </Button>
              </label>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">CSV Format</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your CSV file should have these columns:
              </p>
              <ul className="text-sm space-y-1">
                <li><strong>name</strong> (required) - Item name</li>
                <li><strong>description</strong> (optional) - Item description</li>
                <li><strong>unit_price</strong> (required) - Price per unit</li>
                <li><strong>units</strong> (optional, defaults to 1) - Quantity</li>
              </ul>
              <Button variant="link" className="p-0 h-auto mt-3" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {validItems.length} Valid
                </Badge>
                <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                  <XCircle className="h-3 w-3 mr-1" />
                  {invalidItems.length} Invalid
                </Badge>
                {duplicates.names.length > 0 && (
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {duplicates.names.length} Duplicates in file
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-errors"
                  checked={showOnlyErrors}
                  onCheckedChange={(checked) => setShowOnlyErrors(!!checked)}
                />
                <Label htmlFor="show-errors" className="text-sm">Show only errors</Label>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.slice(0, 100).map((item) => (
                    <TableRow key={item.rowIndex} className={!item.validation.isValid ? 'bg-red-500/5' : ''}>
                      <TableCell className="font-mono text-sm">{item.rowIndex}</TableCell>
                      <TableCell className="font-medium">{item.name || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">₹{item.unit_price?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{item.units || 1}</TableCell>
                      <TableCell>
                        {item.validation.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-500 truncate max-w-[100px]" title={item.validation.errors.join(', ')}>
                              {item.validation.errors[0]}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {displayItems.length > 100 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Showing first 100 rows of {displayItems.length}
                </p>
              )}
            </ScrollArea>

            <div className="flex items-center gap-4">
              <Checkbox
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
              />
              <Label htmlFor="skip-duplicates" className="text-sm">
                Skip items with duplicate names (existing in database)
              </Label>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validItems.length === 0}>
                Import {validItems.length} Item(s)
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing items...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="py-6 space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Import Complete</h3>
              <p className="text-muted-foreground">
                Successfully imported inventory items
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{importResult.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg">
                <p className="text-2xl font-bold text-yellow-500">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-500">{importResult.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-red-500/5 rounded-lg p-4">
                <h4 className="font-medium text-red-500 mb-2">Errors</h4>
                <ul className="text-sm space-y-1 max-h-32 overflow-auto">
                  {importResult.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li className="text-muted-foreground">...and {importResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
            <div className="flex justify-center">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
