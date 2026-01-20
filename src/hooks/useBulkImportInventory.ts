import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ParsedInventoryRow, validateInventoryRow } from '@/utils/inventoryCsvParser';

export interface BulkInventoryImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface BulkImportInventoryOptions {
  skipDuplicates: boolean;
}

export function useBulkImportInventory(institutionId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const bulkImportMutation = useMutation({
    mutationFn: async ({
      items,
      userId,
      options = { skipDuplicates: true }
    }: {
      items: ParsedInventoryRow[];
      userId: string;
      options?: BulkImportInventoryOptions;
    }): Promise<BulkInventoryImportResult> => {
      setIsImporting(true);
      setProgress(0);

      const result: BulkInventoryImportResult = {
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      try {
        // Filter valid items
        const validItems = items.filter((item, index) => {
          const validation = validateInventoryRow(item, index);
          if (!validation.isValid) {
            result.failed++;
            result.errors.push({
              row: index + 1,
              message: validation.errors.join(', ')
            });
            return false;
          }
          return true;
        });

        if (validItems.length === 0) {
          return result;
        }

        // Check for existing items if skipDuplicates is enabled
        let existingNames = new Set<string>();
        if (options.skipDuplicates) {
          const { data: existingItems } = await supabase
            .from('inventory_items')
            .select('name')
            .eq('institution_id', institutionId)
            .eq('status', 'active');

          if (existingItems) {
            existingNames = new Set(
              existingItems
                .map(i => i.name?.toLowerCase())
                .filter((name): name is string => Boolean(name))
            );
          }
        }

        // Filter out duplicates
        const itemsToInsert = validItems.filter((item, index) => {
          if (existingNames.has(item.name.toLowerCase())) {
            result.skipped++;
            return false;
          }
          return true;
        });

        if (itemsToInsert.length === 0) {
          setProgress(100);
          return result;
        }

        // Check if there are any active inventory items for this institution
        const { count, error: countError } = await supabase
          .from('inventory_items')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .eq('status', 'active');

        if (countError) throw countError;

        // If no active items exist, reset the counter to 0
        if (count === 0) {
          await supabase
            .from('id_counters')
            .update({ current_counter: 0, updated_at: new Date().toISOString() })
            .eq('institution_id', institutionId)
            .eq('entity_type', 'inventory_item');
        }

        // Reserve ID range for all items
        const { data: rangeData, error: rangeError } = await supabase.rpc('reserve_id_range', {
          p_institution_id: institutionId,
          p_entity_type: 'inventory_item',
          p_count: itemsToInsert.length
        });

        if (rangeError) throw rangeError;

        const startCounter = rangeData?.[0]?.start_counter || 1;

        // Process items in batches
        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < itemsToInsert.length; i += batchSize) {
          batches.push(itemsToInsert.slice(i, i + batchSize));
        }

        let processedCount = 0;
        let counterOffset = 0;

        for (const batch of batches) {
          const batchRecords = batch.map((item, batchIndex) => ({
            institution_id: institutionId,
            sl_no: startCounter + counterOffset + batchIndex,
            name: item.name.trim(),
            description: item.description?.trim() || null,
            unit_price: item.unit_price,
            units: item.units || 1,
            category: 'general',
            status: 'active',
            created_by: userId
          }));

          const { error: insertError } = await supabase
            .from('inventory_items')
            .insert(batchRecords);

          if (insertError) {
            // Log error but continue with next batch
            console.error('Batch insert error:', insertError);
            result.failed += batch.length;
            batch.forEach((_, idx) => {
              result.errors.push({
                row: processedCount + idx + 1,
                message: insertError.message
              });
            });
          } else {
            result.imported += batch.length;
          }

          counterOffset += batch.length;
          processedCount += batch.length;
          setProgress(Math.round((processedCount / itemsToInsert.length) * 100));
        }

        return result;
      } finally {
        setIsImporting(false);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} item(s)`);
      }
      if (result.skipped > 0) {
        toast.info(`Skipped ${result.skipped} duplicate item(s)`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} item(s)`);
      }
    },
    onError: (error) => {
      toast.error('Bulk import failed: ' + (error as Error).message);
      setIsImporting(false);
    }
  });

  return {
    bulkImport: bulkImportMutation.mutate,
    bulkImportAsync: bulkImportMutation.mutateAsync,
    isImporting,
    progress,
    isPending: bulkImportMutation.isPending,
    reset: () => {
      setProgress(0);
      setIsImporting(false);
    }
  };
}
