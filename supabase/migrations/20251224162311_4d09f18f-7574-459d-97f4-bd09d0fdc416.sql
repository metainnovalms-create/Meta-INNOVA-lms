-- Update get_user_institution_id to check officers.assigned_institutions as fallback
CREATE OR REPLACE FUNCTION public.get_user_institution_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    -- First try profiles.institution_id
    (SELECT institution_id FROM public.profiles WHERE id = _user_id LIMIT 1),
    -- Fallback: for officers, get first assigned institution
    (SELECT assigned_institutions[1] FROM public.officers WHERE user_id = _user_id LIMIT 1)
  )
$$;

-- Backfill: Update profiles.institution_id for officers where it's NULL but they have assigned_institutions
UPDATE public.profiles p
SET institution_id = o.assigned_institutions[1]
FROM public.officers o
WHERE p.id = o.user_id
  AND p.institution_id IS NULL
  AND o.assigned_institutions IS NOT NULL
  AND array_length(o.assigned_institutions, 1) > 0;