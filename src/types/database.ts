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

export interface OrganizationMemberRow {
  id: string;
  org_id: string;
  user_id: string;
  joined_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  org_id: string | null;
  role: AppRole;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  org_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Json;
  occurred_at: string;
}

export type NotificationType =
  | "team_invite_accepted"
  | "password_changed"
  | "welcome";

export interface NotificationRow {
  id: string;
  user_id: string;
  org_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
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
      organization_members: {
        Row: OrganizationMemberRow;
        Insert: { org_id: string; user_id: string };
        Update: never;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: { user_id: string; org_id: string | null; role: AppRole };
        Update: { role?: AppRole };
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: never;
        Update: never;
      };
      notifications: {
        Row: NotificationRow;
        Insert: never;
        Update: { read_at?: string | null };
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
