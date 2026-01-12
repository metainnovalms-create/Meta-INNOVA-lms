-- ========================================
-- MIGRATION 1: Core Types and User Roles Table
-- ========================================

-- Create role enum for all 6 roles
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 
  'system_admin', 
  'management', 
  'officer', 
  'teacher', 
  'student'
);

-- User Roles Table (SECURITY CRITICAL - separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security Definer Function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ========================================
-- MIGRATION 2: Institutions Table
-- ========================================

CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  type TEXT DEFAULT 'school',
  address JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- MIGRATION 3: Profiles Table
-- ========================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  institution_id UUID REFERENCES public.institutions(id),
  class_id UUID,
  position_id TEXT,
  position_name TEXT,
  is_ceo BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10,2),
  overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
  normal_working_hours INTEGER DEFAULT 8,
  password_changed BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- MIGRATION 4: RLS Policies
-- ========================================

-- USER_ROLES POLICIES
-- Users can see their own role
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Super admins can view all roles
CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- System admins can view all roles
CREATE POLICY "System admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'));

-- Super admins can insert roles
CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- System admins can insert roles (except super_admin)
CREATE POLICY "System admins can insert non-super roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'system_admin') 
    AND role != 'super_admin'
  );

-- Super admins can update roles
CREATE POLICY "Super admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can delete roles
CREATE POLICY "Super admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'system_admin')
  );

-- Management can view profiles in their institution
CREATE POLICY "Management can view institution profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'management') AND
    institution_id IN (SELECT institution_id FROM public.profiles WHERE id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'system_admin')
  );

-- INSTITUTIONS POLICIES
-- Admins can view all institutions
CREATE POLICY "Admins can view all institutions" ON public.institutions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'system_admin')
  );

-- Users can view their own institution
CREATE POLICY "Users can view own institution" ON public.institutions
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT institution_id FROM public.profiles WHERE id = auth.uid())
  );

-- Only super_admin can insert institutions
CREATE POLICY "Super admins can insert institutions" ON public.institutions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Only super_admin can update institutions
CREATE POLICY "Super admins can update institutions" ON public.institutions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Only super_admin can delete institutions
CREATE POLICY "Super admins can delete institutions" ON public.institutions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));