# OrganLink — Healthcare Authentication & Organ Donation Platform

A clean, modern, production-quality authentication system built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth & PostgreSQL.

Designed following the **"Minimal, calm, premium, precise"** design philosophy with professional purple accents (`#7C00D9`), light neutral surfaces (`#F1F3F3`), near-black typography (`#171717`), and subtle micro-interactions.

---

## 1. Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design tokens (`globals.css`)
- **Authentication**: Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- **Database & Security**: PostgreSQL with Row-Level Security (RLS) & security definer functions
- **Form Management**: React Hook Form + Zod validation resolver
- **Icons**: Lucide React
- **Motion**: Framer Motion (subtle, calm page & transition animations)

---

## 2. Directory Structure

```
OrganLink/
├── app/
│   ├── app/
│   │   └── dashboard/
│   │       ├── page.tsx            # Protected dashboard route
│   │       └── LogoutButton.tsx    # Accessible Supabase logout action
│   ├── login/
│   │   └── page.tsx                # Dynamic server login route
│   ├── globals.css                 # Design tokens, variables & focus styles
│   ├── layout.tsx                  # Root layout, Inter font, SEO & OpenGraph
│   └── page.tsx                    # Root route router (/ -> /app/dashboard or /login)
├── components/
│   ├── auth/
│   │   ├── AuthInput.tsx           # Accessible text input with label & error
│   │   ├── AuthMethodSelector.tsx  # Initial screen: Continue with Email / Google
│   │   ├── LoginForm.tsx           # Credentials form with validation & safe errors
│   │   ├── LoginPage.tsx           # Screen container with Framer Motion transitions
│   │   ├── PasswordInput.tsx       # Masked password with accessible eye toggle
│   │   └── SocialLoginButton.tsx   # Google SSO UI with coming soon notice
│   └── ui/
│       ├── Button.tsx              # Reusable button with variants & loading state
│       └── Input.tsx               # Base styled input component
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (@supabase/ssr)
│   │   ├── middleware.ts           # Middleware session handler & route guard
│   │   └── server.ts               # Server client with Next.js cookies
│   └── validations/
│       └── auth.ts                 # Zod validation schema (loginSchema)
├── public/
│   ├── favicon.svg                 # Crisp vector favicon
│   └── logo.svg                    # Geometric interlocking rings mark
├── supabase/
│   └── migrations/
│       └── 20240101000000_create_profiles.sql  # Profiles table, roles & RLS
├── middleware.ts                   # Route protection middleware
├── .env.example                    # Template environment variables
├── .env.local                      # Local environment configuration
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 3. Supabase Setup

### Step 1: Create Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL**
   - **anon public** API key

### Step 2: Run Database Migration
Open your Supabase project's **SQL Editor** and execute the contents of `supabase/migrations/20240101000000_create_profiles.sql`.

This script:
- Creates the `app_role` enum (`admin`, `hospital`, `donor`, `recipient`).
- Creates the `profiles` table referencing `auth.users(id) ON DELETE CASCADE`.
- Enables **Row Level Security (RLS)** with policies protecting user data and preventing unauthorized role escalation.
- Creates an automated database trigger (`on_auth_user_created`) to create a profile entry upon user registration.

---

## 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 5. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Test production build
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Authentication Flows

1. **Initial Selection Screen**:
   - Displays clean OrganLink logo, title, "Continue with email", and "Continue with Google".
2. **Email Credentials Screen**:
   - Clicking "Continue with email" smoothly animates to the credentials view.
   - Form validates email format and password length using Zod.
   - Calls `supabase.auth.signInWithPassword({ email, password })`.
   - "Log in" button shows "Logging in..." with spinner while disabling the button.
   - Inline error banner surfaces safe, user-friendly messages for invalid credentials, rate limiting, or network errors without leaking database internals.
   - "Back to login" button returns cleanly to the selection screen.
3. **Session Persistence & Route Protection**:
   - Cookies are managed via `@supabase/ssr` in `middleware.ts`.
   - Visiting `/app/*` without a session redirects to `/login?redirectTo=...`.
   - Visiting `/login` with an active session redirects to `/app/dashboard`.
4. **Dashboard Placeholder & Logout**:
   - `/app/dashboard` displays the authenticated user's email, assigned role, UID, and security badge.
   - "Log out" button invokes `supabase.auth.signOut()` and redirects to `/login`.

---

## 7. Deployment to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. In Vercel, click **Add New Project** and select the repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase Dashboard -> **Authentication -> URL Configuration**:
   - Set **Site URL** to your Vercel deployment domain (e.g. `https://your-app.vercel.app`).
   - Add `https://your-app.vercel.app/**` to **Redirect URLs**.
5. Click **Deploy**.
