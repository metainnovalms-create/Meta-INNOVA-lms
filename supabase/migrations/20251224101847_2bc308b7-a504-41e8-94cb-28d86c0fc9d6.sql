-- Update default values for new profiles
ALTER TABLE profiles 
  ALTER COLUMN must_change_password SET DEFAULT false,
  ALTER COLUMN password_changed SET DEFAULT true;

-- Update existing records to not require password change
UPDATE profiles SET must_change_password = false WHERE must_change_password = true;
UPDATE profiles SET password_changed = true WHERE password_changed = false OR password_changed IS NULL;