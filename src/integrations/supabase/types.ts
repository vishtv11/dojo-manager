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
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      belt_tests: {
        Row: {
          certification_number: string | null
          created_at: string | null
          id: string
          notes: string | null
          result: Database["public"]["Enums"]["test_result"]
          student_id: string
          test_date: string
          test_fee: number
          tested_for_belt: Database["public"]["Enums"]["belt_level"]
          updated_at: string | null
        }
        Insert: {
          certification_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          result?: Database["public"]["Enums"]["test_result"]
          student_id: string
          test_date: string
          test_fee?: number
          tested_for_belt: Database["public"]["Enums"]["belt_level"]
          updated_at?: string | null
        }
        Update: {
          certification_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          result?: Database["public"]["Enums"]["test_result"]
          student_id?: string
          test_date?: string
          test_fee?: number
          tested_for_belt?: Database["public"]["Enums"]["belt_level"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "belt_tests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_fees: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          month: number
          notes: string | null
          paid_date: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          month: number
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          month?: number
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string
          age: number
          created_at: string | null
          current_belt: Database["public"]["Enums"]["belt_level"]
          date_of_birth: string
          fee_structure: Database["public"]["Enums"]["fee_structure"]
          gender: Database["public"]["Enums"]["gender_type"]
          guardian_name: string
          id: string
          instructor_name: string | null
          is_active: boolean | null
          name: string
          phone_number: string
          profile_photo_url: string | null
          state: string | null
          tai_certification_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string
          age: number
          created_at?: string | null
          current_belt?: Database["public"]["Enums"]["belt_level"]
          date_of_birth?: string
          fee_structure?: Database["public"]["Enums"]["fee_structure"]
          gender: Database["public"]["Enums"]["gender_type"]
          guardian_name: string
          id?: string
          instructor_name?: string | null
          is_active?: boolean | null
          name: string
          phone_number: string
          profile_photo_url?: string | null
          state?: string | null
          tai_certification_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string
          age?: number
          created_at?: string | null
          current_belt?: Database["public"]["Enums"]["belt_level"]
          date_of_birth?: string
          fee_structure?: Database["public"]["Enums"]["fee_structure"]
          gender?: Database["public"]["Enums"]["gender_type"]
          guardian_name?: string
          id?: string
          instructor_name?: string | null
          is_active?: boolean | null
          name?: string
          phone_number?: string
          profile_photo_url?: string | null
          state?: string | null
          tai_certification_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "viewer"
      attendance_status: "present" | "absent" | "late"
      belt_level:
        | "white"
        | "yellow"
        | "green"
        | "blue"
        | "red"
        | "black_1st_dan"
        | "black_2nd_dan"
        | "black_3rd_dan"
        | "black_4th_dan"
        | "black_5th_dan"
        | "yellow_stripe"
        | "green_stripe"
        | "blue_stripe"
        | "red_stripe"
        | "red_black"
      fee_structure: "2_classes_700" | "4_classes_1000"
      gender_type: "male" | "female" | "other"
      payment_status: "paid" | "unpaid" | "partial"
      test_result: "passed" | "failed" | "pending"
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
      app_role: ["admin", "instructor", "viewer"],
      attendance_status: ["present", "absent", "late"],
      belt_level: [
        "white",
        "yellow",
        "green",
        "blue",
        "red",
        "black_1st_dan",
        "black_2nd_dan",
        "black_3rd_dan",
        "black_4th_dan",
        "black_5th_dan",
        "yellow_stripe",
        "green_stripe",
        "blue_stripe",
        "red_stripe",
        "red_black",
      ],
      fee_structure: ["2_classes_700", "4_classes_1000"],
      gender_type: ["male", "female", "other"],
      payment_status: ["paid", "unpaid", "partial"],
      test_result: ["passed", "failed", "pending"],
    },
  },
} as const
