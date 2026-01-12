import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plus, Search, Filter, Loader2 } from "lucide-react";
import { CommunicationLogCard } from "@/components/crm/CommunicationLogCard";
import { ContractTracker } from "@/components/crm/ContractTracker";

import { CRMTaskManager } from "@/components/crm/CRMTaskManager";
import { CommunicationTimeline } from "@/components/crm/CommunicationTimeline";
import { AddCommunicationDialog } from "@/components/crm/AddCommunicationDialog";
import { ViewCommunicationDialog } from "@/components/crm/ViewCommunicationDialog";
import { EditCommunicationDialog } from "@/components/crm/EditCommunicationDialog";
import { AddContractDialog } from "@/components/crm/AddContractDialog";
import { ViewContractDialog } from "@/components/crm/ViewContractDialog";
import { EditContractDialog } from "@/components/crm/EditContractDialog";
import { DeleteContractDialog } from "@/components/crm/DeleteContractDialog";
import { DeleteCommunicationDialog } from "@/components/crm/DeleteCommunicationDialog";
import { RenewalWorkflowDialog } from "@/components/crm/RenewalWorkflowDialog";
import { AddTaskDialog } from "@/components/crm/AddTaskDialog";
import { EditTaskDialog } from "@/components/crm/EditTaskDialog";
import { ViewTaskDialog } from "@/components/crm/ViewTaskDialog";
import { TimelineFilterDialog } from "@/components/crm/TimelineFilterDialog";
import { type ContractDetail } from "@/data/mockCRMData";
import { CommunicationLog } from "@/types/communicationLog";
import { useRealtimeCommunicationLogs } from "@/hooks/useRealtimeCommunicationLogs";
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, useRenewContract } from "@/hooks/useContracts";
import { 
  useCRMTasks, 
  useCreateCRMTask, 
  useUpdateCRMTask, 
  useDeleteCRMTask, 
  useMarkTaskComplete,
  CRMTask 
} from "@/hooks/useCRMTasks";
import { 
  createCommunicationLog, 
  updateCommunicationLog, 
  deleteCommunicationLog,
  fetchInstitutions 
} from "@/services/communicationLog.service";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function CRM() {
  const [activeTab, setActiveTab] = useState("communications");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Current user info
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  
  // Institutions from database
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  
  // Communication logs from database with real-time updates
  const { logs: communicationLogs, loading: logsLoading, refetch: refetchLogs } = useRealtimeCommunicationLogs(
    searchQuery ? { search: searchQuery } : undefined
  );
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewCommunicationOpen, setIsViewCommunicationOpen] = useState(false);
  const [isEditCommunicationOpen, setIsEditCommunicationOpen] = useState(false);
  const [isDeleteCommunicationOpen, setIsDeleteCommunicationOpen] = useState(false);
  const [communicationToDelete, setCommunicationToDelete] = useState<CommunicationLog | null>(null);
  const [isDeletingCommunication, setIsDeletingCommunication] = useState(false);
  const [isAddContractDialogOpen, setIsAddContractDialogOpen] = useState(false);
  const [isViewContractOpen, setIsViewContractOpen] = useState(false);
  const [isEditContractOpen, setIsEditContractOpen] = useState(false);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [isDeleteContractOpen, setIsDeleteContractOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [isTimelineFilterOpen, setIsTimelineFilterOpen] = useState(false);
  
  // Selected items for view/edit
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationLog | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractDetail | null>(null);
  const [selectedTask, setSelectedTask] = useState<CRMTask | null>(null);
  
  // Contracts from database
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const createContractMutation = useCreateContract();
  const updateContractMutation = useUpdateContract();
  const deleteContractMutation = useDeleteContract();
  const renewContractMutation = useRenewContract();
  
  // CRM Tasks from database with real-time updates
  const { data: tasks = [], isLoading: tasksLoading } = useCRMTasks();
  const createTaskMutation = useCreateCRMTask();
  const updateTaskMutation = useUpdateCRMTask();
  const deleteTaskMutation = useDeleteCRMTask();
  const markCompleteMutation = useMarkTaskComplete();

  // Fetch current user and institutions on mount
  useEffect(() => {
    const loadUserAndInstitutions = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        setCurrentUser({
          id: user.id,
          name: profile?.name || user.email?.split('@')[0] || 'Unknown User'
        });
      }
      
      // Fetch institutions
      try {
        const institutionsList = await fetchInstitutions();
        setInstitutions(institutionsList);
      } catch (error) {
        console.error('Error fetching institutions:', error);
      }
    };
    
    loadUserAndInstitutions();
  }, []);

  const handleAddCommunication = () => {
    setIsAddDialogOpen(true);
  };

  const handleSaveCommunication = async (newLog: Omit<CommunicationLog, 'id' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) {
      toast.error("Please log in to add communication logs");
      return;
    }
    
    try {
      await createCommunicationLog({
        ...newLog,
        conducted_by_id: currentUser.id,
        conducted_by_name: currentUser.name,
      });
      setIsAddDialogOpen(false);
      toast.success("Communication logged successfully");
    } catch (error) {
      console.error('Error creating communication log:', error);
      toast.error("Failed to save communication log");
    }
  };

  // Communication handlers
  const handleViewCommunicationDetails = (log: CommunicationLog) => {
    setSelectedCommunication(log);
    setIsViewCommunicationOpen(true);
  };

  const handleEditCommunication = (log: CommunicationLog) => {
    setSelectedCommunication(log);
    setIsEditCommunicationOpen(true);
  };

  const handleEditFromView = () => {
    setIsViewCommunicationOpen(false);
    setIsEditCommunicationOpen(true);
  };

  const handleUpdateCommunication = async (updatedLog: CommunicationLog) => {
    try {
      await updateCommunicationLog(updatedLog.id, updatedLog);
      setIsEditCommunicationOpen(false);
      setSelectedCommunication(null);
      toast.success("Communication log updated successfully");
    } catch (error) {
      console.error('Error updating communication log:', error);
      toast.error("Failed to update communication log");
    }
  };

  const handleDeleteCommunication = (log: CommunicationLog) => {
    setCommunicationToDelete(log);
    setIsDeleteCommunicationOpen(true);
  };

  const handleConfirmDeleteCommunication = async (log: CommunicationLog) => {
    setIsDeletingCommunication(true);
    try {
      await deleteCommunicationLog(log.id);
      toast.success("Communication log deleted successfully");
      setIsDeleteCommunicationOpen(false);
      setCommunicationToDelete(null);
    } catch (error) {
      console.error('Error deleting communication log:', error);
      toast.error("Failed to delete communication log");
    } finally {
      setIsDeletingCommunication(false);
    }
  };

  // Contract handlers
  const handleViewContract = (contract: ContractDetail) => {
    setSelectedContract(contract);
    setIsViewContractOpen(true);
  };

  const handleEditContract = (contract: ContractDetail) => {
    setSelectedContract(contract);
    setIsEditContractOpen(true);
  };

  const handleEditContractFromView = () => {
    setIsViewContractOpen(false);
    setIsEditContractOpen(true);
  };

  const handleUpdateContract = (updatedContract: ContractDetail) => {
    updateContractMutation.mutate({
      id: updatedContract.id,
      updates: {
        institution_id: updatedContract.institution_id,
        institution_name: updatedContract.institution_name,
        contract_type: updatedContract.contract_type,
        start_date: updatedContract.start_date,
        end_date: updatedContract.end_date,
        renewal_date: updatedContract.renewal_date,
        contract_value: updatedContract.contract_value,
        payment_terms: updatedContract.payment_terms,
        status: updatedContract.status,
        auto_renew: updatedContract.auto_renew,
        renewal_status: updatedContract.renewal_status,
      }
    });
    setIsEditContractOpen(false);
    setSelectedContract(null);
  };

  const handleInitiateRenewal = (contract: ContractDetail) => {
    setSelectedContract(contract);
    setIsRenewalOpen(true);
  };

  const handleRenewalComplete = () => {
    if (selectedContract) {
      renewContractMutation.mutate(selectedContract.id);
      setSelectedContract(null);
    }
  };

  const handleDeleteContract = (contract: ContractDetail) => {
    setSelectedContract(contract);
    setIsDeleteContractOpen(true);
  };

  const handleConfirmDeleteContract = async (contract: ContractDetail) => {
    await deleteContractMutation.mutateAsync(contract.id);
    setIsDeleteContractOpen(false);
    setSelectedContract(null);
  };

  // Task handlers
  const handleCompleteTask = (task: CRMTask) => {
    markCompleteMutation.mutate(task.id);
  };

  const handleViewTask = (task: CRMTask) => {
    setSelectedTask(task);
    setIsViewTaskOpen(true);
  };

  const handleEditTask = (task: CRMTask) => {
    setSelectedTask(task);
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = (updatedTask: CRMTask) => {
    updateTaskMutation.mutate({
      id: updatedTask.id,
      updates: {
        institution_id: updatedTask.institution_id,
        institution_name: updatedTask.institution_name,
        task_type: updatedTask.task_type,
        description: updatedTask.description,
        due_date: updatedTask.due_date,
        assigned_to: updatedTask.assigned_to,
        priority: updatedTask.priority,
        status: updatedTask.status,
        notes: updatedTask.notes,
      }
    });
    setIsEditTaskOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Contract handlers
  const handleAddContract = () => {
    setIsAddContractDialogOpen(true);
  };

  const handleSaveContract = (
    newContract: Omit<ContractDetail, 'id' | 'documents' | 'communication_history'>,
    files?: File[]
  ) => {
    createContractMutation.mutate({ contract: newContract, files });
    setIsAddContractDialogOpen(false);
  };

  // Task handlers
  const handleAddTask = () => {
    setIsAddTaskDialogOpen(true);
  };

  const handleSaveTask = (newTask: Omit<CRMTask, 'id'>) => {
    createTaskMutation.mutate(newTask);
    setIsAddTaskDialogOpen(false);
  };

  // Timeline handlers
  const handleFilterTimeline = () => {
    setIsTimelineFilterOpen(true);
  };

  const handleApplyTimelineFilters = (filters: any) => {
    toast.success("Filters applied to timeline");
  };

  const handleExportTimeline = () => {
    toast.success("Exporting timeline to PDF...");
  };

  // Filter communication logs based on search
  const filteredLogs = communicationLogs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.institution_name.toLowerCase().includes(searchLower) ||
      log.subject.toLowerCase().includes(searchLower) ||
      log.contact_person.toLowerCase().includes(searchLower) ||
      log.notes.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-8 w-8 text-primary" />
            CRM & Client Relations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage communications, contracts, tasks, and client relationships
          </p>
        </div>
        
        {/* Dynamic Action Buttons Based on Active Tab */}
        <div className="flex gap-2">
          {activeTab === "communications" && (
            <Button onClick={handleAddCommunication}>
              <Plus className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          )}
          
          {activeTab === "contracts" && (
            <Button onClick={handleAddContract}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          )}
          
          {activeTab === "tasks" && (
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
          
          {activeTab === "timeline" && (
            <>
              <Button variant="outline" onClick={handleFilterTimeline}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button onClick={handleExportTimeline}>
                <Plus className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="communications">Communication Tracking</TabsTrigger>
          <TabsTrigger value="contracts">Renewals & Contracts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks & Reminders</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        {/* Communication Tracking Tab */}
        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
              <CardDescription>
                Track all interactions with institution administrators and stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search communications by institution, subject, or contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No communication logs found.</p>
                  <p className="text-sm">Click "Log Communication" to add your first entry.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredLogs.map((log) => (
                    <CommunicationLogCard
                      key={log.id}
                      log={log}
                      onEdit={() => handleEditCommunication(log)}
                      onViewDetails={() => handleViewCommunicationDetails(log)}
                      onDelete={() => handleDeleteCommunication(log)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contracts.filter(c => c.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {contracts.filter(c => c.status === 'expiring_soon').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(contracts.reduce((sum, c) => sum + c.contract_value, 0) / 10000000).toFixed(1)}Cr
                </div>
              </CardContent>
            </Card>
          </div>

          {contractsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No contracts found.</p>
              <p className="text-sm">Click "Create Contract" to add your first contract.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contracts.map((contract) => (
                <ContractTracker
                  key={contract.id}
                  contract={contract}
                  onViewDetails={handleViewContract}
                  onEdit={handleEditContract}
                  onRenew={handleInitiateRenewal}
                  onDelete={handleDeleteContract}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CRMTaskManager
              tasks={tasks}
              onCompleteTask={handleCompleteTask}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
            />
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <CommunicationTimeline logs={communicationLogs} />
        </TabsContent>
        </Tabs>

        <AddCommunicationDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSave={handleSaveCommunication}
          institutions={institutions}
          currentUser={currentUser}
        />

        <AddContractDialog
          open={isAddContractDialogOpen}
          onOpenChange={setIsAddContractDialogOpen}
          onSave={handleSaveContract}
          institutions={institutions}
        />

        <AddTaskDialog
          open={isAddTaskDialogOpen}
          onOpenChange={setIsAddTaskDialogOpen}
          onSave={handleSaveTask}
          institutions={institutions}
        />

        <TimelineFilterDialog
          open={isTimelineFilterOpen}
          onOpenChange={setIsTimelineFilterOpen}
          onApplyFilters={handleApplyTimelineFilters}
          institutions={institutions}
        />

        <ViewCommunicationDialog
          open={isViewCommunicationOpen}
          onOpenChange={setIsViewCommunicationOpen}
          communication={selectedCommunication}
          onEdit={handleEditFromView}
        />

        <EditCommunicationDialog
          open={isEditCommunicationOpen}
          onOpenChange={setIsEditCommunicationOpen}
          communication={selectedCommunication}
          onSave={handleUpdateCommunication}
          institutions={institutions}
        />

        <DeleteCommunicationDialog
          open={isDeleteCommunicationOpen}
          onOpenChange={setIsDeleteCommunicationOpen}
          communication={communicationToDelete}
          onConfirmDelete={handleConfirmDeleteCommunication}
          isDeleting={isDeletingCommunication}
        />

        <ViewContractDialog
          open={isViewContractOpen}
          onOpenChange={setIsViewContractOpen}
          contract={selectedContract}
          onEdit={handleEditContractFromView}
          onInitiateRenewal={() => {
            setIsViewContractOpen(false);
            if (selectedContract) handleInitiateRenewal(selectedContract);
          }}
        />

        <EditContractDialog
          open={isEditContractOpen}
          onOpenChange={setIsEditContractOpen}
          contract={selectedContract}
          onSave={handleUpdateContract}
          institutions={institutions}
        />

        <RenewalWorkflowDialog
          open={isRenewalOpen}
          onOpenChange={setIsRenewalOpen}
          contract={selectedContract}
          onComplete={handleRenewalComplete}
        />

        <DeleteContractDialog
          open={isDeleteContractOpen}
          onOpenChange={setIsDeleteContractOpen}
          contract={selectedContract}
          onConfirmDelete={handleConfirmDeleteContract}
          isDeleting={deleteContractMutation.isPending}
        />

        <EditTaskDialog
          open={isEditTaskOpen}
          onOpenChange={setIsEditTaskOpen}
          task={selectedTask}
          onSave={handleUpdateTask}
          institutions={institutions}
        />

        <ViewTaskDialog
          open={isViewTaskOpen}
          onOpenChange={setIsViewTaskOpen}
          task={selectedTask}
          onEdit={handleEditTask}
          onComplete={handleCompleteTask}
          onDelete={handleDeleteTask}
        />
      </div>
    </Layout>
  );
}
