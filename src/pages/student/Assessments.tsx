import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssessmentCard } from '@/components/assessment/AssessmentCard';
import { assessmentService } from '@/services/assessment.service';
import { getAssessmentStatus } from '@/utils/assessmentHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Assessment, AssessmentAttempt } from '@/types/assessment';

export default function StudentAssessments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const studentClassId = user?.class_id || '';
  const studentInstitutionId = user?.institution_id || user?.tenant_id || '';
  const studentId = user?.id || '';

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      if (!studentId || !studentClassId || !studentInstitutionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [loadedAssessments, loadedAttempts] = await Promise.all([
          assessmentService.getStudentAssessments(studentId, studentClassId, studentInstitutionId),
          assessmentService.getStudentAttempts(studentId)
        ]);
        setAssessments(loadedAssessments);
        setAttempts(loadedAttempts);
      } catch (error) {
        console.error('Error loading assessments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [studentId, studentClassId, studentInstitutionId]);

  // Available assessments (ongoing, not yet attempted or can retake)
  const availableAssessments = assessments.filter(a => {
    const status = getAssessmentStatus(a);
    const hasCompletedAttempt = attempts.some(attempt => 
      attempt.assessment_id === a.id && attempt.status !== 'in_progress'
    );
    return status === 'ongoing' && !hasCompletedAttempt;
  }).filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Completed assessments
  const completedAssessments = attempts.filter(attempt => 
    attempt.status === 'evaluated' || attempt.status === 'submitted' || attempt.status === 'auto_submitted'
  ).map(attempt => {
    const assessment = assessments.find(a => a.id === attempt.assessment_id);
    return { attempt, assessment };
  }).filter(({ assessment }) => 
    assessment && assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Upcoming assessments
  const upcomingAssessments = assessments.filter(a => {
    const status = getAssessmentStatus(a);
    return status === 'upcoming';
  }).filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Assessments</h1>
          <p className="text-muted-foreground">View and take your assigned assessments</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              Available ({availableAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingAssessments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableAssessments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No available assessments at the moment
              </div>
            ) : (
              <div className="grid gap-4">
                {availableAssessments.map((assessment) => (
                  <AssessmentCard 
                    key={assessment.id} 
                    assessment={assessment}
                    mode="take"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedAssessments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No completed assessments yet
              </div>
            ) : (
              <div className="grid gap-4">
                {completedAssessments.map(({ attempt, assessment }) => 
                  assessment && (
                    <div key={attempt.id} className="relative">
                      <AssessmentCard 
                        assessment={assessment}
                        attempt={attempt}
                        mode="review"
                      />
                      {/* Performance Summary Badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          attempt.passed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {attempt.passed ? 'Passed' : 'Failed'} • {attempt.percentage?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAssessments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No upcoming assessments scheduled
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingAssessments.map((assessment) => (
                  <AssessmentCard 
                    key={assessment.id} 
                    assessment={assessment}
                    mode="upcoming"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}