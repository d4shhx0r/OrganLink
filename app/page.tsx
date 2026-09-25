import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      redirect("/app/dashboard");
    }
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
  }

  redirect("/login");
}
