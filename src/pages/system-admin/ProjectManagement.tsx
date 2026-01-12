import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, Users, TrendingUp, Award, FileDown, Eye, 
  Search, ChevronDown, ChevronsUpDown
} from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useAllProjects, ProjectWithRelations } from '@/hooks/useProjects';
import { ProjectDetailsDialog } from '@/components/project/ProjectDetailsDialog';
import { SDGGoalBadges } from '@/components/project/SDGGoalSelector';
import { format } from 'date-fns';

type ProjectWithInstitution = ProjectWithRelations & { 
  institution: { id: string; name: string } 
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  yet_to_start: { label: 'Yet to Start', variant: 'outline' },
  ongoing: { label: 'Ongoing', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
};

export default function ProjectManagement() {
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch all projects from database
  const { data: allProjects = [], isLoading, error } = useAllProjects();
  
  // Debug: Log the data source
  console.log('[ProjectManagement] Data from database:', { 
    count: allProjects.length, 
    isLoading, 
    hasError: !!error,
    error: error?.message,
    projects: allProjects.map(p => ({ id: p.id, title: p.title, institution: p.institution?.name }))
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allProjects.length;
    const byStatus = {
      yet_to_start: allProjects.filter(p => p.status === 'yet_to_start').length,
      ongoing: allProjects.filter(p => p.status === 'ongoing').length,
      completed: allProjects.filter(p => p.status === 'completed').length,
    };
    const totalStudents = allProjects.reduce((sum, p) => sum + (p.project_members?.length || 0), 0);
    const uniqueOfficers = new Set(allProjects.map(p => p.created_by_officer_id)).size;
    const showcaseCount = allProjects.filter(p => p.is_showcase).length;
    const avgProgress = total > 0 ? Math.round(
      allProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / total
    ) : 0;

    return {
      total,
      byStatus,
      totalStudents,
      uniqueOfficers,
      showcaseCount,
      avgProgress
    };
  }, [allProjects]);

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set(allProjects.map(p => p.category));
    return Array.from(categorySet);
  }, [allProjects]);

  // Group projects by institution with statistics
  const institutionGroups = useMemo(() => {
    const groups = new Map<string, ProjectWithInstitution[]>();
    
    // Group projects by institution
    (allProjects as ProjectWithInstitution[]).forEach(project => {
      const instId = project.institution_id;
      if (!groups.has(instId)) {
        groups.set(instId, []);
      }
      groups.get(instId)!.push(project);
    });

    // Calculate statistics for each institution
    return Array.from(groups.entries()).map(([institutionId, projects]) => {
      // Apply filters to projects
      const filteredProjects = projects.filter(project => {
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
        const matchesSearch = searchQuery === '' || 
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.created_by_officer_name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesCategory && matchesSearch;
      });

      const totalProjects = filteredProjects.length;
      const byStatus = {
        yet_to_start: filteredProjects.filter(p => p.status === 'yet_to_start').length,
        ongoing: filteredProjects.filter(p => p.status === 'ongoing').length,
        completed: filteredProjects.filter(p => p.status === 'completed').length,
      };
      const totalStudents = filteredProjects.reduce((sum, p) => sum + (p.project_members?.length || 0), 0);
      const avgProgress = totalProjects > 0 ? Math.round(
        filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects
      ) : 0;

      // Get institution name from first project
      const institutionName = projects[0]?.institution?.name || 'Unknown Institution';

      return {
        institutionId,
        institutionName,
        totalProjects,
        byStatus,
        totalStudents,
        avgProgress,
        projects: filteredProjects
      };
    }).filter(group => group.totalProjects > 0);
  }, [allProjects, statusFilter, categoryFilter, searchQuery]);

  // Toggle institution expansion
  const toggleInstitution = (institutionId: string) => {
    setExpandedInstitutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(institutionId)) {
        newSet.delete(institutionId);
      } else {
        newSet.add(institutionId);
      }
      return newSet;
    });
  };

  // Expand/Collapse all institutions
  const toggleAllInstitutions = () => {
    if (expandedInstitutions.size === institutionGroups.length) {
      setExpandedInstitutions(new Set());
    } else {
      setExpandedInstitutions(new Set(institutionGroups.map(g => g.institutionId)));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const allFilteredProjects = institutionGroups.flatMap(g => g.projects);
    const headers = ['Institution', 'Title', 'Category', 'Status', 'Progress', 'Students', 'Officer', 'Start Date'];
    const rows = allFilteredProjects.map(p => [
      p.institution?.name || 'Unknown',
      p.title,
      p.category,
      p.status,
      p.progress || 0,
      p.project_members?.length || 0,
      p.created_by_officer_name,
      p.start_date || 'Not set'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Project Management Dashboard</h1>
            <p className="text-muted-foreground mt-2">Loading projects...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="py-8">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Project Management Dashboard</h1>
            <p className="text-destructive mt-2">Error loading projects: {error.message}</p>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Failed to load project data from database.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Management Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive oversight of all innovation projects across institutions
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Database: {allProjects.length} projects
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Across all institutions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.ongoing}</div>
              <p className="text-xs text-muted-foreground">
                Active projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.completed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.showcaseCount} showcase projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Involved</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.uniqueOfficers} innovation officers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects or officers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="yet_to_start">Yet to Start</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleAllInstitutions}>
                <ChevronsUpDown className="h-4 w-4 mr-2" />
                {expandedInstitutions.size === institutionGroups.length ? 'Collapse All' : 'Expand All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Institution-Based Project List */}
        <div className="space-y-4">
          {institutionGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No projects found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            institutionGroups.map((institutionGroup) => (
              <Card key={institutionGroup.institutionId}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleInstitution(institutionGroup.institutionId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {institutionGroup.institutionName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {institutionGroup.totalProjects} Projects
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {institutionGroup.totalStudents} Students
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {institutionGroup.avgProgress}% Avg Progress
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2 mr-4">
                      {institutionGroup.byStatus.ongoing > 0 && (
                        <Badge variant="default">
                          {institutionGroup.byStatus.ongoing} Ongoing
                        </Badge>
                      )}
                      {institutionGroup.byStatus.completed > 0 && (
                        <Badge variant="secondary">
                          {institutionGroup.byStatus.completed} Completed
                        </Badge>
                      )}
                      {institutionGroup.byStatus.yet_to_start > 0 && (
                        <Badge variant="outline">
                          {institutionGroup.byStatus.yet_to_start} Yet to Start
                        </Badge>
                      )}
                    </div>
                    
                    <ChevronDown 
                      className={cn(
                        "h-5 w-5 transition-transform",
                        expandedInstitutions.has(institutionGroup.institutionId) && "transform rotate-180"
                      )}
                    />
                  </div>
                </CardHeader>
                
                <Collapsible open={expandedInstitutions.has(institutionGroup.institutionId)}>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {institutionGroup.projects.map((project) => {
                          const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.yet_to_start;
                          
                          return (
                            <Card key={project.id} className="border-l-4 border-l-primary/20 hover:border-l-primary transition-colors">
                              <CardContent className="p-6">
                                <div className="grid gap-4 md:grid-cols-12">
                                  <div className="md:col-span-5 space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="font-semibold text-lg">{project.title}</h3>
                                          <Badge variant={statusInfo.variant}>
                                            {statusInfo.label}
                                          </Badge>
                                          {project.is_showcase && (
                                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                                              <Award className="h-3 w-3 mr-1" />
                                              Showcase
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {project.description || 'No description'}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline">{project.category}</Badge>
                                  </div>

                                  <div className="md:col-span-3 space-y-2">
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Team: </span>
                                      <span className="font-medium">{project.project_members?.length || 0} members</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Officer: </span>
                                      <span className="font-medium">{project.created_by_officer_name}</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Start: </span>
                                      <span className="font-medium">
                                        {project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'Not set'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="md:col-span-3 space-y-2">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{project.progress || 0}%</span>
                                      </div>
                                      <Progress value={project.progress || 0} className="h-2" />
                                    </div>
                                    {project.sdg_goals && (project.sdg_goals as number[]).length > 0 && (
                                      <div className="mt-2">
                                        <SDGGoalBadges goals={project.sdg_goals as number[]} maxDisplay={3} />
                                      </div>
                                    )}
                                  </div>

                                  <div className="md:col-span-1 flex items-center justify-end">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProject(project);
                                        setIsDetailsOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>

        <ProjectDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          project={selectedProject}
        />
      </div>
    </Layout>
  );
}
