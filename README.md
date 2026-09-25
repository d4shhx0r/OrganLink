# OrganLink — Healthcare Registry & Transparent Matching Platform

A secure, production-deployable healthcare research prototype built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Supabase Auth**, **PostgreSQL**, and a **SHA-256 cryptographically linked append-only audit trail**.

> [!IMPORTANT]
> **Mandatory Academic / Research Disclaimer**:
> **OrganLink is an academic/research prototype and must not be used as a clinical transplant allocation system.**
> **The matching model and scoring weights are research-design choices implemented in OrganLink and are not presented as clinical allocation rules.** The platform does not make autonomous clinical decisions, does not replace medical judgment, and does not supersede legally applicable organ procurement and transplantation allocation protocols (such as UNOS/OPTN or Eurotransplant).

---

## 1. Project Overview

OrganLink provides an auditable, transparent web architecture for managing organ donation consent, clinical eligibility reviews, organ procurement, recipient waiting lists, deterministic candidate ranking, and clinician decision sign-offs.

---

## 2. Academic / Research Positioning & Relationship to Reference Research

OrganLink is inspired by the functional concepts in the academic paper:
> *"An Implementation Perspective of Blockchain Technology in Leveraging Organ Donation in a Transparent Mode to both Patients and Donors"*

### Explicit Distinction: Source Concepts vs. OrganLink Design Choices

| Dimension | Reference Research Paper | OrganLink Phase 1–4 Implementation |
| :--- | :--- | :--- |
| **Underlying Ledger** | Private Ethereum blockchain, Ganache, Solidity smart contracts | PostgreSQL with Supabase Row Level Security (RLS) |
| **Audit & Provenance** | Blockchain transactions, gas consumption, and event logs | **SHA-256 cryptographically linked append-only audit log** (Block $N$ hash embeds Block $N-1$ hash) |
| **User Identity** | Web3 wallets (MetaMask) and Ethereum addresses | Supabase Auth with cookie-based SSR sessions, RBAC, and granular PostgreSQL RLS |
| **Matching Logic** | EVM smart contract execution | Pure TypeScript deterministic scoring engine ($0 - 100$ point scale) with factor transparency |
| **Matching Formula** | Outlines ABO, tissue, urgency, waiting time conceptually; does **not** specify numerical weights | **OrganLink Design Decision**: Defined explicit $40/30/20/10$ weighting, HLA loci parsing, and benchmark constants |
| **Allocation Boundary** | Simulated smart contract state transitions | **Strict human-in-the-loop requirement**: Algorithm ranks candidates; human clinician must record mandatory justification notes |

OrganLink is intentionally implemented using a **conventional secure web architecture** to demonstrate that data integrity, auditability, and algorithmic transparency can be achieved without the UX friction, token volatility, gas fees, and key management complexity of public or private blockchain networks.

---

## 3. System Architecture

```
                                    ORGANLINK CLIENT
                                           │
                                    Authentication
                                           │
                                    Supabase Auth
                                           │
                                           ▼
                                     Role / RBAC
                          (admin, hospital, donor, recipient)
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                   DONOR               RECIPIENT              HOSPITAL
              (Consent, HLA)        (Urgency, Organ)     (Review & Match)
                     │                     │                     │
                     └─────────────────────┼─────────────────────┘
                                           ▼
                                 ORGAN REGISTRY & CORE
                                           │
                                           ▼
                             TRANSPARENT MATCHING ENGINE
                                           │
               ┌───────────────────────────┼───────────────────────────┐
               ▼                           ▼                           ▼
              ABO                        TISSUE                     URGENCY
         COMPATIBILITY                 COMPARISON                 AND WAITING
               │                           │                           │
               └───────────────────────────┼───────────────────────────┘
                                           ▼
                                RESEARCH MATCHING SCORE
                                           │
                                           ▼
                                 DETERMINISTIC RANKING
                                           │
                                           ▼
                                      HUMAN REVIEW
                            (Separation of Algorithm & Decision)
                                           │
                                           ▼
                             Cryptographic Audit Ledger
                                           │
                                           ▼
                               SHA-256 Hash Chaining
                          (Block N Hash embeds Block N-1 Hash)
```

---

## 4. Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Server Components)
- **Language**: TypeScript (strict mode, no untyped shortcuts)
- **Database & Auth**: PostgreSQL & Supabase Auth via `@supabase/ssr`
- **Security & Authorization**: PostgreSQL Row Level Security (RLS) & Server Action guards
- **Data Validation**: Zod schema validation
- **Styling**: Tailwind CSS (minimal, calm, healthcare-focused design system)
- **Icons**: Lucide React
- **Cryptography**: Node.js `crypto` (deterministic SHA-256 hashing)

---

## 5. Roles & Access Control Matrix (RBAC)

