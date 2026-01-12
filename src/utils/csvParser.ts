import Papa from 'papaparse';

export interface ParsedRow {
  student_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  // Optional fields
  blood_group?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  previous_school?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DuplicateInfo {
  emails: string[];
}

export function parseCSV(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        resolve(results.data as ParsedRow[]);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

export function validateRow(row: ParsedRow, rowIndex: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation - Only 5 fields are mandatory
  if (!row.student_name?.trim()) {
    errors.push('Student name is required');
  } else if (row.student_name.length < 2 || row.student_name.length > 100) {
    errors.push('Student name must be 2-100 characters');
  }

  // Email validation for student login
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!row.email?.trim()) {
    errors.push('Student email is required for login');
  } else if (!emailRegex.test(row.email)) {
    errors.push('Invalid student email format');
  }

  // Password validation for student login
  if (!row.password?.trim()) {
    errors.push('Password is required for student login');
  } else if (row.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Date validation
  if (!row.date_of_birth) {
    errors.push('Date of birth is required');
  } else {
    const dob = new Date(row.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date format (use YYYY-MM-DD)');
    } else {
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 3 || age > 25) {
        warnings.push('Student age should typically be between 3 and 25 years');
      }
    }
  }

  // Gender validation
  if (!row.gender || !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
    errors.push('Gender must be male, female, or other');
  }

  // Optional field validations (only warnings, not errors)
  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  if (row.blood_group && !validBloodGroups.includes(row.blood_group.toUpperCase())) {
    warnings.push('Invalid blood group format');
  }

  // Phone validation (optional)
  const phoneRegex = /^[\+]?[0-9\s\-()]{10,20}$/;
  if (row.parent_phone && !phoneRegex.test(row.parent_phone)) {
    warnings.push('Parent phone number format may be invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function findDuplicates(data: ParsedRow[]): DuplicateInfo {
  const emails = new Map<string, number>();
  const duplicateEmails: string[] = [];

  data.forEach((row, index) => {
    const email = row.email?.trim()?.toLowerCase();

    if (email) {
      if (emails.has(email)) {
        duplicateEmails.push(email);
      } else {
        emails.set(email, index);
      }
    }
  });

  return {
    emails: [...new Set(duplicateEmails)]
  };
}

export function generateTemplate(): Blob {
  const headers = [
    'student_name',
    'email',
    'password',
    'date_of_birth',
    'gender',
    'blood_group',
    'parent_name',
    'parent_phone',
    'address',
    'previous_school'
  ];

  const exampleRow = [
    'John Doe',
    'john.doe@school.com',
    'Student@123',
    '2010-05-15',
    'male',
    'O+',
    'Mr. Robert Doe',
    '+91-98765-43210',
    '123 Main St, New Delhi',
    'XYZ School'
  ];

  // Add header comment explaining required vs optional
  const headerComment = '# Required: student_name, email, password, date_of_birth, gender | Optional: blood_group, parent_name, parent_phone, address, previous_school';
  
  const csvContent = [
    headerComment,
    headers.join(','),
    exampleRow.map(cell => `"${cell}"`).join(',')
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}
