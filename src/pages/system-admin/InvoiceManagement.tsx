import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Building2, ShoppingCart, Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { InvoiceList } from '@/components/invoice/InvoiceList';
import { CreateInvoiceDialog } from '@/components/invoice/CreateInvoiceDialog';
import { CreatePurchaseInvoiceDialog } from '@/components/invoice/CreatePurchaseInvoiceDialog';
import { ViewInvoiceDialog } from '@/components/invoice/ViewInvoiceDialog';
import { ViewPurchaseInvoiceDialog } from '@/components/invoice/ViewPurchaseInvoiceDialog';
import { useInvoices } from '@/hooks/useInvoices';
import { updateInvoiceStatus, deleteInvoice } from '@/services/invoice.service';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, InvoiceType, InvoiceStatus } from '@/types/invoice';
import { toast } from 'sonner';

export default function InvoiceManagement() {
  const [activeTab, setActiveTab] = useState<InvoiceType>('institution');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPurchaseDialogOpen, setCreatePurchaseDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewPurchaseDialogOpen, setViewPurchaseDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);

  const { invoices, loading, refetch } = useInvoices({ invoice_type: activeTab });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    const { data } = await supabase
      .from('institutions')
      .select('id, name')
      .order('name');
    if (data) setInstitutions(data);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.invoice_type === 'purchase') {
      setViewPurchaseDialogOpen(true);
    } else {
      setViewDialogOpen(true);
    }
  };

  const handleDownload = (invoice: Invoice) => {
    if (invoice.invoice_type === 'purchase' && invoice.attachment_url) {
      // Download the attached bill
      const link = document.createElement('a');
      link.href = invoice.attachment_url;
      link.download = invoice.attachment_name || 'vendor-bill';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For generated invoices, open view dialog for PDF
      setSelectedInvoice(invoice);
      setViewDialogOpen(true);
    }
  };

  const handleCreateClick = () => {
    if (activeTab === 'purchase') {
      setCreatePurchaseDialogOpen(true);
    } else {
      setCreateDialogOpen(true);
    }
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(id, status, status === 'paid' ? new Date().toISOString().split('T')[0] : undefined);
      toast.success(`Invoice marked as ${status}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const getTabIcon = (type: InvoiceType) => {
    switch (type) {
      case 'institution':
        return <Building2 className="h-4 w-4" />;
      case 'sales':
        return <ShoppingCart className="h-4 w-4" />;
      case 'purchase':
        return <Package className="h-4 w-4" />;
    }
  };

  const getTabLabel = (type: InvoiceType) => {
    switch (type) {
      case 'institution':
        return 'Institution Billing';
      case 'sales':
        return 'Sales Billing';
      case 'purchase':
        return 'Purchase Billing';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Invoice Management</h1>
            <p className="text-muted-foreground">
              Create, manage and download invoices
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'purchase' ? 'Record Purchase' : 'Create Invoice'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InvoiceType)}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            {(['institution', 'sales', 'purchase'] as InvoiceType[]).map((type) => (
              <TabsTrigger key={type} value={type} className="gap-2">
                {getTabIcon(type)}
                <span className="hidden sm:inline">{getTabLabel(type)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(['institution', 'sales', 'purchase'] as InvoiceType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              <InvoiceList
                invoices={invoices}
                loading={loading}
                onView={handleView}
                onDownload={handleDownload}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>

        <CreateInvoiceDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          invoiceType={activeTab}
          onSuccess={refetch}
          institutions={institutions}
        />

        <CreatePurchaseInvoiceDialog
          open={createPurchaseDialogOpen}
          onOpenChange={setCreatePurchaseDialogOpen}
          onSuccess={refetch}
        />

        <ViewInvoiceDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          invoice={selectedInvoice}
          onDownload={handleDownload}
        />

        <ViewPurchaseInvoiceDialog
          open={viewPurchaseDialogOpen}
          onOpenChange={setViewPurchaseDialogOpen}
          invoice={selectedInvoice}
        />
      </div>
    </Layout>
  );
}
