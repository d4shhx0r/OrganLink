-- ==============================================================================
-- OrganLink: Profiles Schema & Row-Level Security (RLS) Migration
-- ==============================================================================

-- 1. Create Role Enum Type
CREATE TYPE public.app_role AS ENUM ('admin', 'hospital', 'donor', 'recipient');

-- 2. Create Profiles Table referencing auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'donor',
  avatar_url TEXT,
  phone TEXT,
  blood_group TEXT,
  hospital_id UUID,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Helper Function: Check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 5. RLS Policies for Profiles
-- Policy A: Authenticated users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy B: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy C: Users can update their own profile (non-role fields)
-- Prevent role escalation by ensuring user cannot change their own role unless admin
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- If user is admin, allow any role update; otherwise role must remain unchanged
      public.is_admin()
      OR role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- Policy D: Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Updated At Automatic Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Trigger to automatically create a profile row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'donor'::public.app_role),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

-- Register trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
-- ==============================================================================
-- OrganLink Phase 2: Core Data Module & Cryptographic Audit Schema
-- Based on research workflow: "An Implementation Perspective of Blockchain Technology
-- in Leveraging Organ Donation in a Transparent Mode to both Patients and Donors"
-- ==============================================================================

-- 1. DONORS TABLE
CREATE TABLE IF NOT EXISTS public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_reference TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  tissue_type TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_information TEXT,
  medical_status TEXT NOT NULL DEFAULT 'pending_review' 
    CHECK (medical_status IN ('pending_review', 'eligible_for_review', 'not_currently_eligible')),
  consent_status TEXT NOT NULL DEFAULT 'provided' 
    CHECK (consent_status IN ('pending', 'provided', 'withdrawn')),
  approval_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Donors Indexes for efficient queries and Phase 3 matching
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON public.donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_tissue_type ON public.donors(tissue_type);
CREATE INDEX IF NOT EXISTS idx_donors_approval_status ON public.donors(approval_status);
CREATE INDEX IF NOT EXISTS idx_donors_profile_id ON public.donors(profile_id);


-- 2. RECIPIENTS / PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_reference TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  tissue_type TEXT NOT NULL,
  required_organ TEXT NOT NULL 
    CHECK (required_organ IN ('kidney', 'liver', 'heart', 'lung', 'cornea')),
  location TEXT NOT NULL,
  medical_urgency TEXT NOT NULL DEFAULT 'routine' 
    CHECK (medical_urgency IN ('status_1_critical', 'status_2_urgent', 'routine')),
  waiting_since TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'matched', 'transplanted', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Recipients Indexes for future matching engine
CREATE INDEX IF NOT EXISTS idx_recipients_blood_group ON public.recipients(blood_group);
CREATE INDEX IF NOT EXISTS idx_recipients_tissue_type ON public.recipients(tissue_type);
CREATE INDEX IF NOT EXISTS idx_recipients_required_organ ON public.recipients(required_organ);
CREATE INDEX IF NOT EXISTS idx_recipients_medical_urgency ON public.recipients(medical_urgency);
CREATE INDEX IF NOT EXISTS idx_recipients_waiting_since ON public.recipients(waiting_since);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON public.recipients(status);
CREATE INDEX IF NOT EXISTS idx_recipients_profile_id ON public.recipients(profile_id);


-- 3. ORGANS TABLE
CREATE TABLE IF NOT EXISTS public.organs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organ_reference TEXT UNIQUE NOT NULL,
  organ_type TEXT NOT NULL 
    CHECK (organ_type IN ('kidney', 'liver', 'heart', 'lung', 'cornea')),
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE RESTRICT,
  blood_group TEXT NOT NULL,
  tissue_type TEXT NOT NULL,
  location TEXT NOT NULL,
  availability_status TEXT NOT NULL DEFAULT 'available' 
    CHECK (availability_status IN ('available', 'reserved', 'allocated', 'transplanted', 'unavailable')),
  available_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expiry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Organs Indexes for matching engine
CREATE INDEX IF NOT EXISTS idx_organs_organ_type ON public.organs(organ_type);
CREATE INDEX IF NOT EXISTS idx_organs_availability ON public.organs(availability_status);
CREATE INDEX IF NOT EXISTS idx_organs_blood_group ON public.organs(blood_group);
CREATE INDEX IF NOT EXISTS idx_organs_tissue_type ON public.organs(tissue_type);
CREATE INDEX IF NOT EXISTS idx_organs_donor_id ON public.organs(donor_id);


-- 4. TAMPER-EVIDENT CRYPTOGRAPHIC AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  previous_hash TEXT,
  current_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);


-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- 6. HELPER FUNCTIONS FOR ROLE VERIFICATION
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_hospital_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hospital')
  );
$$;


-- 7. RLS POLICIES FOR DONORS
-- A: Hospital and Admin can select all donors
CREATE POLICY "Hospital/Admin can view all donors"
  ON public.donors FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

-- B: Donor users can only view their own donor registration
CREATE POLICY "Donors can view own registration"
  ON public.donors FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- C: Donors can insert their own record; Hospital/Admin can insert donors
CREATE POLICY "Authorized insert on donors"
  ON public.donors FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_hospital_or_admin() 
    OR (profile_id = auth.uid() AND approval_status = 'pending')
  );

-- D: Donors can update their own contact details (cannot alter approval_status!)
CREATE POLICY "Donors can update own contact details"
  ON public.donors FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() AND NOT public.is_hospital_or_admin())
  WITH CHECK (
    profile_id = auth.uid()
    AND approval_status = (SELECT d.approval_status FROM public.donors d WHERE d.id = donors.id)
  );

