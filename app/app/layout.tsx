import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import type { AppRole } from "@/lib/types/organlink";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch verified profile role
  let role: AppRole = "donor";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      role = profile.role as AppRole;
    }
  } catch {
    role = "donor";
  }

  return (
    <AppShell userEmail={user.email || "user@organlink.internal"} role={role}>
      {children}
    </AppShell>
  );
}