OrganLink defines 4 distinct roles in `public.app_role`:

| Role | Permissions & Boundaries |
| :--- | :--- |
| `admin` | Full administrative access: view all entities, manage users, execute matching runs, view audit ledger. |
| `hospital` | Clinical personnel: register procured organs, approve/reject donor applications, execute matching runs, record human clinical reviews, view audit ledger. |
| `donor` | Register donation preferences and consent; view own donor registration and donated organs. **Cannot approve themselves, execute matching, or view hospital records.** |
| `recipient` | Register and view own patient profile and waiting list status. **Cannot execute matching or alter audit records.** |

Authorization is enforced at both the application layer (Server Actions) and the database layer (PostgreSQL Row Level Security). UI hiding is never the sole defense.

---

## 6. Database Structure & Migrations

Database migrations are located in `supabase/migrations/` and must be executed in timestamp order on a fresh database:

1. `supabase/migrations/20240101000000_create_profiles.sql`:
   - `app_role` enum (`admin`, `hospital`, `donor`, `recipient`)
   - `profiles` table (linked to `auth.users`)
   - Automatic user creation trigger on signup
   - Profile RLS policies and `is_admin()` helper function
2. `supabase/migrations/20260925_organlink_core_entities.sql`:
   - `donors`: Donor demographics, consent status, and approval workflow fields
   - `recipients`: Patient profiles, blood group, tissue type, required organ, medical urgency, waiting time
   - `organs`: Procured organ specifications linked to approved donors
   - `audit_logs`: Append-only cryptographic audit ledger
   - RLS policies for role-based isolation and update restrictions
3. `supabase/migrations/20260925_organlink_matching_engine.sql`:
   - `matching_runs`: Captures execution snapshots, criteria weights, and candidate counts
   - `matching_results`: Stores individual candidate factor breakdowns, scores, and ranks
   - `matching_reviews`: Captures human clinician sign-off with mandatory justification notes
   - RLS policies restricting matching execution and reviews to `hospital` and `admin`

---

## 7. Authentication Security

- Powered by `@supabase/ssr` with HTTP-only cookies.
- Middleware (`middleware.ts`) refreshes active sessions and protects routes (`/app/*`).
- Unauthenticated requests to protected pages are redirected to `/login?redirectTo=...`.
- Unauthorized role access (e.g. `donor` visiting `/app/matching`) triggers a server-side redirect to `/app/dashboard`.
- Social Authentication: "Continue with Google" is clearly surfaced with a "Soon" badge and informative tooltip.

---

## 8. Row Level Security (RLS) Audit

Every sensitive table in `public` has Row Level Security enabled:

- **IDOR Protection**: Donors and recipients can only query rows where `profile_id = auth.uid()`. Tampering with UUIDs in query params or requests returns 0 rows (`404 Not Found`).
- **Approval Escalation Prevention**: Donors can update contact details, but RLS policies strictly prevent modifying `approval_status`.
- **Append-Only Ledger**: The `audit_logs` table has policies for `SELECT` and `INSERT`. It contains **no `UPDATE` or `DELETE` policies**, ensuring database-enforced immutability.

---

## 9. Cryptographic Audit Hash Chain

OrganLink records every state change in `public.audit_logs` using a SHA-256 cryptographic chain:

$$\text{current\_hash} = \text{SHA-256}\left(\text{previous\_hash} + \text{action} + \text{entity} + \text{state} + \text{timestamp}\right)$$

- **Genesis Block**: The initial record links to a constant `"GENESIS_BLOCK_ORGANLINK"`.
- **Linkage Integrity**: Each subsequent block embeds the previous block's `current_hash`.
- **Tamper Evidence**: An automated verifier (`verifyRecordsIntegrity`) recomputes all hashes across the chain. Any modified payload, broken pointer, retroactively altered timestamp, or mutated state is flagged immediately.

---

## 10. Matching Engine & Scoring Formula

The matching engine calculates an explainable **Research Matching Score** ($0.0 - 100.0$ points):

$$\text{Score} = 100 \times \left(0.40 \cdot S_{\text{ABO}} + 0.30 \cdot S_{\text{HLA}} + 0.20 \cdot S_{\text{urgency}} + 0.10 \cdot S_{\text{wait}}\right)$$

### Hard Exclusions (Candidates Excluded from Primary Ranking):
1. **Organ Type Mismatch**: Organ type must match patient's `required_organ`.
2. **Patient Status**: Patient must have `active` status.
3. **Major ABO Incompatibility**: Biological blood incompatibility (e.g. Type A donor to Type B recipient) excludes the candidate with human-readable rationale.

