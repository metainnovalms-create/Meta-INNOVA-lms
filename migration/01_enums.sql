-- ============================================
-- Meta-INNOVA LMS - Enum Types
-- Run this FIRST before creating tables
-- ============================================

-- Create the app_role enum type for user roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM (
        'super_admin',
        'system_admin',
        'management',
        'officer',
        'student'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant usage on enum type
GRANT USAGE ON TYPE public.app_role TO anon, authenticated, service_role;
