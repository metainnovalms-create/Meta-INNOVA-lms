import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, GraduationCap, FolderOpen } from 'lucide-react';
import { EmployeeIdTable } from '@/components/id-directory/EmployeeIdTable';
import { InstitutionIdTable } from '@/components/id-directory/InstitutionIdTable';
import { StudentIdTable } from '@/components/id-directory/StudentIdTable';

export default function IdConfiguration() {
  const [activeTab, setActiveTab] = useState('employee');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FolderOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">ID Directory</h1>
              <p className="text-muted-foreground">
                Browse and search all employee, institution, and student IDs
              </p>
            </div>
          </div>
        </div>

        {/* Directory Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>
              Search, filter, and export ID records for all entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="employee" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Employees</span>
                  <span className="sm:hidden">Emp</span>
                </TabsTrigger>
                <TabsTrigger value="institution" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Institutions</span>
                  <span className="sm:hidden">Inst</span>
                </TabsTrigger>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Students</span>
                  <span className="sm:hidden">Stud</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employee" className="mt-6">
                <EmployeeIdTable />
              </TabsContent>

              <TabsContent value="institution" className="mt-6">
                <InstitutionIdTable />
              </TabsContent>

              <TabsContent value="student" className="mt-6">
                <StudentIdTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
