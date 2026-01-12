import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2, Download, ChevronDown } from 'lucide-react';
import { InstitutionClass } from '@/types/institution';
import { parseCSV, validateRow, findDuplicates, generateTemplate, ParsedRow, ValidationResult } from '@/utils/csvParser';
import { toast } from 'sonner';

interface BulkUploadResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  duplicates?: string[];
}

interface ValidatedRow extends ParsedRow {
  rowIndex: number;
  validation: ValidationResult;
}

interface BulkUploadStudentsToClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classData: InstitutionClass;
  institutionId: string;
  onUploadComplete: (file: File) => Promise<BulkUploadResult>;
}

export function BulkUploadStudentsToClassDialog({
  isOpen,
  onOpenChange,
  classData,
  institutionId,
  onUploadComplete
}: BulkUploadStudentsToClassDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ValidatedRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploadedFile(file);
      const data = await parseCSV(file);
      
      if (data.length === 0) {
        toast.error('CSV file is empty');
        return;
      }

      if (data.length > 1000) {
        toast.error('Maximum 1000 students allowed per upload');
        return;
      }

      // Validate each row
      const validatedData: ValidatedRow[] = data.map((row, index) => ({
        ...row,
        rowIndex: index + 2,
        validation: validateRow(row, index)
      }));

      setParsedData(validatedData);
      toast.success(`Loaded ${data.length} rows from CSV`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = generateTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_bulk_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!uploadedFile || parsedData.length === 0) {
        toast.error('Please upload a CSV file first');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const validRows = parsedData.filter(row => row.validation.isValid);
      if (validRows.length === 0) {
        toast.error('No valid rows to import');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleImport();
    }
  };

  const handleImport = async () => {
    if (!uploadedFile) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Real import - no fake delays
      const validRows = parsedData.filter(row => row.validation.isValid);
      setImportProgress(10);
      
      const result = await onUploadComplete(uploadedFile);
      setImportProgress(100);
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} students!`);
      }
      if (result.skipped > 0) {
        toast.info(`Skipped ${result.skipped} duplicate entries`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} students failed to import`);
      }
      
      handleReset();
    } catch (error: any) {
      toast.error(`Failed to import students: ${error.message}`);
      console.error(error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedData([]);
    setSkipDuplicates(true);
    onOpenChange(false);
  };

  const validRows = parsedData.filter(row => row.validation.isValid).length;
  const errorRows = parsedData.filter(row => !row.validation.isValid).length;
  const previewData = parsedData.slice(0, 10);
  const duplicates = findDuplicates(parsedData);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Students - Step {currentStep} of 3</DialogTitle>
          <DialogDescription>
            Upload students for {classData.class_name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(step => (
            <div 
              key={step} 
              className={`h-1 flex-1 rounded transition-colors ${
                step <= currentStep ? 'bg-primary' : 'bg-muted'
              }`} 
            />
          ))}
        </div>

        {/* Step 1: Upload CSV */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Card className="border-2 border-dashed bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Download the CSV template</p>
                <p>• Fill in student information</p>
                <p>• Upload the file (max 1000 students, 5MB limit)</p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            {!uploadedFile ? (
              <Card className="border-dashed border-2">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Upload CSV file</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 5MB, 1000 students
                      </p>
                    </div>
                    <Input 
                      type="file" 
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(2)} KB • {parsedData.length} students
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setUploadedFile(null);
                      setParsedData([]);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Validation & Preview */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parsedData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Valid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{validRows}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{errorRows}</div>
                </CardContent>
              </Card>
            </div>

            {duplicates.emails.length > 0 && (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertCircle className="h-4 w-4" />
                    Duplicate Entries Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  <p>Duplicate emails: {duplicates.emails.join(', ')}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview (First 10 rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row) => (
                        <TableRow key={row.rowIndex} className={!row.validation.isValid ? 'bg-destructive/10' : ''}>
                          <TableCell>{row.rowIndex}</TableCell>
                          <TableCell>{row.student_name}</TableCell>
                          <TableCell className="text-xs">{row.email}</TableCell>
                          <TableCell className="capitalize">{row.gender}</TableCell>
                          <TableCell className="text-xs">{row.date_of_birth}</TableCell>
                          <TableCell>
                            {row.validation.isValid ? (
                              <Badge variant="default" className="bg-green-500">Valid</Badge>
                            ) : (
                              <Badge variant="destructive">Error</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {errorRows > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      View Errors ({errorRows})
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <ScrollArea className="h-[200px]">
                        {parsedData.filter(row => !row.validation.isValid).map((row) => (
                          <div key={row.rowIndex} className="mb-3 pb-3 border-b last:border-0">
                            <p className="font-medium text-sm mb-1">Row {row.rowIndex}: {row.student_name || 'Unknown'}</p>
                            <ul className="text-xs text-destructive space-y-1 ml-4 list-disc">
                              {row.validation.errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {/* Step 3: Import Options */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Settings</CardTitle>
                <CardDescription>Configure how the data should be imported</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skip-duplicates" 
                    checked={skipDuplicates} 
                    onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
                  />
                  <Label htmlFor="skip-duplicates" className="cursor-pointer">
                    Skip duplicate entries (based on email)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Class:</span>
                  <span className="font-medium">{classData.class_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total students to import:</span>
                  <span className="font-medium">{validRows}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rows with errors (will be skipped):</span>
                  <span className="font-medium text-destructive">{errorRows}</span>
                </div>
              </CardContent>
            </Card>

            {isImporting && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing students...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={currentStep === 1 ? () => onOpenChange(false) : () => setCurrentStep(currentStep - 1)} disabled={isImporting}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={isImporting || (currentStep === 1 && !uploadedFile)}>
            {isImporting ? 'Importing...' : currentStep === 3 ? 'Import' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
