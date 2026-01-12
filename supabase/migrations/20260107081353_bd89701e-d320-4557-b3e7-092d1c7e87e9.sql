-- Insert default Ask Metova AI settings if not exists
INSERT INTO system_configurations (key, value, category, description)
VALUES (
  'ask_metova_settings',
  '{"enabled": true, "custom_api_key": "", "model": "gpt-4o-mini"}',
  'features',
  'Ask Metova AI integration settings - toggle, API key, model selection'
)
ON CONFLICT (key) DO NOTHING;