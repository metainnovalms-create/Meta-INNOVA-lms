export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_prompt_usage: {
        Row: {
          created_at: string
          id: string
          month: number
          prompt_count: number
          role: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          prompt_count?: number
          role?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          prompt_count?: number
          role?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      appraisal_projects: {
        Row: {
          appraisal_id: string
          contest_name: string | null
          created_at: string | null
          display_order: number | null
          domain: string | null
          grade_level: string | null
          id: string
          level: string | null
          project_title: string
          result: string | null
        }
        Insert: {
          appraisal_id: string
          contest_name?: string | null
          created_at?: string | null
          display_order?: number | null
          domain?: string | null
          grade_level?: string | null
          id?: string
          level?: string | null
          project_title: string
          result?: string | null
        }
        Update: {
          appraisal_id?: string
          contest_name?: string | null
          created_at?: string | null
          display_order?: number | null
          domain?: string | null
          grade_level?: string | null
          id?: string
          level?: string | null
          project_title?: string
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_projects_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "performance_appraisals"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_option_id: string | null
          time_spent_seconds: number
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          selected_option_id?: string | null
          time_spent_seconds?: number
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          selected_option_id?: string | null
          time_spent_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          assessment_id: string
          class_id: string
          conducted_at: string | null
          created_at: string
          id: string
          institution_id: string
          is_manual: boolean
          manual_notes: string | null
          passed: boolean
          percentage: number
          question_order: Json | null
          retake_allowed: boolean | null
          score: number
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          time_taken_seconds: number | null
          total_points: number
        }
        Insert: {
          assessment_id: string
          class_id: string
          conducted_at?: string | null
          created_at?: string
          id?: string
          institution_id: string
          is_manual?: boolean
          manual_notes?: string | null
          passed?: boolean
          percentage?: number
          question_order?: Json | null
          retake_allowed?: boolean | null
          score?: number
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
          total_points?: number
        }
        Update: {
          assessment_id?: string
          class_id?: string
          conducted_at?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          is_manual?: boolean
          manual_notes?: string | null
          passed?: boolean
          percentage?: number
          question_order?: Json | null
          retake_allowed?: boolean | null
          score?: number
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_class_assignments: {
        Row: {
          assessment_id: string
          assigned_at: string
          assigned_by: string | null
          class_id: string
          id: string
          institution_id: string
        }
        Insert: {
          assessment_id: string
          assigned_at?: string
          assigned_by?: string | null
          class_id: string
          id?: string
          institution_id: string
        }
        Update: {
          assessment_id?: string
          assigned_at?: string
          assigned_by?: string | null
          class_id?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_class_assignments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_class_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_class_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          code_snippet: string | null
          correct_option_id: string
          created_at: string
          display_order: number
          explanation: string | null
          id: string
          image_url: string | null
          options: Json
          points: number
          question_number: number
          question_text: string
          question_type: string
          time_limit_seconds: number | null
        }
        Insert: {
          assessment_id: string
          code_snippet?: string | null
          correct_option_id: string
          created_at?: string
          display_order?: number
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          points?: number
          question_number: number
          question_text: string
          question_type?: string
          time_limit_seconds?: number | null
        }
        Update: {
          assessment_id?: string
          code_snippet?: string | null
          correct_option_id?: string
          created_at?: string
          display_order?: number
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json
          points?: number
          question_number?: number
          question_text?: string
          question_type?: string
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          allow_review_after_submission: boolean
          auto_evaluate: boolean
          auto_submit: boolean
          certificate_template_id: string | null
          created_at: string
          created_by: string | null
          created_by_role: string
          description: string | null
          duration_minutes: number
          end_time: string
          id: string
          institution_id: string | null
          pass_percentage: number
          show_results_immediately: boolean
          shuffle_questions: boolean
          start_time: string
          status: string
          title: string
          total_points: number
          updated_at: string
        }
        Insert: {
          allow_review_after_submission?: boolean
          auto_evaluate?: boolean
          auto_submit?: boolean
          certificate_template_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_role?: string
          description?: string | null
          duration_minutes?: number
          end_time: string
          id?: string
          institution_id?: string | null
          pass_percentage?: number
          show_results_immediately?: boolean
          shuffle_questions?: boolean
          start_time: string
          status?: string
          title: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          allow_review_after_submission?: boolean
          auto_evaluate?: boolean
          auto_submit?: boolean
          certificate_template_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_role?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          institution_id?: string | null
          pass_percentage?: number
          show_results_immediately?: boolean
          shuffle_questions?: boolean
          start_time?: string
          status?: string
          title?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_class_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_id: string
          class_id: string
          id: string
          institution_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id: string
          class_id: string
          id?: string
          institution_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          class_id?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_class_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_class_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          class_id: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          institution_id: string
          marks_obtained: number | null
          status: string
          student_id: string
          submission_pdf_url: string
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          class_id: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          institution_id: string
          marks_obtained?: number | null
          status?: string
          student_id: string
          submission_pdf_url: string
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          class_id?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          institution_id?: string
          marks_obtained?: number | null
          status?: string
          student_id?: string
          submission_pdf_url?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_resubmit: boolean | null
          created_at: string | null
          created_by: string | null
          created_by_role: string
          description: string | null
          id: string
          institution_id: string | null
          passing_marks: number | null
          question_doc_url: string | null
          start_date: string
          status: string
          submission_end_date: string
          title: string
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          allow_resubmit?: boolean | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string
          description?: string | null
          id?: string
          institution_id?: string | null
          passing_marks?: number | null
          question_doc_url?: string | null
          start_date: string
          status?: string
          submission_end_date: string
          title: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_resubmit?: boolean | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string
          description?: string | null
          id?: string
          institution_id?: string | null
          passing_marks?: number | null
          question_doc_url?: string | null
          start_date?: string
          status?: string
          submission_end_date?: string
          title?: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_corrections: {
        Row: {
          attendance_id: string
          attendance_type: string
          corrected_by: string | null
          corrected_by_name: string | null
          created_at: string | null
          field_corrected: string
          id: string
          new_value: string | null
          original_value: string | null
          reason: string
        }
        Insert: {
          attendance_id: string
          attendance_type: string
          corrected_by?: string | null
          corrected_by_name?: string | null
          created_at?: string | null
          field_corrected: string
          id?: string
          new_value?: string | null
          original_value?: string | null
          reason: string
        }
        Update: {
          attendance_id?: string
          attendance_type?: string
          corrected_by?: string | null
          corrected_by_name?: string | null
          created_at?: string | null
          field_corrected?: string
          id?: string
          new_value?: string | null
          original_value?: string | null
          reason?: string
        }
        Relationships: []
      }
      calendar_day_types: {
        Row: {
          calendar_type: string
          created_at: string | null
          created_by: string | null
          date: string
          day_type: string
          description: string | null
          id: string
          institution_id: string | null
          updated_at: string | null
        }
        Insert: {
          calendar_type: string
          created_at?: string | null
          created_by?: string | null
          date: string
          day_type: string
          description?: string | null
          id?: string
          institution_id?: string | null
          updated_at?: string | null
        }
        Update: {
          calendar_type?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          day_type?: string
          description?: string | null
          id?: string
          institution_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_day_types_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_interviews: {
        Row: {
          application_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          interview_type: string
          interviewer_ids: string[] | null
          interviewer_names: string[] | null
          location: string | null
          meeting_link: string | null
          result: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          stage_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          interview_type?: string
          interviewer_ids?: string[] | null
          interviewer_names?: string[] | null
          location?: string | null
          meeting_link?: string | null
          result?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          stage_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          interview_type?: string
          interviewer_ids?: string[] | null
          interviewer_names?: string[] | null
          location?: string | null
          meeting_link?: string | null
          result?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          stage_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_interviews_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "interview_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_offers: {
        Row: {
          application_id: string | null
          benefits: string | null
          candidate_response_notes: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          expiry_date: string | null
          id: string
          job_title: string
          joining_date: string | null
          offer_letter_url: string | null
          offered_salary: number
          probation_period_months: number | null
          responded_at: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          benefits?: string | null
          candidate_response_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          expiry_date?: string | null
          id?: string
          job_title: string
          joining_date?: string | null
          offer_letter_url?: string | null
          offered_salary: number
          probation_period_months?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          benefits?: string | null
          candidate_response_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          expiry_date?: string | null
          id?: string
          job_title?: string
          joining_date?: string | null
          offer_letter_url?: string | null
          offered_salary?: number
          probation_period_months?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          category: string
          course_name_position: Json | null
          created_at: string | null
          created_by: string | null
          date_position: Json | null
          default_height: number | null
          default_width: number | null
          description: string | null
          id: string
          is_active: boolean | null
          level_title_position: Json | null
          name: string
          name_position: Json | null
          template_image_url: string | null
        }
        Insert: {
          category?: string
          course_name_position?: Json | null
          created_at?: string | null
          created_by?: string | null
          date_position?: Json | null
          default_height?: number | null
          default_width?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_title_position?: Json | null
          name: string
          name_position?: Json | null
          template_image_url?: string | null
        }
        Update: {
          category?: string
          course_name_position?: Json | null
          created_at?: string | null
          created_by?: string | null
          date_position?: Json | null
          default_height?: number | null
          default_width?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_title_position?: Json | null
          name?: string
          name_position?: Json | null
          template_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_assessment_mapping: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          created_by: string | null
          fa1_assessment_id: string | null
          fa2_assessment_id: string | null
          final_assessment_id: string | null
          id: string
          institution_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string
          class_id: string
          created_at?: string | null
          created_by?: string | null
          fa1_assessment_id?: string | null
          fa2_assessment_id?: string | null
          final_assessment_id?: string | null
          id?: string
          institution_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          created_by?: string | null
          fa1_assessment_id?: string | null
          fa2_assessment_id?: string | null
          final_assessment_id?: string | null
          id?: string
          institution_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_assessment_mapping_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assessment_mapping_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assessment_mapping_fa1_assessment_id_fkey"
            columns: ["fa1_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assessment_mapping_fa2_assessment_id_fkey"
            columns: ["fa2_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assessment_mapping_final_assessment_id_fkey"
            columns: ["final_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assessment_mapping_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_module_assignments: {
        Row: {
          class_assignment_id: string
          created_at: string | null
          id: string
          is_unlocked: boolean | null
          module_id: string
          unlock_mode: string | null
          unlock_order: number | null
          updated_at: string | null
        }
        Insert: {
          class_assignment_id: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          module_id: string
          unlock_mode?: string | null
          unlock_order?: number | null
          updated_at?: string | null
        }
        Update: {
          class_assignment_id?: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          module_id?: string
          unlock_mode?: string | null
          unlock_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_module_assignments_class_assignment_id_fkey"
            columns: ["class_assignment_id"]
            isOneToOne: false
            referencedRelation: "course_class_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      class_session_assignments: {
        Row: {
          class_module_assignment_id: string
          created_at: string | null
          id: string
          is_unlocked: boolean | null
          session_id: string
          unlock_mode: string | null
          unlock_order: number | null
          updated_at: string | null
        }
        Insert: {
          class_module_assignment_id: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          session_id: string
          unlock_mode?: string | null
          unlock_order?: number | null
          updated_at?: string | null
        }
        Update: {
          class_module_assignment_id?: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          session_id?: string
          unlock_mode?: string | null
          unlock_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_session_assignments_class_module_assignment_id_fkey"
            columns: ["class_module_assignment_id"]
            isOneToOne: false
            referencedRelation: "class_module_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_session_attendance: {
        Row: {
          attendance_records: Json | null
          class_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          date: string
          id: string
          institution_id: string
          is_session_completed: boolean | null
          notes: string | null
          officer_id: string | null
          period_label: string | null
          period_time: string | null
          students_absent: number
          students_late: number
          students_present: number
          subject: string | null
          timetable_assignment_id: string
          total_students: number
          updated_at: string | null
        }
        Insert: {
          attendance_records?: Json | null
          class_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          date: string
          id?: string
          institution_id: string
          is_session_completed?: boolean | null
          notes?: string | null
          officer_id?: string | null
          period_label?: string | null
          period_time?: string | null
          students_absent?: number
          students_late?: number
          students_present?: number
          subject?: string | null
          timetable_assignment_id: string
          total_students?: number
          updated_at?: string | null
        }
        Update: {
          attendance_records?: Json | null
          class_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          date?: string
          id?: string
          institution_id?: string
          is_session_completed?: boolean | null
          notes?: string | null
          officer_id?: string | null
          period_label?: string | null
          period_time?: string | null
          students_absent?: number
          students_late?: number
          students_present?: number
          subject?: string | null
          timetable_assignment_id?: string
          total_students?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_session_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_attendance_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_attendance_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_attendance_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_attendance_timetable_assignment_id_fkey"
            columns: ["timetable_assignment_id"]
            isOneToOne: false
            referencedRelation: "institution_timetable_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          class_name: string
          class_teacher_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          institution_id: string
          room_number: string | null
          section: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          class_name: string
          class_teacher_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          institution_id: string
          room_number?: string | null
          section?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          class_name?: string
          class_teacher_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          institution_id?: string
          room_number?: string | null
          section?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_log_attachments: {
        Row: {
          communication_log_id: string
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          public_url: string
          storage_path: string
          uploaded_by_id: string | null
          uploaded_by_name: string
        }
        Insert: {
          communication_log_id: string
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          public_url: string
          storage_path: string
          uploaded_by_id?: string | null
          uploaded_by_name: string
        }
        Update: {
          communication_log_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          public_url?: string
          storage_path?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_attachments_communication_log_id_fkey"
            columns: ["communication_log_id"]
            isOneToOne: false
            referencedRelation: "communication_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          conducted_by_id: string | null
          conducted_by_name: string
          contact_person: string
          contact_role: string
          created_at: string | null
          date: string
          id: string
          institution_id: string
          institution_name: string
          next_action: string | null
          next_action_date: string | null
          notes: string
          priority: string
          status: string
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          conducted_by_id?: string | null
          conducted_by_name: string
          contact_person: string
          contact_role: string
          created_at?: string | null
          date?: string
          id?: string
          institution_id: string
          institution_name: string
          next_action?: string | null
          next_action_date?: string | null
          notes: string
          priority?: string
          status?: string
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          conducted_by_id?: string | null
          conducted_by_name?: string
          contact_person?: string
          contact_role?: string
          created_at?: string | null
          date?: string
          id?: string
          institution_id?: string
          institution_name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string
          priority?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_holidays: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          end_date: string | null
          holiday_type: string
          id: string
          is_paid: boolean | null
          name: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          holiday_type?: string
          id?: string
          is_paid?: boolean | null
          name: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          holiday_type?: string
          id?: string
          is_paid?: boolean | null
          name?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      company_item_master: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          current_stock: number
          description: string | null
          gst_percentage: number | null
          id: string
          item_code: string
          item_name: string
          reorder_level: number | null
          status: string
          unit_of_measure: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number
          description?: string | null
          gst_percentage?: number | null
          id?: string
          item_code: string
          item_name: string
          reorder_level?: number | null
          status?: string
          unit_of_measure?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number
          description?: string | null
          gst_percentage?: number | null
          id?: string
          item_code?: string
          item_name?: string
          reorder_level?: number | null
          status?: string
          unit_of_measure?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_item_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          address: string | null
          bank_details: Json | null
          cin: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string | null
          created_by: string | null
          declaration: string | null
          default_cgst_rate: number | null
          default_igst_rate: number | null
          default_notes: string | null
          default_sgst_rate: number | null
          email: string | null
          gstin: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          profile_type: string
          report_logo_height: number | null
          report_logo_url: string | null
          report_logo_width: number | null
          report_signatory_designation: string | null
          report_signatory_name: string | null
          signature_url: string | null
          state: string | null
          state_code: string | null
          terms_and_conditions: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_details?: Json | null
          cin?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          declaration?: string | null
          default_cgst_rate?: number | null
          default_igst_rate?: number | null
          default_notes?: string | null
          default_sgst_rate?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          profile_type?: string
          report_logo_height?: number | null
          report_logo_url?: string | null
          report_logo_width?: number | null
          report_signatory_designation?: string | null
          report_signatory_name?: string | null
          signature_url?: string | null
          state?: string | null
          state_code?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_details?: Json | null
          cin?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          declaration?: string | null
          default_cgst_rate?: number | null
          default_igst_rate?: number | null
          default_notes?: string | null
          default_sgst_rate?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          profile_type?: string
          report_logo_height?: number | null
          report_logo_url?: string | null
          report_logo_width?: number | null
          report_signatory_designation?: string | null
          report_signatory_name?: string | null
          signature_url?: string | null
          state?: string | null
          state_code?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_stock_entries: {
        Row: {
          amount: number | null
          batch_serial: string | null
          created_at: string | null
          created_by: string | null
          entry_date: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          item_id: string
          location_store: string | null
          notes: string | null
          quantity: number
          rate: number
          supplier_id: string | null
        }
        Insert: {
          amount?: number | null
          batch_serial?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_date?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          item_id: string
          location_store?: string | null
          notes?: string | null
          quantity: number
          rate?: number
          supplier_id?: string | null
        }
        Update: {
          amount?: number | null
          batch_serial?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_date?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          item_id?: string
          location_store?: string | null
          notes?: string | null
          quantity?: number
          rate?: number
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_stock_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_stock_entries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "company_item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_stock_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "company_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_stock_issues: {
        Row: {
          admin_override: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          issue_date: string
          issued_to_id: string | null
          issued_to_name: string
          issued_to_type: string
          item_id: string
          notes: string | null
          purpose: string | null
          quantity: number
          reference_number: string | null
        }
        Insert: {
          admin_override?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_date?: string
          issued_to_id?: string | null
          issued_to_name: string
          issued_to_type: string
          item_id: string
          notes?: string | null
          purpose?: string | null
          quantity: number
          reference_number?: string | null
        }
        Update: {
          admin_override?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_date?: string
          issued_to_id?: string | null
          issued_to_name?: string
          issued_to_type?: string
          item_id?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_stock_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_stock_issues_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "company_item_master"
            referencedColumns: ["id"]
          },
        ]
      }
      company_suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_class_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          class_id: string
          course_id: string
          id: string
          institution_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          class_id: string
          course_id: string
          id?: string
          institution_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          class_id?: string
          course_id?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_class_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_class_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_content: {
        Row: {
          course_id: string
          created_at: string
          display_order: number
          duration_minutes: number | null
          file_path: string | null
          file_size_mb: number | null
          id: string
          module_id: string
          session_id: string
          title: string
          type: string
          views_count: number | null
          youtube_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          file_path?: string | null
          file_size_mb?: number | null
          id?: string
          module_id: string
          session_id: string
          title: string
          type: string
          views_count?: number | null
          youtube_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          file_path?: string | null
          file_size_mb?: number | null
          id?: string
          module_id?: string
          session_id?: string
          title?: string
          type?: string
          views_count?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_content_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_institution_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          course_id: string
          id: string
          institution_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          course_id: string
          id?: string
          institution_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          course_id?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_institution_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_institution_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          certificate_template_id: string | null
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          title: string
        }
        Insert: {
          certificate_template_id?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          title: string
        }
        Update: {
          certificate_template_id?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          learning_objectives: Json | null
          module_id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          learning_objectives?: Json | null
          module_id: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          learning_objectives?: Json | null
          module_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          certificate_template_id: string | null
          course_code: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          duration_weeks: number | null
          id: string
          learning_outcomes: Json | null
          prerequisites: string | null
          sdg_goals: Json | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          certificate_template_id?: string | null
          course_code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration_weeks?: number | null
          id?: string
          learning_outcomes?: Json | null
          prerequisites?: string | null
          sdg_goals?: Json | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          certificate_template_id?: string | null
          course_code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration_weeks?: number | null
          id?: string
          learning_outcomes?: Json | null
          prerequisites?: string | null
          sdg_goals?: Json | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_contract_documents: {
        Row: {
          contract_id: string
          file_name: string
          file_size: number | null
          id: string
          public_url: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          file_name: string
          file_size?: number | null
          id?: string
          public_url: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          file_name?: string
          file_size?: number | null
          id?: string
          public_url?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "crm_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contract_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contracts: {
        Row: {
          auto_renew: boolean | null
          contract_type: string
          contract_value: number
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          institution_id: string
          institution_name: string
          notes: string | null
          payment_terms: string
          renewal_date: string
          renewal_status: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          contract_type: string
          contract_value?: number
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          institution_id: string
          institution_name: string
          notes?: string | null
          payment_terms?: string
          renewal_date: string
          renewal_status?: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          contract_type?: string
          contract_value?: number
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          institution_id?: string
          institution_name?: string
          notes?: string | null
          payment_terms?: string
          renewal_date?: string
          renewal_status?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contracts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string
          assigned_to_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          institution_id: string
          institution_name: string
          notes: string | null
          priority: string
          related_contract_id: string | null
          status: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          institution_id: string
          institution_name: string
          notes?: string | null
          priority?: string
          related_contract_id?: string | null
          status?: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          institution_id?: string
          institution_name?: string
          notes?: string | null
          priority?: string
          related_contract_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_related_contract_id_fkey"
            columns: ["related_contract_id"]
            isOneToOne: false
            referencedRelation: "crm_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_work_logs: {
        Row: {
          created_at: string | null
          date: string
          hours_logged: number | null
          id: string
          notes: string | null
          officer_id: string | null
          productivity_score: number | null
          tasks_completed: string | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          hours_logged?: number | null
          id?: string
          notes?: string | null
          officer_id?: string | null
          productivity_score?: number | null
          tasks_completed?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          hours_logged?: number | null
          id?: string
          notes?: string | null
          officer_id?: string | null
          productivity_score?: number | null
          tasks_completed?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_work_logs_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_class_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          class_id: string
          event_id: string
          id: string
          institution_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          class_id: string
          event_id: string
          id?: string
          institution_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          class_id?: string
          event_id?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_class_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_class_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          class_id: string | null
          class_name: string | null
          email: string | null
          event_id: string
          id: string
          institution_id: string
          institution_name: string | null
          registered_at: string | null
          section: string | null
          student_id: string
          student_name: string | null
        }
        Insert: {
          class_id?: string | null
          class_name?: string | null
          email?: string | null
          event_id: string
          id?: string
          institution_id: string
          institution_name?: string | null
          registered_at?: string | null
          section?: string | null
          student_id: string
          student_name?: string | null
        }
        Update: {
          class_id?: string | null
          class_name?: string | null
          email?: string | null
          event_id?: string
          id?: string
          institution_id?: string
          institution_name?: string | null
          registered_at?: string | null
          section?: string | null
          student_id?: string
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_updates: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          event_id: string
          id: string
          link_url: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          event_id: string
          id?: string
          link_url?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          id?: string
          link_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_updates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attachments: Json | null
          brochure_url: string | null
          created_at: string | null
          created_by: string | null
          current_participants: number | null
          description: string | null
          eligibility_criteria: string | null
          event_end: string | null
          event_start: string
          event_type: string
          id: string
          max_participants: number | null
          prizes: Json | null
          registration_end: string | null
          registration_start: string | null
          rules: string | null
          status: string
          title: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          attachments?: Json | null
          brochure_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          eligibility_criteria?: string | null
          event_end?: string | null
          event_start: string
          event_type: string
          id?: string
          max_participants?: number | null
          prizes?: Json | null
          registration_end?: string | null
          registration_start?: string | null
          rules?: string | null
          status?: string
          title: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          attachments?: Json | null
          brochure_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          eligibility_criteria?: string | null
          event_end?: string | null
          event_start?: string
          event_type?: string
          id?: string
          max_participants?: number | null
          prizes?: Json | null
          registration_end?: string | null
          registration_start?: string | null
          rules?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      gamification_badges: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          unlock_criteria: Json
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          unlock_criteria?: Json
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          unlock_criteria?: Json
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "gamification_badges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_rating_projects: {
        Row: {
          competition_level: string | null
          created_at: string | null
          hr_rating_id: string
          id: string
          project_title: string
          result: string | null
          stars_earned: number | null
          verified_by: string | null
          verified_by_hr: boolean | null
          verified_date: string | null
        }
        Insert: {
          competition_level?: string | null
          created_at?: string | null
          hr_rating_id: string
          id?: string
          project_title: string
          result?: string | null
          stars_earned?: number | null
          verified_by?: string | null
          verified_by_hr?: boolean | null
          verified_date?: string | null
        }
        Update: {
          competition_level?: string | null
          created_at?: string | null
          hr_rating_id?: string
          id?: string
          project_title?: string
          result?: string | null
          stars_earned?: number | null
          verified_by?: string | null
          verified_by_hr?: boolean | null
          verified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_rating_projects_hr_rating_id_fkey"
            columns: ["hr_rating_id"]
            isOneToOne: false
            referencedRelation: "hr_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_rating_projects_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_ratings: {
        Row: {
          created_at: string | null
          created_by: string | null
          cumulative_stars_year: number | null
          employee_id: string
          id: string
          period: string
          total_stars_quarter: number | null
          trainer_id: string
          trainer_name: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cumulative_stars_year?: number | null
          employee_id: string
          id?: string
          period: string
          total_stars_quarter?: number | null
          trainer_id: string
          trainer_name: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cumulative_stars_year?: number | null
          employee_id?: string
          id?: string
          period?: string
          total_stars_quarter?: number | null
          trainer_id?: string
          trainer_name?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_ratings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_ratings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      id_counters: {
        Row: {
          counter_padding: number | null
          created_at: string
          current_counter: number
          entity_type: string
          id: string
          institution_id: string
          prefix: string | null
          updated_at: string
          year_format: string | null
        }
        Insert: {
          counter_padding?: number | null
          created_at?: string
          current_counter?: number
          entity_type: string
          id?: string
          institution_id: string
          prefix?: string | null
          updated_at?: string
          year_format?: string | null
        }
        Update: {
          counter_padding?: number | null
          created_at?: string
          current_counter?: number
          entity_type?: string
          id?: string
          institution_id?: string
          prefix?: string | null
          updated_at?: string
          year_format?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "id_counters_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_holidays: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          end_date: string | null
          holiday_type: string
          id: string
          institution_id: string
          is_paid: boolean | null
          name: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          holiday_type?: string
          id?: string
          institution_id: string
          is_paid?: boolean | null
          name: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          holiday_type?: string
          id?: string
          institution_id?: string
          is_paid?: boolean | null
          name?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "institution_holidays_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_periods: {
        Row: {
          created_at: string
          display_order: number
          end_time: string
          id: string
          institution_id: string
          is_break: boolean
          label: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          end_time: string
          id?: string
          institution_id: string
          is_break?: boolean
          label: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          end_time?: string
          id?: string
          institution_id?: string
          is_break?: boolean
          label?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_periods_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_timetable_assignments: {
        Row: {
          academic_year: string
          backup_officer_id: string | null
          backup_officer_name: string | null
          class_id: string
          class_name: string
          created_at: string
          day: string
          id: string
          institution_id: string
          period_id: string
          room: string | null
          secondary_officer_id: string | null
          secondary_officer_name: string | null
          subject: string
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string
          backup_officer_id?: string | null
          backup_officer_name?: string | null
          class_id: string
          class_name: string
          created_at?: string
          day: string
          id?: string
          institution_id: string
          period_id: string
          room?: string | null
          secondary_officer_id?: string | null
          secondary_officer_name?: string | null
          subject: string
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          backup_officer_id?: string | null
          backup_officer_name?: string | null
          class_id?: string
          class_name?: string
          created_at?: string
          day?: string
          id?: string
          institution_id?: string
          period_id?: string
          room?: string | null
          secondary_officer_id?: string | null
          secondary_officer_name?: string | null
          subject?: string
          teacher_id?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_timetable_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_timetable_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_timetable_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "institution_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: Json | null
          admin_user_id: string | null
          code: string | null
          contact_info: Json | null
          contract_expiry_date: string | null
          contract_value: number | null
          created_at: string | null
          current_users: number | null
          id: string
          license_expiry: string | null
          license_type: string | null
          max_users: number | null
          name: string
          settings: Json | null
          slug: string
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          admin_user_id?: string | null
          code?: string | null
          contact_info?: Json | null
          contract_expiry_date?: string | null
          contract_value?: number | null
          created_at?: string | null
          current_users?: number | null
          id?: string
          license_expiry?: string | null
          license_type?: string | null
          max_users?: number | null
          name: string
          settings?: Json | null
          slug: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          admin_user_id?: string | null
          code?: string | null
          contact_info?: Json | null
          contract_expiry_date?: string | null
          contract_value?: number | null
          created_at?: string | null
          current_users?: number | null
          id?: string
          license_expiry?: string | null
          license_type?: string | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_assessment_marks: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          entered_by: string | null
          id: string
          institution_id: string
          marks_obtained: number
          notes: string | null
          student_id: string
          total_marks: number
          updated_at: string | null
        }
        Insert: {
          academic_year?: string
          class_id: string
          created_at?: string | null
          entered_by?: string | null
          id?: string
          institution_id: string
          marks_obtained?: number
          notes?: string | null
          student_id: string
          total_marks?: number
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          entered_by?: string | null
          id?: string
          institution_id?: string
          marks_obtained?: number
          notes?: string | null
          student_id?: string
          total_marks?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_assessment_marks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_assessment_marks_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_assessment_marks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_assessment_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          communication_rating: number | null
          cultural_fit_rating: number | null
          detailed_feedback: string | null
          id: string
          interview_id: string | null
          interviewer_id: string | null
          interviewer_name: string | null
          overall_rating: number | null
          problem_solving_rating: number | null
          recommendation: string | null
          strengths: string | null
          submitted_at: string | null
          technical_skills_rating: number | null
          weaknesses: string | null
        }
        Insert: {
          communication_rating?: number | null
          cultural_fit_rating?: number | null
          detailed_feedback?: string | null
          id?: string
          interview_id?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          overall_rating?: number | null
          problem_solving_rating?: number | null
          recommendation?: string | null
          strengths?: string | null
          submitted_at?: string | null
          technical_skills_rating?: number | null
          weaknesses?: string | null
        }
        Update: {
          communication_rating?: number | null
          cultural_fit_rating?: number | null
          detailed_feedback?: string | null
          id?: string
          interview_id?: string | null
          interviewer_id?: string | null
          interviewer_name?: string | null
          overall_rating?: number | null
          problem_solving_rating?: number | null
          recommendation?: string | null
          strengths?: string | null
          submitted_at?: string | null
          technical_skills_rating?: number | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "candidate_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_stages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          job_id: string | null
          stage_name: string
          stage_order: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          job_id?: string | null
          stage_name: string
          stage_order: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          job_id?: string | null
          stage_name?: string
          stage_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_issues: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          description: string
          id: string
          institution_id: string
          inventory_item_id: string | null
          issue_code: string
          issue_type: string
          item_name: string
          quantity_affected: number | null
          reported_by: string
          reporter_name: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          description: string
          id?: string
          institution_id: string
          inventory_item_id?: string | null
          issue_code: string
          issue_type: string
          item_name: string
          quantity_affected?: number | null
          reported_by: string
          reporter_name: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          description?: string
          id?: string
          institution_id?: string
          inventory_item_id?: string | null
          issue_code?: string
          issue_type?: string
          item_name?: string
          quantity_affected?: number | null
          reported_by?: string
          reporter_name?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_issues_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_issues_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          institution_id: string
          name: string
          sl_no: number
          status: string | null
          total_value: number | null
          unit_price: number
          units: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id: string
          name: string
          sl_no?: number
          status?: string | null
          total_value?: number | null
          unit_price?: number
          units?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          name?: string
          sl_no?: number
          status?: string | null
          total_value?: number | null
          unit_price?: number
          units?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string | null
          description: string
          discount_amount: number | null
          discount_percent: number | null
          display_order: number | null
          hsn_sac_code: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_id: string
          quantity: number | null
          rate: number
          sgst_amount: number | null
          sgst_rate: number | null
          unit: string | null
        }
        Insert: {
          amount?: number
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          display_order?: number | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_id: string
          quantity?: number | null
          rate?: number
          sgst_amount?: number | null
          sgst_rate?: number | null
          unit?: string | null
        }
        Update: {
          amount?: number
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          display_order?: number | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_id?: string
          quantity?: number | null
          rate?: number
          sgst_amount?: number | null
          sgst_rate?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_number_sequences: {
        Row: {
          created_at: string | null
          financial_year: string
          id: string
          invoice_type: string
          last_number: number
          prefix: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          financial_year: string
          id?: string
          invoice_type: string
          last_number?: number
          prefix: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          financial_year?: string
          id?: string
          invoice_type?: string
          last_number?: number
          prefix?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          ack_date: string | null
          ack_number: string | null
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          balance_due: number
          bank_details: Json | null
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string | null
          created_by: string | null
          declaration: string | null
          delivery_note: string | null
          discount_amount: number | null
          due_date: string | null
          from_company_address: string | null
          from_company_cin: string | null
          from_company_city: string | null
          from_company_email: string | null
          from_company_gstin: string | null
          from_company_name: string
          from_company_pan: string | null
          from_company_phone: string | null
          from_company_pincode: string | null
          from_company_state: string | null
          from_company_state_code: string | null
          from_company_website: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          institution_id: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          irn: string | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          place_of_supply: string | null
          reference_number: string | null
          sgst_amount: number | null
          sgst_rate: number | null
          ship_to_address: string | null
          ship_to_city: string | null
          ship_to_gstin: string | null
          ship_to_name: string | null
          ship_to_pincode: string | null
          ship_to_state: string | null
          ship_to_state_code: string | null
          signature_url: string | null
          status: string
          sub_total: number
          tds_amount: number | null
          tds_rate: number | null
          terms: string | null
          terms_and_conditions: string | null
          to_company_address: string | null
          to_company_city: string | null
          to_company_contact_person: string | null
          to_company_gstin: string | null
          to_company_name: string
          to_company_phone: string | null
          to_company_pincode: string | null
          to_company_state: string | null
          to_company_state_code: string | null
          total_amount: number
          total_in_words: string | null
          updated_at: string | null
        }
        Insert: {
          ack_date?: string | null
          ack_number?: string | null
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          balance_due?: number
          bank_details?: Json | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          declaration?: string | null
          delivery_note?: string | null
          discount_amount?: number | null
          due_date?: string | null
          from_company_address?: string | null
          from_company_cin?: string | null
          from_company_city?: string | null
          from_company_email?: string | null
          from_company_gstin?: string | null
          from_company_name: string
          from_company_pan?: string | null
          from_company_phone?: string | null
          from_company_pincode?: string | null
          from_company_state?: string | null
          from_company_state_code?: string | null
          from_company_website?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          institution_id?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_type: string
          irn?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          place_of_supply?: string | null
          reference_number?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          ship_to_address?: string | null
          ship_to_city?: string | null
          ship_to_gstin?: string | null
          ship_to_name?: string | null
          ship_to_pincode?: string | null
          ship_to_state?: string | null
          ship_to_state_code?: string | null
          signature_url?: string | null
          status?: string
          sub_total?: number
          tds_amount?: number | null
          tds_rate?: number | null
          terms?: string | null
          terms_and_conditions?: string | null
          to_company_address?: string | null
          to_company_city?: string | null
          to_company_contact_person?: string | null
          to_company_gstin?: string | null
          to_company_name: string
          to_company_phone?: string | null
          to_company_pincode?: string | null
          to_company_state?: string | null
          to_company_state_code?: string | null
          total_amount?: number
          total_in_words?: string | null
          updated_at?: string | null
        }
        Update: {
          ack_date?: string | null
          ack_number?: string | null
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          balance_due?: number
          bank_details?: Json | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          declaration?: string | null
          delivery_note?: string | null
          discount_amount?: number | null
          due_date?: string | null
          from_company_address?: string | null
          from_company_cin?: string | null
          from_company_city?: string | null
          from_company_email?: string | null
          from_company_gstin?: string | null
          from_company_name?: string
          from_company_pan?: string | null
          from_company_phone?: string | null
          from_company_pincode?: string | null
          from_company_state?: string | null
          from_company_state_code?: string | null
          from_company_website?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          institution_id?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          irn?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          place_of_supply?: string | null
          reference_number?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          ship_to_address?: string | null
          ship_to_city?: string | null
          ship_to_gstin?: string | null
          ship_to_name?: string | null
          ship_to_pincode?: string | null
          ship_to_state?: string | null
          ship_to_state_code?: string | null
          signature_url?: string | null
          status?: string
          sub_total?: number
          tds_amount?: number | null
          tds_rate?: number | null
          terms?: string | null
          terms_and_conditions?: string | null
          to_company_address?: string | null
          to_company_city?: string | null
          to_company_contact_person?: string | null
          to_company_gstin?: string | null
          to_company_name?: string
          to_company_phone?: string | null
          to_company_pincode?: string | null
          to_company_state?: string | null
          to_company_state_code?: string | null
          total_amount?: number
          total_in_words?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          candidate_email: string
          candidate_name: string
          candidate_phone: string | null
          cover_letter: string | null
          current_company: string | null
          current_designation: string | null
          expected_salary: number | null
          experience_years: number | null
          hr_notes: string | null
          id: string
          job_id: string | null
          notice_period_days: number | null
          resume_url: string | null
          skills: string[] | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_email: string
          candidate_name: string
          candidate_phone?: string | null
          cover_letter?: string | null
          current_company?: string | null
          current_designation?: string | null
          expected_salary?: number | null
          experience_years?: number | null
          hr_notes?: string | null
          id?: string
          job_id?: string | null
          notice_period_days?: number | null
          resume_url?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_email?: string
          candidate_name?: string
          candidate_phone?: string | null
          cover_letter?: string | null
          current_company?: string | null
          current_designation?: string | null
          expected_salary?: number | null
          experience_years?: number | null
          hr_notes?: string | null
          id?: string
          job_id?: string | null
          notice_period_days?: number | null
          resume_url?: string | null
          skills?: string[] | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          employment_type: string
          experience_level: string | null
          id: string
          job_title: string
          location: string | null
          max_experience_years: number | null
          min_experience_years: number | null
          number_of_openings: number | null
          position_id: string | null
          required_skills: string[] | null
          salary_range_max: number | null
          salary_range_min: number | null
          status: string | null
          target_role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string
          experience_level?: string | null
          id?: string
          job_title: string
          location?: string | null
          max_experience_years?: number | null
          min_experience_years?: number | null
          number_of_openings?: number | null
          position_id?: string | null
          required_skills?: string[] | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string
          experience_level?: string | null
          id?: string
          job_title?: string
          location?: string | null
          max_experience_years?: number | null
          min_experience_years?: number | null
          number_of_openings?: number | null
          position_id?: string | null
          required_skills?: string[] | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leaderboard_configs: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          is_public: boolean | null
          reset_schedule: string | null
          scope: string | null
          time_period: string | null
          top_n_display: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          is_public?: boolean | null
          reset_schedule?: string | null
          scope?: string | null
          time_period?: string | null
          top_n_display?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          is_public?: boolean | null
          reset_schedule?: string | null
          scope?: string | null
          time_period?: string | null
          top_n_display?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_configs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_applications: {
        Row: {
          applicant_id: string
          applicant_name: string
          applicant_type: string
          applied_at: string | null
          approval_chain: Json | null
          current_approval_level: number | null
          end_date: string
          final_approved_at: string | null
          final_approved_by: string | null
          final_approved_by_name: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_lop: boolean | null
          leave_type: string
          lop_days: number | null
          officer_id: string | null
          paid_days: number | null
          position_id: string | null
          position_name: string | null
          reason: string
          rejected_at: string | null
          rejected_by: string | null
          rejected_by_name: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          substitute_assignments: Json | null
          total_days: number
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          applicant_name: string
          applicant_type: string
          applied_at?: string | null
          approval_chain?: Json | null
          current_approval_level?: number | null
          end_date: string
          final_approved_at?: string | null
          final_approved_by?: string | null
          final_approved_by_name?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_lop?: boolean | null
          leave_type: string
          lop_days?: number | null
          officer_id?: string | null
          paid_days?: number | null
          position_id?: string | null
          position_name?: string | null
          reason: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejected_by_name?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          substitute_assignments?: Json | null
          total_days: number
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          applicant_name?: string
          applicant_type?: string
          applied_at?: string | null
          approval_chain?: Json | null
          current_approval_level?: number | null
          end_date?: string
          final_approved_at?: string | null
          final_approved_by?: string | null
          final_approved_by_name?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_lop?: boolean | null
          leave_type?: string
          lop_days?: number | null
          officer_id?: string | null
          paid_days?: number | null
          position_id?: string | null
          position_name?: string | null
          reason?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejected_by_name?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          substitute_assignments?: Json | null
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_applications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_approval_hierarchy: {
        Row: {
          applicant_position_id: string | null
          applicant_type: string
          approval_order: number
          approver_position_id: string
          created_at: string | null
          id: string
          is_final_approver: boolean | null
          is_optional: boolean | null
          updated_at: string | null
        }
        Insert: {
          applicant_position_id?: string | null
          applicant_type: string
          approval_order: number
          approver_position_id: string
          created_at?: string | null
          id?: string
          is_final_approver?: boolean | null
          is_optional?: boolean | null
          updated_at?: string | null
        }
        Update: {
          applicant_position_id?: string | null
          applicant_type?: string
          approval_order?: number
          approver_position_id?: string
          created_at?: string | null
          id?: string
          is_final_approver?: boolean | null
          is_optional?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_approval_hierarchy_applicant_position_id_fkey"
            columns: ["applicant_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_approval_hierarchy_approver_position_id_fkey"
            columns: ["approver_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balance_adjustments: {
        Row: {
          adjusted_by: string | null
          adjusted_by_name: string | null
          adjustment_amount: number
          adjustment_type: string
          created_at: string | null
          id: string
          leave_balance_id: string | null
          new_value: number
          previous_value: number
          reason: string
          user_id: string
          user_type: string
        }
        Insert: {
          adjusted_by?: string | null
          adjusted_by_name?: string | null
          adjustment_amount: number
          adjustment_type: string
          created_at?: string | null
          id?: string
          leave_balance_id?: string | null
          new_value: number
          previous_value: number
          reason: string
          user_id: string
          user_type: string
        }
        Update: {
          adjusted_by?: string | null
          adjusted_by_name?: string | null
          adjustment_amount?: number
          adjustment_type?: string
          created_at?: string | null
          id?: string
          leave_balance_id?: string | null
          new_value?: number
          previous_value?: number
          reason?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balance_adjustments_leave_balance_id_fkey"
            columns: ["leave_balance_id"]
            isOneToOne: false
            referencedRelation: "leave_balances"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          additional_credit: number | null
          adjusted_at: string | null
          adjusted_by: string | null
          adjustment_reason: string | null
          balance_remaining: number
          carried_forward: number
          casual_leave_used: number
          created_at: string | null
          id: string
          lop_days: number
          month: number
          monthly_credit: number
          officer_id: string | null
          sick_leave_used: number
          updated_at: string | null
          user_id: string
          user_type: string
          year: number
        }
        Insert: {
          additional_credit?: number | null
          adjusted_at?: string | null
          adjusted_by?: string | null
          adjustment_reason?: string | null
          balance_remaining?: number
          carried_forward?: number
          casual_leave_used?: number
          created_at?: string | null
          id?: string
          lop_days?: number
          month: number
          monthly_credit?: number
          officer_id?: string | null
          sick_leave_used?: number
          updated_at?: string | null
          user_id: string
          user_type: string
          year: number
        }
        Update: {
          additional_credit?: number | null
          adjusted_at?: string | null
          adjusted_by?: string | null
          adjustment_reason?: string | null
          balance_remaining?: number
          carried_forward?: number
          casual_leave_used?: number
          created_at?: string | null
          id?: string
          lop_days?: number
          month?: number
          monthly_credit?: number
          officer_id?: string | null
          sick_leave_used?: number
          updated_at?: string | null
          user_id?: string
          user_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_name: string
          download_count: number | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          institution_id: string | null
          pdf_url: string
          published_at: string | null
          status: string
          target_audience: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          created_by_name: string
          download_count?: number | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          institution_id?: string | null
          pdf_url: string
          published_at?: string | null
          status?: string
          target_audience?: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string
          download_count?: number | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          institution_id?: string | null
          pdf_url?: string
          published_at?: string | null
          status?: string
          target_audience?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletters_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          recipient_id: string
          recipient_role: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          recipient_id: string
          recipient_role: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          recipient_role?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      officer_attendance: {
        Row: {
          check_in_address: string | null
          check_in_distance_meters: number | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_time: string | null
          check_in_validated: boolean | null
          check_out_address: string | null
          check_out_distance_meters: number | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_time: string | null
          check_out_validated: boolean | null
          corrected_by: string | null
          correction_reason: string | null
          created_at: string | null
          date: string
          expected_check_in_time: string | null
          expected_check_out_time: string | null
          id: string
          institution_id: string
          is_early_checkout: boolean | null
          is_late_login: boolean | null
          is_manual_correction: boolean | null
          late_minutes: number | null
          notes: string | null
          officer_id: string
          original_check_in_time: string | null
          original_check_out_time: string | null
          overtime_auto_generated: boolean | null
          overtime_hours: number | null
          status: string | null
          total_hours_worked: number | null
          updated_at: string | null
        }
        Insert: {
          check_in_address?: string | null
          check_in_distance_meters?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_in_validated?: boolean | null
          check_out_address?: string | null
          check_out_distance_meters?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          check_out_validated?: boolean | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string | null
          date?: string
          expected_check_in_time?: string | null
          expected_check_out_time?: string | null
          id?: string
          institution_id: string
          is_early_checkout?: boolean | null
          is_late_login?: boolean | null
          is_manual_correction?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          officer_id: string
          original_check_in_time?: string | null
          original_check_out_time?: string | null
          overtime_auto_generated?: boolean | null
          overtime_hours?: number | null
          status?: string | null
          total_hours_worked?: number | null
          updated_at?: string | null
        }
        Update: {
          check_in_address?: string | null
          check_in_distance_meters?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_in_validated?: boolean | null
          check_out_address?: string | null
          check_out_distance_meters?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          check_out_validated?: boolean | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string | null
          date?: string
          expected_check_in_time?: string | null
          expected_check_out_time?: string | null
          id?: string
          institution_id?: string
          is_early_checkout?: boolean | null
          is_late_login?: boolean | null
          is_manual_correction?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          officer_id?: string
          original_check_in_time?: string | null
          original_check_out_time?: string | null
          overtime_auto_generated?: boolean | null
          overtime_hours?: number | null
          status?: string | null
          total_hours_worked?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officer_attendance_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officer_attendance_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      officer_class_access_grants: {
        Row: {
          access_type: string
          class_id: string
          created_at: string | null
          granting_officer_id: string
          id: string
          institution_id: string
          is_active: boolean | null
          reason: string | null
          receiving_officer_id: string
          timetable_assignment_id: string | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          access_type?: string
          class_id: string
          created_at?: string | null
          granting_officer_id: string
          id?: string
          institution_id: string
          is_active?: boolean | null
          reason?: string | null
          receiving_officer_id: string
          timetable_assignment_id?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          access_type?: string
          class_id?: string
          created_at?: string | null
          granting_officer_id?: string
          id?: string
          institution_id?: string
          is_active?: boolean | null
          reason?: string | null
          receiving_officer_id?: string
          timetable_assignment_id?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_granting_officer"
            columns: ["granting_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_institution"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_receiving_officer"
            columns: ["receiving_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_timetable_assignment"
            columns: ["timetable_assignment_id"]
            isOneToOne: false
            referencedRelation: "institution_timetable_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      officer_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_name: string
          document_type: string
          file_size_mb: number | null
          file_type: string | null
          file_url: string
          id: string
          officer_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_name: string
          document_type: string
          file_size_mb?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          officer_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_name?: string
          document_type?: string
          file_size_mb?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          officer_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officer_documents_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      officer_institution_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          institution_id: string
          notes: string | null
          officer_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          notes?: string | null
          officer_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          notes?: string | null
          officer_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officer_institution_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officer_institution_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officer_institution_assignments_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      officers: {
        Row: {
          address: string | null
          annual_leave_allowance: number | null
          annual_salary: number
          assigned_institutions: string[] | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          casual_leave_allowance: number | null
          certifications: Json | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          designation: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          employment_type: string
          full_name: string
          hourly_rate: number | null
          id: string
          join_date: string | null
          normal_working_hours: number | null
          overtime_rate_multiplier: number | null
          phone: string | null
          profile_photo_url: string | null
          qualifications: Json | null
          salary_structure: Json | null
          sick_leave_allowance: number | null
          skills: Json | null
          status: string
          statutory_info: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          annual_leave_allowance?: number | null
          annual_salary?: number
          assigned_institutions?: string[] | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          casual_leave_allowance?: number | null
          certifications?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          employment_type?: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          join_date?: string | null
          normal_working_hours?: number | null
          overtime_rate_multiplier?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          qualifications?: Json | null
          salary_structure?: Json | null
          sick_leave_allowance?: number | null
          skills?: Json | null
          status?: string
          statutory_info?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          annual_leave_allowance?: number | null
          annual_salary?: number
          assigned_institutions?: string[] | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          casual_leave_allowance?: number | null
          certifications?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          employment_type?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          join_date?: string | null
          normal_working_hours?: number | null
          overtime_rate_multiplier?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          qualifications?: Json | null
          salary_structure?: Json | null
          sick_leave_allowance?: number | null
          skills?: Json | null
          status?: string
          statutory_info?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      overtime_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          attendance_id: string | null
          calculated_pay: number | null
          created_at: string | null
          date: string
          id: string
          institution_id: string | null
          officer_id: string | null
          overtime_rate: number | null
          reason: string
          rejection_reason: string | null
          requested_hours: number
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          attendance_id?: string | null
          calculated_pay?: number | null
          created_at?: string | null
          date: string
          id?: string
          institution_id?: string | null
          officer_id?: string | null
          overtime_rate?: number | null
          reason: string
          rejection_reason?: string | null
          requested_hours: number
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          attendance_id?: string | null
          calculated_pay?: number | null
          created_at?: string | null
          date?: string
          id?: string
          institution_id?: string | null
          officer_id?: string | null
          overtime_rate?: number | null
          reason?: string
          rejection_reason?: string | null
          requested_hours?: number
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overtime_requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_requests_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          basic_pay: number | null
          created_at: string | null
          da: number | null
          days_absent: number | null
          days_leave: number | null
          days_lop: number | null
          days_present: number | null
          deductions: Json | null
          esi_employee: number | null
          esi_employer: number | null
          generated_at: string | null
          gross_salary: number | null
          hra: number | null
          id: string
          institution_id: string | null
          loan_deduction: number | null
          lop_deduction: number | null
          month: number
          monthly_salary: number
          net_pay: number | null
          notes: string | null
          officer_id: string | null
          other_allowances: number | null
          other_deductions: number | null
          overtime_approved: boolean | null
          overtime_hours: number | null
          overtime_pay: number | null
          paid_date: string | null
          payment_mode: string | null
          payment_reference: string | null
          per_day_salary: number | null
          pf_employee: number | null
          pf_employer: number | null
          position_id: string | null
          professional_tax: number | null
          salary_components: Json | null
          special_allowance: number | null
          standard_days: number | null
          status: string | null
          tds: number | null
          total_deductions: number | null
          total_earnings: number | null
          total_hours_worked: number | null
          uninformed_leave_days: number | null
          updated_at: string | null
          user_id: string
          user_type: string
          working_days: number
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          basic_pay?: number | null
          created_at?: string | null
          da?: number | null
          days_absent?: number | null
          days_leave?: number | null
          days_lop?: number | null
          days_present?: number | null
          deductions?: Json | null
          esi_employee?: number | null
          esi_employer?: number | null
          generated_at?: string | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          institution_id?: string | null
          loan_deduction?: number | null
          lop_deduction?: number | null
          month: number
          monthly_salary?: number
          net_pay?: number | null
          notes?: string | null
          officer_id?: string | null
          other_allowances?: number | null
          other_deductions?: number | null
          overtime_approved?: boolean | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          paid_date?: string | null
          payment_mode?: string | null
          payment_reference?: string | null
          per_day_salary?: number | null
          pf_employee?: number | null
          pf_employer?: number | null
          position_id?: string | null
          professional_tax?: number | null
          salary_components?: Json | null
          special_allowance?: number | null
          standard_days?: number | null
          status?: string | null
          tds?: number | null
          total_deductions?: number | null
          total_earnings?: number | null
          total_hours_worked?: number | null
          uninformed_leave_days?: number | null
          updated_at?: string | null
          user_id: string
          user_type: string
          working_days?: number
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          basic_pay?: number | null
          created_at?: string | null
          da?: number | null
          days_absent?: number | null
          days_leave?: number | null
          days_lop?: number | null
          days_present?: number | null
          deductions?: Json | null
          esi_employee?: number | null
          esi_employer?: number | null
          generated_at?: string | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          institution_id?: string | null
          loan_deduction?: number | null
          lop_deduction?: number | null
          month?: number
          monthly_salary?: number
          net_pay?: number | null
          notes?: string | null
          officer_id?: string | null
          other_allowances?: number | null
          other_deductions?: number | null
          overtime_approved?: boolean | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          paid_date?: string | null
          payment_mode?: string | null
          payment_reference?: string | null
          per_day_salary?: number | null
          pf_employee?: number | null
          pf_employer?: number | null
          position_id?: string | null
          professional_tax?: number | null
          salary_components?: Json | null
          special_allowance?: number | null
          standard_days?: number | null
          status?: string | null
          tds?: number | null
          total_deductions?: number | null
          total_earnings?: number | null
          total_hours_worked?: number | null
          uninformed_leave_days?: number | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
          working_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_appraisals: {
        Row: {
          collaboration_coordination: string | null
          created_at: string | null
          created_by: string | null
          employee_id: string
          future_goals: string[] | null
          hr_review: Json | null
          id: string
          innovations_introduced: string[] | null
          institution_id: string | null
          institution_name: string
          key_contributions: string[] | null
          lab_domains: string[] | null
          manager_review: Json | null
          planned_trainings: string[] | null
          principal_review: Json | null
          reporting_period_from: string
          reporting_period_to: string
          status: string
          student_comments_summary: string | null
          student_feedback: Json | null
          student_mentorship_experience: string | null
          support_needed: string | null
          total_instructional_hours: number | null
          total_projects_mentored: number | null
          trainer_id: string
          trainer_name: string
          updated_at: string | null
        }
        Insert: {
          collaboration_coordination?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          future_goals?: string[] | null
          hr_review?: Json | null
          id?: string
          innovations_introduced?: string[] | null
          institution_id?: string | null
          institution_name: string
          key_contributions?: string[] | null
          lab_domains?: string[] | null
          manager_review?: Json | null
          planned_trainings?: string[] | null
          principal_review?: Json | null
          reporting_period_from: string
          reporting_period_to: string
          status?: string
          student_comments_summary?: string | null
          student_feedback?: Json | null
          student_mentorship_experience?: string | null
          support_needed?: string | null
          total_instructional_hours?: number | null
          total_projects_mentored?: number | null
          trainer_id: string
          trainer_name: string
          updated_at?: string | null
        }
        Update: {
          collaboration_coordination?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          future_goals?: string[] | null
          hr_review?: Json | null
          id?: string
          innovations_introduced?: string[] | null
          institution_id?: string | null
          institution_name?: string
          key_contributions?: string[] | null
          lab_domains?: string[] | null
          manager_review?: Json | null
          planned_trainings?: string[] | null
          principal_review?: Json | null
          reporting_period_from?: string
          reporting_period_to?: string
          status?: string
          student_comments_summary?: string | null
          student_feedback?: Json | null
          student_mentorship_experience?: string | null
          support_needed?: string | null
          total_instructional_hours?: number | null
          total_projects_mentored?: number | null
          trainer_id?: string
          trainer_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_appraisals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_appraisals_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_appraisals_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_ceo_position: boolean
          position_name: string
          updated_at: string | null
          visible_features: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_ceo_position?: boolean
          position_name: string
          updated_at?: string | null
          visible_features?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_ceo_position?: boolean
          position_name?: string
          updated_at?: string | null
          visible_features?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          annual_leave_allowance: number | null
          annual_salary: number | null
          avatar: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          casual_leave_allowance: number | null
          check_in_time: string | null
          check_out_time: string | null
          class_id: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          designation: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          hourly_rate: number | null
          id: string
          institution_id: string | null
          is_ceo: boolean | null
          join_date: string | null
          must_change_password: boolean | null
          name: string
          normal_working_hours: number | null
          overtime_rate_multiplier: number | null
          password_changed: boolean | null
          password_changed_at: string | null
          phone: string | null
          position_id: string | null
          position_name: string | null
          profile_photo_url: string | null
          salary_structure: Json | null
          sick_leave_allowance: number | null
          status: string | null
          statutory_info: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          annual_leave_allowance?: number | null
          annual_salary?: number | null
          avatar?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          casual_leave_allowance?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          hourly_rate?: number | null
          id: string
          institution_id?: string | null
          is_ceo?: boolean | null
          join_date?: string | null
          must_change_password?: boolean | null
          name: string
          normal_working_hours?: number | null
          overtime_rate_multiplier?: number | null
          password_changed?: boolean | null
          password_changed_at?: string | null
          phone?: string | null
          position_id?: string | null
          position_name?: string | null
          profile_photo_url?: string | null
          salary_structure?: Json | null
          sick_leave_allowance?: number | null
          status?: string | null
          statutory_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          annual_leave_allowance?: number | null
          annual_salary?: number | null
          avatar?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          casual_leave_allowance?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          hourly_rate?: number | null
          id?: string
          institution_id?: string | null
          is_ceo?: boolean | null
          join_date?: string | null
          must_change_password?: boolean | null
          name?: string
          normal_working_hours?: number | null
          overtime_rate_multiplier?: number | null
          password_changed?: boolean | null
          password_changed_at?: string | null
          phone?: string | null
          position_id?: string | null
          position_name?: string | null
          profile_photo_url?: string | null
          salary_structure?: Json | null
          sick_leave_allowance?: number | null
          status?: string | null
          statutory_info?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_achievements: {
        Row: {
          added_by_officer_id: string | null
          certificate_url: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_name: string | null
          id: string
          project_id: string
          title: string
          type: string
        }
        Insert: {
          added_by_officer_id?: string | null
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          project_id: string
          title: string
          type?: string
        }
        Update: {
          added_by_officer_id?: string | null
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          project_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_achievements_added_by_officer_id_fkey"
            columns: ["added_by_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_achievements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          assigned_at: string | null
          assigned_by_officer_id: string | null
          id: string
          project_id: string
          role: string
          student_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_officer_id?: string | null
          id?: string
          project_id: string
          role?: string
          student_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_officer_id?: string | null
          id?: string
          project_id?: string
          role?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_assigned_by_officer_id_fkey"
            columns: ["assigned_by_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      project_progress_updates: {
        Row: {
          attachment_urls: Json | null
          created_at: string | null
          id: string
          notes: string
          progress_percentage: number | null
          project_id: string
          updated_by_officer_id: string | null
          updated_by_officer_name: string
        }
        Insert: {
          attachment_urls?: Json | null
          created_at?: string | null
          id?: string
          notes: string
          progress_percentage?: number | null
          project_id: string
          updated_by_officer_id?: string | null
          updated_by_officer_name: string
        }
        Update: {
          attachment_urls?: Json | null
          created_at?: string | null
          id?: string
          notes?: string
          progress_percentage?: number | null
          project_id?: string
          updated_by_officer_id?: string | null
          updated_by_officer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_progress_updates_updated_by_officer_id_fkey"
            columns: ["updated_by_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          award_date: string | null
          award_description: string | null
          award_name: string | null
          category: string
          created_at: string | null
          created_by_officer_id: string
          created_by_officer_name: string
          description: string | null
          has_award: boolean | null
          id: string
          institution_id: string
          is_published: boolean | null
          is_showcase: boolean | null
          progress: number | null
          remarks: string | null
          sdg_goals: Json | null
          showcase_image_url: string | null
          start_date: string | null
          status: string
          target_completion_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          award_date?: string | null
          award_description?: string | null
          award_name?: string | null
          category?: string
          created_at?: string | null
          created_by_officer_id: string
          created_by_officer_name: string
          description?: string | null
          has_award?: boolean | null
          id?: string
          institution_id: string
          is_published?: boolean | null
          is_showcase?: boolean | null
          progress?: number | null
          remarks?: string | null
          sdg_goals?: Json | null
          showcase_image_url?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          award_date?: string | null
          award_description?: string | null
          award_name?: string | null
          category?: string
          created_at?: string | null
          created_by_officer_id?: string
          created_by_officer_name?: string
          description?: string | null
          has_award?: boolean | null
          id?: string
          institution_id?: string
          is_published?: boolean | null
          is_showcase?: boolean | null
          progress?: number | null
          remarks?: string | null
          sdg_goals?: Json | null
          showcase_image_url?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_officer_id_fkey"
            columns: ["created_by_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_approval_chain: {
        Row: {
          approver_type: string
          approver_user_id: string
          assigned_at: string | null
          assigned_by: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          position_id: string | null
        }
        Insert: {
          approver_type: string
          approver_user_id: string
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          position_id?: string | null
        }
        Update: {
          approver_type?: string
          approver_user_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_approval_chain_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_approval_chain_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          created_at: string | null
          final_approved_at: string | null
          final_approved_by: string | null
          final_comments: string | null
          id: string
          institution_approved_at: string | null
          institution_approved_by: string | null
          institution_comments: string | null
          institution_id: string
          items: Json
          justification: string | null
          officer_id: string
          priority: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_code: string
          requester_name: string
          status: string | null
          total_estimated_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          final_approved_at?: string | null
          final_approved_by?: string | null
          final_comments?: string | null
          id?: string
          institution_approved_at?: string | null
          institution_approved_by?: string | null
          institution_comments?: string | null
          institution_id: string
          items?: Json
          justification?: string | null
          officer_id: string
          priority?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_code: string
          requester_name: string
          status?: string | null
          total_estimated_cost?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          final_approved_at?: string | null
          final_approved_by?: string | null
          final_comments?: string | null
          id?: string
          institution_approved_at?: string | null
          institution_approved_by?: string | null
          institution_comments?: string | null
          institution_id?: string
          items?: Json
          justification?: string | null
          officer_id?: string
          priority?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_code?: string
          requester_name?: string
          status?: string | null
          total_estimated_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          activities: Json
          assessment_results: string | null
          assessments_completed: string | null
          client_location: string | null
          client_name: string
          created_at: string | null
          created_by: string | null
          generated_pdf_url: string | null
          hours_handled: number | null
          hours_unit: string | null
          id: string
          institution_id: string | null
          is_published: boolean | null
          portion_covered_percentage: number | null
          published_at: string | null
          report_date: string
          report_month: string
          report_type: string
          signatory_designation: string | null
          signatory_name: string | null
          signature_url: string | null
          status: string | null
          trainers: Json
          updated_at: string | null
        }
        Insert: {
          activities?: Json
          assessment_results?: string | null
          assessments_completed?: string | null
          client_location?: string | null
          client_name: string
          created_at?: string | null
          created_by?: string | null
          generated_pdf_url?: string | null
          hours_handled?: number | null
          hours_unit?: string | null
          id?: string
          institution_id?: string | null
          is_published?: boolean | null
          portion_covered_percentage?: number | null
          published_at?: string | null
          report_date?: string
          report_month: string
          report_type?: string
          signatory_designation?: string | null
          signatory_name?: string | null
          signature_url?: string | null
          status?: string | null
          trainers?: Json
          updated_at?: string | null
        }
        Update: {
          activities?: Json
          assessment_results?: string | null
          assessments_completed?: string | null
          client_location?: string | null
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          generated_pdf_url?: string | null
          hours_handled?: number | null
          hours_unit?: string | null
          id?: string
          institution_id?: string | null
          is_published?: boolean | null
          portion_covered_percentage?: number | null
          published_at?: string | null
          report_date?: string
          report_month?: string
          report_type?: string
          signatory_designation?: string | null
          signatory_name?: string | null
          signature_url?: string | null
          status?: string | null
          trainers?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_invoice_numbers: {
        Row: {
          deleted_at: string | null
          deleted_by: string | null
          id: string
          invoice_number: string
          invoice_type: string
          original_invoice_id: string | null
          reason: string | null
        }
        Insert: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          invoice_number: string
          invoice_type: string
          original_invoice_id?: string | null
          reason?: string | null
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          original_invoice_id?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          check_in_address: string | null
          check_in_distance_meters: number | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_time: string | null
          check_in_validated: boolean | null
          check_out_address: string | null
          check_out_distance_meters: number | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_time: string | null
          check_out_validated: boolean | null
          corrected_by: string | null
          correction_reason: string | null
          created_at: string | null
          date: string
          expected_check_in_time: string | null
          expected_check_out_time: string | null
          id: string
          institution_id: string | null
          is_early_checkout: boolean | null
          is_late_login: boolean | null
          is_manual_correction: boolean | null
          late_minutes: number | null
          notes: string | null
          original_check_in_time: string | null
          original_check_out_time: string | null
          overtime_hours: number | null
          position_id: string | null
          status: string | null
          total_hours_worked: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_address?: string | null
          check_in_distance_meters?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_in_validated?: boolean | null
          check_out_address?: string | null
          check_out_distance_meters?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          check_out_validated?: boolean | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string | null
          date?: string
          expected_check_in_time?: string | null
          expected_check_out_time?: string | null
          id?: string
          institution_id?: string | null
          is_early_checkout?: boolean | null
          is_late_login?: boolean | null
          is_manual_correction?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          original_check_in_time?: string | null
          original_check_out_time?: string | null
          overtime_hours?: number | null
          position_id?: string | null
          status?: string | null
          total_hours_worked?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_address?: string | null
          check_in_distance_meters?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string | null
          check_in_validated?: boolean | null
          check_out_address?: string | null
          check_out_distance_meters?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          check_out_validated?: boolean | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string | null
          date?: string
          expected_check_in_time?: string | null
          expected_check_out_time?: string | null
          id?: string
          institution_id?: string | null
          is_early_checkout?: boolean | null
          is_late_login?: boolean | null
          is_manual_correction?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          original_check_in_time?: string | null
          original_check_out_time?: string | null
          overtime_hours?: number | null
          position_id?: string | null
          status?: string | null
          total_hours_worked?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_name: string
          document_type: string
          file_size_mb: number | null
          file_type: string | null
          file_url: string
          id: string
          staff_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_name: string
          document_type: string
          file_size_mb?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          staff_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_name?: string
          document_type?: string
          file_size_mb?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          staff_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          institution_id: string | null
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          institution_id?: string | null
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          institution_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "gamification_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_certificates: {
        Row: {
          activity_id: string | null
          activity_name: string
          activity_type: string
          certificate_url: string | null
          created_at: string | null
          grade: string | null
          id: string
          institution_id: string | null
          issued_date: string | null
          student_id: string
          template_id: string | null
          verification_code: string | null
        }
        Insert: {
          activity_id?: string | null
          activity_name: string
          activity_type: string
          certificate_url?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          institution_id?: string | null
          issued_date?: string | null
          student_id: string
          template_id?: string | null
          verification_code?: string | null
        }
        Update: {
          activity_id?: string | null
          activity_name?: string
          activity_type?: string
          certificate_url?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          institution_id?: string | null
          issued_date?: string | null
          student_id?: string
          template_id?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_certificates_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      student_content_completions: {
        Row: {
          class_assignment_id: string
          completed_at: string | null
          content_id: string
          id: string
          student_id: string
          watch_percentage: number | null
        }
        Insert: {
          class_assignment_id: string
          completed_at?: string | null
          content_id: string
          id?: string
          student_id: string
          watch_percentage?: number | null
        }
        Update: {
          class_assignment_id?: string
          completed_at?: string | null
          content_id?: string
          id?: string
          student_id?: string
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_content_completions_class_assignment_id_fkey"
            columns: ["class_assignment_id"]
            isOneToOne: false
            referencedRelation: "course_class_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_content_completions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_content_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_feedback: {
        Row: {
          admin_response: string | null
          admin_response_at: string | null
          admin_response_by: string | null
          category: string
          created_at: string | null
          feedback_text: string
          id: string
          institution_id: string
          is_anonymous: boolean | null
          rating: number | null
          related_course_id: string | null
          related_officer_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          student_name: string | null
          subject: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_at?: string | null
          admin_response_by?: string | null
          category: string
          created_at?: string | null
          feedback_text: string
          id?: string
          institution_id: string
          is_anonymous?: boolean | null
          rating?: number | null
          related_course_id?: string | null
          related_officer_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          student_name?: string | null
          subject: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          admin_response_at?: string | null
          admin_response_by?: string | null
          category?: string
          created_at?: string | null
          feedback_text?: string
          id?: string
          institution_id?: string
          is_anonymous?: boolean | null
          rating?: number | null
          related_course_id?: string | null
          related_officer_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          student_name?: string | null
          subject?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_feedback_admin_response_by_fkey"
            columns: ["admin_response_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_feedback_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_feedback_related_course_id_fkey"
            columns: ["related_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_feedback_related_officer_id_fkey"
            columns: ["related_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_feedback_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_streaks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_xp_transactions: {
        Row: {
          activity_id: string | null
          activity_type: string
          description: string | null
          earned_at: string | null
          id: string
          institution_id: string | null
          points_earned: number
          student_id: string
        }
        Insert: {
          activity_id?: string | null
          activity_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          institution_id?: string | null
          points_earned: number
          student_id: string
        }
        Update: {
          activity_id?: string | null
          activity_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          institution_id?: string | null
          points_earned?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_xp_transactions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_xp_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          admission_number: string | null
          avatar: string | null
          blood_group: string | null
          class_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          institution_id: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          previous_school: string | null
          roll_number: string | null
          status: string | null
          student_id: string
          student_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          admission_number?: string | null
          avatar?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          institution_id: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          previous_school?: string | null
          roll_number?: string | null
          status?: string | null
          student_id: string
          student_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          admission_number?: string | null
          avatar?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          institution_id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          previous_school?: string | null
          roll_number?: string | null
          status?: string | null
          student_id?: string
          student_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_required: boolean | null
          options: Json | null
          question_text: string
          question_type: string
          scale_max: number | null
          scale_min: number | null
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text: string
          question_type: string
          scale_max?: number | null
          scale_min?: number | null
          survey_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text?: string
          question_type?: string
          scale_max?: number | null
          scale_min?: number | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_response_answers: {
        Row: {
          answer_number: number | null
          answer_options: Json | null
          answer_text: string | null
          created_at: string | null
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_number?: number | null
          answer_options?: Json | null
          answer_text?: string | null
          created_at?: string | null
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_number?: number | null
          answer_options?: Json | null
          answer_text?: string | null
          created_at?: string | null
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_response_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_response_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          institution_id: string
          status: string
          student_id: string
          submitted_at: string | null
          survey_id: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          status?: string
          student_id: string
          submitted_at?: string | null
          survey_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          survey_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_name: string
          deadline: string
          description: string | null
          id: string
          institution_id: string | null
          status: string
          target_audience: string
          target_class_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          created_by_name: string
          deadline: string
          description?: string | null
          id?: string
          institution_id?: string | null
          status?: string
          target_audience?: string
          target_class_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string
          deadline?: string
          description?: string | null
          id?: string
          institution_id?: string | null
          status?: string
          target_audience?: string
          target_class_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configurations: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_configurations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          institution_id: string | null
          ip_address: string | null
          metadata: Json | null
          status: string
          user_agent: string | null
          user_email: string
          user_id: string | null
          user_name: string
          user_role: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          institution_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          status?: string
          user_agent?: string | null
          user_email: string
          user_id?: string | null
          user_name: string
          user_role: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          institution_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          status?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          description: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
          user_name: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          public_url: string
          storage_path: string
          task_id: string
          uploaded_by_id: string
          uploaded_by_name: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          public_url: string
          storage_path: string
          task_id: string
          uploaded_by_id: string
          uploaded_by_name: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          public_url?: string
          storage_path?: string
          task_id?: string
          uploaded_by_id?: string
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          task_id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          task_id: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          approved_at: string | null
          approved_by_id: string | null
          approved_by_name: string | null
          assigned_to_id: string
          assigned_to_name: string
          assigned_to_position: string | null
          assigned_to_role: string | null
          attachments: Json | null
          category: string
          completed_at: string | null
          created_at: string | null
          created_by_id: string | null
          created_by_name: string
          created_by_position: string | null
          description: string
          due_date: string
          due_soon_notified: boolean | null
          id: string
          overdue_notified: boolean | null
          priority: string
          progress_percentage: number | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          assigned_to_id: string
          assigned_to_name: string
          assigned_to_position?: string | null
          assigned_to_role?: string | null
          attachments?: Json | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name: string
          created_by_position?: string | null
          description: string
          due_date: string
          due_soon_notified?: boolean | null
          id?: string
          overdue_notified?: boolean | null
          priority?: string
          progress_percentage?: number | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          assigned_to_id?: string
          assigned_to_name?: string
          assigned_to_position?: string | null
          assigned_to_role?: string | null
          attachments?: Json | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string
          created_by_position?: string | null
          description?: string
          due_date?: string
          due_soon_notified?: boolean | null
          id?: string
          overdue_notified?: boolean | null
          priority?: string
          progress_percentage?: number | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webinars: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          guest_details: string | null
          guest_name: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          webinar_date: string | null
          youtube_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          guest_details?: string | null
          guest_name?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          webinar_date?: string | null
          youtube_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          guest_details?: string | null
          guest_name?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          webinar_date?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
      xp_rules: {
        Row: {
          activity: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          multiplier: number | null
          points: number
        }
        Insert: {
          activity: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          points?: number
        }
        Update: {
          activity?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          points?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_leave_application_to_balance: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      apply_sequential_unlocks: {
        Args: { p_class_module_assignment_id: string }
        Returns: undefined
      }
      can_manage_events: { Args: { _user_id: string }; Returns: boolean }
      can_view_event: {
        Args: { _event_id: string; _status: string; _user_id: string }
        Returns: boolean
      }
      can_view_event_updates: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      check_invoice_number_available: {
        Args: { p_invoice_number: string }
        Returns: {
          available: boolean
          reason: string
        }[]
      }
      generate_invoice_number: {
        Args: { p_invoice_type: string }
        Returns: string
      }
      generate_request_code: {
        Args: { prefix: string; table_name: string }
        Returns: string
      }
      get_leave_balance: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          balance_remaining: number
          carried_forward: number
          casual_leave_used: number
          lop_days: number
          monthly_credit: number
          sick_leave_used: number
          total_available: number
          total_used: number
        }[]
      }
      get_next_id: {
        Args: { p_entity_type: string; p_institution_id: string }
        Returns: number
      }
      get_project_institution_id: {
        Args: { _project_id: string }
        Returns: string
      }
      get_user_institution_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_company_inventory_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_newsletter_downloads: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      initialize_leave_balance: {
        Args: {
          p_month: number
          p_officer_id: string
          p_user_id: string
          p_user_type: string
          p_year: number
        }
        Returns: string
      }
      is_event_assigned_to_user_institution: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_owner: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      reserve_id_range: {
        Args: {
          p_count: number
          p_entity_type: string
          p_institution_id: string
        }
        Returns: {
          end_counter: number
          start_counter: number
        }[]
      }
      students_share_project: {
        Args: { target_student_id: string; viewer_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "system_admin"
        | "management"
        | "officer"
        | "teacher"
        | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "system_admin",
        "management",
        "officer",
        "teacher",
        "student",
      ],
    },
  },
} as const
