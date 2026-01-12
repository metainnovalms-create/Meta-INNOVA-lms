-- Add streak milestone badges
INSERT INTO gamification_badges (name, description, icon, category, unlock_criteria, xp_reward, is_active)
VALUES 
  ('Week Warrior', 'Login for 7 consecutive days', '🔥', 'milestone', 
   '{"type": "streak", "threshold": 7, "description": "Maintain a 7-day login streak"}'::jsonb, 50, true),
  ('Monthly Champion', 'Login for 30 consecutive days', '⚡', 'milestone', 
   '{"type": "streak", "threshold": 30, "description": "Maintain a 30-day login streak"}'::jsonb, 150, true),
  ('Century Legend', 'Login for 100 consecutive days', '🏆', 'milestone', 
   '{"type": "streak", "threshold": 100, "description": "Maintain a 100-day login streak"}'::jsonb, 500, true)
ON CONFLICT DO NOTHING;