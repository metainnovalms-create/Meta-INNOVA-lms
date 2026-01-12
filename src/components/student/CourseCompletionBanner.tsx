import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CourseCompletionBannerProps {
  courseName: string;
  completionDate: string;
  onViewCertificate: () => void;
}

export function CourseCompletionBanner({
  courseName,
  completionDate,
  onViewCertificate
}: CourseCompletionBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in after a short delay
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <Card 
      className={`border-2 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-background transition-all duration-500 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Award className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">
              🎉 Congratulations! Course Completed!
            </h3>
            <p className="text-muted-foreground">
              You've successfully completed <span className="font-semibold">{courseName}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Completed on {new Date(completionDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={onViewCertificate}>
              <Award className="mr-2 h-4 w-4" />
              View Certificate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
