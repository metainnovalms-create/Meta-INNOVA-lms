import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchInvoices } from '@/services/invoice.service';
import type { Invoice, InvoiceFilters } from '@/types/invoice';
import { toast } from 'sonner';

export function useInvoices(filters?: InvoiceFilters) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetching = useRef(false);

  // Extract individual filter values to use as stable dependencies
  const invoiceType = filters?.invoice_type;
  const status = filters?.status;
  const institutionId = filters?.institution_id;
  const search = filters?.search;
  const startDate = filters?.start_date;
  const endDate = filters?.end_date;

  const loadInvoices = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetching.current) return;
    
    isFetching.current = true;
    try {
      setLoading(true);
      const filterParams: InvoiceFilters = {};
      if (invoiceType) filterParams.invoice_type = invoiceType;
      if (status) filterParams.status = status;
      if (institutionId) filterParams.institution_id = institutionId;
      if (search) filterParams.search = search;
      if (startDate) filterParams.start_date = startDate;
      if (endDate) filterParams.end_date = endDate;

      const data = await fetchInvoices(filterParams);
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err as Error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [invoiceType, status, institutionId, search, startDate, endDate]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newInvoice = payload.new as Invoice;
            // Only add if it matches current filters
            if (!invoiceType || newInvoice.invoice_type === invoiceType) {
              setInvoices((prev) => [{ ...newInvoice, line_items: [] }, ...prev]);
              toast.success('New invoice created');
            }
          } else if (payload.eventType === 'UPDATE') {
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === payload.new.id ? { ...inv, ...payload.new } : inv
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setInvoices((prev) => prev.filter((inv) => inv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invoiceType]);

  return { invoices, loading, error, refetch: loadInvoices };
}