-- E: Hospital and Admin can update donor approval, medical status, and records
CREATE POLICY "Hospital/Admin can update donors"
  ON public.donors FOR UPDATE
  TO authenticated
  USING (public.is_hospital_or_admin())
  WITH CHECK (public.is_hospital_or_admin());


-- 8. RLS POLICIES FOR RECIPIENTS / PATIENTS
-- A: Hospital/Admin can view all recipients
CREATE POLICY "Hospital/Admin can view all recipients"
  ON public.recipients FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

-- B: Recipient users can view own record
CREATE POLICY "Recipients can view own record"
  ON public.recipients FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- C: Authorized insert on recipients
CREATE POLICY "Authorized insert on recipients"
  ON public.recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_hospital_or_admin()
    OR (profile_id = auth.uid())
  );

-- D: Recipients update own record
CREATE POLICY "Recipients can update own record"
  ON public.recipients FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() AND NOT public.is_hospital_or_admin())
  WITH CHECK (profile_id = auth.uid());

-- E: Hospital/Admin update recipients
CREATE POLICY "Hospital/Admin can update recipients"
  ON public.recipients FOR UPDATE
  TO authenticated
  USING (public.is_hospital_or_admin())
  WITH CHECK (public.is_hospital_or_admin());


-- 9. RLS POLICIES FOR ORGANS
-- A: Hospital/Admin can view all organs
CREATE POLICY "Hospital/Admin can view all organs"
  ON public.organs FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

-- B: Donors can view organs associated with their donor ID
CREATE POLICY "Donors can view their own donated organs"
  ON public.organs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.donors
      WHERE donors.id = organs.donor_id AND donors.profile_id = auth.uid()
    )
  );

-- C: Only Hospital/Admin can insert organs
CREATE POLICY "Hospital/Admin can register organs"
  ON public.organs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hospital_or_admin());

-- D: Only Hospital/Admin can update organs
CREATE POLICY "Hospital/Admin can update organs"
  ON public.organs FOR UPDATE
  TO authenticated
  USING (public.is_hospital_or_admin())
  WITH CHECK (public.is_hospital_or_admin());


-- 10. RLS POLICIES FOR AUDIT LOGS (APPEND-ONLY)
-- A: Hospital/Admin can view audit logs
CREATE POLICY "Hospital/Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

-- B: Authenticated users can insert audit records for actions they perform
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- C: NO UPDATE POLICY AND NO DELETE POLICY!
-- Audit logs are strictly immutable and append-only from both client and API roles.


-- 11. AUTOMATIC UPDATED_AT TRIGGERS
CREATE TRIGGER on_donors_updated
  BEFORE UPDATE ON public.donors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_recipients_updated
  BEFORE UPDATE ON public.recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_organs_updated
  BEFORE UPDATE ON public.organs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- ==============================================================================
-- OrganLink Phase 3: Transparent Donor-Recipient Matching Engine Schema
-- Research Prototype: Persists algorithm runs, candidate evaluations, and human reviews
-- ==============================================================================

-- 1. MATCHING RUNS TABLE
CREATE TABLE IF NOT EXISTS public.matching_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organ_id UUID NOT NULL REFERENCES public.organs(id) ON DELETE CASCADE,
  executed_by UUID NOT NULL REFERENCES auth.users(id),
  algorithm_version TEXT NOT NULL,
  configuration JSONB NOT NULL,
  candidate_count INT NOT NULL DEFAULT 0,
  eligible_count INT NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_matching_runs_organ ON public.matching_runs(organ_id);
CREATE INDEX IF NOT EXISTS idx_matching_runs_generated_at ON public.matching_runs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_matching_runs_executed_by ON public.matching_runs(executed_by);


-- 2. MATCHING RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.matching_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_run_id UUID NOT NULL REFERENCES public.matching_runs(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
  eligible BOOLEAN NOT NULL,
  score NUMERIC(5, 2),
  factor_breakdown JSONB NOT NULL,
  exclusion_reason TEXT,
  rank INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_matching_results_run ON public.matching_results(matching_run_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_recipient ON public.matching_results(recipient_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_rank ON public.matching_results(matching_run_id, rank);


-- 3. MATCHING REVIEWS TABLE (Human Review Boundary)
CREATE TABLE IF NOT EXISTS public.matching_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_run_id UUID NOT NULL REFERENCES public.matching_runs(id) ON DELETE CASCADE,
  selected_recipient_id UUID REFERENCES public.recipients(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  decision TEXT NOT NULL 
    CHECK (decision IN ('reviewed', 'selected_for_research_demo', 'not_selected_for_research_demo')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_matching_reviews_run ON public.matching_reviews(matching_run_id);
CREATE INDEX IF NOT EXISTS idx_matching_reviews_reviewer ON public.matching_reviews(reviewer_id);


-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.matching_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_reviews ENABLE ROW LEVEL SECURITY;

-- Matching Runs RLS
CREATE POLICY "Hospital/Admin can view matching runs"
  ON public.matching_runs FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

CREATE POLICY "Hospital/Admin can insert matching runs"
  ON public.matching_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hospital_or_admin() AND executed_by = auth.uid());

-- Matching Results RLS
CREATE POLICY "Hospital/Admin can view matching results"
  ON public.matching_results FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

CREATE POLICY "Hospital/Admin can insert matching results"
  ON public.matching_results FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hospital_or_admin());

-- Matching Reviews RLS
CREATE POLICY "Hospital/Admin can view matching reviews"
  ON public.matching_reviews FOR SELECT
  TO authenticated
  USING (public.is_hospital_or_admin());

CREATE POLICY "Hospital/Admin can insert matching reviews"
  ON public.matching_reviews FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hospital_or_admin() AND reviewer_id = auth.uid());
