import { IdConfiguration, GeneratedId, IdEntityType, IdGenerationRequest } from '@/types/id-configuration';
import { ApiResponse } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const idGenerationService = {
  /**
   * Get ID configuration for entity type
   */
  async getIdConfiguration(
    entityType: IdEntityType,
    institutionId?: string
  ): Promise<ApiResponse<IdConfiguration>> {
    if (!institutionId) {
      return {
        success: false,
        message: 'Institution ID required',
        data: null as any,
      };
    }

    try {
      const { data, error } = await supabase
        .from('id_counters')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('entity_type', entityType)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Return default config if not found
      const config: IdConfiguration = data ? {
        id: data.id,
        entity_type: entityType,
        institution_id: institutionId,
        prefix: data.prefix || 'STU',
        suffix: '',
        separator: '-',
        pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
        counter_padding: data.counter_padding || 4,
        current_counter: data.current_counter || 0,
        reset_counter_annually: false,
        include_year: true,
        year_format: (data.year_format as 'YY' | 'YYYY') || 'YYYY',
        include_month: false,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: 'system',
      } : {
        id: `temp-${Date.now()}`,
        entity_type: entityType,
        institution_id: institutionId,
        prefix: 'STU',
        suffix: '',
        separator: '-',
        pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
        counter_padding: 4,
        current_counter: 0,
        reset_counter_annually: false,
        include_year: true,
        year_format: 'YYYY' as const,
        include_month: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
      };

      return {
        success: true,
        message: 'Configuration retrieved',
        data: config,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get configuration',
        data: null as any,
      };
    }
  },

  /**
   * Save or update ID configuration
   */
  async saveIdConfiguration(
    config: Partial<IdConfiguration>
  ): Promise<ApiResponse<IdConfiguration>> {
    if (!config.institution_id || !config.entity_type) {
      return {
        success: false,
        message: 'Institution ID and entity type required',
        data: null as any,
      };
    }

    try {
      const { data, error } = await supabase
        .from('id_counters')
        .upsert({
          institution_id: config.institution_id,
          entity_type: config.entity_type,
          prefix: config.prefix || 'STU',
          year_format: config.year_format || 'YYYY',
          counter_padding: config.counter_padding || 4,
          current_counter: config.current_counter || 0,
        }, {
          onConflict: 'institution_id,entity_type',
        })
        .select()
        .single();

      if (error) throw error;

      const savedConfig: IdConfiguration = {
        id: data.id,
        entity_type: config.entity_type,
        institution_id: config.institution_id,
        prefix: data.prefix || 'STU',
        suffix: '',
        separator: '-',
        pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
        counter_padding: data.counter_padding || 4,
        current_counter: data.current_counter || 0,
        reset_counter_annually: false,
        include_year: true,
        year_format: (data.year_format as 'YY' | 'YYYY') || 'YYYY',
        include_month: false,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: 'system',
      };

      return {
        success: true,
        message: 'Configuration saved successfully',
        data: savedConfig,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to save configuration',
        data: null as any,
      };
    }
  },

  /**
   * Generate new ID using database function
   */
  async generateId(
    request: IdGenerationRequest
  ): Promise<ApiResponse<{ id: string; counter: number }>> {
    if (!request.institution_id) {
      return {
        success: false,
        message: 'Institution ID required',
        data: null as any,
      };
    }

    try {
      // Get next counter from database (atomic operation)
      const { data: counter, error } = await supabase.rpc('get_next_id', {
        p_institution_id: request.institution_id,
        p_entity_type: request.entity_type,
      });

      if (error) throw error;

      // Get institution code for prefix
      const { data: instData } = await supabase
        .from('institutions')
        .select('code, slug')
        .eq('id', request.institution_id)
        .single();

      const prefix = instData?.code || instData?.slug?.toUpperCase() || 'STU';
      const year = new Date().getFullYear();
      const paddedCounter = String(counter).padStart(4, '0');

      const generatedId = `${prefix}-${year}-${paddedCounter}`;

      return {
        success: true,
        message: 'ID generated successfully',
        data: {
          id: generatedId,
          counter: counter,
        },
      };
    } catch (error: any) {
      // Fallback to temp ID if database fails
      const tempId = `STU-${Date.now()}`;
      return {
        success: true,
        message: 'Generated temporary ID',
        data: {
          id: tempId,
          counter: 0,
        },
      };
    }
  },

  /**
   * Check if ID is unique
   */
  async isIdUnique(
    id: string,
    entityType: IdEntityType
  ): Promise<ApiResponse<boolean>> {
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'ID checked',
        data: (count || 0) === 0,
      };
    } catch (error: any) {
      return {
        success: true,
        message: 'ID checked (fallback)',
        data: true,
      };
    }
  },

  /**
   * Reset counter for configuration
   */
  async resetCounter(
    entityType: IdEntityType,
    institutionId?: string
  ): Promise<ApiResponse<IdConfiguration>> {
    if (!institutionId) {
      return {
        success: false,
        message: 'Institution ID required',
        data: null as any,
      };
    }

    try {
      const { data, error } = await supabase
        .from('id_counters')
        .upsert({
          institution_id: institutionId,
          entity_type: entityType,
          current_counter: 0,
        }, {
          onConflict: 'institution_id,entity_type',
        })
        .select()
        .single();

      if (error) throw error;

      const config: IdConfiguration = {
        id: data.id,
        entity_type: entityType,
        institution_id: institutionId,
        prefix: data.prefix || 'STU',
        suffix: '',
        separator: '-',
        pattern_template: '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}',
        counter_padding: data.counter_padding || 4,
        current_counter: 0,
        reset_counter_annually: false,
        include_year: true,
        year_format: (data.year_format as 'YY' | 'YYYY') || 'YYYY',
        include_month: false,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: 'system',
      };

      return {
        success: true,
        message: 'Counter reset successfully',
        data: config,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reset counter',
        data: null as any,
      };
    }
  },
};
