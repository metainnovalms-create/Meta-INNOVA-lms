import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingDown, DollarSign, Users } from 'lucide-react';
import { useCompanyInventoryStats } from '@/hooks/useCompanyInventory';
import { ItemMasterTab } from '@/components/company-inventory/ItemMasterTab';
import { StockEntryTab } from '@/components/company-inventory/StockEntryTab';
import { StockIssueTab } from '@/components/company-inventory/StockIssueTab';
import { SuppliersTab } from '@/components/company-inventory/SuppliersTab';
import { ReportsTab } from '@/components/company-inventory/ReportsTab';

export default function CompanyInventory() {
  const [activeTab, setActiveTab] = useState('items');
  const { data: stats, isLoading: statsLoading } = useCompanyInventoryStats();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Inventory</h1>
          <p className="text-muted-foreground">
            Manage internal stock, track entries and issues, and generate reports
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.totalItems || 0}
              </div>
              <p className="text-xs text-muted-foreground">Items in master</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {statsLoading ? '...' : stats?.lowStockCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Below reorder level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{statsLoading ? '...' : (stats?.totalValue || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">Based on purchase value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.totalSuppliers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Registered suppliers</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="items">Item Master</TabsTrigger>
            <TabsTrigger value="entries">Stock Entry</TabsTrigger>
            <TabsTrigger value="issues">Stock Issue</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ItemMasterTab />
          </TabsContent>

          <TabsContent value="entries">
            <StockEntryTab />
          </TabsContent>

          <TabsContent value="issues">
            <StockIssueTab />
          </TabsContent>

          <TabsContent value="suppliers">
            <SuppliersTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
