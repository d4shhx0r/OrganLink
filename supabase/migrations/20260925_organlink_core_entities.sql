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
