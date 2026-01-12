import { supabase } from '@/integrations/supabase/client';

interface InstitutionSettings {
  student_id_prefix?: string;
  student_id_suffix?: string;
}

export function useRollNumberGenerator(institutionId: string) {
  const generateRollNumber = async (): Promise<string> => {
    try {
      console.log('Generating roll number for institution:', institutionId);
      
      // Get next counter from database (atomic operation)
      const { data: counter, error } = await supabase.rpc('get_next_id', {
        p_institution_id: institutionId,
        p_entity_type: 'roll_number',
      });

      if (error) {
        console.error('get_next_id RPC error:', error);
        throw error;
      }

      console.log('Counter received:', counter);

      // Get institution settings for prefix/suffix
      const { data: instData, error: instError } = await supabase
        .from('institutions')
        .select('settings')
        .eq('id', institutionId)
        .single();

      if (instError) {
        console.error('Institution fetch error:', instError);
      }

      const settings = (instData?.settings || {}) as InstitutionSettings;
      const prefix = settings.student_id_prefix || 'STU';
      const suffix = settings.student_id_suffix || '';
      const year = new Date().getFullYear();
      const paddedCounter = String(counter).padStart(4, '0');

      console.log('Roll number parts:', { prefix, suffix, year, counter: paddedCounter });

      // Format: PREFIX-YEAR-COUNTER or PREFIX-YEAR-COUNTER-SUFFIX
      return suffix 
        ? `${prefix}-${year}-${paddedCounter}-${suffix}`
        : `${prefix}-${year}-${paddedCounter}`;
    } catch (error) {
      console.error('Roll number generation failed:', error);
      return `ROLL-${Date.now()}`;
    }
  };

  const generateRollNumbers = async (count: number): Promise<string[]> => {
    try {
      // Reserve a range of IDs
      const { data, error } = await supabase.rpc('reserve_id_range', {
        p_institution_id: institutionId,
        p_entity_type: 'roll_number',
        p_count: count,
      });

      if (error) throw error;

      // Get institution settings for prefix/suffix
      const { data: instData } = await supabase
        .from('institutions')
        .select('settings')
        .eq('id', institutionId)
        .single();

      const settings = (instData?.settings || {}) as InstitutionSettings;
      const prefix = settings.student_id_prefix || 'STU';
      const suffix = settings.student_id_suffix || '';
      const year = new Date().getFullYear();
      
      const startCounter = data?.[0]?.start_counter || 1;
      const rollNumbers: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const paddedCounter = String(startCounter + i).padStart(4, '0');
        const rollNumber = suffix 
          ? `${prefix}-${year}-${paddedCounter}-${suffix}`
          : `${prefix}-${year}-${paddedCounter}`;
        rollNumbers.push(rollNumber);
      }

      return rollNumbers;
    } catch (error) {
      return Array.from({ length: count }, (_, i) => `ROLL-${Date.now()}-${i}`);
    }
  };

  return { generateRollNumber, generateRollNumbers };
}
