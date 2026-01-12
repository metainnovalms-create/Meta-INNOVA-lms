-- Create function to sync profile avatar to students and officers tables
CREATE OR REPLACE FUNCTION sync_profile_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if avatar actually changed
  IF OLD.avatar IS DISTINCT FROM NEW.avatar THEN
    -- Update students table where email matches
    UPDATE students SET avatar = NEW.avatar WHERE email = NEW.email;
    
    -- Update officers table where email matches
    UPDATE officers SET profile_photo_url = NEW.avatar WHERE email = NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sync avatar on profile update
DROP TRIGGER IF EXISTS on_profile_avatar_update ON profiles;
CREATE TRIGGER on_profile_avatar_update
AFTER UPDATE OF avatar ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_avatar();