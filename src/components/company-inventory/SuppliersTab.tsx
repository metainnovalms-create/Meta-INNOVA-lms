import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { useCompanySuppliers, useDeleteCompanySupplier } from '@/hooks/useCompanyInventory';
import { AddSupplierDialog } from './AddSupplierDialog';
import { EditSupplierDialog } from './EditSupplierDialog';
import { SupplierHistoryDialog } from './SupplierHistoryDialog';
import { CompanySupplier } from '@/types/companyInventory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function SuppliersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<CompanySupplier | null>(null);

  const { data: suppliers = [], isLoading } = useCompanySuppliers();
  const deleteSupplier = useDeleteCompanySupplier();

  const filteredSuppliers = suppliers.filter(
    supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (supplier: CompanySupplier) => {
    setSelectedSupplier(supplier);
    setEditDialogOpen(true);
  };

  const handleViewHistory = (supplier: CompanySupplier) => {
    setSelectedSupplier(supplier);
    setHistoryDialogOpen(true);
  };

  const handleDelete = (supplier: CompanySupplier) => {
    setSelectedSupplier(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSupplier) {
      deleteSupplier.mutate(selectedSupplier.id);
      setDeleteDialogOpen(false);
      setSelectedSupplier(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Suppliers</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No suppliers match your search' : 'No suppliers found. Add your first supplier.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.city || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{supplier.gstin || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewHistory(supplier)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Purchase History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(supplier)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddSupplierDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      
      <EditSupplierDialog
        supplier={selectedSupplier}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <SupplierHistoryDialog
        supplier={selectedSupplier}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSupplier?.name}"? This action cannot be
              undone if there are no stock entries linked to this supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
