import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ถ้ายังไม่ได้ล็อกอิน -> ไปหน้า Login
  if (!user) {
    redirect("/login");
  }

  // ถ้าล็อกอินแล้ว -> ไปหน้า Dashboard
  redirect("/dashboard");
}
