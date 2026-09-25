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
