-- Ensure security definer helpers bypass RLS to avoid recursion

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
SET row_security TO off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_institution_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
SET row_security TO off
AS $$
  SELECT COALESCE(
    (SELECT institution_id FROM public.profiles WHERE id = _user_id LIMIT 1),
    (SELECT assigned_institutions[1] FROM public.officers WHERE user_id = _user_id LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_events(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
SET row_security TO off
AS $$
  SELECT (
    public.has_role(_user_id, 'super_admin'::public.app_role)
    OR public.has_role(_user_id, 'system_admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = _user_id
        AND is_ceo = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.positions pos ON pos.id = p.position_id
      WHERE p.id = _user_id
        AND pos.is_ceo_position = true
    )
  );
$$;