-- Gamification Badges (configurable badge types)
CREATE TABLE gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Award',
  category TEXT NOT NULL DEFAULT 'achievement', -- achievement, participation, excellence, milestone
  unlock_criteria JSONB NOT NULL DEFAULT '{}',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- XP Rules (points for activities)
CREATE TABLE xp_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity TEXT NOT NULL UNIQUE, -- session_attendance, assessment_completion, project_submission, course_completion, module_completion, perfect_score, daily_login, early_submission
  points INTEGER NOT NULL DEFAULT 10,
  multiplier NUMERIC DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student XP Transactions (log of XP earned)
CREATE TABLE student_xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id),
  activity_type TEXT NOT NULL,
  activity_id UUID,
  points_earned INTEGER NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Student Badges (badges earned by students)
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES gamification_badges(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Student Streaks (login/activity streaks)
CREATE TABLE student_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leaderboard Configs (per institution settings)
CREATE TABLE leaderboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL UNIQUE REFERENCES institutions(id) ON DELETE CASCADE,
  scope TEXT DEFAULT 'institution', -- institution, class, course
  time_period TEXT DEFAULT 'all_time', -- all_time, monthly, weekly
  top_n_display INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  reset_schedule TEXT, -- none, weekly, monthly
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Certificate Templates (stored in database)
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'course', -- course, module, assessment, event
  template_image_url TEXT,
  default_width INTEGER DEFAULT 1200,
  default_height INTEGER DEFAULT 900,
  name_position JSONB DEFAULT '{"x": 600, "y": 450, "fontSize": 48, "color": "#1e3a8a", "fontFamily": "serif"}',
  date_position JSONB DEFAULT '{"x": 600, "y": 520, "fontSize": 24, "color": "#374151"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Student Certificates (issued certificates)
CREATE TABLE student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES certificate_templates(id),
  activity_type TEXT NOT NULL, -- course, module, assessment, event
  activity_id UUID,
  activity_name TEXT NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  issued_date TIMESTAMPTZ DEFAULT now(),
  certificate_url TEXT,
  verification_code TEXT UNIQUE,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_student_xp_student ON student_xp_transactions(student_id);
CREATE INDEX idx_student_xp_institution ON student_xp_transactions(institution_id);
CREATE INDEX idx_student_xp_earned_at ON student_xp_transactions(earned_at DESC);
CREATE INDEX idx_student_badges_student ON student_badges(student_id);
CREATE INDEX idx_student_certificates_student ON student_certificates(student_id);
CREATE INDEX idx_student_certificates_verification ON student_certificates(verification_code);

-- Enable RLS on all tables
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gamification_badges
CREATE POLICY "Anyone can view active badges" ON gamification_badges FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage badges" ON gamification_badges FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage badges" ON gamification_badges FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for xp_rules
CREATE POLICY "Anyone authenticated can view xp rules" ON xp_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admins can manage xp rules" ON xp_rules FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage xp rules" ON xp_rules FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for student_xp_transactions
CREATE POLICY "Students can view own xp" ON student_xp_transactions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Officers can view institution xp" ON student_xp_transactions FOR SELECT USING (
  has_role(auth.uid(), 'officer') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Management can view institution xp" ON student_xp_transactions FOR SELECT USING (
  has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Super admins can manage all xp" ON student_xp_transactions FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage all xp" ON student_xp_transactions FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for student_badges
CREATE POLICY "Students can view own badges" ON student_badges FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Officers can view institution badges" ON student_badges FOR SELECT USING (
  has_role(auth.uid(), 'officer') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Management can view institution badges" ON student_badges FOR SELECT USING (
  has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Super admins can manage all badges" ON student_badges FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage all badges" ON student_badges FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for student_streaks
CREATE POLICY "Students can view own streak" ON student_streaks FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update own streak" ON student_streaks FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Super admins can manage streaks" ON student_streaks FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage streaks" ON student_streaks FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for leaderboard_configs
CREATE POLICY "Anyone can view public leaderboards" ON leaderboard_configs FOR SELECT USING (is_public = true);
CREATE POLICY "Management can manage own institution leaderboard" ON leaderboard_configs FOR ALL USING (
  has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Super admins can manage leaderboards" ON leaderboard_configs FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage leaderboards" ON leaderboard_configs FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for certificate_templates
CREATE POLICY "Anyone can view active templates" ON certificate_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage templates" ON certificate_templates FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage templates" ON certificate_templates FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- RLS Policies for student_certificates
CREATE POLICY "Students can view own certificates" ON student_certificates FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Officers can view institution certificates" ON student_certificates FOR SELECT USING (
  has_role(auth.uid(), 'officer') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Management can view institution certificates" ON student_certificates FOR SELECT USING (
  has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid())
);
CREATE POLICY "Super admins can manage certificates" ON student_certificates FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System admins can manage certificates" ON student_certificates FOR ALL USING (has_role(auth.uid(), 'system_admin'));

-- Insert default XP rules
INSERT INTO xp_rules (activity, points, multiplier, description, is_active) VALUES
  ('session_attendance', 10, 1.0, 'Points for attending a session', true),
  ('assessment_completion', 50, 1.0, 'Points for completing an assessment', true),
  ('project_submission', 100, 1.0, 'Points for submitting a project', true),
  ('course_completion', 200, 1.0, 'Points for completing a full course', true),
  ('module_completion', 100, 1.0, 'Points for completing a module', true),
  ('perfect_score', 150, 1.0, 'Bonus points for getting 100% on assessment', true),
  ('daily_login', 5, 1.0, 'Points for daily login', true),
  ('early_submission', 25, 1.0, 'Bonus points for submitting before deadline', true);

-- Insert default badges
INSERT INTO gamification_badges (name, description, icon, category, unlock_criteria, xp_reward, is_active) VALUES
  ('First Steps', 'Complete your first session', 'Footprints', 'milestone', '{"type": "sessions", "threshold": 1}', 50, true),
  ('Weekly Warrior', 'Login for 7 consecutive days', 'Flame', 'participation', '{"type": "streak", "threshold": 7}', 100, true),
  ('Perfect Attendance', 'Attend 30 consecutive sessions', 'Calendar', 'participation', '{"type": "attendance", "threshold": 30}', 200, true),
  ('Assessment Master', 'Score 90%+ in 5 assessments', 'Trophy', 'excellence', '{"type": "assessments", "threshold": 5, "minScore": 90}', 300, true),
  ('Project Pioneer', 'Submit your first project', 'Rocket', 'milestone', '{"type": "projects", "threshold": 1}', 100, true),
  ('Course Champion', 'Complete a full course', 'Crown', 'achievement', '{"type": "courses", "threshold": 1}', 500, true),
  ('Knowledge Seeker', 'Earn 1000 XP points', 'Star', 'milestone', '{"type": "points", "threshold": 1000}', 150, true),
  ('Rising Star', 'Earn 5000 XP points', 'Sparkles', 'excellence', '{"type": "points", "threshold": 5000}', 300, true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE student_xp_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE student_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE student_streaks;

-- Add updated_at trigger for student_streaks
CREATE TRIGGER update_student_streaks_updated_at
  BEFORE UPDATE ON student_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for leaderboard_configs  
CREATE TRIGGER update_leaderboard_configs_updated_at
  BEFORE UPDATE ON leaderboard_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();