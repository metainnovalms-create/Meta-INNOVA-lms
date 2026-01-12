-- Add foreign key constraint for profiles.position_id to positions.id
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_position_id_fkey
FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;