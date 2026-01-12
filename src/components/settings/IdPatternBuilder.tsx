import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IdPattern } from '@/types/id-configuration';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IdPatternBuilderProps {
  pattern: IdPattern;
  onChange: (pattern: IdPattern) => void;
  entityType: 'employee' | 'institution' | 'student';
}

export function IdPatternBuilder({ pattern, onChange, entityType }: IdPatternBuilderProps) {
  const updatePattern = (updates: Partial<IdPattern>) => {
    onChange({ ...pattern, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Basic Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Basic Components</CardTitle>
          <CardDescription>Define the prefix, suffix, and separator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={pattern.prefix}
                onChange={(e) => updatePattern({ prefix: e.target.value.toUpperCase() })}
                placeholder="e.g., EMP, STU"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Starting text for the ID
              </p>
            </div>

            <div>
              <Label htmlFor="suffix">Suffix</Label>
              <Input
                id="suffix"
                value={pattern.suffix}
                onChange={(e) => updatePattern({ suffix: e.target.value.toUpperCase() })}
                placeholder="e.g., ID (optional)"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ending text for the ID
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="separator">Separator</Label>
            <Select
              value={pattern.separator || "none"}
              onValueChange={(value) => updatePattern({ separator: value === "none" ? "" : value })}
            >
              <SelectTrigger id="separator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Hyphen (-)</SelectItem>
                <SelectItem value="_">Underscore (_)</SelectItem>
                <SelectItem value="/">Slash (/)</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Character between ID parts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Date Components</CardTitle>
          <CardDescription>Include year or month in the ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-year">Include Year</Label>
              <p className="text-xs text-muted-foreground">
                Add year to the ID pattern
              </p>
            </div>
            <Switch
              id="include-year"
              checked={pattern.include_year}
              onCheckedChange={(checked) => updatePattern({ include_year: checked })}
            />
          </div>

          {pattern.include_year && (
            <div>
              <Label htmlFor="year-format">Year Format</Label>
              <Select
                value={pattern.year_format}
                onValueChange={(value: 'YY' | 'YYYY') => updatePattern({ year_format: value })}
              >
                <SelectTrigger id="year-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY">Full Year (2025)</SelectItem>
                  <SelectItem value="YY">Short Year (25)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-month">Include Month</Label>
              <p className="text-xs text-muted-foreground">
                Add month to the ID pattern
              </p>
            </div>
            <Switch
              id="include-month"
              checked={pattern.include_month}
              onCheckedChange={(checked) => updatePattern({ include_month: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Counter Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Counter Configuration</CardTitle>
          <CardDescription>Configure the sequential number part</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="counter-padding">Number Padding</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Number of digits for the counter. For example, 4 will generate 0001, 0002, etc.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={pattern.counter_padding.toString()}
              onValueChange={(value) => updatePattern({ counter_padding: parseInt(value) })}
            >
              <SelectTrigger id="counter-padding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 digits (001, 002, ...)</SelectItem>
                <SelectItem value="4">4 digits (0001, 0002, ...)</SelectItem>
                <SelectItem value="5">5 digits (00001, 00002, ...)</SelectItem>
                <SelectItem value="6">6 digits (000001, 000002, ...)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entityType === 'student' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">
                    Lifelong Student IDs
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                    Student IDs are permanent and will not reset annually. Once assigned, 
                    they remain with the student throughout their entire educational journey.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
