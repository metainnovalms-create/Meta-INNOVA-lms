import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sdgService, SDG_GOALS, getSDGByNumber } from '@/services/sdg.service';
import { Building2, Users, BookOpen, Trophy, Search, Eye, Globe, Target, Award } from 'lucide-react';
import { toast } from 'sonner';

interface InstitutionContribution {
  institution_id: string;
  institution_name: string;
  total_projects: number;
  sdg_projects: number;
  students_in_sdg_projects: number;
  officers_involved: number;
  courses_assigned: number;
  sdg_courses_assigned: number;
  unique_sdgs: number[];
  contribution_score: number;
  sdg_breakdown: Record<number, { projects: number }>;
}

interface GlobalStats {
  total_institutions: number;
  total_sdg_projects: number;
  total_sdgs_covered: number;
  total_students_impacted: number;
}

export default function SDGInstitutionContributions() {
  const [contributions, setContributions] = useState<InstitutionContribution[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total_institutions: 0,
    total_sdg_projects: 0,
    total_sdgs_covered: 0,
    total_students_impacted: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionContribution | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadContributions();
  }, []);

  const loadContributions = async () => {
    try {
      setLoading(true);
      const data = await sdgService.getInstitutionContributions();
      setContributions(data.institutions);
      setGlobalStats(data.globalStats);
    } catch (error) {
      console.error('Error loading institution contributions:', error);
      toast.error('Failed to load institution contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (institution: InstitutionContribution) => {
    setSelectedInstitution(institution);
    setDetailsOpen(true);
  };

  const filteredContributions = contributions.filter(c =>
    c.institution_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🏆 #1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 #2</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 #3</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const renderSDGBadges = (sdgs: number[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {sdgs.slice(0, 8).map(sdgNum => {
          const sdg = getSDGByNumber(sdgNum);
          if (!sdg) return null;
          return (
            <div
              key={sdgNum}
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: sdg.color }}
              title={sdg.title}
            >
              {sdgNum}
            </div>
          );
        })}
        {sdgs.length > 8 && (
          <Badge variant="outline" className="text-xs">+{sdgs.length - 8}</Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Platform Impact Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Global SDG Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg border">
              <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-3xl font-bold text-foreground">{globalStats.total_institutions}</p>
              <p className="text-sm text-muted-foreground">Contributing Institutions</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold text-foreground">{globalStats.total_sdg_projects}</p>
              <p className="text-sm text-muted-foreground">SDG Projects</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <Award className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <p className="text-3xl font-bold text-foreground">{globalStats.total_sdgs_covered}</p>
              <p className="text-sm text-muted-foreground">SDGs Covered</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border">
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-foreground">{globalStats.total_students_impacted}</p>
              <p className="text-sm text-muted-foreground">Students Impacted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Institution List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Institution Contributions Leaderboard
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContributions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No institutions found with SDG contributions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContributions.map((institution, index) => (
                <Card key={institution.institution_id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getRankBadge(index + 1)}
                          <h3 className="font-semibold text-lg text-foreground">
                            {institution.institution_name}
                          </h3>
                          <Badge variant="secondary" className="ml-auto md:ml-0">
                            Score: {institution.contribution_score}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span><strong>{institution.sdg_projects}</strong> Projects</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span><strong>{institution.students_in_sdg_projects}</strong> Students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span><strong>{institution.officers_involved}</strong> Officers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span><strong>{institution.sdg_courses_assigned}</strong> Courses</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">SDGs:</span>
                          {renderSDGBadges(institution.unique_sdgs)}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(institution)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Institution Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedInstitution?.institution_name} - SDG Contribution Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstitution && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Score Summary */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">{selectedInstitution.contribution_score}</p>
                      <p className="text-muted-foreground">Total Contribution Score</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Target className="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <p className="text-2xl font-bold">{selectedInstitution.sdg_projects}</p>
                      <p className="text-sm text-muted-foreground">SDG Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-bold">{selectedInstitution.students_in_sdg_projects}</p>
                      <p className="text-sm text-muted-foreground">Students Involved</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-2xl font-bold">{selectedInstitution.officers_involved}</p>
                      <p className="text-sm text-muted-foreground">Officers Involved</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <BookOpen className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                      <p className="text-2xl font-bold">{selectedInstitution.sdg_courses_assigned}</p>
                      <p className="text-sm text-muted-foreground">SDG Courses</p>
                    </CardContent>
                  </Card>
                </div>

                {/* SDG Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SDG Goal Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedInstitution.unique_sdgs.map(sdgNum => {
                        const sdg = getSDGByNumber(sdgNum);
                        const breakdown = selectedInstitution.sdg_breakdown[sdgNum];
                        if (!sdg) return null;
                        
                        return (
                          <div key={sdgNum} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: sdg.color }}
                            >
                              {sdgNum}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{sdg.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {breakdown?.projects || 0} project(s)
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Score Calculation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Score Calculation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>• SDG Projects × 3 = {selectedInstitution.sdg_projects * 3}</p>
                      <p>• Students × 1 = {selectedInstitution.students_in_sdg_projects * 1}</p>
                      <p>• SDG Courses × 2 = {selectedInstitution.sdg_courses_assigned * 2}</p>
                      <p>• Unique SDGs × 2 = {selectedInstitution.unique_sdgs.length * 2}</p>
                      <div className="border-t pt-2 mt-2">
                        <p className="font-semibold text-foreground">
                          Total = {selectedInstitution.contribution_score}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
