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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_actions: {
        Row: {
          action: string
          agent: string
          company_id: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          platform: string | null
          product_id: string | null
          reason: string | null
          status: string
        }
        Insert: {
          action: string
          agent: string
          company_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          platform?: string | null
          product_id?: string | null
          reason?: string | null
          status: string
        }
        Update: {
          action?: string
          agent?: string
          company_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          platform?: string | null
          product_id?: string | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          auto_hashtags: boolean | null
          auto_publish: boolean
          brand_voice: string | null
          business_name: string | null
          business_type: string | null
          created_at: string
          default_platform: string | null
          default_tone: string | null
          facebook_connected: boolean | null
          facebook_url: string | null
          follower_count: number | null
          id: string
          include_cta: boolean | null
          include_emojis: boolean | null
          instagram_connected: boolean | null
          instagram_handle: string | null
          linkedin_connected: boolean | null
          linkedin_url: string | null
          target_audience: string | null
          tiktok_connected: boolean | null
          tone: string | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_hashtags?: boolean | null
          auto_publish?: boolean
          brand_voice?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          default_platform?: string | null
          default_tone?: string | null
          facebook_connected?: boolean | null
          facebook_url?: string | null
          follower_count?: number | null
          id?: string
          include_cta?: boolean | null
          include_emojis?: boolean | null
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          linkedin_connected?: boolean | null
          linkedin_url?: string | null
          target_audience?: string | null
          tiktok_connected?: boolean | null
          tone?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_hashtags?: boolean | null
          auto_publish?: boolean
          brand_voice?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          default_platform?: string | null
          default_tone?: string | null
          facebook_connected?: boolean | null
          facebook_url?: string | null
          follower_count?: number | null
          id?: string
          include_cta?: boolean | null
          include_emojis?: boolean | null
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          linkedin_connected?: boolean | null
          linkedin_url?: string | null
          target_audience?: string | null
          tiktok_connected?: boolean | null
          tone?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_history: {
        Row: {
          content_type: string
          created_at: string
          external_post_id: string | null
          generated_content: string
          id: string
          platform: string
          publish_attempts: number
          publish_error: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          external_post_id?: string | null
          generated_content: string
          id?: string
          platform: string
          publish_attempts?: number
          publish_error?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          external_post_id?: string | null
          generated_content?: string
          id?: string
          platform?: string
          publish_attempts?: number
          publish_error?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: string
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          channel?: string
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          channel?: string
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          images: string[]
          name: string
          price: number
          promo_price: number | null
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name: string
          price?: number
          promo_price?: number | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name?: string
          price?: number
          promo_price?: number | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
      get_order_status: {
        Args: { _order: string }
        Returns: {
          created_at: string
          customer_name: string
          status: string
          total: number
        }[]
      }
      is_company_admin: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      place_order: {
        Args: {
          _company_slug: string
          _customer_email: string
          _customer_name: string
          _customer_phone: string
          _items: Json
          _notes: string
        }
        Returns: string
      }
    }
    Enums: {
      company_role: "owner" | "admin" | "staff"
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
      company_role: ["owner", "admin", "staff"],
    },
  },
} as const
