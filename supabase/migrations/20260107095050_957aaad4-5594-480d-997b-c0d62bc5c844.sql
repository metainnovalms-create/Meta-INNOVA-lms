-- Insert platform settings configuration
INSERT INTO system_configurations (key, value, category, description)
VALUES (
  'platform_settings',
  '{"maintenance_mode": false, "maintenance_message": "System is under maintenance. Please check back later.", "session_timeout_enabled": true, "session_timeout_minutes": 30}',
  'platform',
  'Platform-wide settings for maintenance mode and session management'
) ON CONFLICT (key) DO NOTHING;

-- Enable realtime for system_configurations
ALTER PUBLICATION supabase_realtime ADD TABLE system_configurations;