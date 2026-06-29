import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv, hasSupabaseEnv } from "./config";

async function getClient(withSetAll: boolean) {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (withSetAll) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        }
      },
    },
  });
}

export async function createSupabaseServerClient() {
  return getClient(false);
}

export async function createSupabaseActionClient() {
  return getClient(true);
}

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await getClient(false);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
