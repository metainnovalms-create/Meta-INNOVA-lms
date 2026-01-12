import { Layout } from "@/components/layout/Layout";
import { ManagementCoursesView } from "@/components/management/ManagementCoursesView";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { getInstitutionBySlug } from "@/data/mockInstitutionData";
import { useLocation } from "react-router-dom";

const CoursesAndSessions = () => {
  // Extract institution from URL for header display
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  const institution = getInstitutionBySlug(institutionSlug);

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institution.established_year}
            location={institution.location}
            totalStudents={institution.total_students}
            academicYear={institution.academic_year}
            userRole="Management Portal"
            assignedOfficers={institution.assigned_officers.map(o => o.officer_name)}
          />
        )}
        
        <div>
          <h1 className="text-3xl font-bold">Courses & Sessions</h1>
          <p className="text-muted-foreground">View all published courses</p>
        </div>

        {/* Course catalog - view only */}
        <ManagementCoursesView />
      </div>
    </Layout>
  );
};

export default CoursesAndSessions;