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
          favourite: boolean;
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
          year_approximate: boolean;
          year_from: number | null;
          year_to: number | null;
        };
        ComputedFields: never;
        Insert: {
          author_unknown?: boolean;
          created_at?: string;
          deleted_at?: string | null;
          era_code?: string | null;
          favourite?: boolean;
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
          year_approximate?: boolean;
          year_from?: number | null;
          year_to?: number | null;
        };
        Update: {
          author_unknown?: boolean;
          created_at?: string;
          deleted_at?: string | null;
          era_code?: string | null;
          favourite?: boolean;
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
          year_approximate?: boolean;
          year_from?: number | null;
          year_to?: number | null;
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
      author_details: {
        Row: {
          birth_year: number | null;
          category_code: string;
          death_year: number | null;
          image_height: number | null;
          image_width: number | null;
          notes: string | null;
          own_image_path: string | null;
          own_image_source_url: string | null;
          own_image_url: string | null;
          owner_id: string;
          sort_name: string | null;
          source_image_attribution: string | null;
          source_image_file: string | null;
          source_image_licence: string | null;
          source_image_licence_url: string | null;
          source_wikidata_id: string | null;
          summary: string | null;
          updated_at: string;
          value_id: string;
          years_approximate: boolean;
        };
        ComputedFields: never;
        Insert: {
          birth_year?: number | null;
          category_code?: string;
          death_year?: number | null;
          image_height?: number | null;
          image_width?: number | null;
          notes?: string | null;
          own_image_path?: string | null;
          own_image_source_url?: string | null;
          own_image_url?: string | null;
          owner_id?: string;
          sort_name?: string | null;
          source_image_attribution?: string | null;
          source_image_file?: string | null;
          source_image_licence?: string | null;
          source_image_licence_url?: string | null;
          source_wikidata_id?: string | null;
          summary?: string | null;
          updated_at?: string;
          value_id: string;
          years_approximate?: boolean;
        };
        Update: {
          birth_year?: number | null;
          category_code?: string;
          death_year?: number | null;
          image_height?: number | null;
          image_width?: number | null;
          notes?: string | null;
          own_image_path?: string | null;
          own_image_source_url?: string | null;
          own_image_url?: string | null;
          owner_id?: string;
          sort_name?: string | null;
          source_image_attribution?: string | null;
          source_image_file?: string | null;
          source_image_licence?: string | null;
          source_image_licence_url?: string | null;
          source_wikidata_id?: string | null;
          summary?: string | null;
          updated_at?: string;
          value_id?: string;
          years_approximate?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "author_details_value_id_owner_id_category_code_fkey";
            columns: ["value_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
        ];
      };
      catalogue_museums: {
        Row: {
          country_code: string;
          english_name: string | null;
          name: string;
          wikidata_id: string;
        };
        ComputedFields: never;
        Insert: {
          country_code: string;
          english_name?: string | null;
          name: string;
          wikidata_id: string;
        };
        Update: {
          country_code?: string;
          english_name?: string | null;
          name?: string;
          wikidata_id?: string;
        };
        Relationships: [];
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
      era_details: {
        Row: {
          era_code: string;
          notes: string | null;
          owner_id: string;
          summary: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          era_code: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
        };
        Update: {
          era_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "era_details_era_code_fkey";
            columns: ["era_code"];
            isOneToOne: false;
            referencedRelation: "eras";
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
      feedback: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          kind: string;
          owner_id: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          kind: string;
          owner_id?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          kind?: string;
          owner_id?: string;
          title?: string;
        };
        Relationships: [];
      };
      glossary_entries: {
        Row: {
          category: string;
          created_at: string;
          definition: string | null;
          forms: string[];
          id: string;
          name: string;
          owner_id: string;
          source_fetched_on: string | null;
          source_licence: string | null;
          source_title: string | null;
          source_url: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          created_at?: string;
          definition?: string | null;
          forms?: string[];
          id?: string;
          name: string;
          owner_id?: string;
          source_fetched_on?: string | null;
          source_licence?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          definition?: string | null;
          forms?: string[];
          id?: string;
          name?: string;
          owner_id?: string;
          source_fetched_on?: string | null;
          source_licence?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_details: {
        Row: {
          catalogue_wikidata_id: string | null;
          category_code: string;
          country_code: string | null;
          notes: string | null;
          owner_id: string;
          place_type: string | null;
          summary: string | null;
          updated_at: string;
          value_id: string;
        };
        ComputedFields: never;
        Insert: {
          catalogue_wikidata_id?: string | null;
          category_code?: string;
          country_code?: string | null;
          notes?: string | null;
          owner_id?: string;
          place_type?: string | null;
          summary?: string | null;
          updated_at?: string;
          value_id: string;
        };
        Update: {
          catalogue_wikidata_id?: string | null;
          category_code?: string;
          country_code?: string | null;
          notes?: string | null;
          owner_id?: string;
          place_type?: string | null;
          summary?: string | null;
          updated_at?: string;
          value_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "location_details_catalogue_wikidata_id_fkey";
            columns: ["catalogue_wikidata_id"];
            isOneToOne: false;
            referencedRelation: "catalogue_museums";
            referencedColumns: ["wikidata_id"];
          },
          {
            foreignKeyName: "location_details_value_id_owner_id_category_code_fkey";
            columns: ["value_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
        ];
      };
      material_details: {
        Row: {
          category_code: string;
          notes: string | null;
          owner_id: string;
          summary: string | null;
          updated_at: string;
          value_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
          value_id: string;
        };
        Update: {
          category_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
          value_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_details_value_id_owner_id_category_code_fkey";
            columns: ["value_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
        ];
      };
      period_details: {
        Row: {
          category_code: string;
          notes: string | null;
          owner_id: string;
          summary: string | null;
          updated_at: string;
          value_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
          value_id: string;
        };
        Update: {
          category_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
          value_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "period_details_value_id_owner_id_category_code_fkey";
            columns: ["value_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
        ];
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
      review_cards: {
        Row: {
          artwork_id: string;
          created_at: string;
          difficulty: number;
          due: string;
          facet: string;
          lapses: number;
          last_review: string | null;
          learning_steps: number;
          owner_id: string;
          reps: number;
          scheduled_days: number;
          stability: number;
          state: number;
        };
        ComputedFields: never;
        Insert: {
          artwork_id: string;
          created_at?: string;
          difficulty: number;
          due: string;
          facet?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          owner_id?: string;
          reps?: number;
          scheduled_days?: number;
          stability: number;
          state: number;
        };
        Update: {
          artwork_id?: string;
          created_at?: string;
          difficulty?: number;
          due?: string;
          facet?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          owner_id?: string;
          reps?: number;
          scheduled_days?: number;
          stability?: number;
          state?: number;
        };
        Relationships: [
          {
            foreignKeyName: "review_cards_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      review_log: {
        Row: {
          answer_ms: number | null;
          artwork_id: string;
          correct: boolean | null;
          facet: string;
          id: number;
          mode: string;
          owner_id: string;
          rating: number;
          reviewed_at: string;
        };
        ComputedFields: never;
        Insert: {
          answer_ms?: number | null;
          artwork_id: string;
          correct?: boolean | null;
          facet?: string;
          id?: never;
          mode: string;
          owner_id?: string;
          rating: number;
          reviewed_at?: string;
        };
        Update: {
          answer_ms?: number | null;
          artwork_id?: string;
          correct?: boolean | null;
          facet?: string;
          id?: never;
          mode?: string;
          owner_id?: string;
          rating?: number;
          reviewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_log_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      style_details: {
        Row: {
          category_code: string;
          notes: string | null;
          owner_id: string;
          summary: string | null;
          updated_at: string;
          value_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
          value_id: string;
        };
        Update: {
          category_code?: string;
          notes?: string | null;
          owner_id?: string;
          summary?: string | null;
          updated_at?: string;
          value_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "style_details_value_id_owner_id_category_code_fkey";
            columns: ["value_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
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
      record_review: {
        Args: { answer: Json; card: Json; target_artwork: string };
        Returns: undefined;
      };
      review_counts: {
        Args: { day_start: string };
        Returns: {
          due: number;
          new_available: number;
          new_today: number;
          with_image: number;
        }[];
      };
      review_session: {
        Args: {
          day_start: string;
          scope_kind?: string;
          scope_value?: string;
          session_form?: string;
        };
        Returns: Json;
      };
      save_artwork: {
        Args: { artwork: Json; existing_id?: string; values_by_category: Json };
        Returns: {
          id: string;
          record_number: number;
        }[];
      };
      save_era_details: {
        Args: { details: Json; target_era: string };
        Returns: undefined;
      };
      save_value_details: {
        Args: { details: Json; target_value: string };
        Returns: undefined;
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
      value_page_content: {
        Args: { target_value: string };
        Returns: {
          has_content: boolean;
          own_image_path: string;
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
