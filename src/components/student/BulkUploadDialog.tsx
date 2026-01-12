import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2, Download, ChevronDown } from 'lucide-react';
import { parseCSV, validateRow, findDuplicates, generateTemplate, ParsedRow, ValidationResult } from '@/utils/csvParser';
import { toast } from 'sonner';

interface BulkUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
  classId?: string;
  className?: string;
  onUploadComplete: (result: BulkUploadResult) => void;
}

export interface BulkUploadResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  duplicates?: string[];
  errors?: Array<{ row: number; roll_number: string; error: string }>;
}

interface ValidatedRow extends ParsedRow {
  rowIndex: number;
  validation: ValidationResult;
}

export function BulkUploadDialog({ isOpen, onOpenChange, institutionId, classId, className, onUploadComplete }: BulkUploadDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ValidatedRow[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [sendWelcomeEmails, setSendWelcomeEmails] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];

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
        rowIndex: index + 2, // +2 because row 1 is header, and we start from 0
        validation: validateRow(row, index)
      }));

      setParsedData(validatedData);
      toast.success(`Loaded ${data.length} rows from CSV`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedData([]);
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
      if (!selectedClass || !selectedSection) {
        toast.error('Please select class and section');
        return;
      }
      
      const validRows = parsedData.filter(row => row.validation.isValid);
      if (validRows.length === 0) {
        toast.error('No valid rows to import. Please fix errors first.');
        return;
      }
      
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleImport();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(0);

    // Simulate import progress
    const validRows = parsedData.filter(row => row.validation.isValid);
    
    try {
      // Simulate API call with progress
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Mock successful import
      const result: BulkUploadResult = {
        imported: validRows.length,
        updated: updateExisting ? Math.floor(validRows.length * 0.1) : 0,
        skipped: skipDuplicates ? parsedData.length - validRows.length : 0,
        failed: 0,
        duplicates: [],
        errors: []
      };

      toast.success(`Successfully imported ${result.imported} students!`);
      onUploadComplete(result);
      handleReset();
    } catch (error) {
      toast.error('Failed to import students');
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
    setSelectedClass('');
    setSelectedSection('');
    setSkipDuplicates(true);
    setUpdateExisting(false);
    setSendWelcomeEmails(false);
    onOpenChange(false);
  };

  const validRows = parsedData.filter(row => row.validation.isValid).length;
  const errorRows = parsedData.filter(row => !row.validation.isValid).length;
  const previewData = parsedData.slice(0, 10);
  const duplicates = findDuplicates(parsedData);

  const stepDescriptions = {
    1: 'Upload a CSV file containing student information',
    2: 'Review and validate the uploaded data',
    3: 'Confirm import settings and start the upload'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Students - Step {currentStep} of 3</DialogTitle>
          <DialogDescription>
            {className 
              ? `Upload student data for ${className}`
              : stepDescriptions[currentStep as keyof typeof stepDescriptions]
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
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
                <p>• Download the CSV template to see the required format</p>
                <p>• Fill in student information following the template structure</p>
                <p>• Save as CSV file and upload below</p>
                <p>• Maximum 1000 students per upload, file size limit 5MB</p>
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
                      <p className="text-sm font-medium">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports CSV files up to 5MB (max 1000 students)
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
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
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

            {/* Class & Section Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Class and Section</CardTitle>
                <CardDescription>All students will be assigned to this class and section</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section *</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duplicate Warning */}
            {duplicates.emails.length > 0 && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertCircle className="h-4 w-4" />
                    Duplicate Entries Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-orange-700 dark:text-orange-300">
                  <p>Duplicate emails: {duplicates.emails.join(', ')}</p>
                </CardContent>
              </Card>
            )}

            {/* Preview Table */}
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

            {/* Error Details */}
            {errorRows > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      View Error Details ({errorRows} errors)
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
                            {row.validation.errors.map((error, idx) => (
                              <div key={idx} className="flex gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                              </div>
                            ))}
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

        {/* Step 3: Confirm & Import */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total students to import:</span>
                    <span className="font-bold">{validRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <Badge>{selectedClass}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section:</span>
                    <Badge>{selectedSection}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Institution ID:</span>
                    <span className="font-mono text-sm">{institutionId}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">Import Options</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="skip-duplicates" 
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                    />
                    <Label htmlFor="skip-duplicates" className="font-normal text-sm">
                      Skip duplicate roll numbers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="update-existing" 
                      checked={updateExisting}
                      onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                    />
                    <Label htmlFor="update-existing" className="font-normal text-sm">
                      Update existing student records if found
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="send-emails" 
                      checked={sendWelcomeEmails}
                      onCheckedChange={(checked) => setSendWelcomeEmails(checked as boolean)}
                    />
                    <Label htmlFor="send-emails" className="font-normal text-sm">
                      Send welcome emails to parents
                    </Label>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing students...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isImporting}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={isImporting}>
            {isImporting ? 'Importing...' : currentStep === 3 ? 'Import Students' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
