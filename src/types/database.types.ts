export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ads_engagement: {
        Row: {
          ads_eligible: boolean
          first_match_at: string | null
          id: string
          swipe_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ads_eligible?: boolean
          first_match_at?: string | null
          id?: string
          swipe_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ads_eligible?: boolean
          first_match_at?: string | null
          id?: string
          swipe_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_engagement_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissals: {
        Row: {
          created_at: string
          dismissed_id: string
          dismisser_id: string
          id: string
          last_dismissed_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          dismissed_id: string
          dismisser_id: string
          id?: string
          last_dismissed_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          dismissed_id?: string
          dismisser_id?: string
          id?: string
          last_dismissed_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "dismissals_dismissed_id_fkey"
            columns: ["dismissed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissals_dismisser_id_fkey"
            columns: ["dismisser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enforcement_actions: {
        Row: {
          action: Database["public"]["Enums"]["enforcement_action_type"]
          created_at: string
          end_at: string | null
          id: string
          start_at: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["enforcement_action_type"]
          created_at?: string
          end_at?: string | null
          id?: string
          start_at?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["enforcement_action_type"]
          created_at?: string
          end_at?: string | null
          id?: string
          start_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enforcement_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_liked_id_fkey"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          unmatched_at: string | null
          unmatched_by: string | null
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          unmatched_at?: string | null
          unmatched_by?: string | null
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          unmatched_at?: string | null
          unmatched_by?: string | null
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_unmatched_by_fkey"
            columns: ["unmatched_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          delivered_at: string | null
          id: string
          media_url: string | null
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          media_url?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          media_url?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          id: string
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          order_index: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          order_index?: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          order_index?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          completion_score: number
          created_at: string
          display_name: string | null
          gender: string | null
          hometown: string | null
          nitty_gritty: Json | null
          show_gender: boolean
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          bio?: string | null
          completion_score?: number
          created_at?: string
          display_name?: string | null
          gender?: string | null
          hometown?: string | null
          nitty_gritty?: Json | null
          show_gender?: boolean
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          bio?: string | null
          completion_score?: number
          created_at?: string
          display_name?: string | null
          gender?: string | null
          hometown?: string | null
          nitty_gritty?: Json | null
          show_gender?: boolean
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_config: {
        Row: {
          id: string
          updated_at: string
          weight_name: string
          weight_value: number
        }
        Insert: {
          id?: string
          updated_at?: string
          weight_name: string
          weight_value: number
        }
        Update: {
          id?: string
          updated_at?: string
          weight_name?: string
          weight_value?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string
          id: string
          saved_id: string
          saver_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          saved_id: string
          saver_id: string
        }
        Update: {
          created_at?: string
          id?: string
          saved_id?: string
          saver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_saved_id_fkey"
            columns: ["saved_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_saver_id_fkey"
            columns: ["saver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: string
          match_id: string | null
          status: Database["public"]["Enums"]["thread_status"]
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id?: string | null
          status?: Database["public"]["Enums"]["thread_status"]
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string | null
          status?: Database["public"]["Enums"]["thread_status"]
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_schools: {
        Row: {
          school_id: string
          user_id: string
        }
        Insert: {
          school_id: string
          user_id: string
        }
        Update: {
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_schools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          birthdate: string
          created_at: string
          enforcement_state: Database["public"]["Enums"]["enforcement_state"]
          id: string
          last_active_at: string
          mode_status: Database["public"]["Enums"]["mode_status"]
          onboarding_completed: boolean
          phone: string | null
          selfie_verified: boolean
        }
        Insert: {
          birthdate: string
          created_at?: string
          enforcement_state?: Database["public"]["Enums"]["enforcement_state"]
          id: string
          last_active_at?: string
          mode_status?: Database["public"]["Enums"]["mode_status"]
          onboarding_completed?: boolean
          phone?: string | null
          selfie_verified?: boolean
        }
        Update: {
          birthdate?: string
          created_at?: string
          enforcement_state?: Database["public"]["Enums"]["enforcement_state"]
          id?: string
          last_active_at?: string
          mode_status?: Database["public"]["Enums"]["mode_status"]
          onboarding_completed?: boolean
          phone?: string | null
          selfie_verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dismiss_profile: {
        Args: { p_dismissed_id: string; p_user_id: string }
        Returns: Json
      }
      get_discovery_stack: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: Json
      }
      is_blocked: { Args: { user_a: string; user_b: string }; Returns: boolean }
      like_profile: {
        Args: { p_liked_id: string; p_liker_id: string }
        Returns: Json
      }
      send_message: {
        Args: {
          p_body?: string
          p_media_url?: string
          p_message_id?: string
          p_reply_to_id?: string
          p_sender_id: string
          p_thread_id: string
        }
        Returns: Json
      }
      shares_school: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      unmatch_user: {
        Args: { p_block_too?: boolean; p_other_id: string; p_user_id: string }
        Returns: Json
      }
      update_mode_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["mode_status"]
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      enforcement_action_type:
        | "warning"
        | "dm_ban_48h"
        | "suspended_7d"
        | "permanent_ban"
      enforcement_state:
        | "none"
        | "warning"
        | "dm_ban_48h"
        | "suspended_7d"
        | "permanent_ban"
      mode_status: "roommate" | "friends" | "found_roommate"
      moderation_status: "pending" | "approved" | "rejected"
      report_reason:
        | "harassment"
        | "sexual_content"
        | "hate_speech"
        | "spam"
        | "impersonation"
        | "underage"
        | "safety_threat"
        | "other"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      thread_status: "active" | "unmatched" | "blocked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      enforcement_action_type: [
        "warning",
        "dm_ban_48h",
        "suspended_7d",
        "permanent_ban",
      ],
      enforcement_state: [
        "none",
        "warning",
        "dm_ban_48h",
        "suspended_7d",
        "permanent_ban",
      ],
      mode_status: ["roommate", "friends", "found_roommate"],
      moderation_status: ["pending", "approved", "rejected"],
      report_reason: [
        "harassment",
        "sexual_content",
        "hate_speech",
        "spam",
        "impersonation",
        "underage",
        "safety_threat",
        "other",
      ],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      thread_status: ["active", "unmatched", "blocked"],
    },
  },
} as const
