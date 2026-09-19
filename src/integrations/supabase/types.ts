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
      ignored_ips: {
        Row: {
          created_at: string
          id: string
          ip: string
          note: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          note?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          note?: string | null
        }
        Relationships: []
      }
      popular_services: {
        Row: {
          created_at: string
          service_name: string
        }
        Insert: {
          created_at?: string
          service_name: string
        }
        Update: {
          created_at?: string
          service_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_level: string
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_blacklisted: boolean
          last_name: string | null
          notes: string | null
          reputation_score: number
          role: string
          username: string | null
        }
        Insert: {
          client_level?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_blacklisted?: boolean
          last_name?: string | null
          notes?: string | null
          reputation_score?: number
          role?: string
          username?: string | null
        }
        Update: {
          client_level?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_blacklisted?: boolean
          last_name?: string | null
          notes?: string | null
          reputation_score?: number
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          first_name: string
          id: string
          is_visible: boolean
          last_name: string
          rating: number
          review_date: string
          service_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          first_name: string
          id?: string
          is_visible?: boolean
          last_name: string
          rating: number
          review_date?: string
          service_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          first_name?: string
          id?: string
          is_visible?: boolean
          last_name?: string
          rating?: number
          review_date?: string
          service_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_visit_logs: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          ip: string
          path: string | null
          region: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip: string
          path?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip?: string
          path?: string | null
          region?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          created_at: string
          has_unread_admin: boolean
          has_unread_user: boolean
          id: string
          last_message_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_unread_admin?: boolean
          has_unread_user?: boolean
          id?: string
          last_message_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_unread_admin?: boolean
          has_unread_user?: boolean
          id?: string
          last_message_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string
          size_bytes: number
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          size_bytes: number
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_admin_reply: string | null
          new_status: string
          old_admin_reply: string | null
          old_status: string | null
          ticket_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_admin_reply?: string | null
          new_status: string
          old_admin_reply?: string | null
          old_status?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_admin_reply?: string | null
          new_status?: string
          old_admin_reply?: string | null
          old_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          admin_note: string | null
          admin_reply: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          is_priority: boolean
          preferred_date: string | null
          preferred_slot: string | null
          service_type: string
          source: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          admin_reply?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          is_priority?: boolean
          preferred_date?: string | null
          preferred_slot?: string | null
          service_type: string
          source?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          admin_reply?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          is_priority?: boolean
          preferred_date?: string | null
          preferred_slot?: string | null
          service_type?: string
          source?: string
          status?: string
          title?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_username: { Args: { _username: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
