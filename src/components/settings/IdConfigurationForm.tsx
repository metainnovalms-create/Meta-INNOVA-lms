import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IdPattern, IdConfiguration } from '@/types/id-configuration';
import { IdPatternBuilder } from './IdPatternBuilder';
import { IdPreviewCard } from './IdPreviewCard';
import { buildPatternTemplate, generateIdPreview, getDefaultIdConfiguration } from '@/utils/idGenerationHelpers';
import { idGenerationService } from '@/services/id-generation.service';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface IdConfigurationFormProps {
  entityType: 'employee' | 'institution' | 'student';
  institutionId?: string;
  onSave?: () => void;
}

export function IdConfigurationForm({ 
  entityType, 
  institutionId,
  onSave 
}: IdConfigurationFormProps) {
  const [pattern, setPattern] = useState<IdPattern>({
    prefix: '',
    suffix: '',
    separator: '-',
    include_year: true,
    year_format: 'YYYY',
    include_month: false,
    counter_padding: 4,
  });

  const [configuration, setConfiguration] = useState<IdConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [entityType, institutionId]);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const response = await idGenerationService.getIdConfiguration(entityType, institutionId);
      
      if (response.success && response.data) {
        const config = response.data;
        setConfiguration(config);
        setPattern({
          prefix: config.prefix,
          suffix: config.suffix,
          separator: config.separator,
          include_year: config.include_year,
          year_format: config.year_format,
          include_month: config.include_month,
          counter_padding: config.counter_padding,
          custom_fields: config.custom_fields,
        });
      } else {
        // Load defaults
        const defaults = getDefaultIdConfiguration(entityType);
        setPattern({
          prefix: defaults.prefix || '',
          suffix: defaults.suffix || '',
          separator: defaults.separator || '-',
          include_year: defaults.include_year || true,
          year_format: defaults.year_format || 'YYYY',
          include_month: defaults.include_month || false,
          counter_padding: defaults.counter_padding || 4,
        });
      }
    } catch (error) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const patternTemplate = buildPatternTemplate(pattern);
      
      const configToSave: Partial<IdConfiguration> = {
        entity_type: entityType,
        institution_id: institutionId,
        prefix: pattern.prefix,
        suffix: pattern.suffix,
        separator: pattern.separator,
        pattern_template: patternTemplate,
        counter_padding: pattern.counter_padding,
        current_counter: configuration?.current_counter || 1,
        reset_counter_annually: entityType !== 'student', // Students never reset
        include_year: pattern.include_year,
        year_format: pattern.year_format,
        include_month: pattern.include_month,
        custom_fields: pattern.custom_fields,
      };

      const response = await idGenerationService.saveIdConfiguration(configToSave);
      
      if (response.success) {
        toast.success('ID configuration saved successfully');
        setConfiguration(response.data);
        onSave?.();
      } else {
        toast.error(response.message || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const getPreview = () => {
    const tempConfig: IdConfiguration = {
      id: 'temp',
      entity_type: entityType,
      ...pattern,
      pattern_template: buildPatternTemplate(pattern),
      current_counter: configuration?.current_counter || 1,
      reset_counter_annually: entityType !== 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current-user',
    };

    return generateIdPreview(tempConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Configuration */}
      <div className="space-y-6">
        <IdPatternBuilder
          pattern={pattern}
          onChange={setPattern}
          entityType={entityType}
        />

        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <IdPreviewCard preview={getPreview()} entityType={entityType} />
      </div>
    </div>
  );
}
