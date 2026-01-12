-- Delete old XP rules and insert new simplified ones
DELETE FROM xp_rules;

INSERT INTO xp_rules (activity, points, description, is_active) VALUES
('assessment_completion', 10, 'Points for completing an assessment', true),
('assessment_pass', 25, 'Points for passing an assessment', true),
('assessment_perfect_score', 25, 'Bonus points for scoring 100% in assessment', true),
('level_completion', 100, 'Points for completing a level and earning certificate', true),
('project_membership', 100, 'Points for being part of a project team', true),
('project_award', 150, 'Points when project receives an award or achievement', true),
('session_attendance', 5, 'Points for attending each session', true);

-- Add award fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS has_award BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS award_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS award_description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS award_date DATE;

-- Delete old badges and insert new simplified ones based on XP activities
DELETE FROM gamification_badges;

INSERT INTO gamification_badges (name, description, icon, category, unlock_criteria, xp_reward, is_active) VALUES
('First Assessment', 'Complete your first assessment', '📝', 'achievement', '{"type": "custom", "threshold": 1, "description": "Complete 1 assessment"}', 10, true),
('Assessment Ace', 'Pass 5 assessments', '🎯', 'achievement', '{"type": "custom", "threshold": 5, "description": "Pass 5 assessments"}', 50, true),
('Perfect Scorer', 'Score 100% on 3 assessments', '💯', 'excellence', '{"type": "custom", "threshold": 3, "description": "Get 100% on 3 assessments"}', 75, true),
('Level Master', 'Complete 3 levels with certificates', '🎓', 'milestone', '{"type": "custom", "threshold": 3, "description": "Complete 3 levels"}', 100, true),
('Team Player', 'Join a project team', '👥', 'participation', '{"type": "custom", "threshold": 1, "description": "Be part of a project team"}', 50, true),
('Award Winner', 'Be part of an awarded project', '🏆', 'excellence', '{"type": "custom", "threshold": 1, "description": "Project receives an award"}', 100, true),
('Attendance Star', 'Attend 20 sessions', '⭐', 'participation', '{"type": "attendance", "threshold": 20, "description": "Attend 20 sessions"}', 50, true),
('Rising Star', 'Earn 500 total XP', '🌟', 'milestone', '{"type": "points", "threshold": 500, "description": "Earn 500 XP"}', 75, true),
('Champion', 'Earn 1000 total XP', '👑', 'milestone', '{"type": "points", "threshold": 1000, "description": "Earn 1000 XP"}', 150, true);