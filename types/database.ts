import type { UserRole } from "./auth";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          full_name: string;
          role: UserRole;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          request_type: string;
          source: string;
          page_url: string | null;
          related_type: string | null;
          related_slug: string | null;
          message: string | null;
          desired_date: string | null;
          people_count: number | null;
          estimated_budget: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          name: string;
          phone: string;
          email?: string | null;
          request_type: string;
          source?: string;
          page_url?: string | null;
          related_type?: string | null;
          related_slug?: string | null;
          message?: string | null;
          desired_date?: string | null;
          people_count?: number | null;
          estimated_budget?: number | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
