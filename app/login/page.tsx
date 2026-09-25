import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginPage } from "@/components/auth/LoginPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      redirect("/app/dashboard");
    }
  } catch (error) {
    // If redirect throws NEXT_REDIRECT, re-throw it so Next.js handles the redirect properly
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    // Otherwise fallback to rendering LoginPage if unconfigured or unauthenticated
  }

  return <LoginPage />;
}
