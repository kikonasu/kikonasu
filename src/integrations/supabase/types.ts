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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      capsule_wardrobes: {
        Row: {
          created_at: string
          id: string
          item_ids: string[]
          name: string
          total_outfits: number
          updated_at: string
          user_id: string
          description: string | null
          season: string | null
          style: string | null
          is_public: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_ids?: string[]
          name: string
          total_outfits?: number
          updated_at?: string
          user_id: string
          description?: string | null
          season?: string | null
          style?: string | null
          is_public?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          item_ids?: string[]
          name?: string
          total_outfits?: number
          updated_at?: string
          user_id?: string
          description?: string | null
          season?: string | null
          style?: string | null
          is_public?: boolean | null
        }
        Relationships: []
      }
      capsule_wishlist: {
        Row: {
          created_at: string
          id: string
          item_category: string
          item_description: string | null
          item_name: string
          notes: string | null
          price_range_high: number | null
          price_range_low: number | null
          purchased: boolean | null
          purchased_at: string | null
          target_price: number | null
          template_id: string
          template_item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_category: string
          item_description?: string | null
          item_name: string
          notes?: string | null
          price_range_high?: number | null
          price_range_low?: number | null
          purchased?: boolean | null
          purchased_at?: string | null
          target_price?: number | null
          template_id: string
          template_item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_category?: string
          item_description?: string | null
          item_name?: string
          notes?: string | null
          price_range_high?: number | null
          price_range_low?: number | null
          purchased?: boolean | null
          purchased_at?: string | null
          target_price?: number | null
          template_id?: string
          template_item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_outfits: {
        Row: {
          accessory_item_id: string | null
          bottom_item_id: string | null
          created_at: string
          dress_item_id: string | null
          id: string
          outerwear_item_id: string | null
          shoes_item_id: string | null
          top_item_id: string | null
          user_id: string
          name: string | null
          occasion: string | null
          tags: string[] | null
        }
        Insert: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          dress_item_id?: string | null
          id?: string
          outerwear_item_id?: string | null
          shoes_item_id?: string | null
          top_item_id?: string | null
          user_id: string
          name?: string | null
          occasion?: string | null
          tags?: string[] | null
        }
        Update: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          dress_item_id?: string | null
          id?: string
          outerwear_item_id?: string | null
          shoes_item_id?: string | null
          top_item_id?: string | null
          user_id?: string
          name?: string | null
          occasion?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_outfits_bottom_item_id_fkey"
            columns: ["bottom_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_outfits_shoes_item_id_fkey"
            columns: ["shoes_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_outfits_top_item_id_fkey"
            columns: ["top_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_history: {
        Row: {
          accessory_item_id: string | null
          bottom_item_id: string | null
          created_at: string
          dress_item_id: string | null
          id: string
          outerwear_item_id: string | null
          shoes_item_id: string | null
          top_item_id: string | null
          user_id: string
          occasion: string | null
          weather_temp: number | null
          weather_condition: string | null
          was_worn: boolean | null
          worn_at: string | null
          rating: number | null
          notes: string | null
        }
        Insert: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          dress_item_id?: string | null
          id?: string
          outerwear_item_id?: string | null
          shoes_item_id?: string | null
          top_item_id?: string | null
          user_id: string
          occasion?: string | null
          weather_temp?: number | null
          weather_condition?: string | null
          was_worn?: boolean | null
          worn_at?: string | null
          rating?: number | null
          notes?: string | null
        }
        Update: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          dress_item_id?: string | null
          id?: string
          outerwear_item_id?: string | null
          shoes_item_id?: string | null
          top_item_id?: string | null
          user_id?: string
          occasion?: string | null
          weather_temp?: number | null
          weather_condition?: string | null
          was_worn?: boolean | null
          worn_at?: string | null
          rating?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_history_bottom_item_id_fkey"
            columns: ["bottom_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_history_shoes_item_id_fkey"
            columns: ["shoes_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_history_top_item_id_fkey"
            columns: ["top_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          avatar_url: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id: string
          avatar_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          avatar_url?: string | null
        }
        Relationships: []
      }
      suitcase_outfits: {
        Row: {
          accessory_item_id: string | null
          bottom_item_id: string | null
          created_at: string
          day_number: number
          dress_item_id: string | null
          id: string
          occasion: string | null
          occasion_label: string | null
          outerwear_item_id: string | null
          outfit_date: string
          shoes_item_id: string | null
          suitcase_id: string
          time_of_day: string | null
          top_item_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          day_number: number
          dress_item_id?: string | null
          id?: string
          occasion?: string | null
          occasion_label?: string | null
          outerwear_item_id?: string | null
          outfit_date: string
          shoes_item_id?: string | null
          suitcase_id: string
          time_of_day?: string | null
          top_item_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          day_number?: number
          dress_item_id?: string | null
          id?: string
          occasion?: string | null
          occasion_label?: string | null
          outerwear_item_id?: string | null
          outfit_date?: string
          shoes_item_id?: string | null
          suitcase_id?: string
          time_of_day?: string | null
          top_item_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_outfits_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcases: {
        Row: {
          created_at: string
          destination: string
          end_date: string
          id: string
          is_local: boolean | null
          plan_type: string | null
          start_date: string
          trip_name: string
          trip_type: string[] | null
          updated_at: string
          user_id: string
          weather_data: Json | null
          notes: string | null
          packing_list: Json | null
          is_archived: boolean | null
        }
        Insert: {
          created_at?: string
          destination: string
          end_date: string
          id?: string
          is_local?: boolean | null
          plan_type?: string | null
          start_date: string
          trip_name: string
          trip_type?: string[] | null
          updated_at?: string
          user_id: string
          weather_data?: Json | null
          notes?: string | null
          packing_list?: Json | null
          is_archived?: boolean | null
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          is_local?: boolean | null
          plan_type?: string | null
          start_date?: string
          trip_name?: string
          trip_type?: string[] | null
          updated_at?: string
          user_id?: string
          weather_data?: Json | null
          notes?: string | null
          packing_list?: Json | null
          is_archived?: boolean | null
        }
        Relationships: []
      }
      user_capsule_items: {
        Row: {
          created_at: string
          id: string
          match_type: string
          template_id: string
          template_item_id: string
          updated_at: string
          user_id: string
          wardrobe_item_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_type?: string
          template_id: string
          template_item_id: string
          updated_at?: string
          user_id: string
          wardrobe_item_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_type?: string
          template_id?: string
          template_item_id?: string
          updated_at?: string
          user_id?: string
          wardrobe_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_capsule_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_data: Json | null
          interaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_style_preferences: {
        Row: {
          created_at: string
          favorite_colors: Json | null
          favorite_combinations: Json | null
          id: string
          item_usage: Json | null
          last_computed_at: string | null
          occasion_preferences: Json | null
          skip_patterns: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_colors?: Json | null
          favorite_combinations?: Json | null
          id?: string
          item_usage?: Json | null
          last_computed_at?: string | null
          occasion_preferences?: Json | null
          skip_patterns?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_colors?: Json | null
          favorite_combinations?: Json | null
          id?: string
          item_usage?: Json | null
          last_computed_at?: string | null
          occasion_preferences?: Json | null
          skip_patterns?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          ai_analysis: string | null
          category: string
          color: string | null
          brand: string | null
          tags: string[] | null
          is_favorite: boolean | null
          wear_count: number | null
          last_worn_at: string | null
          created_at: string
          id: string
          image_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          category: string
          color?: string | null
          brand?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          wear_count?: number | null
          last_worn_at?: string | null
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          category?: string
          color?: string | null
          brand?: string | null
          tags?: string[] | null
          is_favorite?: boolean | null
          wear_count?: number | null
          last_worn_at?: string | null
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wish_list_items: {
        Row: {
          affiliate_link: string | null
          ai_analysis: string | null
          category: string
          created_at: string
          id: string
          image_url: string
          notes: string | null
          outfit_potential: number | null
          price: number | null
          priority: number | null
          is_purchased: boolean | null
          purchased_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_link?: string | null
          ai_analysis?: string | null
          category: string
          created_at?: string
          id?: string
          image_url: string
          notes?: string | null
          outfit_potential?: number | null
          price?: number | null
          priority?: number | null
          is_purchased?: boolean | null
          purchased_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_link?: string | null
          ai_analysis?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          notes?: string | null
          outfit_potential?: number | null
          price?: number | null
          priority?: number | null
          is_purchased?: boolean | null
          purchased_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_profile_emails: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
