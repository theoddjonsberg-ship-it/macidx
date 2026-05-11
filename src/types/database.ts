export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExperienceRole =
  | "machine_owner"
  | "service_tech"
  | "oem"
  | "bank_finance"
  | "insurance";

export type AppRole =
  | "owner"
  | "admin"
  | "member"
  | "viewer"
  | "platform_admin";

export type Language = "sv" | "en";

export interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  experience_role: ExperienceRole | null;
  language: Language;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRow {
  id: string;
  name: string;
  org_number: string | null;
  country: string | null;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { user_id: string };
        Update: Partial<Omit<ProfileRow, "id" | "user_id" | "created_at">>;
      };
      organizations: {
        Row: OrganizationRow;
        Insert: { name: string; org_number?: string | null; country?: string | null };
        Update: Partial<Omit<OrganizationRow, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invitation: {
        Args: { _token: string };
        Returns: string;
      };
      record_login_attempt: {
        Args: { _email: string; _ip: string; _success: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
    };
  };
}
