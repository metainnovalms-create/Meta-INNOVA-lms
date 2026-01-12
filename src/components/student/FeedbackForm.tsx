import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { StudentFeedback } from "@/services/studentFeedback.service";

interface FeedbackFormProps {
  onSubmit: (feedback: Omit<StudentFeedback, 'id' | 'status'>) => void;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const { user } = useAuth();
  const profile = user;
  const [category, setCategory] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [relatedCourse, setRelatedCourse] = useState('');
  const [relatedOfficer, setRelatedOfficer] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch courses assigned to student's class
  const { data: courses = [] } = useQuery({
    queryKey: ['student-courses', profile?.class_id],
    queryFn: async () => {
      if (!profile?.class_id) return [];
      const { data, error } = await supabase
        .from('course_class_assignments')
        .select(`
          course_id,
          courses (id, title)
        `)
        .eq('class_id', profile.class_id);
      if (error) throw error;
      return data?.map(d => d.courses).filter(Boolean) || [];
    },
    enabled: !!profile?.class_id,
  });

  // Fetch officers from student's institution
  const { data: officers = [] } = useQuery({
    queryKey: ['institution-officers', profile?.institution_id],
    queryFn: async () => {
      if (!profile?.institution_id) return [];
      const { data, error } = await supabase
        .from('officers')
        .select('id, full_name')
        .contains('assigned_institutions', [profile.institution_id])
        .order('full_name');
      if (error) throw error;
      return data?.map(o => ({ id: o.id, name: o.full_name })) || [];
    },
    enabled: !!profile?.institution_id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subject || !feedbackText) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (feedbackText.length < 50) {
      toast.error("Feedback must be at least 50 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const feedback: Omit<StudentFeedback, 'id' | 'status'> = {
        student_id: '', // Will be set by parent
        student_name: profile?.name,
        institution_id: '', // Will be set by parent
        category: category as StudentFeedback['category'],
        subject,
        feedback_text: feedbackText,
        is_anonymous: isAnonymous,
        rating: rating > 0 ? rating : undefined,
        related_course_id: category === 'course' && relatedCourse ? relatedCourse : undefined,
        related_officer_id: category === 'officer' && relatedOfficer ? relatedOfficer : undefined
      };

      onSubmit(feedback);
      
      // Reset form
      setCategory('');
      setSubject('');
      setRelatedCourse('');
      setRelatedOfficer('');
      setRating(0);
      setFeedbackText('');
      setIsAnonymous(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>
          Share your thoughts and help us improve your learning experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course Feedback</SelectItem>
                <SelectItem value="officer">Innovation Officer Feedback</SelectItem>
                <SelectItem value="facility">Facility & Infrastructure</SelectItem>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {category === 'course' && (
            <div className="space-y-2">
              <Label htmlFor="course">Select Course</Label>
              <Select value={relatedCourse} onValueChange={setRelatedCourse}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length > 0 ? (
                    courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No courses available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {category === 'officer' && (
            <div className="space-y-2">
              <Label htmlFor="officer">Select Officer</Label>
              <Select value={relatedOfficer} onValueChange={setRelatedOfficer}>
                <SelectTrigger id="officer">
                  <SelectValue placeholder="Select officer" />
                </SelectTrigger>
                <SelectContent>
                  {officers.length > 0 ? (
                    officers.map((officer: any) => (
                      <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No officers available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief subject of your feedback"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Rating (Optional)</Label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRating(index + 1)}
                  onMouseEnter={() => setHoverRating(index + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) > index
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground self-center">
                  {rating} / 5
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">
              Detailed Feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your detailed feedback (minimum 50 characters)..."
              className="min-h-[150px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              {feedbackText.length} / 50 characters minimum
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous" className="cursor-pointer">
              Submit anonymously
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
