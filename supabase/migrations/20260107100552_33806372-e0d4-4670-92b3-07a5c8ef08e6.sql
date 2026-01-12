-- Allow authenticated users to read platform_settings for maintenance mode check
CREATE POLICY "Authenticated users can read platform settings" 
ON public.system_configurations 
FOR SELECT 
TO authenticated
USING (key = 'platform_settings');