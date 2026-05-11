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

export type NotificationType =
  | "team_invite_accepted"
  | "password_changed"
  | "welcome";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; user_id: string; display_name: string | null; avatar_url: string | null; experience_role: ExperienceRole | null; language: Language; onboarding_completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; display_name?: string | null; avatar_url?: string | null; experience_role?: ExperienceRole | null; language?: Language; onboarding_completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; display_name?: string | null; avatar_url?: string | null; experience_role?: ExperienceRole | null; language?: Language; onboarding_completed_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      organizations: {
        Row: { id: string; name: string; org_number: string | null; country: string | null; logo_url: string | null; timezone: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; org_number?: string | null; country?: string | null; logo_url?: string | null; timezone?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; org_number?: string | null; country?: string | null; logo_url?: string | null; timezone?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      organization_members: {
        Row: { id: string; org_id: string; user_id: string; joined_at: string };
        Insert: { id?: string; org_id: string; user_id: string; joined_at?: string };
        Update: { id?: string; org_id?: string; user_id?: string; joined_at?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { id: string; user_id: string; org_id: string | null; role: AppRole; created_at: string };
        Insert: { id?: string; user_id: string; org_id: string | null; role: AppRole; created_at?: string };
        Update: { id?: string; user_id?: string; org_id?: string | null; role?: AppRole; created_at?: string };
        Relationships: [];
      };
      org_invitations: {
        Row: { id: string; org_id: string; email: string; role: AppRole; token_hash: string; invited_by: string; expires_at: string; consumed_at: string | null; consumed_by: string | null; created_at: string };
        Insert: { id?: string; org_id: string; email: string; role: AppRole; token_hash: string; invited_by: string; expires_at?: string; consumed_at?: string | null; consumed_by?: string | null; created_at?: string };
        Update: { id?: string; org_id?: string; email?: string; role?: AppRole; token_hash?: string; invited_by?: string; expires_at?: string; consumed_at?: string | null; consumed_by?: string | null; created_at?: string };
        Relationships: [];
      };
      audit_log: {
        Row: { id: string; org_id: string | null; actor_user_id: string | null; action: string; entity_type: string; entity_id: string; metadata: Json; occurred_at: string };
        Insert: { id?: string; org_id?: string | null; actor_user_id?: string | null; action: string; entity_type: string; entity_id: string; metadata?: Json; occurred_at?: string };
        Update: { id?: string; org_id?: string | null; actor_user_id?: string | null; action?: string; entity_type?: string; entity_id?: string; metadata?: Json; occurred_at?: string };
        Relationships: [];
      };
      notifications: {
        Row: { id: string; user_id: string; org_id: string | null; type: NotificationType; title: string; body: string; link: string | null; read_at: string | null; created_at: string };
        Insert: { id?: string; user_id: string; org_id?: string | null; type: NotificationType; title: string; body: string; link?: string | null; read_at?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; org_id?: string | null; type?: NotificationType; title?: string; body?: string; link?: string | null; read_at?: string | null; created_at?: string };
        Relationships: [];
      };
      login_attempts: {
        Row: { id: string; email_hash: string; ip_hash: string; success: boolean; attempted_at: string };
        Insert: { id?: string; email_hash: string; ip_hash: string; success: boolean; attempted_at?: string };
        Update: { id?: string; email_hash?: string; ip_hash?: string; success?: boolean; attempted_at?: string };
        Relationships: [];
      };
      auth_events: {
        Row: { id: string; user_id: string | null; event_type: string; ip_hash: string | null; severity: string; metadata: Json; occurred_at: string };
        Insert: { id?: string; user_id?: string | null; event_type: string; ip_hash?: string | null; severity?: string; metadata?: Json; occurred_at?: string };
        Update: { id?: string; user_id?: string | null; event_type?: string; ip_hash?: string | null; severity?: string; metadata?: Json; occurred_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string };
      record_login_attempt: { Args: { _email: string; _ip: string; _success: boolean }; Returns: undefined };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: { [_ in never]: never };
  };
}

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