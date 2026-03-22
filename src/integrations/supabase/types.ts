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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      billing_reminders: {
        Row: {
          created_at: string
          expected_value: number | null
          id: string
          note: string | null
          owner_id: string
          payment_id: string | null
          project_id: string | null
          reminder_date: string
          resolved: boolean | null
        }
        Insert: {
          created_at?: string
          expected_value?: number | null
          id?: string
          note?: string | null
          owner_id: string
          payment_id?: string | null
          project_id?: string | null
          reminder_date: string
          resolved?: boolean | null
        }
        Update: {
          created_at?: string
          expected_value?: number | null
          id?: string
          note?: string | null
          owner_id?: string
          payment_id?: string | null
          project_id?: string | null
          reminder_date?: string
          resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_reminders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          observations: string | null
          owner_id: string
          project_id: string | null
          quote_id: string | null
          service_type: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          observations?: string | null
          owner_id: string
          project_id?: string | null
          quote_id?: string | null
          service_type?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          observations?: string | null
          owner_id?: string
          project_id?: string | null
          quote_id?: string | null
          service_type?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          project_id: string | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid: boolean | null
          paid_at: string | null
          project_id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          project_id: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          project_id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_annotations: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          project_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          project_id: string
          x_position: number
          y_position: number
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          project_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "plant_annotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          environment_type: string | null
          id: string
          is_before: boolean | null
          owner_id: string
          pair_id: string | null
          photo_url: string
          project_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          environment_type?: string | null
          id?: string
          is_before?: boolean | null
          owner_id: string
          pair_id?: string | null
          photo_url: string
          project_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          environment_type?: string | null
          id?: string
          is_before?: boolean | null
          owner_id?: string
          pair_id?: string | null
          photo_url?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cau: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          instagram: string | null
          office_name: string | null
          phone: string | null
          portfolio_city: string | null
          portfolio_slug: string | null
          portfolio_whatsapp: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialty: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          cau?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          instagram?: string | null
          office_name?: string | null
          phone?: string | null
          portfolio_city?: string | null
          portfolio_slug?: string | null
          portfolio_whatsapp?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          cau?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          instagram?: string | null
          office_name?: string | null
          phone?: string | null
          portfolio_city?: string | null
          portfolio_slug?: string | null
          portfolio_whatsapp?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          accepted: boolean | null
          architect_email: string
          architect_name: string | null
          architect_office: string | null
          architect_phone: string | null
          architect_user_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          invite_token: string
          project_id: string
          status: string | null
        }
        Insert: {
          accepted?: boolean | null
          architect_email: string
          architect_name?: string | null
          architect_office?: string | null
          architect_phone?: string | null
          architect_user_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_token?: string
          project_id: string
          status?: string | null
        }
        Update: {
          accepted?: boolean | null
          architect_email?: string
          architect_name?: string | null
          architect_office?: string | null
          architect_phone?: string | null
          architect_user_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_token?: string
          project_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          area_m2: number
          area_with_margin: number
          created_at: string
          description: string
          id: string
          length_m: number
          owner_id: string
          price_per_m2: number | null
          project_id: string
          quantity: number
          supplier_id: string | null
          total_cost: number | null
          width_m: number
        }
        Insert: {
          area_m2: number
          area_with_margin: number
          created_at?: string
          description: string
          id?: string
          length_m: number
          owner_id: string
          price_per_m2?: number | null
          project_id: string
          quantity?: number
          supplier_id?: string | null
          total_cost?: number | null
          width_m: number
        }
        Update: {
          area_m2?: number
          area_with_margin?: number
          created_at?: string
          description?: string
          id?: string
          length_m?: number
          owner_id?: string
          price_per_m2?: number | null
          project_id?: string
          quantity?: number
          supplier_id?: string | null
          total_cost?: number | null
          width_m?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          stage_number: number
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          stage_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          stage_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          architect_logo_url: string | null
          client_name: string | null
          created_at: string
          deadline: string | null
          down_payment: number | null
          environment_type: string | null
          finish: string | null
          id: string
          name: string
          observations: string | null
          owner_id: string
          owner_logo_url: string | null
          paid_value: number | null
          payment_method: string | null
          pieces: string | null
          status: string
          stone_color: string | null
          stone_type: string | null
          thickness: string | null
          total_value: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          architect_logo_url?: string | null
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          down_payment?: number | null
          environment_type?: string | null
          finish?: string | null
          id?: string
          name: string
          observations?: string | null
          owner_id: string
          owner_logo_url?: string | null
          paid_value?: number | null
          payment_method?: string | null
          pieces?: string | null
          status?: string
          stone_color?: string | null
          stone_type?: string | null
          thickness?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          architect_logo_url?: string | null
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          down_payment?: number | null
          environment_type?: string | null
          finish?: string | null
          id?: string
          name?: string
          observations?: string | null
          owner_id?: string
          owner_logo_url?: string | null
          paid_value?: number | null
          payment_method?: string | null
          pieces?: string | null
          status?: string
          stone_color?: string | null
          stone_type?: string | null
          thickness?: string | null
          total_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_name: string
          client_whatsapp: string | null
          created_at: string
          environment_type: string | null
          estimated_value: number | null
          follow_up_date: string | null
          id: string
          observations: string | null
          owner_id: string
          sent_date: string | null
          status: string
          stone_type: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          client_whatsapp?: string | null
          created_at?: string
          environment_type?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          observations?: string | null
          owner_id: string
          sent_date?: string | null
          status?: string
          stone_type?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          client_whatsapp?: string | null
          created_at?: string
          environment_type?: string | null
          estimated_value?: number | null
          follow_up_date?: string | null
          id?: string
          observations?: string | null
          owner_id?: string
          sent_date?: string | null
          status?: string
          stone_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stage_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          stage_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          stage_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_photos_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stones: {
        Row: {
          category: string
          colors: string | null
          cons: string | null
          created_at: string
          featured: boolean | null
          finishes: string | null
          id: string
          in_stock: boolean | null
          is_global: boolean | null
          name: string
          observations: string | null
          origin: string | null
          owner_id: string
          photo_url: string | null
          price_per_m2: number | null
          promo_active: boolean | null
          promo_badge: string | null
          pros: string | null
          thicknesses: string | null
          usage_indication: string | null
        }
        Insert: {
          category: string
          colors?: string | null
          cons?: string | null
          created_at?: string
          featured?: boolean | null
          finishes?: string | null
          id?: string
          in_stock?: boolean | null
          is_global?: boolean | null
          name: string
          observations?: string | null
          origin?: string | null
          owner_id: string
          photo_url?: string | null
          price_per_m2?: number | null
          promo_active?: boolean | null
          promo_badge?: string | null
          pros?: string | null
          thicknesses?: string | null
          usage_indication?: string | null
        }
        Update: {
          category?: string
          colors?: string | null
          cons?: string | null
          created_at?: string
          featured?: boolean | null
          finishes?: string | null
          id?: string
          in_stock?: boolean | null
          is_global?: boolean | null
          name?: string
          observations?: string | null
          origin?: string | null
          owner_id?: string
          photo_url?: string | null
          price_per_m2?: number | null
          promo_active?: boolean | null
          promo_badge?: string | null
          pros?: string | null
          thicknesses?: string | null
          usage_indication?: string | null
        }
        Relationships: []
      }
      supplier_purchases: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          material: string
          owner_id: string
          project_id: string | null
          purchase_date: string | null
          quantity: string | null
          supplier_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          material: string
          owner_id: string
          project_id?: string | null
          purchase_date?: string | null
          quantity?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          material?: string
          owner_id?: string
          project_id?: string | null
          purchase_date?: string | null
          quantity?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          avg_delivery_days: number | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          materials_supplied: string | null
          observations: string | null
          owner_id: string
          rating: number | null
          whatsapp: string | null
        }
        Insert: {
          avg_delivery_days?: number | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          materials_supplied?: string | null
          observations?: string | null
          owner_id: string
          rating?: number | null
          whatsapp?: string | null
        }
        Update: {
          avg_delivery_days?: number | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          materials_supplied?: string | null
          observations?: string | null
          owner_id?: string
          rating?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_project_access: {
        Args: { project_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "marmorista" | "arquiteta"
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
      user_role: ["marmorista", "arquiteta"],
    },
  },
} as const
