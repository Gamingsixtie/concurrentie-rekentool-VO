export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'accountmanager' | 'manager' | 'viewer';
export type ActionStatus = 'todo' | 'in-progress' | 'done';
export type PriceType = 'publication' | 'agreed';

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          region: string;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          role?: UserRole;
          region?: string;
          team_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          region?: string;
          team_id?: string;
          created_at?: string;
        };
      };
      schools: {
        Row: {
          id: string;
          slug: string;
          name: string;
          team_id: string;
          owner_id: string;
          is_complete: boolean;
          completed_steps: number[];
          levels: string[];
          student_counts: Json;
          selected_modules: string[];
          module_setups: Json;
          scenario: string | null;
          migration_hourly_rate: number;
          migration_time_saving_overrides: Json;
          pipeline_status: string;
          lost_deal_info: Json | null;
          region: string;
          tags: string[];
          view_preference: string;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          team_id: string;
          owner_id: string;
          is_complete?: boolean;
          completed_steps?: number[];
          levels?: string[];
          student_counts?: Json;
          selected_modules?: string[];
          module_setups?: Json;
          scenario?: string | null;
          migration_hourly_rate?: number;
          migration_time_saving_overrides?: Json;
          pipeline_status?: string;
          lost_deal_info?: Json | null;
          region?: string;
          tags?: string[];
          view_preference?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          team_id?: string;
          owner_id?: string;
          is_complete?: boolean;
          completed_steps?: number[];
          levels?: string[];
          student_counts?: Json;
          selected_modules?: string[];
          module_setups?: Json;
          scenario?: string | null;
          migration_hourly_rate?: number;
          migration_time_saving_overrides?: Json;
          pipeline_status?: string;
          lost_deal_info?: Json | null;
          region?: string;
          tags?: string[];
          view_preference?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          dmu_position: string;
          job_title: string;
          email: string;
          phone: string;
          preferred_channel: string;
          authority: string;
          last_contact_date: string | null;
          notes: string;
          is_primary: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          dmu_position: string;
          job_title?: string;
          email?: string;
          phone?: string;
          preferred_channel?: string;
          authority?: string;
          last_contact_date?: string | null;
          notes?: string;
          is_primary?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          dmu_position?: string;
          job_title?: string;
          email?: string;
          phone?: string;
          preferred_channel?: string;
          authority?: string;
          last_contact_date?: string | null;
          notes?: string;
          is_primary?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          school_id: string;
          date: string;
          contact_id: string | null;
          content: string;
          tags: string[];
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          date: string;
          contact_id?: string | null;
          content: string;
          tags?: string[];
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          date?: string;
          contact_id?: string | null;
          content?: string;
          tags?: string[];
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      actions: {
        Row: {
          id: string;
          school_id: string;
          title: string;
          status: string;
          conversation_id: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          title: string;
          status?: string;
          conversation_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          title?: string;
          status?: string;
          conversation_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_events: {
        Row: {
          id: string;
          school_id: string;
          timestamp: string;
          event_type: string;
          description: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          timestamp?: string;
          event_type: string;
          description: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          timestamp?: string;
          event_type?: string;
          description?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
      };
      school_prices: {
        Row: {
          id: string;
          school_id: string;
          module_id: string;
          provider: string;
          amount: number;
          price_type: string;
          discount_percentage: number;
          source: string;
          verified_at: string | null;
          note: string;
          is_active: boolean;
          activation_reason: string | null;
          activated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          module_id: string;
          provider: string;
          amount: number;
          price_type: string;
          discount_percentage?: number;
          source?: string;
          verified_at?: string | null;
          note?: string;
          is_active?: boolean;
          activation_reason?: string | null;
          activated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          module_id?: string;
          provider?: string;
          amount?: number;
          price_type?: string;
          discount_percentage?: number;
          source?: string;
          verified_at?: string | null;
          note?: string;
          is_active?: boolean;
          activation_reason?: string | null;
          activated_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_team_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      action_status: ActionStatus;
      price_type: PriceType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
