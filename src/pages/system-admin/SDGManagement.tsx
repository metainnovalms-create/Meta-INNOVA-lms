import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SDGDashboard from "./SDGDashboard";
import SDGCourseMapping from "./SDGCourseMapping";
import SDGProjectListing from "./SDGProjectListing";
import SDGInstitutionContributions from "./SDGInstitutionContributions";

export default function SDGManagement() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SDG Management</h1>
          <p className="text-muted-foreground mt-2">
            Map courses and projects to UN Sustainable Development Goals and track impact
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="dashboard">SDG Dashboard</TabsTrigger>
            <TabsTrigger value="courses">Course Mapping</TabsTrigger>
            <TabsTrigger value="projects">Project Listing</TabsTrigger>
            <TabsTrigger value="institutions">Institution Contributions</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SDGDashboard />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <SDGCourseMapping />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <SDGProjectListing />
          </TabsContent>

          <TabsContent value="institutions" className="space-y-6">
            <SDGInstitutionContributions />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