### Soft Factor Normalization:
- **ABO Compatibility ($S_{\text{ABO}}$)**: Identical = $1.00$, Compatible (e.g. O to A) = $0.85$, Minor Rh- warning = $0.80$.
- **HLA Tissue Compatibility ($S_{\text{HLA}}$)**: Multi-locus comparison (HLA-A, B, C, DRB1, DQB1). Exact match ($\ge 80\%$) = $1.00$, Partial match ($50\% - 79\%$) = $0.60 - 0.79$, Mismatch ($<50\%$) = $0.20$, Insufficient data = $0.25$ baseline.
- **Medical Urgency ($S_{\text{urgency}}$)**: `status_1_critical` = $1.00$, `status_2_urgent` = $0.70$, `routine` = $0.40$.
- **Waiting Duration ($S_{\text{wait}}$)**: Proportional scaling: $\min(1.0, \frac{\text{Days Registered}}{730})$.

### Deterministic Tie-Breaking Sequence:
1. Research Composite Score (descending)
2. Medical Urgency Score (descending)
3. Waiting Time in Days (descending)
4. Recipient Reference String (ascending alphanumeric order)

---

## 11. Human Review Workflow Boundary

OrganLink strictly separates algorithmic candidate ranking from medical allocation authority:

1. Hospital staff selects an available organ and executes matching.
2. The engine computes deterministic rankings and factor breakdowns.
3. Clinical personnel inspect candidate breakdowns in the UI.
4. Clinician submits a formal review decision (`reviewed`, `selected_for_research_demo`, `not_selected_for_research_demo`) with **mandatory clinical justification notes**.
5. The review is recorded in `matching_reviews` and appends a `MATCH_REVIEW_RECORDED` block to the cryptographic audit trail.

---

## 12. Research Assumptions & Known Limitations

- **String-Based HLA Comparison**: Evaluates text alleles for demonstration; real clinical practice requires serological virtual crossmatching and Panel Reactive Antibody (PRA) testing.
- **Geographic Distance**: Location is represented as facility text; real allocation systems calculate transport transit time and cold ischemia thresholds.
- **Organ-Specific Scoring**: Heart and liver allocation in clinical practice rely on laboratory MELD or status score systems rather than waiting-list duration alone.

---

## 13. Environment Configuration

### Public Variables (Client-Exposed)
- `NEXT_PUBLIC_SUPABASE_URL`: HTTPS endpoint of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous API key with RLS enforcement.

### Server-Only Variables (NEVER Expose to Browser)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret used exclusively by backend admin utilities. Never prefix with `NEXT_PUBLIC_` or import into client components.

---

## 14. Local Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd OrganLink

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase project credentials

# 4. Run database migrations in Supabase SQL Editor
# Execute migrations 1, 2, and 3 in sequence.

# 5. Run test suite
npm test

# 6. Start development server
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 15. Supabase Setup & Auth URL Configuration

In your Supabase Dashboard:

1. Navigate to **Authentication &rarr; URL Configuration**.
2. Set **Site URL** to:
   - For local development: `http://localhost:3000`
   - For production deployment: `https://YOUR-PRODUCTION-DOMAIN.vercel.app`
3. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://YOUR-PRODUCTION-DOMAIN.vercel.app/**`
4. Navigate to **Authentication &rarr; Providers** and ensure **Email** is enabled.

---

## 16. Vercel Deployment Instructions

1. Push your repository to GitHub or GitLab.
2. Log in to [Vercel](https://vercel.com) and click **Add New &rarr; Project**.
3. Import the `OrganLink` repository.
4. In the **Environment Variables** section, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will build the application using `npm run build`.
6. Once deployed, update your **Site URL** and **Redirect URLs** in Supabase with your assigned Vercel domain.

---

## 17. Testing & Verification Suites

OrganLink includes 3 automated test suites:

```bash
# Run all tests
npm test

# 1. Cryptographic Audit Chain Verification
npx tsx tests/audit-chain.test.ts
# Tests valid chains, modified records, broken previous_hash links, state mutation, action mutation, and timestamp backdating.

# 2. Deterministic Matching Engine Regression
npx tsx tests/matching-engine.test.ts
# Tests ABO rules, HLA concordance, urgency factors, waiting normalization, tie-breaking, missing data, and hard exclusions.

# 3. End-to-End Synthetic Workflow Simulation
npx tsx tests/e2e-workflow.test.ts
# Simulates full lifecycle: donor creation -> approval -> organ registration -> recipient registration -> matching run -> candidate ranking -> clinician review -> 7-block audit chain verification.
```

---

## 18. Security Considerations

- **Security Headers**: Configured in `next.config.mjs` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).
- **No SQL / Secret Leaks**: Server actions intercept and sanitize database errors, returning human-friendly user feedback without exposing internal stack traces, table names, or service keys.
- **Input Validation**: All client and server mutations are strictly validated via Zod schemas before hitting the database.
