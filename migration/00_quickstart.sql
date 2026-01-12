-- ============================================
-- QUICK START: Run these commands in order
-- ============================================

-- Step 1: Create app_role enum
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('super_admin','system_admin','management','officer','student'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 2: Note - For full schema, you need to export from current project using:
-- pg_dump -h db.ftadmxcxzhptngqbbqpk.supabase.co -U postgres -d postgres --schema-only --no-owner > schema.sql
-- Then run that schema.sql in your new project

-- Step 3: After schema, run 03_functions.sql
-- Step 4: After functions, run 04_triggers.sql  
-- Step 5: After triggers, run 05_rls_policies.sql (export from current project)
-- Step 6: Run 06_storage.sql
-- Step 7: Run 07_realtime.sql

-- ============================================
-- To export full schema from current project:
-- ============================================
-- 
-- Option 1: Use Supabase Dashboard
-- Go to Database > Backups > Download backup
--
-- Option 2: Use pg_dump
-- Connection string: postgresql://postgres:[PASSWORD]@db.ftadmxcxzhptngqbbqpk.supabase.co:5432/postgres
-- pg_dump --schema-only --no-owner --file=schema.sql
--
-- Option 3: Use Supabase CLI
-- supabase db dump --schema-only > schema.sql
