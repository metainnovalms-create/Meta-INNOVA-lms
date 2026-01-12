import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CourseContentTab } from '@/components/officer/CourseContentTab';
import { AssignmentsAndQuizzesTab } from '@/components/officer/AssignmentsAndQuizzesTab';
import { ClassSelector } from '@/components/officer/ClassSelector';
import { ClassCourseLauncher } from '@/components/officer/ClassCourseLauncher';
import { ClassStudentsList } from '@/components/officer/ClassStudentsList';
import { ClassTeachingReport } from '@/components/officer/ClassTeachingReport';

export default function OfficerCourseManagement() {
  const { tenantId } = useParams();
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>('');
  const [classSubTab, setClassSubTab] = useState('courses');

  const officerId = 'off-001'; // In real app, get from auth context

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Start Teaching</h1>
          <p className="text-muted-foreground mt-2">
            Select a class to begin teaching or continue from where you left off
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="content">Course Content</TabsTrigger>
          </TabsList>

          {/* Classes Tab - NEW */}
          <TabsContent value="classes" className="space-y-6">
            {!selectedClassId ? (
              <ClassSelector
                officerId={officerId}
                institutionId="1"
                onClassSelect={(classId, className) => {
                  setSelectedClassId(classId);
                  setSelectedClassName(className);
                  setClassSubTab('courses');
                }}
                selectedClassId={selectedClassId || undefined}
              />
            ) : (
              <div className="space-y-4">
                {/* Back button and class header */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedClassId(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Classes
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClassName}</h2>
                    <p className="text-muted-foreground">
                      Teaching Dashboard
                    </p>
                  </div>
                </div>

                {/* Class sub-tabs */}
                <Tabs value={classSubTab} onValueChange={setClassSubTab}>
                  <TabsList>
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="report">Report</TabsTrigger>
                  </TabsList>

                  <TabsContent value="courses">
                    <ClassCourseLauncher
                      classId={selectedClassId}
                      className={selectedClassName}
                      officerId={officerId}
                    />
                  </TabsContent>

                  <TabsContent value="students">
                    <ClassStudentsList
                      classId={selectedClassId}
                      className={selectedClassName}
                    />
                  </TabsContent>

                  <TabsContent value="report">
                    <ClassTeachingReport
                      classId={selectedClassId}
                      className={selectedClassName}
                      officerId={officerId}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </TabsContent>

          {/* Course Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <CourseContentTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
