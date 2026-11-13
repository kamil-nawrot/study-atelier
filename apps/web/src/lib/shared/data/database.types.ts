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
      announcements: {
        Row: {
          body: string;
          created_at: string;
          ends_at: string | null;
          id: string;
          starts_at: string;
          title: string | null;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          starts_at?: string;
          title?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          starts_at?: string;
          title?: string | null;
        };
        Relationships: [];
      };
      artwork_field_entries: {
        Row: {
          artwork_id: string;
          field_id: string;
          field_kind: string;
          owner_id: string;
          text_value: string | null;
        };
        ComputedFields: never;
        Insert: {
          artwork_id: string;
          field_id: string;
          field_kind: string;
          owner_id?: string;
          text_value?: string | null;
        };
        Update: {
          artwork_id?: string;
          field_id?: string;
          field_kind?: string;
          owner_id?: string;
          text_value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "artwork_field_entries_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "artwork_field_entries_field_id_owner_id_field_kind_fkey";
            columns: ["field_id", "owner_id", "field_kind"];
            isOneToOne: false;
            referencedRelation: "artwork_fields";
            referencedColumns: ["id", "owner_id", "kind"];
          },
        ];
      };
      artwork_fields: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          kind: string;
          multiple: boolean;
          name: string;
          owner_id: string;
          position: number;
          type_codes: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          kind: string;
          multiple?: boolean;
          name: string;
          owner_id?: string;
          position?: number;
          type_codes?: string[];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          kind?: string;
          multiple?: boolean;
          name?: string;
          owner_id?: string;
          position?: number;
          type_codes?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      artwork_images: {
        Row: {
          artwork_id: string;
          id: string;
          image_height: number | null;
          image_width: number | null;
          own_image_path: string | null;
          own_image_url: string | null;
          owner_id: string;
          palette: Json | null;
          position: number;
          source_image_attribution: string | null;
          source_image_file: string | null;
          source_image_licence: string | null;
          source_image_licence_url: string | null;
          source_wikidata_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          artwork_id: string;
          id?: string;
          image_height?: number | null;
          image_width?: number | null;
          own_image_path?: string | null;
          own_image_url?: string | null;
          owner_id?: string;
          palette?: Json | null;
          position: number;
          source_image_attribution?: string | null;
          source_image_file?: string | null;
          source_image_licence?: string | null;
          source_image_licence_url?: string | null;
          source_wikidata_id?: string | null;
        };
        Update: {
          artwork_id?: string;
          id?: string;
          image_height?: number | null;
          image_width?: number | null;
          own_image_path?: string | null;
          own_image_url?: string | null;
          owner_id?: string;
          palette?: Json | null;
          position?: number;
          source_image_attribution?: string | null;
          source_image_file?: string | null;
          source_image_licence?: string | null;
          source_image_licence_url?: string | null;
          source_wikidata_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "artwork_images_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      artwork_pins: {
        Row: {
          created_at: string;
          crop_path: string | null;
          glossary_entry_id: string | null;
          id: string;
          image_id: string;
          owner_id: string;
          symbol_id: string | null;
          symbol_meaning_id: string | null;
          text: string | null;
          view_width: number | null;
          x: number;
          y: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          crop_path?: string | null;
          glossary_entry_id?: string | null;
          id?: string;
          image_id: string;
          owner_id?: string;
          symbol_id?: string | null;
          symbol_meaning_id?: string | null;
          text?: string | null;
          view_width?: number | null;
          x: number;
          y: number;
        };
        Update: {
          created_at?: string;
          crop_path?: string | null;
          glossary_entry_id?: string | null;
          id?: string;
          image_id?: string;
          owner_id?: string;
          symbol_id?: string | null;
          symbol_meaning_id?: string | null;
          text?: string | null;
          view_width?: number | null;
          x?: number;
          y?: number;
        };
        Relationships: [
          {
            foreignKeyName: "artwork_pins_glossary_entry_id_owner_id_fkey";
            columns: ["glossary_entry_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "glossary_entries";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "artwork_pins_image_id_owner_id_fkey";
            columns: ["image_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artwork_images";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "artwork_pins_symbol_id_owner_id_fkey";
            columns: ["symbol_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "symbols";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "artwork_pins_symbol_meaning_id_symbol_id_fkey";
            columns: ["symbol_meaning_id", "symbol_id"];
            isOneToOne: false;
            referencedRelation: "symbol_meanings";
            referencedColumns: ["id", "symbol_id"];
          },
        ];
      };
      artwork_relations: {
        Row: {
          created_at: string;
          from_id: string;
          kind: string;
          owner_id: string;
          to_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_id: string;
          kind: string;
          owner_id?: string;
          to_id: string;
        };
        Update: {
          created_at?: string;
          from_id?: string;
          kind?: string;
          owner_id?: string;
          to_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artwork_relations_from_id_owner_id_fkey";
            columns: ["from_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "artwork_relations_to_id_owner_id_fkey";
            columns: ["to_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
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
          notes: string | null;
          owner_id: string;
          record_number: number;
          title: string;
          type_code: string | null;
          updated_at: string;
          want_to_see: boolean;
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
          notes?: string | null;
          owner_id?: string;
          record_number: number;
          title: string;
          type_code?: string | null;
          updated_at?: string;
          want_to_see?: boolean;
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
          notes?: string | null;
          owner_id?: string;
          record_number?: number;
          title?: string;
          type_code?: string | null;
          updated_at?: string;
          want_to_see?: boolean;
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
          country: string | null;
          death_year: number | null;
          image_height: number | null;
          image_width: number | null;
          notes: string | null;
          own_image_path: string | null;
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
          country?: string | null;
          death_year?: number | null;
          image_height?: number | null;
          image_width?: number | null;
          notes?: string | null;
          own_image_path?: string | null;
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
          country?: string | null;
          death_year?: number | null;
          image_height?: number | null;
          image_width?: number | null;
          notes?: string | null;
          own_image_path?: string | null;
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
      author_relations: {
        Row: {
          category_code: string;
          created_at: string;
          from_id: string;
          kind: string;
          owner_id: string;
          to_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_code?: string;
          created_at?: string;
          from_id: string;
          kind: string;
          owner_id?: string;
          to_id: string;
        };
        Update: {
          category_code?: string;
          created_at?: string;
          from_id?: string;
          kind?: string;
          owner_id?: string;
          to_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "author_relations_from_id_owner_id_category_code_fkey";
            columns: ["from_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
          {
            foreignKeyName: "author_relations_to_id_owner_id_category_code_fkey";
            columns: ["to_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
        ];
      };
      catalogue_museums: {
        Row: {
          alias: string | null;
          country_code: string;
          latitude: number;
          longitude: number;
          name: string;
          wikidata_id: string;
        };
        ComputedFields: never;
        Insert: {
          alias?: string | null;
          country_code: string;
          latitude: number;
          longitude: number;
          name: string;
          wikidata_id: string;
        };
        Update: {
          alias?: string | null;
          country_code?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          wikidata_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          code: string;
          field_id: string | null;
          multiple: boolean;
          owner_id: string | null;
          position: number | null;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          field_id?: string | null;
          multiple: boolean;
          owner_id?: string | null;
          position?: number | null;
        };
        Update: {
          code?: string;
          field_id?: string | null;
          multiple?: boolean;
          owner_id?: string | null;
          position?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_field_fkey";
            columns: ["field_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artwork_fields";
            referencedColumns: ["id", "owner_id"];
          },
        ];
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
      exhibit_rooms: {
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
      exhibit_tiers: {
        Row: {
          exhibit: string;
          owner_id: string;
          seen_at: string | null;
          tier: number;
          tiers: number | null;
          unlocked_at: string;
        };
        ComputedFields: never;
        Insert: {
          exhibit: string;
          owner_id?: string;
          seen_at?: string | null;
          tier: number;
          tiers?: number | null;
          unlocked_at?: string;
        };
        Update: {
          exhibit?: string;
          owner_id?: string;
          seen_at?: string | null;
          tier?: number;
          tiers?: number | null;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exhibit_tiers_exhibit_fkey";
            columns: ["exhibit"];
            isOneToOne: false;
            referencedRelation: "exhibits";
            referencedColumns: ["code"];
          },
        ];
      };
      exhibition_artworks: {
        Row: {
          artwork_id: string;
          exhibition_id: string;
          owner_id: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          artwork_id: string;
          exhibition_id: string;
          owner_id?: string;
          position: number;
        };
        Update: {
          artwork_id?: string;
          exhibition_id?: string;
          owner_id?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "exhibition_artworks_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "exhibition_artworks_exhibition_id_owner_id_fkey";
            columns: ["exhibition_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "exhibitions";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      exhibitions: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          document: NonNullable<Json>;
          format: number;
          id: string;
          owner_id: string;
          revision: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          document?: NonNullable<Json>;
          format?: number;
          id?: string;
          owner_id?: string;
          revision?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          document?: NonNullable<Json>;
          format?: number;
          id?: string;
          owner_id?: string;
          revision?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exhibits: {
        Row: {
          code: string;
          hidden: boolean;
          position: number;
          room_code: string;
          thresholds: number[];
        };
        ComputedFields: never;
        Insert: {
          code: string;
          hidden: boolean;
          position: number;
          room_code: string;
          thresholds: number[];
        };
        Update: {
          code?: string;
          hidden?: boolean;
          position?: number;
          room_code?: string;
          thresholds?: number[];
        };
        Relationships: [
          {
            foreignKeyName: "exhibits_room_code_fkey";
            columns: ["room_code"];
            isOneToOne: false;
            referencedRelation: "exhibit_rooms";
            referencedColumns: ["code"];
          },
        ];
      };
      feedback: {
        Row: {
          browser: string | null;
          created_at: string;
          description: string | null;
          id: string;
          kind: string;
          notified_at: string | null;
          owner_id: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          browser?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          kind: string;
          notified_at?: string | null;
          owner_id?: string;
          title: string;
        };
        Update: {
          browser?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          kind?: string;
          notified_at?: string | null;
          owner_id?: string;
          title?: string;
        };
        Relationships: [];
      };
      free_review_days: {
        Row: {
          answers: number;
          day_start: string;
          owner_id: string;
        };
        ComputedFields: never;
        Insert: {
          answers: number;
          day_start: string;
          owner_id?: string;
        };
        Update: {
          answers?: number;
          day_start?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      glossary_entries: {
        Row: {
          category: string;
          created_at: string;
          definition: string | null;
          forms: string[];
          has_definition: boolean | null;
          id: string;
          name: string;
          owner_id: string;
          sort_name: string | null;
          source_fetched_on: string | null;
          source_licence: string | null;
          source_title: string | null;
          source_url: string | null;
          synonyms: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          created_at?: string;
          definition?: string | null;
          forms?: string[];
          has_definition?: never;
          id?: string;
          name: string;
          owner_id?: string;
          sort_name?: string | null;
          source_fetched_on?: string | null;
          source_licence?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          synonyms?: string[];
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          definition?: string | null;
          forms?: string[];
          has_definition?: never;
          id?: string;
          name?: string;
          owner_id?: string;
          sort_name?: string | null;
          source_fetched_on?: string | null;
          source_licence?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          synonyms?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      location_details: {
        Row: {
          catalogue_wikidata_id: string | null;
          category_code: string;
          city_id: string | null;
          country_code: string | null;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          owner_id: string;
          place_type: string | null;
          summary: string | null;
          updated_at: string;
          value_id: string;
          wikidata_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          catalogue_wikidata_id?: string | null;
          category_code?: string;
          city_id?: string | null;
          country_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          owner_id?: string;
          place_type?: string | null;
          summary?: string | null;
          updated_at?: string;
          value_id: string;
          wikidata_id?: string | null;
        };
        Update: {
          catalogue_wikidata_id?: string | null;
          category_code?: string;
          city_id?: string | null;
          country_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          owner_id?: string;
          place_type?: string | null;
          summary?: string | null;
          updated_at?: string;
          value_id?: string;
          wikidata_id?: string | null;
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
            foreignKeyName: "location_details_city_fkey";
            columns: ["city_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
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
      note_links: {
        Row: {
          id: number;
          owner_id: string;
          source_artwork_id: string | null;
          source_era_code: string | null;
          source_value_id: string | null;
          source_visit_id: string | null;
          target_artwork_id: string | null;
          target_era_code: string | null;
          target_value_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          id?: never;
          owner_id?: string;
          source_artwork_id?: string | null;
          source_era_code?: string | null;
          source_value_id?: string | null;
          source_visit_id?: string | null;
          target_artwork_id?: string | null;
          target_era_code?: string | null;
          target_value_id?: string | null;
        };
        Update: {
          id?: never;
          owner_id?: string;
          source_artwork_id?: string | null;
          source_era_code?: string | null;
          source_value_id?: string | null;
          source_visit_id?: string | null;
          target_artwork_id?: string | null;
          target_era_code?: string | null;
          target_value_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "note_links_source_artwork_fkey";
            columns: ["source_artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "note_links_source_era_fkey";
            columns: ["owner_id", "source_era_code"];
            isOneToOne: false;
            referencedRelation: "era_details";
            referencedColumns: ["owner_id", "era_code"];
          },
          {
            foreignKeyName: "note_links_source_value_fkey";
            columns: ["source_value_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "note_links_source_visit_fkey";
            columns: ["source_visit_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "note_links_target_artwork_fkey";
            columns: ["target_artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "note_links_target_era_code_fkey";
            columns: ["target_era_code"];
            isOneToOne: false;
            referencedRelation: "eras";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "note_links_target_value_fkey";
            columns: ["target_value_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
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
      point_events: {
        Row: {
          answers: number | null;
          code: string | null;
          day_start: string | null;
          id: number;
          item_id: string | null;
          kind: string;
          occurred_at: string;
          owner_id: string;
          plan_share: number | null;
          streak_days: number | null;
        };
        ComputedFields: never;
        Insert: {
          answers?: number | null;
          code?: string | null;
          day_start?: string | null;
          id?: never;
          item_id?: string | null;
          kind: string;
          occurred_at?: string;
          owner_id?: string;
          plan_share?: number | null;
          streak_days?: number | null;
        };
        Update: {
          answers?: number | null;
          code?: string | null;
          day_start?: string | null;
          id?: never;
          item_id?: string | null;
          kind?: string;
          occurred_at?: string;
          owner_id?: string;
          plan_share?: number | null;
          streak_days?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          career_shown: boolean;
          created_at: string;
          display_name: string | null;
          era_bounds: number[] | null;
          fetch_definition: boolean;
          fetch_event: boolean;
          fetch_forms: boolean;
          fetch_image: boolean;
          legal_accepted_at: string | null;
          legal_version: string | null;
          long_look_at: string | null;
          night_light_at: string | null;
          owner_id: string;
          rank_form: string;
          rank_seen: number;
          review_form: string;
          review_free: boolean;
          review_glossary_on: boolean;
          review_glossary_questions: number;
          review_new_per_day: number;
          review_note_questions: boolean;
          review_quiz_kinds: string[];
          review_session_size: number;
          review_symbol_questions: number;
          review_time_questions: boolean;
          updated_at: string;
          view_loupe_on: boolean;
          view_show_pins: boolean;
        };
        ComputedFields: never;
        Insert: {
          avatar_path?: string | null;
          career_shown?: boolean;
          created_at?: string;
          display_name?: string | null;
          era_bounds?: number[] | null;
          fetch_definition?: boolean;
          fetch_event?: boolean;
          fetch_forms?: boolean;
          fetch_image?: boolean;
          legal_accepted_at?: string | null;
          legal_version?: string | null;
          long_look_at?: string | null;
          night_light_at?: string | null;
          owner_id?: string;
          rank_form?: string;
          rank_seen?: number;
          review_form?: string;
          review_free?: boolean;
          review_glossary_on?: boolean;
          review_glossary_questions?: number;
          review_new_per_day?: number;
          review_note_questions?: boolean;
          review_quiz_kinds?: string[];
          review_session_size?: number;
          review_symbol_questions?: number;
          review_time_questions?: boolean;
          updated_at?: string;
          view_loupe_on?: boolean;
          view_show_pins?: boolean;
        };
        Update: {
          avatar_path?: string | null;
          career_shown?: boolean;
          created_at?: string;
          display_name?: string | null;
          era_bounds?: number[] | null;
          fetch_definition?: boolean;
          fetch_event?: boolean;
          fetch_forms?: boolean;
          fetch_image?: boolean;
          legal_accepted_at?: string | null;
          legal_version?: string | null;
          long_look_at?: string | null;
          night_light_at?: string | null;
          owner_id?: string;
          rank_form?: string;
          rank_seen?: number;
          review_form?: string;
          review_free?: boolean;
          review_glossary_on?: boolean;
          review_glossary_questions?: number;
          review_new_per_day?: number;
          review_note_questions?: boolean;
          review_quiz_kinds?: string[];
          review_session_size?: number;
          review_symbol_questions?: number;
          review_time_questions?: boolean;
          updated_at?: string;
          view_loupe_on?: boolean;
          view_show_pins?: boolean;
        };
        Relationships: [];
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
          due_before: string | null;
          facet: string;
          guessed_year: number | null;
          id: number;
          mode: string;
          owner_id: string;
          rating: number;
          reviewed_at: string;
          wrong_answer: string | null;
          year_miss: number | null;
        };
        ComputedFields: never;
        Insert: {
          answer_ms?: number | null;
          artwork_id: string;
          correct?: boolean | null;
          due_before?: string | null;
          facet?: string;
          guessed_year?: number | null;
          id?: never;
          mode: string;
          owner_id?: string;
          rating: number;
          reviewed_at?: string;
          wrong_answer?: string | null;
          year_miss?: number | null;
        };
        Update: {
          answer_ms?: number | null;
          artwork_id?: string;
          correct?: boolean | null;
          due_before?: string | null;
          facet?: string;
          guessed_year?: number | null;
          id?: never;
          mode?: string;
          owner_id?: string;
          rating?: number;
          reviewed_at?: string;
          wrong_answer?: string | null;
          year_miss?: number | null;
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
      symbol_meaning_contexts: {
        Row: {
          artwork_id: string | null;
          era_code: string | null;
          glossary_entry_id: string | null;
          id: string;
          meaning_id: string;
          owner_id: string;
          position: number;
          text: string | null;
          value_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          artwork_id?: string | null;
          era_code?: string | null;
          glossary_entry_id?: string | null;
          id?: string;
          meaning_id: string;
          owner_id?: string;
          position: number;
          text?: string | null;
          value_id?: string | null;
        };
        Update: {
          artwork_id?: string | null;
          era_code?: string | null;
          glossary_entry_id?: string | null;
          id?: string;
          meaning_id?: string;
          owner_id?: string;
          position?: number;
          text?: string | null;
          value_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "symbol_meaning_contexts_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "symbol_meaning_contexts_era_code_fkey";
            columns: ["era_code"];
            isOneToOne: false;
            referencedRelation: "eras";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "symbol_meaning_contexts_glossary_entry_id_owner_id_fkey";
            columns: ["glossary_entry_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "glossary_entries";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "symbol_meaning_contexts_meaning_id_owner_id_fkey";
            columns: ["meaning_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "symbol_meanings";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "symbol_meaning_contexts_value_id_owner_id_fkey";
            columns: ["value_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      symbol_meanings: {
        Row: {
          id: string;
          owner_id: string;
          position: number;
          symbol_id: string;
          text: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          owner_id?: string;
          position: number;
          symbol_id: string;
          text: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          position?: number;
          symbol_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "symbol_meanings_symbol_id_owner_id_fkey";
            columns: ["symbol_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "symbols";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      symbols: {
        Row: {
          cover_pin_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cover_pin_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id?: string;
          updated_at?: string;
        };
        Update: {
          cover_pin_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "symbols_cover_pin_id_fkey";
            columns: ["cover_pin_id"];
            isOneToOne: false;
            referencedRelation: "artwork_pins";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline_events: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          source_fetched_on: string | null;
          source_licence: string | null;
          source_title: string | null;
          source_url: string | null;
          updated_at: string;
          year_approximate: boolean;
          year_from: number | null;
          year_to: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id?: string;
          source_fetched_on?: string | null;
          source_licence?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          updated_at?: string;
          year_approximate?: boolean;
          year_from?: number | null;
          year_to: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          source_fetched_on?: string | null;
          source_licence?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          updated_at?: string;
          year_approximate?: boolean;
          year_from?: number | null;
          year_to?: number;
        };
        Relationships: [];
      };
      visit_artworks: {
        Row: {
          artwork_id: string;
          owner_id: string;
          visit_id: string;
        };
        ComputedFields: never;
        Insert: {
          artwork_id: string;
          owner_id?: string;
          visit_id: string;
        };
        Update: {
          artwork_id?: string;
          owner_id?: string;
          visit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visit_artworks_artwork_id_owner_id_fkey";
            columns: ["artwork_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "visit_artworks_visit_id_owner_id_fkey";
            columns: ["visit_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
      visits: {
        Row: {
          category_code: string;
          created_at: string;
          date_precision: string;
          ends_on: string | null;
          id: string;
          kind: string;
          notes: string | null;
          owner_id: string;
          place_id: string;
          trip_id: string | null;
          updated_at: string;
          visited_on: string;
        };
        ComputedFields: never;
        Insert: {
          category_code?: string;
          created_at?: string;
          date_precision: string;
          ends_on?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          owner_id?: string;
          place_id: string;
          trip_id?: string | null;
          updated_at?: string;
          visited_on: string;
        };
        Update: {
          category_code?: string;
          created_at?: string;
          date_precision?: string;
          ends_on?: string | null;
          id?: string;
          kind?: string;
          notes?: string | null;
          owner_id?: string;
          place_id?: string;
          trip_id?: string | null;
          updated_at?: string;
          visited_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visits_place_id_owner_id_category_code_fkey";
            columns: ["place_id", "owner_id", "category_code"];
            isOneToOne: false;
            referencedRelation: "category_values";
            referencedColumns: ["id", "owner_id", "category_code"];
          },
          {
            foreignKeyName: "visits_trip_id_owner_id_fkey";
            columns: ["trip_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      artwork_field_type_impact: {
        Args: { target_field: string; type_codes: string[] };
        Returns: number;
      };
      artwork_field_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          artwork_count: number;
          field_id: string;
        }[];
      };
      atelier_empty: { Args: Record<PropertyKey, never>; Returns: boolean };
      card_index: { Args: Record<PropertyKey, never>; Returns: Json };
      career_standing: {
        Args: { time_zone: string; unlock: boolean };
        Returns: {
          new_tiers: number;
          points: number;
          rank_seen: number;
        }[];
      };
      collection_statistics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      delete_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      delete_unused_value: {
        Args: { target_value: string };
        Returns: undefined;
      };
      deleted_account_images: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      duplicate_candidates: {
        Args: { title: string };
        Returns: {
          authors: string[];
          id: string;
          record_number: number;
          title: string;
        }[];
      };
      ensure_city_place: {
        Args: {
          city_name: string;
          country_code?: string;
          latitude?: number;
          longitude?: number;
          wikidata_id?: string;
        };
        Returns: string;
      };
      import_atelier: { Args: { payload: Json }; Returns: Json };
      keep_alive: { Args: Record<PropertyKey, never>; Returns: string };
      learner_points: { Args: Record<PropertyKey, never>; Returns: number };
      mastered_artworks: { Args: { artwork_ids: string[] }; Returns: number };
      merge_category_values: {
        Args: { kept_id: string; merged_id: string };
        Returns: undefined;
      };
      move_artwork_field: {
        Args: { direction: number; target_field: string };
        Returns: undefined;
      };
      note_gap_artwork: {
        Args: {
          excluded?: string[];
          scope_kind?: string;
          scope_value?: string;
        };
        Returns: Json;
      };
      note_link_labels: {
        Args: {
          artwork_number?: number;
          era_code?: string;
          value_id?: string;
          visit_id?: string;
        };
        Returns: {
          id: string;
          kind: string;
          record_number: number;
          title: string;
        }[];
      };
      note_link_mentions: {
        Args: { artwork_number?: number; era_code?: string; value_id?: string };
        Returns: {
          id: string;
          kind: string;
          record_number: number;
          title: string;
        }[];
      };
      note_link_suggestions: {
        Args: { link_trigger: string; phrase: string };
        Returns: {
          authors: string[];
          id: string;
          kind: string;
          parents: string[];
          record_number: number;
          title: string;
        }[];
      };
      period_era_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          artwork_count: number;
          era_code: string;
          period_id: string;
        }[];
      };
      record_free_answers: {
        Args: { answers: number; day_start: string };
        Returns: undefined;
      };
      record_long_look: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      record_night_light: { Args: { time_zone: string }; Returns: boolean };
      record_review: {
        Args: {
          answer: Json;
          card: Json;
          day_start?: string;
          target_artwork: string;
          time_zone?: string;
        };
        Returns: undefined;
      };
      record_right_answer: { Args: { day_start: string }; Returns: undefined };
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
          free_round?: number;
          scope_kind?: string;
          scope_value?: string;
          session_form?: string;
          time_questions?: boolean;
        };
        Returns: Json;
      };
      review_streak: {
        Args: { day_start: string; time_zone: string };
        Returns: number;
      };
      save_artwork: {
        Args: {
          artwork: Json;
          existing_id?: string;
          field_entries?: Json;
          images?: Json;
          relations?: Json;
          values_by_category: Json;
        };
        Returns: {
          id: string;
          record_number: number;
        }[];
      };
      save_era_details: {
        Args: { details: Json; target_era: string };
        Returns: undefined;
      };
      save_exhibition: {
        Args: {
          exhibition_id: string;
          expected_revision?: number;
          new_document: Json;
          new_title: string;
        };
        Returns: number;
      };
      save_symbol: {
        Args: {
          new_description?: string;
          new_meanings: Json;
          new_name: string;
          symbol_id?: string;
        };
        Returns: string;
      };
      save_value_details: {
        Args: { details: Json; target_value: string };
        Returns: undefined;
      };
      save_visit: {
        Args: {
          artwork_ids: string[];
          existing_id?: string;
          place: string;
          visit: Json;
        };
        Returns: string;
      };
      search_key: { Args: { value: string }; Returns: string };
      set_period_eras: {
        Args: { era_codes: string[]; move_to?: string; target_period: string };
        Returns: number;
      };
      set_place_point: {
        Args: {
          latitude: number;
          longitude: number;
          place: string;
          wikidata_id?: string;
        };
        Returns: undefined;
      };
      set_style_periods: {
        Args: { period_ids: string[]; target_style: string };
        Returns: undefined;
      };
      set_symbol_cover: {
        Args: { pin_id?: string; symbol_id: string };
        Returns: undefined;
      };
      storage_has_room: { Args: { adding: number }; Returns: boolean };
      storage_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          quota_bytes: number;
          used_bytes: number;
        }[];
      };
      style_period_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          artwork_count: number;
          period_id: string;
          style_id: string;
        }[];
      };
      symbol_atlas: {
        Args: Record<PropertyKey, never>;
        Returns: {
          cover: Json;
          created_at: string;
          id: string;
          meaning_count: number;
          name: string;
          pin_count: number;
        }[];
      };
      term_mentions: {
        Args: { needles: string[] };
        Returns: {
          id: string;
          kind: string;
          notes: string;
          record_number: number;
          title: string;
        }[];
      };
      unlock_exhibits: {
        Args: { time_zone: string };
        Returns: {
          exhibit: string;
          hidden: boolean;
          room: string;
          thresholds: number[];
          value: number;
        }[];
      };
      unused_images: { Args: Record<PropertyKey, never>; Returns: string[] };
      used_category_values: {
        Args: Record<PropertyKey, never>;
        Returns: {
          category_code: string;
          name: string;
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
          visit_count: number;
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
