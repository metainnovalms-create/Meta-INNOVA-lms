import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SDG_GOALS, sdgService, getSDGByNumber } from "@/services/sdg.service";
import { Search, Target, Users, Building2, Calendar, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

export default function SDGProjectListing() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSDG, setFilterSDG] = useState<string>("all");
  const [filterInstitution, setFilterInstitution] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get all projects with institution data
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*, institutions(id, name)');

        // Get project members to count team size
        const { data: membersData } = await supabase
          .from('project_members')
          .select('project_id, student_id');

        // Create a map of project_id to member count
        const memberCounts = (membersData || []).reduce((acc: Record<string, number>, m) => {
          acc[m.project_id] = (acc[m.project_id] || 0) + 1;
          return acc;
        }, {});

        // Add member counts to projects
        const projectsWithCounts = (projectsData || []).map(p => ({
          ...p,
          member_count: memberCounts[p.id] || 0
        }));

        // Get unique institutions
        const { data: institutionsData } = await supabase
          .from('institutions')
          .select('id, name');

        setProjects(projectsWithCounts);
        setInstitutions(institutionsData || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const projectSDGs = (project.sdg_goals as number[]) || [];
    const matchesSDG = filterSDG === "all" || projectSDGs.includes(parseInt(filterSDG));
    
    const matchesInstitution = filterInstitution === "all" || project.institution_id === filterInstitution;
    
    return matchesSearch && matchesSDG && matchesInstitution;
  });

  const handleViewDetails = async (project: any) => {
    setSelectedProject(project);
    setDetailsOpen(true);
    
    // Fetch team members for this project
    const { data: members } = await supabase
      .from('project_members')
      .select(`
        id, role, student_id,
        students(id, full_name, email, admission_number)
      `)
      .eq('project_id', project.id);
    
    setProjectMembers(members || []);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposal: 'bg-yellow-500',
      approved: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      rejected: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Project Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterSDG} onValueChange={setFilterSDG}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by SDG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SDGs</SelectItem>
                {SDG_GOALS.map(sdg => (
                  <SelectItem key={sdg.number} value={sdg.number.toString()}>
                    SDG {sdg.number}: {sdg.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterInstitution} onValueChange={setFilterInstitution}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                {institutions.map(inst => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Project Cards */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects found matching your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {project.institutions?.name || 'Unknown Institution'}
                    </div>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                {/* SDG Badges */}
                <div className="flex flex-wrap gap-1">
                  {((project.sdg_goals as number[]) || []).map(sdgNum => {
                    const sdgInfo = getSDGByNumber(sdgNum);
                    return sdgInfo ? (
                      <Badge 
                        key={sdgNum}
                        style={{ 
                          backgroundColor: sdgInfo.color,
                          color: '#ffffff',
                          borderColor: sdgInfo.color
                        }}
                        className="text-xs font-semibold"
                      >
                        SDG {sdgInfo.number}
                      </Badge>
                    ) : null;
                  })}
                  {(!project.sdg_goals || project.sdg_goals.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">No SDGs assigned</span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>

                {/* Team Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project.member_count || 0} team members</span>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleViewDetails(project)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Project details and SDG impact tracking
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-6 py-4">
              {/* SDG Goals */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">SDG Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {((selectedProject.sdg_goals as number[]) || []).map((sdgNum: number) => {
                    const sdgInfo = getSDGByNumber(sdgNum);
                    return sdgInfo ? (
                      <div 
                        key={sdgNum}
                        className="flex items-center gap-2 p-2 border rounded-lg"
                      >
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: sdgInfo.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {sdgInfo.number}. {sdgInfo.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{sdgInfo.description}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Project Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Institution</p>
                  <p className="font-medium">{selectedProject.institutions?.name || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedProject.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedProject.status)}>
                    {selectedProject.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="font-medium">{selectedProject.progress || 0}%</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
              </div>

              {/* Team Members */}
              {projectMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Team Members ({projectMembers.length})</h4>
                  <div className="space-y-2">
                    {projectMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{member.students?.full_name || 'Unknown Student'}</span>
                        <Badge variant={member.role === 'leader' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {projectMembers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No team members assigned to this project
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
