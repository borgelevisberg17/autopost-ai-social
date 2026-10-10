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
      agent_permissions: {
        Row: {
          agent_id: string
          allowed: boolean
          company_id: string
          created_at: string
          id: string
          permission: string
        }
        Insert: {
          agent_id: string
          allowed?: boolean
          company_id: string
          created_at?: string
          id?: string
          permission: string
        }
        Update: {
          agent_id?: string
          allowed?: boolean
          company_id?: string
          created_at?: string
          id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_id: string | null
          agent_name: string
          company_id: string
          completed_at: string | null
          id: string
          metadata: Json | null
          started_at: string
          status: string
          summary: string | null
          trigger: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_name: string
          company_id: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string
          status: string
          summary?: string | null
          trigger?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_name?: string
          company_id?: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string
          status?: string
          summary?: string | null
          trigger?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_name: string
          actor_type: string
          changes: Json | null
          company_id: string
          created_at: string
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_name: string
          actor_type: string
          changes?: Json | null
          company_id: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_name?: string
          actor_type?: string
          changes?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "business_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          name: string
          payment_express_number: string | null
          payment_iban: string | null
          payment_iban_holder: string | null
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
          payment_express_number?: string | null
          payment_iban?: string | null
          payment_iban_holder?: string | null
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
          payment_express_number?: string | null
          payment_iban?: string | null
          payment_iban_holder?: string | null
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
      company_subscriptions: {
        Row: {
          company_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          provider: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_history: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "content_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string
          company_id: string
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string
          id: string
          last_inbound_at: string | null
          last_message_at: string
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          company_id: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone: string
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          company_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          channel: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          last_order_at: string | null
          name: string
          notes: string | null
          orders_count: number
          phone: string | null
          total_spent: number
          updated_at: string
        }
        Insert: {
          channel?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name: string
          notes?: string | null
          orders_count?: number
          phone?: string | null
          total_spent?: number
          updated_at?: string
        }
        Update: {
          channel?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name?: string
          notes?: string | null
          orders_count?: number
          phone?: string | null
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          reason: string | null
          type: string
          variant_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          type: string
          variant_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          type?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          company_id: string
          conversation_id: string
          created_at: string
          direction: string
          error: string | null
          external_id: string | null
          id: string
          sender: string
          status: string
        }
        Insert: {
          body: string
          company_id: string
          conversation_id: string
          created_at?: string
          direction: string
          error?: string | null
          external_id?: string | null
          id?: string
          sender: string
          status?: string
        }
        Update: {
          body?: string
          company_id?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          error?: string | null
          external_id?: string | null
          id?: string
          sender?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          company_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          order_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          company_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          order_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
          fulfillment_status: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_proof_path: string | null
          payment_reference: string | null
          payment_status: string
          payment_submitted_at: string | null
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
          fulfillment_status?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_path?: string | null
          payment_reference?: string | null
          payment_status?: string
          payment_submitted_at?: string | null
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
          fulfillment_status?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_path?: string | null
          payment_reference?: string | null
          payment_status?: string
          payment_submitted_at?: string | null
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
      product_variants: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          name: string
          price: number | null
          product_id: string
          promo_price: number | null
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id?: string
          name: string
          price?: number | null
          product_id: string
          promo_price?: number | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          product_id?: string
          promo_price?: number | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      social_connections: {
        Row: {
          account_id: string | null
          account_name: string | null
          company_id: string
          created_at: string
          id: string
          last_synced_at: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          company_id: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          company_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          auto_reply: boolean
          company_id: string
          created_at: string
          display_phone: string | null
          id: string
          last_event_at: string | null
          phone_number_id: string
          status: string
          updated_at: string
          waba_id: string | null
        }
        Insert: {
          auto_reply?: boolean
          company_id: string
          created_at?: string
          display_phone?: string | null
          id?: string
          last_event_at?: string | null
          phone_number_id: string
          status?: string
          updated_at?: string
          waba_id?: string | null
        }
        Update: {
          auto_reply?: boolean
          company_id?: string
          created_at?: string
          display_phone?: string | null
          id?: string
          last_event_at?: string | null
          phone_number_id?: string
          status?: string
          updated_at?: string
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          items: Json
          paid_at: string
          payment_method: string
          payment_status: string
          payment_submitted_at: string
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
      set_payment_status: {
        Args: { _order: string; _status: string }
        Returns: undefined
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
