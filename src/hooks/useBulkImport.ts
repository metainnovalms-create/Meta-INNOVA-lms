import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIdCounter } from './useTimetable';
import { ParsedRow } from '@/utils/csvParser';

export interface BulkImportResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  duplicates: string[];
}

export interface BulkImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  createAuthUsers: boolean;
}

export function useBulkImportStudents(institutionId: string, classId: string) {
  const queryClient = useQueryClient();
  const { reserveIdRange } = useIdCounter(institutionId);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const bulkImportMutation = useMutation({
    mutationFn: async ({
      students,
      options,
    }: {
      students: ParsedRow[];
      options: BulkImportOptions;
    }): Promise<BulkImportResult> => {
      setIsImporting(true);
      setProgress(0);
      
      const result: BulkImportResult = {
        imported: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        duplicates: [],
      };

      const validStudents = students.filter(s => s.student_name?.trim());
      if (validStudents.length === 0) {
        throw new Error('No valid students to import');
      }

      try {
        // Reserve ID range for student IDs
        const { start: startCounter } = await reserveIdRange('student', validStudents.length);
        
        // Reserve ID range for roll numbers
        const { data: rollRangeData } = await supabase.rpc('reserve_id_range', {
          p_institution_id: institutionId,
          p_entity_type: 'roll_number',
          p_count: validStudents.length,
        });
        const rollStartCounter = rollRangeData?.[0]?.start_counter || 1;
        
        const currentYear = new Date().getFullYear();
        
        // Get institution settings for prefix/suffix
        const { data: instData } = await supabase
          .from('institutions')
          .select('code, slug, settings')
          .eq('id', institutionId)
          .single();
        
        const settings = (instData?.settings || {}) as { student_id_prefix?: string; student_id_suffix?: string };
        const rollPrefix = settings.student_id_prefix || 'STU';
        const rollSuffix = settings.student_id_suffix || '';
        const institutionCode = instData?.code || instData?.slug?.toUpperCase() || 'STU';

        // Check for existing students by email if needed
        let existingEmails: Set<string> = new Set();
        
        if (options.skipDuplicates) {
          const { data: existingStudents } = await supabase
            .from('students')
            .select('email')
            .eq('institution_id', institutionId);
          
          if (existingStudents) {
            existingEmails = new Set(
              existingStudents
                .map(s => s.email?.toLowerCase())
                .filter((email): email is string => Boolean(email))
            );
          }
        }

        // Process students in batches
        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < validStudents.length; i += batchSize) {
          batches.push(validStudents.slice(i, i + batchSize));
        }

        let processedCount = 0;
        let counterOffset = 0;
        
        for (const batch of batches) {
          const studentsToInsert: any[] = [];
          
          for (let i = 0; i < batch.length; i++) {
            const student = batch[i];
            
            // Check for duplicates by email
            const studentEmail = student.email?.toLowerCase();
            const isDuplicate = studentEmail && existingEmails.has(studentEmail);
            
            if (isDuplicate && options.skipDuplicates) {
              result.skipped++;
              result.duplicates.push(student.email || student.student_name);
              continue;
            }

            // Add to existing emails set to prevent duplicates within the same import
            if (studentEmail) {
              existingEmails.add(studentEmail);
            }

            const counter = startCounter + counterOffset;
            const rollCounter = rollStartCounter + counterOffset;
            counterOffset++;

            // Generate student ID
            const studentId = `${institutionCode}-${currentYear}-${String(counter).padStart(4, '0')}`;
            
            // Generate roll number using settings prefix/suffix
            const rollNumber = rollSuffix 
              ? `${rollPrefix}-${currentYear}-${String(rollCounter).padStart(4, '0')}-${rollSuffix}`
              : `${rollPrefix}-${currentYear}-${String(rollCounter).padStart(4, '0')}`;

            // Create auth user if option enabled and email/password provided
            let userId: string | null = null;
            if (options.createAuthUsers && student.email && student.password) {
              try {
                const response = await supabase.functions.invoke('create-student-user', {
                  body: {
                    email: student.email,
                    password: student.password,
                    student_name: student.student_name,
                    institution_id: institutionId,
                    class_id: classId,
                  },
                });
                
                if (response.data?.user_id) {
                  userId = response.data.user_id;
                } else if (response.error) {
                  console.error('[BulkImport] Failed to create auth user for:', student.email, response.error);
                }
              } catch (err) {
                console.error('[BulkImport] Error creating auth user for:', student.email, err);
              }
            }

            studentsToInsert.push({
              institution_id: institutionId,
              class_id: classId,
              student_id: studentId,
              student_name: student.student_name,
              email: student.email || null,
              user_id: userId,
              roll_number: rollNumber, // Auto-generated
              admission_number: `ADM-${currentYear}-${String(counter).padStart(4, '0')}`,
              date_of_birth: student.date_of_birth || null,
              gender: student.gender?.toLowerCase() || 'male',
              blood_group: student.blood_group || null,
              admission_date: new Date().toISOString().split('T')[0],
              parent_name: student.parent_name || null,
              parent_phone: student.parent_phone || null,
              address: student.address || null,
              previous_school: student.previous_school || null,
              status: 'active',
            });
          }

          if (studentsToInsert.length > 0) {
            const { data, error } = await supabase
              .from('students')
              .insert(studentsToInsert)
              .select();

            if (error) {
              result.failed += studentsToInsert.length;
              result.errors.push(error.message);
            } else {
              result.imported += data?.length || 0;
            }
          }

          processedCount += batch.length;
          setProgress(Math.round((processedCount / validStudents.length) * 100));
        }

        return result;
      } finally {
        setIsImporting(false);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['students', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-counts', institutionId] });
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} students`);
      }
      if (result.skipped > 0) {
        toast.info(`Skipped ${result.skipped} duplicate entries`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} students`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Bulk import failed: ${error.message}`);
    },
  });

  return {
    bulkImport: bulkImportMutation.mutateAsync,
    progress,
    isImporting,
    reset: () => {
      setProgress(0);
      setIsImporting(false);
    },
  };
}
