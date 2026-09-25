# OrganLink — Healthcare Registry & Organ Donation Platform

A production-grade, secure healthcare platform built with Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL.

This system is an academic research prototype based on the core functional workflow described in:
> *"An Implementation Perspective of Blockchain Technology in Leveraging Organ Donation in a Transparent Mode to both Patients and Donors"*

> [!NOTE]
> **Research Prototype Notice**: OrganLink implements the paper's transparent organ donation and procurement workflow using a conventional secure web architecture (PostgreSQL, Row Level Security, and Cryptographic SHA-256 Hash Chaining) instead of blockchain. It is designed for research and prototyping and is **not** certified for real-world clinical decision-making or production medical allocations.

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
            (Consent, HLA)        (Urgency, Organ)     (Review & Procure)
                   │                     │                     │
                   └─────────────────────┼─────────────────────┘
                                         ▼
                               ORGAN REGISTRY & CORE
                                         │
                                         ▼
                               PostgreSQL Database
                               (Enforced with RLS)
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
   - A donor or clinical center registers donor demographic details, ABO blood group, HLA tissue typing (`tissue_type`), facility location, and consent status.
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
   - Waiting time (`waiting_since`) is captured to establish priority for the upcoming Phase 3 matching engine.
5. **Cryptographic Audit Provenance**:
   - Every mutation is authorized server-side and recorded in `audit_logs` using SHA-256 hash chaining.

---

## 3. Database Schema & Tables

### Tables Overview

1. **`profiles`**
   - References `auth.users(id) ON DELETE CASCADE`.
   - Fields: `id`, `email`, `full_name`, `role` (`app_role` enum), `avatar_url`, `phone`, `blood_group`, `created_at`, `updated_at`.
2. **`donors`**
   - Fields: `id`, `profile_id`, `donor_reference` (unique), `full_name`, `date_of_birth`, `gender`, `blood_group`, `tissue_type`, `location`, `contact_information`, `medical_status`, `consent_status`, `approval_status`, `approved_by`, `approved_at`, `created_at`, `updated_at`.
   - Indexed on: `blood_group`, `tissue_type`, `approval_status`, `profile_id`.
3. **`recipients`**
   - Fields: `id`, `profile_id`, `recipient_reference` (unique), `full_name`, `date_of_birth`, `gender`, `blood_group`, `tissue_type`, `required_organ`, `location`, `medical_urgency`, `waiting_since`, `status`, `created_at`, `updated_at`.
   - Indexed on: `blood_group`, `tissue_type`, `required_organ`, `medical_urgency`, `waiting_since`, `status`, `profile_id`.
4. **`organs`**
   - Fields: `id`, `organ_reference` (unique), `organ_type`, `donor_id` (references `donors.id`), `blood_group`, `tissue_type`, `location`, `availability_status`, `available_at`, `expiry_at`, `created_at`, `updated_at`.
   - Indexed on: `organ_type`, `availability_status`, `blood_group`, `tissue_type`, `donor_id`.
5. **`audit_logs`**
   - Fields: `id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `previous_state`, `new_state`, `metadata`, `previous_hash`, `current_hash`, `created_at`.
   - Indexed on: `created_at DESC`, `entity_type`, `entity_id`, `actor_user_id`.

---

## 4. Role-Based Access Control (RBAC) & Row Level Security (RLS)

| Role | Dashboard | Donors | Recipients | Organs | Audit Log | Profile |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Full Overview | View / Create / Review | View / Create | View / Register / Update | Full View & Verify | View & Edit |
| **Hospital** | Full Overview | View / Create / Review | View / Create | View / Register / Update | Full View & Verify | View & Edit |
| **Donor** | My Donation | View / Register Own | &mdash; | View Own Donated | &mdash; | View & Edit |
| **Recipient** | My Request | &mdash; | View / Register Own | &mdash; | &mdash; | View & Edit |

### Strict RLS Policy Guarantees:
- **Append-Only Audit Trail**: `audit_logs` has **NO UPDATE** and **NO DELETE** policies for any authenticated role.
- **Anti-Self-Escalation**: Donors cannot approve their own registration; the RLS policy forbids updating `approval_status` unless the caller is `hospital` or `admin`.
- **Profile Protection**: Users cannot modify their own `role` field.

---

## 5. Tamper-Evident Cryptographic Audit Chain

OrganLink provides tamper-evident integrity without the high latency and transaction costs of blockchain:

$$\text{Block}_0: \quad \text{previous\_hash} = \text{GENESIS\_BLOCK\_ORGANLINK}$$
$$\text{Block}_N: \quad \text{current\_hash} = \text{SHA-256}(\text{previous\_hash} + \text{action} + \text{entity} + \text{payload} + \text{timestamp})$$

The client application includes a real-time verification utility (`verifyAuditChainIntegrity()`) accessible on `/app/audit` that sequentially validates that each record's link and recalculated hash are authentic.

---

## 6. Supabase Setup Instructions

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and navigate to **SQL Editor**.
2. Run the initial migration:
   - `supabase/migrations/20240101000000_create_profiles.sql` (Creates `app_role`, `profiles`, and auth triggers).
3. Run the Phase 2 core entities migration:
   - `supabase/migrations/20260925_organlink_core_entities.sql` (Creates `donors`, `recipients`, `organs`, `audit_logs`, and RLS policies).

---

## 7. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 3. Run development server
npm run dev

# 4. Run production build test
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 8. Deployment to Vercel

1. Commit and push repository changes to GitHub.
2. Link the repository to Vercel.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings.
4. Set **Site URL** in Supabase Auth Settings to your Vercel deployment URL.
5. Deploy.
