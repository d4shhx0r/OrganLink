import { createClient } from "@supabase/supabase-js";

/**
 * Server-only administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * 
 * SECURITY WARNING:
 * - This client bypasses Row Level Security (RLS).
 * - NEVER import or execute this file in client-side code, Client Components, or public API routes.
 * - Used exclusively for administrative server-side tasks or automated migration scripts.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Security Violation: createAdminClient cannot be called from a browser/client environment.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing server configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
