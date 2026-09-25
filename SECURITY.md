# Security Policy — OrganLink

## 1. Academic & Research Prototype Notice

> [!IMPORTANT]
> **OrganLink is an academic/research prototype and is not a certified clinical transplant allocation system.**
> It is designed to demonstrate transparent algorithmic candidate prioritization, role-based access control, and cryptographic tamper-evident audit logging using conventional web architecture. It must not be deployed as an autonomous medical allocation system or used in real-world clinical decision-making.

---

## 2. Security Architecture Overview

OrganLink implements defense-in-depth across multiple application boundaries:

1. **Authentication & Session Security**:
   - Managed via Supabase Auth and `@supabase/ssr` using HTTP-only, secure, `SameSite=Lax` cookies.
   - Session verification and automatic token rotation performed via Next.js Middleware.
   - Client components cannot access raw JWT credentials directly.

2. **Role-Based Access Control (RBAC)**:
   - Four distinct application roles: `admin`, `hospital`, `donor`, and `recipient` defined in PostgreSQL `public.app_role`.
   - Authorization is derived from the database profile (`profiles.role`), never from client-provided headers or tokens.
   - Server Actions enforce strict role preconditions before executing data mutations.

3. **Row Level Security (RLS) on PostgreSQL**:
   - RLS is enabled and forced on all application tables: `profiles`, `donors`, `recipients`, `organs`, `audit_logs`, `matching_runs`, `matching_results`, `matching_reviews`.
   - **IDOR Protection**: Donors and recipients can only query records where `profile_id = auth.uid()`.
   - **Privilege Escalation Protection**: RLS `WITH CHECK` policies strictly prohibit donors from altering their own `approval_status`.
   - **Append-Only Immutability**: The `audit_logs` table has no `UPDATE` or `DELETE` policies for any role, ensuring database-enforced immutability.

4. **Cryptographic Audit Ledger**:
   - State-changing actions append records to `audit_logs` chained using SHA-256:
     $$\text{current\_hash} = \text{SHA-256}\left(\text{previous\_hash} + \text{action} + \text{entity} + \text{state} + \text{timestamp}\right)$$
   - Tamper-detection utilities verify continuous cryptographic linkage and state consistency from the Genesis block to current records.

5. **HTTP Security Headers**:
   - Configured in `next.config.mjs`:
     - `X-Frame-Options: DENY` (Clickjacking mitigation)
     - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
     - `X-XSS-Protection: 1; mode=block`
     - `poweredByHeader: false` (Suppresses server disclosure)

6. **File Upload Attack Surface**:
   - **No file-upload attack surface identified.** OrganLink does not process, store, or accept binary file uploads.

---

## 3. Secrets Policy & Credential Handling

- **Public Variables**:
  - Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the client. The anon key is subject to PostgreSQL Row Level Security.
- **Server-Only Secrets**:
  - `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is restricted to server-side administrative utilities in `lib/supabase/admin.ts`.
  - Calling administrative clients from browser environments throws an immediate security exception.
  - No secret keys, credentials, or private keys are ever committed to version control.
  - `.env`, `.env.local`, `.env.*.local`, and `.env.production` are strictly excluded in `.gitignore`.

---

## 4. Reporting a Security Vulnerability

If you discover a potential security vulnerability within this repository:

1. **Do not disclose the vulnerability publicly.**
2. Send a detailed report to the repository maintainer: `developer.debashish.ind@gmail.com`.
3. Include:
   - Description of the vulnerability and affected components
   - Steps to reproduce or proof-of-concept
   - Potential impact
4. Security reports will be acknowledged within 48 hours, and patches will be published promptly.
