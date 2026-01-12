-- Create password reset tokens table for custom Resend-based password resets
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Index for cleanup queries
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS - only backend functions can access this table
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed as this will only be accessed by service role in edge functions