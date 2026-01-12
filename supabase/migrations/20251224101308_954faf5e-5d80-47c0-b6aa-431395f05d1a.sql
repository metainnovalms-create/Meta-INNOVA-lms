-- Add management role for tushar@gmail.com who has no role assigned
INSERT INTO public.user_roles (user_id, role)
VALUES ('7b377a85-38f7-455c-a143-e83994351aea', 'management')
ON CONFLICT (user_id, role) DO NOTHING;

-- Link the institution to this admin user
UPDATE public.institutions 
SET admin_user_id = '7b377a85-38f7-455c-a143-e83994351aea'
WHERE id = '90b02536-401c-40c7-a389-eee8df4dd4e0';