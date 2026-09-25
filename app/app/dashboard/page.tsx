import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { ShieldCheck, UserCheck, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Attempt to fetch profile details if available
  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  } catch {
    profile = null;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="w-full bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="OrganLink"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-base text-[#171717] tracking-tight">
            OrganLink
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#7C00D9]/10 text-[#7C00D9]">
            <Activity className="w-3 h-3" />
            Healthcare Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-[#171717]">
              {profile?.full_name || user.email}
            </span>
            <span className="text-[11px] text-[#6B7280] capitalize">
              Role: {profile?.role || "donor"}
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Session Authenticated
              </span>
              <h1 className="text-2xl font-semibold text-[#171717] tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                You are currently logged in with <strong className="text-[#171717]">{user.email}</strong>
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
              <span className="text-xs font-medium text-[#6B7280]">Account UID</span>
              <p className="text-xs font-mono text-[#171717] mt-1 truncate" title={user.id}>
                {user.id}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
              <span className="text-xs font-medium text-[#6B7280]">Assigned Role</span>
              <div className="flex items-center gap-1.5 mt-1">
                <UserCheck className="w-4 h-4 text-[#7C00D9]" />
                <span className="text-sm font-medium text-[#171717] capitalize">
                  {profile?.role || "donor"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
              <span className="text-xs font-medium text-[#6B7280]">Security Status</span>
              <p className="text-sm font-medium text-emerald-600 mt-1">
                Verified &bull; RLS Protected
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#F3F4F6] text-xs text-[#6B7280] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p>
              Supabase Auth Session &bull; Row Level Security Active &bull; Ready for donor/recipient workflows
            </p>
            <div className="sm:hidden">
              <LogoutButton />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#9CA3AF] border-t border-[#F3F4F6] bg-white">
        OrganLink Health Portal &bull; Medical Security Architecture
      </footer>
    </div>
  );
}
