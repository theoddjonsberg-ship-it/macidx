export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
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
      app_role: "owner" | "admin" | "member" | "viewer" | "platform_admin";
    };
  };
}
