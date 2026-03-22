/**
 * Supabase Database type definitions.
 * Minimal stub — will be expanded by Plan 01 or generated via supabase gen types.
 */

export type UserRole = 'accountmanager' | 'manager' | 'viewer';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          region: string;
          team_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: UserRole;
          region?: string;
          team_id?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: UserRole;
          region?: string;
          team_id?: string;
        };
      };
      schools: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
