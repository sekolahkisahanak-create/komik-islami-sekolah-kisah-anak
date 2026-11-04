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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          class_id: string
          created_at: string
          due_at: string | null
          episode_id: string
          id: string
          include_quiz: boolean
        }
        Insert: {
          class_id: string
          created_at?: string
          due_at?: string | null
          episode_id: string
          id?: string
          include_quiz?: boolean
        }
        Update: {
          class_id?: string
          created_at?: string
          due_at?: string | null
          episode_id?: string
          id?: string
          include_quiz?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          child_id: string
          code: string
          earned_at: string
          label: string
          user_id: string
        }
        Insert: {
          child_id?: string
          code: string
          earned_at?: string
          label: string
          user_id: string
        }
        Update: {
          child_id?: string
          code?: string
          earned_at?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          child_id: string
          created_at: string
          series_id: string
          user_id: string
        }
        Insert: {
          child_id?: string
          created_at?: string
          series_id: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      child_profiles: {
        Row: {
          age_group: string
          created_at: string
          id: string
          name: string
          parent_id: string
        }
        Insert: {
          age_group?: string
          created_at?: string
          id?: string
          name: string
          parent_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          display_name: string
          joined_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          display_name: string
          joined_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          display_name?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_code?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      episode_pages: {
        Row: {
          episode_id: string
          id: string
          image_url: string
          position: number
        }
        Insert: {
          episode_id: string
          id?: string
          image_url: string
          position: number
        }
        Update: {
          episode_id?: string
          id?: string
          image_url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "episode_pages_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          discussion_question: string
          ibrah: string[]
          id: string
          is_premium: boolean
          number: number
          published: boolean
          release_at: string
          series_id: string
          synopsis: string
          title: string
        }
        Insert: {
          created_at?: string
          discussion_question?: string
          ibrah?: string[]
          id?: string
          is_premium?: boolean
          number: number
          published?: boolean
          release_at?: string
          series_id: string
          synopsis?: string
          title: string
        }
        Update: {
          created_at?: string
          discussion_question?: string
          ibrah?: string[]
          id?: string
          is_premium?: boolean
          number?: number
          published?: boolean
          release_at?: string
          series_id?: string
          synopsis?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          child_id: string
          created_at: string
          series_id: string
          user_id: string
        }
        Insert: {
          child_id?: string
          created_at?: string
          series_id: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_idr: number
          created_at: string
          decided_at: string | null
          id: string
          note: string | null
          plan_id: string | null
          series_id: string | null
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          amount_idr: number
          created_at?: string
          decided_at?: string | null
          id?: string
          note?: string | null
          plan_id?: string | null
          series_id?: string | null
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          amount_idr?: number
          created_at?: string
          decided_at?: string | null
          id?: string
          note?: string | null
          plan_id?: string | null
          series_id?: string | null
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_pins: {
        Row: {
          pin_hash: string
          user_id: string
        }
        Insert: {
          pin_hash: string
          user_id: string
        }
        Update: {
          pin_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          duration_days: number
          id: string
          name: string
          price_idr: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_days: number
          id?: string
          name: string
          price_idr: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_days?: number
          id?: string
          name?: string
          price_idr?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          notify_new_episode: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          notify_new_episode?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          notify_new_episode?: boolean
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          episode_id: string
          id: string
          options: string[]
          position: number
          question: string
        }
        Insert: {
          correct_index?: number
          episode_id: string
          id?: string
          options: string[]
          position?: number
          question: string
        }
        Update: {
          correct_index?: number
          episode_id?: string
          id?: string
          options?: string[]
          position?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          child_id: string
          created_at: string
          episode_id: string
          id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          child_id?: string
          created_at?: string
          episode_id: string
          id?: string
          score: number
          total: number
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          episode_id?: string
          id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          series_id: string
          stars: number
          user_id: string
        }
        Insert: {
          series_id: string
          stars: number
          user_id: string
        }
        Update: {
          series_id?: string
          stars?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_days: {
        Row: {
          child_id: string
          day: string
          user_id: string
        }
        Insert: {
          child_id?: string
          day?: string
          user_id: string
        }
        Update: {
          child_id?: string
          day?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          child_id: string
          episode_id: string
          finished: boolean
          progress: number
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          child_id?: string
          episode_id: string
          finished?: boolean
          progress?: number
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          child_id?: string
          episode_id?: string
          finished?: boolean
          progress?: number
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          age_group: string
          cover_hue: number
          cover_url: string | null
          created_at: string
          featured: boolean
          genre: string
          id: string
          is_premium: boolean
          price_idr: number | null
          published: boolean
          slug: string
          sources: string
          status: string
          synopsis: string
          title: string
          updated_at: string
        }
        Insert: {
          age_group: string
          cover_hue?: number
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          genre: string
          id?: string
          is_premium?: boolean
          price_idr?: number | null
          published?: boolean
          slug: string
          sources?: string
          status?: string
          synopsis?: string
          title: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          cover_hue?: number
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          genre?: string
          id?: string
          is_premium?: boolean
          price_idr?: number | null
          published?: boolean
          slug?: string
          sources?: string
          status?: string
          synopsis?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          series_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          series_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          series_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_decide_order: {
        Args: { _approve: boolean; _order_id: string }
        Returns: undefined
      }
      admin_episode_stats: {
        Args: never
        Returns: {
          episode_id: string
          finishes: number
          number: number
          reads: number
          series_title: string
          title: string
        }[]
      }
      admin_stats: {
        Args: never
        Returns: {
          bookmarks: number
          favorites: number
          finishes: number
          reads: number
          series_id: string
          title: string
        }[]
      }
      can_read_episode: { Args: { _episode_id: string }; Returns: boolean }
      class_report: {
        Args: { _class_id: string }
        Returns: {
          assignment_id: string
          display_name: string
          finished: boolean
          quiz_score: number
          quiz_total: number
          user_id: string
        }[]
      }
      has_parent_pin: { Args: never; Returns: boolean }
      has_premium_access: { Args: { _series_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_class_member: { Args: { _class_id: string }; Returns: boolean }
      is_class_owner: { Args: { _class_id: string }; Returns: boolean }
      join_class: { Args: { _code: string; _name: string }; Returns: string }
      parent_weekly_report: {
        Args: { _pin: string }
        Returns: {
          child_id: string
          episodes_finished: number
          episodes_read: number
          name: string
          quizzes_done: number
          reading_days: number
        }[]
      }
      series_rating: {
        Args: { _series_id: string }
        Returns: {
          avg: number
          count: number
        }[]
      }
      set_parent_pin: { Args: { _pin: string }; Returns: undefined }
      verify_parent_pin: { Args: { _pin: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "reader"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "reader"],
    },
  },
} as const
