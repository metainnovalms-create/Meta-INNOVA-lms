# Meta-INNOVA LMS - Complete Migration Guide

This guide helps you migrate your entire backend from Lovable Cloud to your client's Supabase account.

## Prerequisites

Before starting, ensure your client has:
1. A Supabase account at [supabase.com](https://supabase.com)
2. A new Supabase project created
3. Access to the Supabase Dashboard for that project
4. The following credentials from the new project:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key
   - Service Role Key (for edge functions)

---

## Migration Overview

| Component | Count | Notes |
|-----------|-------|-------|
| Database Tables | 103 tables | Full schema with relationships |
| Database Functions | 30+ functions | Custom business logic |
| RLS Policies | 128+ policies | Security rules |
| Edge Functions | 15 functions | User management, certificates, AI, etc. |
| Storage Buckets | 15 buckets | Files, images, documents |
| Realtime Tables | 16 tables | Live updates enabled |

---

## Step 1: Run Database Schema Migration

1. Go to your new Supabase project's **SQL Editor**
2. Run the SQL files in this order:
   - `01_enums.sql` - Custom enum types (app_role)
   - `02_schema.sql` - All 103 tables (run in batches if needed)
   - `03_functions.sql` - All database functions
   - `04_triggers.sql` - All triggers
   - `05_rls_policies.sql` - All RLS policies
   - `06_storage.sql` - Storage buckets and policies
   - `07_realtime.sql` - Enable realtime on tables

**Important:** If you get errors about existing objects, you may need to drop them first or run `DROP TABLE IF EXISTS` commands.

---

## Step 2: Deploy Edge Functions

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to new project:**
   ```bash
   supabase link --project-ref YOUR_NEW_PROJECT_ID
   ```

4. **Copy edge functions folder:**
   Copy the entire `supabase/functions/` folder from this project to your local setup.

5. **Deploy all functions:**
   ```bash
   supabase functions deploy seed-admin
   supabase functions deploy create-institution-admin
   supabase functions deploy create-officer-user
   supabase functions deploy create-student-user
   supabase functions deploy reset-institution-admin-password
   supabase functions deploy set-user-password
   supabase functions deploy admin-user-management
   supabase functions deploy check-task-reminders
   supabase functions deploy delete-institution-cascade
   supabase functions deploy delete-class-cascade
   supabase functions deploy download-newsletter
   supabase functions deploy issue-completion-certificates
   supabase functions deploy ask-metova
   supabase functions deploy send-password-reset
   supabase functions deploy verify-reset-token
   ```

### Option B: Manual Upload via Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Create a new function**
3. For each function, copy the code from `supabase/functions/{function-name}/index.ts`
4. Set `verify_jwt = false` for all functions in the function settings

---

## Step 3: Configure Edge Function Secrets

In your new Supabase Dashboard, go to **Edge Functions > Secrets** and add:

| Secret Name | Value | Required For |
|-------------|-------|--------------|
| `SUPABASE_URL` | Your new project URL | All functions |
| `SUPABASE_ANON_KEY` | Your new anon key | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Your new service role key | All functions |
| `RESEND_API_KEY` | Your Resend.com API key | Email functions |
| `OPENAI_API_KEY` | Your OpenAI API key | AI assistant (ask-metova) |

---

## Step 4: Create CEO/Admin Account

After deploying edge functions, call the `seed-admin` function to create the initial admin:

```bash
curl -X POST https://YOUR_NEW_PROJECT.supabase.co/functions/v1/seed-admin
```

This creates:
- **Email:** `ceo@metasagealliance.com`
- **Password:** `ChangeMe@2025!`
- **Role:** `system_admin`
- **Profile:** CEO - MetaSage Alliance

⚠️ **Important:** The user should change this password immediately after first login!

---

## Step 5: Configure Authentication Settings

In the new Supabase Dashboard:
1. Go to **Authentication > Providers**
2. Enable Email provider
3. Set **Confirm email** → **OFF** (auto-confirm signups)
4. Go to **Authentication > URL Configuration**
5. Add your Vercel domain to **Site URL** and **Redirect URLs**

---

## Step 6: Update Frontend Configuration

### For Vercel Deployment

Set these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_NEW_PROJECT.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your new anon key |
| `VITE_SUPABASE_PROJECT_ID` | Your new project ID |
| `VITE_API_BASE_URL` | Your API URL (if applicable) |
| `VITE_APP_NAME` | `Meta-INNOVA LMS` |

### For Local Development

Update `.env` file:
```env
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_new_anon_key"
VITE_SUPABASE_PROJECT_ID="your_new_project_id"
VITE_API_BASE_URL="your_api_url"
VITE_APP_NAME="Meta-INNOVA LMS"
```

---

## Step 7: Data Migration (Optional)

If you need to migrate existing data:

### Export Data from Current Project

```bash
# Using pg_dump
pg_dump -h db.ftadmxcxzhptngqbbqpk.supabase.co -U postgres -d postgres --data-only > data.sql
```

### Import Data to New Project

```bash
# Using psql
psql -h db.YOUR_NEW_PROJECT.supabase.co -U postgres -d postgres < data.sql
```

⚠️ **Note:** User passwords cannot be migrated. Users will need to reset their passwords.

---

## Step 8: Verify Migration

Test the following:

- [ ] Login with CEO account (`ceo@metasagealliance.com` / `ChangeMe@2025!`)
- [ ] Create a test institution
- [ ] Create a test student/officer
- [ ] Upload a file to storage
- [ ] Test realtime updates (tasks, notifications)
- [ ] Test AI assistant (Ask Metova)
- [ ] Test password reset flow

---

## Edge Functions Reference

| Function | Purpose | Required Secrets |
|----------|---------|------------------|
| `seed-admin` | Create initial CEO account | SERVICE_ROLE_KEY |
| `create-institution-admin` | Create institution admin users | SERVICE_ROLE_KEY |
| `create-officer-user` | Create officer accounts | SERVICE_ROLE_KEY |
| `create-student-user` | Create student accounts | SERVICE_ROLE_KEY |
| `reset-institution-admin-password` | Reset admin passwords | SERVICE_ROLE_KEY |
| `set-user-password` | Set user passwords | SERVICE_ROLE_KEY |
| `admin-user-management` | Manage users | SERVICE_ROLE_KEY |
| `check-task-reminders` | Send task notifications | SERVICE_ROLE_KEY |
| `delete-institution-cascade` | Delete institution + related data | SERVICE_ROLE_KEY |
| `delete-class-cascade` | Delete class + related data | SERVICE_ROLE_KEY |
| `download-newsletter` | Download newsletter PDFs | SERVICE_ROLE_KEY |
| `issue-completion-certificates` | Generate certificates | SERVICE_ROLE_KEY |
| `ask-metova` | AI assistant | OPENAI_API_KEY |
| `send-password-reset` | Send reset emails | RESEND_API_KEY |
| `verify-reset-token` | Verify reset tokens | SERVICE_ROLE_KEY |

---

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure all tables have RLS enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
   - Run the RLS policies SQL after tables are created

2. **Edge Function 500 Errors**
   - Check if all secrets are configured
   - Delete `deno.lock` file if present and redeploy

3. **Auth Issues**
   - Verify auto-confirm email is enabled
   - Check redirect URLs in Authentication settings

4. **Realtime Not Working**
   - Ensure tables are added to realtime publication
   - Run the realtime SQL script

---

## Support

For issues with:
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **This App:** Contact the development team

---

**Last Updated:** January 2026
