import { IdConfiguration, IdPattern, IdPreview } from '@/types/id-configuration';

/**
 * Generate an ID based on configuration
 */
export const generateIdFromPattern = (
  config: IdConfiguration,
  customValues?: Record<string, string>
): string => {
  let id = '';
  const now = new Date();
  const year = config.year_format === 'YYYY' 
    ? now.getFullYear().toString() 
    : now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const counter = config.current_counter.toString().padStart(config.counter_padding, '0');

  // Build ID from pattern template
  let pattern = config.pattern_template;
  
  // Replace placeholders
  pattern = pattern.replace('{PREFIX}', config.prefix);
  pattern = pattern.replace('{SUFFIX}', config.suffix);
  pattern = pattern.replace('{SEPARATOR}', config.separator);
  pattern = pattern.replace('{YEAR}', config.include_year ? year : '');
  pattern = pattern.replace('{MONTH}', config.include_month ? month : '');
  pattern = pattern.replace('{COUNTER}', counter);

  // Replace custom fields
  if (config.custom_fields && customValues) {
    config.custom_fields.forEach(field => {
      const value = customValues[field.name] || field.value;
      pattern = pattern.replace(`{${field.name.toUpperCase()}}`, value);
    });
  }

  // Clean up multiple separators
  const sep = config.separator;
  if (sep) {
    // Replace multiple consecutive separators with single separator
    const regex = new RegExp(`${sep}+`, 'g');
    pattern = pattern.replace(regex, sep);
    // Remove leading/trailing separators
    pattern = pattern.replace(new RegExp(`^${sep}|${sep}$`, 'g'), '');
  }

  return pattern;
};

/**
 * Build pattern template from configuration
 */
export const buildPatternTemplate = (pattern: IdPattern): string => {
  const parts: string[] = [];
  
  if (pattern.prefix) {
    parts.push('{PREFIX}');
  }
  
  if (pattern.include_year) {
    parts.push('{YEAR}');
  }
  
  if (pattern.include_month) {
    parts.push('{MONTH}');
  }
  
  if (pattern.custom_fields && pattern.custom_fields.length > 0) {
    pattern.custom_fields
      .sort((a, b) => a.position - b.position)
      .forEach(field => {
        parts.push(`{${field.name.toUpperCase()}}`);
      });
  }
  
  parts.push('{COUNTER}');
  
  if (pattern.suffix) {
    parts.push('{SUFFIX}');
  }
  
  return parts.join('{SEPARATOR}');
};

/**
 * Generate preview examples
 */
export const generateIdPreview = (config: IdConfiguration): IdPreview => {
  const pattern = config.pattern_template;
  const exampleId = generateIdFromPattern(config);
  const nextCounter = config.current_counter + 1;
  const nextConfig = { ...config, current_counter: nextCounter };
  const nextId = generateIdFromPattern(nextConfig);

  return {
    pattern,
    example: exampleId,
    next_id: nextId,
  };
};

/**
 * Validate ID configuration
 */
export const validateIdConfiguration = (config: Partial<IdConfiguration>): string[] => {
  const errors: string[] = [];

  if (!config.prefix && !config.suffix) {
    errors.push('Either prefix or suffix is required');
  }

  if (config.counter_padding && (config.counter_padding < 1 || config.counter_padding > 10)) {
    errors.push('Counter padding must be between 1 and 10');
  }

  if (config.pattern_template && !config.pattern_template.includes('{COUNTER}')) {
    errors.push('Pattern template must include {COUNTER}');
  }

  return errors;
};

/**
 * Get default configuration for entity type
 */
export const getDefaultIdConfiguration = (entityType: 'employee' | 'institution' | 'student'): Partial<IdConfiguration> => {
  const defaults = {
    employee: {
      prefix: 'EMP',
      suffix: '',
      separator: '-',
      pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
      counter_padding: 4,
      current_counter: 1,
      reset_counter_annually: true,
      include_year: true,
      year_format: 'YYYY' as const,
      include_month: false,
    },
    institution: {
      prefix: 'INST',
      suffix: '',
      separator: '-',
      pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
      counter_padding: 3,
      current_counter: 1,
      reset_counter_annually: true,
      include_year: true,
      year_format: 'YYYY' as const,
      include_month: false,
    },
    student: {
      prefix: 'STU',
      suffix: '',
      separator: '-',
      pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
      counter_padding: 5,
      current_counter: 1,
      reset_counter_annually: false, // Students keep IDs for life
      include_year: true,
      year_format: 'YYYY' as const,
      include_month: false,
    },
  };

  return defaults[entityType];
};

/**
 * Format ID for display
 */
export const formatIdForDisplay = (id: string, entityType: 'employee' | 'institution' | 'student'): string => {
  return id;
};

/**
 * Parse pattern template to human-readable format
 */
export const parsePatternToReadable = (pattern: string): string => {
  return pattern
    .replace('{PREFIX}', 'Prefix')
    .replace('{SUFFIX}', 'Suffix')
    .replace('{SEPARATOR}', '-')
    .replace('{YEAR}', 'Year')
    .replace('{MONTH}', 'Month')
    .replace('{COUNTER}', 'Number');
};

/**
 * Check if counter should reset
 */
export const shouldResetCounter = (config: IdConfiguration, lastGeneratedDate: string): boolean => {
  if (!config.reset_counter_annually) {
    return false;
  }

  const lastDate = new Date(lastGeneratedDate);
  const currentDate = new Date();

  return lastDate.getFullYear() !== currentDate.getFullYear();
};
