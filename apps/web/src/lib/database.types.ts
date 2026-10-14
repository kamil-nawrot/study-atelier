export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      artwork_types: {
        Row: {
          code: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          position: number;
        };
        Update: {
          code?: string;
          position?: number;
        };
        Relationships: [];
      };
      artwork_values: {
        Row: {
          artwork_id: string;
          owner_id: string;
          position: number;
          value_id: string;
        };
        ComputedFields: never;
        Insert: {
          artwork_id: string;
          owner_id?: string;
          position?: number;
          value_id: string;
        };
        Update: {
          artwork_id?: string;
          owner_id?: string;
          position?: number;
          value_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artwork_values_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "artwork_values_value_id_owner_id_fkey";
            columns: ["value_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      artworks: {
        Row: {
          author_unknown: boolean;
          created_at: string;
          deleted_at: string | null;
          era_code: string | null;
          id: string;
          image_height: number | null;
          image_width: number | null;
          notes: string | null;
          own_image_path: string | null;
          own_image_url: string | null;
          owner_id: string;
          record_number: number;
          source_image_attribution: string | null;
          source_image_file: string | null;
          source_image_licence: string | null;
          source_image_licence_url: string | null;
          source_wikidata_id: string | null;
          title: string;
          type_code: string | null;
          updated_at: string;
          year: number | null;
          year_approximate: boolean;
        };
        ComputedFields: never;
        Insert: {
          author_unknown?: boolean;
          created_at?: string;
          deleted_at?: string | null;
          era_code?: string | null;
          id?: string;
          image_height?: number | null;
          image_width?: number | null;
          notes?: string | null;
          own_image_path?: string | null;
          own_image_url?: string | null;
          owner_id?: string;
          record_number: number;
          source_image_attribution?: string | null;
          source_image_file?: string | null;
          source_image_licence?: string | null;
          source_image_licence_url?: string | null;
          source_wikidata_id?: string | null;
          title: string;
          type_code?: string | null;
          updated_at?: string;
          year?: number | null;
          year_approximate?: boolean;
        };
        Update: {
          author_unknown?: boolean;
          created_at?: string;
          deleted_at?: string | null;
          era_code?: string | null;
          id?: string;
          image_height?: number | null;
          image_width?: number | null;
          notes?: string | null;
          own_image_path?: string | null;
          own_image_url?: string | null;
          owner_id?: string;
          record_number?: number;
          source_image_attribution?: string | null;
          source_image_file?: string | null;
          source_image_licence?: string | null;
          source_image_licence_url?: string | null;
          source_wikidata_id?: string | null;
          title?: string;
          type_code?: string | null;
          updated_at?: string;
          year?: number | null;
          year_approximate?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "artworks_era_code_fkey";
            columns: ["era_code"];
            isOneToOne: false;
            referencedRelation: "eras";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "artworks_type_code_fkey";
            columns: ["type_code"];
            isOneToOne: false;
            referencedRelation: "artwork_types";
            referencedColumns: ["code"];
          },
        ];
      };
      categories: {
        Row: {
          code: string;
          multiple: boolean;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          multiple: boolean;
          position: number;
        };
        Update: {
          code?: string;
          multiple?: boolean;
          position?: number;
        };
        Relationships: [];
      };
      category_values: {
        Row: {
          category_code: string;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_code: string;
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string;
        };
        Update: {
          category_code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_values_category_code_fkey";
            columns: ["category_code"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["code"];
          },
        ];
      };
      eras: {
        Row: {
          code: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          position: number;
        };
        Update: {
          code?: string;
          position?: number;
        };
        Relationships: [];
      };
      period_eras: {
        Row: {
          era_code: string;
          owner_id: string;
          value_id: string;
        };
        ComputedFields: never;
        Insert: {
          era_code: string;
          owner_id?: string;
          value_id: string;
        };
        Update: {
          era_code?: string;
          owner_id?: string;
          value_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "period_eras_era_code_fkey";
            columns: ["era_code"];
            isOneToOne: false;
            referencedRelation: "eras";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "period_eras_value_id_owner_id_fkey";
            columns: ["value_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      style_periods: {
        Row: {
          owner_id: string;
          period_id: string;
          style_id: string;
        };
        ComputedFields: never;
        Insert: {
          owner_id?: string;
          period_id: string;
          style_id: string;
        };
        Update: {
          owner_id?: string;
          period_id?: string;
          style_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "style_periods_period_id_owner_id_fkey";
            columns: ["period_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "style_periods_style_id_owner_id_fkey";
            columns: ["style_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_unused_value: {
        Args: { target_value: string };
        Returns: undefined;
      };
      keep_alive: { Args: Record<PropertyKey, never>; Returns: string };
      merge_category_values: {
        Args: { kept_id: string; merged_id: string };
        Returns: undefined;
      };
      period_era_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          artwork_count: number;
          era_code: string;
          period_id: string;
        }[];
      };
      save_artwork: {
        Args: { artwork: Json; existing_id?: string; values_by_category: Json };
        Returns: {
          id: string;
          record_number: number;
        }[];
      };
      set_period_eras: {
        Args: { era_codes: string[]; move_to?: string; target_period: string };
        Returns: number;
      };
      set_style_periods: {
        Args: { period_ids: string[]; target_style: string };
        Returns: undefined;
      };
      style_period_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          artwork_count: number;
          period_id: string;
          style_id: string;
        }[];
      };
      value_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          artwork_count: number;
          category_code: string;
          id: string;
          name: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
