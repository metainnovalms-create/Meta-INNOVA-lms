-- Add gps_checkin_enabled setting to leave_settings table
INSERT INTO public.leave_settings (id, setting_key, setting_value, description)
VALUES (
  gen_random_uuid(),
  'gps_checkin_enabled',
  'true',
  'Enable GPS location verification for check-in/check-out. When disabled, employees can check in/out without GPS validation.'
)
ON CONFLICT (setting_key) DO NOTHING;