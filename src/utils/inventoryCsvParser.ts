import Papa from 'papaparse';

export interface ParsedInventoryRow {
  name: string;
  description?: string;
  unit_price: number;
  units: number;
}

export interface InventoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InventoryDuplicateInfo {
  names: string[];
}

export function parseInventoryCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        resolve(results.data as Record<string, string>[]);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

export function transformInventoryRow(row: Record<string, string>): ParsedInventoryRow {
  return {
    name: row.name?.trim() || '',
    description: row.description?.trim() || undefined,
    unit_price: parseFloat(row.unit_price) || 0,
    units: parseInt(row.units, 10) || 1,
  };
}

export function validateInventoryRow(row: ParsedInventoryRow, rowIndex: number): InventoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation - required
  if (!row.name?.trim()) {
    errors.push('Name is required');
  } else if (row.name.length < 2 || row.name.length > 200) {
    errors.push('Name must be 2-200 characters');
  }

  // Unit price validation - required, must be positive
  if (row.unit_price === undefined || row.unit_price === null || isNaN(row.unit_price)) {
    errors.push('Unit price is required');
  } else if (row.unit_price < 0) {
    errors.push('Unit price cannot be negative');
  } else if (row.unit_price === 0) {
    warnings.push('Unit price is zero');
  }

  // Units validation - optional, defaults to 1
  if (row.units !== undefined && row.units !== null) {
    if (isNaN(row.units) || row.units < 0) {
      errors.push('Units must be a non-negative number');
    } else if (row.units === 0) {
      warnings.push('Units is zero');
    }
  }

  // Description - optional, just warn if very long
  if (row.description && row.description.length > 500) {
    warnings.push('Description is very long (>500 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function findInventoryDuplicates(data: ParsedInventoryRow[]): InventoryDuplicateInfo {
  const names = new Map<string, number>();
  const duplicateNames: string[] = [];

  data.forEach((row, index) => {
    const name = row.name?.trim()?.toLowerCase();

    if (name) {
      if (names.has(name)) {
        duplicateNames.push(name);
      } else {
        names.set(name, index);
      }
    }
  });

  return {
    names: [...new Set(duplicateNames)]
  };
}

export function generateInventoryTemplate(): Blob {
  const headers = ['name', 'description', 'unit_price', 'units'];

  const exampleRows = [
    ['Arduino Uno', 'Microcontroller board for prototyping', '800', '10'],
    ['Raspberry Pi 4', 'Single-board computer 4GB RAM', '4500', '5'],
    ['Jumper Wires', 'Male-to-Male 40pcs pack', '120', '20'],
    ['Breadboard', '830 points solderless breadboard', '180', '15'],
    ['LED Pack', '5mm Assorted Colors 100pcs', '250', '10'],
  ];

  const csvContent = [
    '# Inventory Items Bulk Import Template',
    '# Required columns: name, unit_price',
    '# Optional columns: description (text), units (defaults to 1)',
    '',
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}
