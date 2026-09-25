# OrganLink — Healthcare Registry & Transparent Matching Platform

A production-grade, secure healthcare platform built with Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL.

This system is an academic research prototype based on the core functional workflow described in:
> *"An Implementation Perspective of Blockchain Technology in Leveraging Organ Donation in a Transparent Mode to both Patients and Donors"*

> [!NOTE]
> **Research Prototype Notice**: OrganLink implements the paper's transparent organ donation, procurement, and recipient ranking workflow using a conventional secure web architecture (PostgreSQL, Row Level Security, and Cryptographic SHA-256 Hash Chaining) instead of blockchain. It is designed for research, simulation, and academic benchmarking and is **not** certified for real-world clinical decision-making or production medical allocations.

---

## 1. System Architecture

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
                             Tamper-Evident Audit Ledger
                                         │
                                         ▼
                             SHA-256 Cryptographic Chain
                        (Block N Hash embeds Block N-1 Hash)
```

---

## 2. Core Workflow (Preserved from Research Paper)

1. **Donor Registration**:
   - Demographic details, ABO blood group, HLA tissue typing (`tissue_type`), facility location, and consent status are recorded.
   - Initial state is set to `pending`.
2. **Hospital Clinical Review**:
   - Authorized hospital clinicians or platform administrators review the donor application.
   - Decision transition: `pending` &rarr; `approved` (or `rejected`).
   - Every approval decision appends a tamper-evident cryptographic block to the audit ledger.
3. **Organ Availability Registration**:
   - Once a donor is clinically `approved`, authorized medical staff can register procured organs (`kidney`, `liver`, `heart`, `lung`, `cornea`).
   - Unapproved donors cannot have organs registered.
   - Status defaults to `available`.
4. **Recipient / Patient Registration**:
   - Patients requiring an organ are registered with ABO blood group, HLA tissue profile, required organ, facility location, and medical urgency (`status_1_critical`, `status_2_urgent`, `routine`).
   - Waiting time (`waiting_since`) is captured in UTC to establish priority.
5. **Deterministic Candidate Ranking**:
   - Available organs are matched against the active recipient waiting list pool.
   - Hard constraints (organ type match, active status, major ABO compatibility) are enforced.
   - Eligible candidates receive a normalized 0–100 Research Matching Score with transparent factor breakdowns.
6. **Human Review Boundary**:
   - The software NEVER makes automatic medical allocation decisions.
   - Authorized clinicians review the ranking and log a human review decision.
7. **Cryptographic Audit Provenance**:
   - Every mutation and matching run is recorded in `audit_logs` using SHA-256 hash chaining.

---

## 3. Matching Engine Methodology

> [!IMPORTANT]
> **Academic Transparency Statement**:
> The source paper identifies blood group, tissue type, medical urgency, and waiting time as matching considerations but does **not** provide a complete reproducible numerical weighting formula. OrganLink therefore implements a transparent configurable research scoring model using these exact criteria.

### Hard Constraints vs. Soft Factors

1. **Hard Constraints (Exclusion Criteria)**:
   - **Organ Type Match**: Patient must require the exact organ type procured (`recipient.required_organ == organ.organ_type`).
   - **Active Status**: Patient status must be `active`. Suspended or inactive patients are excluded.
   - **ABO Compatibility**: Donor must be ABO compatible with recipient (e.g. O can donate to O, A, B, AB; A to A, AB; B to B, AB; AB to AB). Major ABO mismatch causes immediate exclusion from primary ranking with an explicit explanation.

2. **Soft Scoring Factors (Weighted Criteria)**:
   - **Blood Group Concordance** ($W_{\text{blood}} = 0.40$):
     - Identical match (e.g. O+ &rarr; O+): factor = $1.00$
     - Universal/compatible transfer (e.g. O+ &rarr; A+): factor = $0.95$
     - Rh difference (e.g. Rh+ &rarr; Rh-): factor = $0.90$
   - **HLA Tissue Typing Concordance** ($W_{\text{tissue}} = 0.30$):
     - Exact match on all tested loci: factor = $1.00$
     - Partial match: factor = $0.30 + 0.70 \times \left(\frac{\text{shared loci}}{\text{total loci}}\right)$
     - Complete mismatch: factor = $0.05$
     - Insufficient data: factor = $0.25$ (with explicit disclaimer: *"Insufficient structured tissue data for clinical-grade comparison"*)
   - **Medical Urgency** ($W_{\text{urgency}} = 0.20$):
     - `status_1_critical`: factor = $1.00$
     - `status_2_urgent`: factor = $0.70$
     - `routine`: factor = $0.40$
   - **Waiting Time** ($W_{\text{waiting}} = 0.10$):
     - Linear normalization scaling up to 730 days (~2 years): $\min\left(1.0, \max\left(0.05, \frac{\text{days}}{730}\right)\right)$

### Research Score Formula

$$\text{Research Score} = \Big( S_{\text{blood}} \cdot W_{\text{blood}} + S_{\text{tissue}} \cdot W_{\text{tissue}} + S_{\text{urgency}} \cdot W_{\text{urgency}} + S_{\text{waiting}} \cdot W_{\text{waiting}} \Big) \times 100$$

### Deterministic Tie-Breaking
When candidates achieve identical research scores:
1. Candidate with higher medical urgency score ranks first.
2. Candidate with longer accumulated waiting time ranks first.
3. Alphabetical order of unique patient reference (`recipient_reference`) as a deterministic tie-breaker.

---

## 4. Database Schema & Tables

### Tables Overview

1. **`profiles`**: References `auth.users(id)` with assigned `app_role` (`admin`, `hospital`, `donor`, `recipient`).
2. **`donors`**: Complete donor records, HLA typing, consent, and hospital approval status (`pending`, `approved`, `rejected`).
3. **`recipients`**: Active recipient waiting list with required organ, HLA profile, urgency, and waiting time.
4. **`organs`**: Procured organs linked to approved donors, with availability status (`available`, `reserved`, `allocated`, `transplanted`, `unavailable`).
5. **`matching_runs`**: Persists each matching run, organ ID, algorithm version, configuration weights, candidate counts, and executor.
6. **`matching_results`**: Individual candidate results per run with rank, research score, factor breakdowns, and exclusion reasons.
7. **`matching_reviews`**: Human clinical review records linked to matching runs, enforcing clinical accountability.
8. **`audit_logs`**: Append-only cryptographic audit chain embedding previous block SHA-256 hashes.

---

## 5. Role-Based Access Control (RBAC) & Row Level Security (RLS)

| Role | Dashboard | Donors | Recipients | Organs | Matching Engine | Audit Log | Profile |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Full Overview | Full Management | Full Management | Full Management | Execute & Review | Full View & Verify | View & Edit |
| **Hospital** | Full Overview | Full Management | Full Management | Full Management | Execute & Review | Full View & Verify | View & Edit |
| **Donor** | My Donation | View / Register Own | &mdash; | View Own Donated | &mdash; | &mdash; | View & Edit |
| **Recipient** | My Request | &mdash; | View / Register Own | &mdash; | &mdash; | &mdash; | View & Edit |

---

## 6. Supabase Setup Instructions

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and navigate to **SQL Editor**.
2. Run migrations sequentially:
   - `supabase/migrations/20240101000000_create_profiles.sql` (Profiles, roles, and auth trigger).
   - `supabase/migrations/20260925_organlink_core_entities.sql` (Donors, recipients, organs, audit logs, RLS).
   - `supabase/migrations/20260925_organlink_matching_engine.sql` (Matching runs, matching results, matching reviews, RLS).

---

## 7. Running Locally & Testing

```bash
# 1. Install dependencies
npm install

# 2. Run matching engine unit tests
npx tsx tests/matching-engine.test.ts

# 3. Test production build
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000).
