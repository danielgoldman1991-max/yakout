"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
