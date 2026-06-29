"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Identifiants invalides")}`);
  }

  redirect("/dashboard/ecosystem");
}

export async function signOut() {
  const supabase = await createSupabaseActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
