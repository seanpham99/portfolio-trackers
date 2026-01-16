export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          asset_class: string;
          created_at: string | null;
          currency: string;
          exchange: string | null;
          id: string;
          industry: string | null;
          logo_url: string | null;
          market: string | null;
          metadata: Json | null;
          name_en: string;
          name_local: string | null;
          sector: string | null;
          source: string | null;
          symbol: string;
          updated_at: string | null;
        };
        Insert: {
          asset_class: string;
          created_at?: string | null;
          currency: string;
          exchange?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          market?: string | null;
          metadata?: Json | null;
          name_en: string;
          name_local?: string | null;
          sector?: string | null;
          source?: string | null;
          symbol: string;
          updated_at?: string | null;
        };
        Update: {
          asset_class?: string;
          created_at?: string | null;
          currency?: string;
          exchange?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          market?: string | null;
          metadata?: Json | null;
          name_en?: string;
          name_local?: string | null;
          sector?: string | null;
          source?: string | null;
          symbol?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      portfolios: {
        Row: {
          base_currency: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          base_currency: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          base_currency?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          asset_id: string;
          created_at: string | null;
          exchange_rate: number | null;
          fee: number | null;
          id: string;
          notes: string | null;
          portfolio_id: string;
          price: number;
          quantity: number;
          total: number | null;
          transaction_date: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          asset_id: string;
          created_at?: string | null;
          exchange_rate?: number | null;
          fee?: number | null;
          id?: string;
          notes?: string | null;
          portfolio_id: string;
          price: number;
          quantity: number;
          total?: number | null;
          transaction_date?: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          asset_id?: string;
          created_at?: string | null;
          exchange_rate?: number | null;
          fee?: number | null;
          id?: string;
          notes?: string | null;
          portfolio_id?: string;
          price?: number;
          quantity?: number;
          total?: number | null;
          transaction_date?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_portfolio_id_fkey";
            columns: ["portfolio_id"];
            isOneToOne: false;
            referencedRelation: "portfolios";
            referencedColumns: ["id"];
          },
        ];
      };
      user_connections: {
        Row: {
          api_key: string;
          api_secret_encrypted: string;
          created_at: string | null;
          exchange_id: Database["public"]["Enums"]["exchange_id"];
          id: string;
          last_synced_at: string | null;
          status: Database["public"]["Enums"]["connection_status"] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          api_key: string;
          api_secret_encrypted: string;
          created_at?: string | null;
          exchange_id: Database["public"]["Enums"]["exchange_id"];
          id?: string;
          last_synced_at?: string | null;
          status?: Database["public"]["Enums"]["connection_status"] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          api_key?: string;
          api_secret_encrypted?: string;
          created_at?: string | null;
          exchange_id?: Database["public"]["Enums"]["exchange_id"];
          id?: string;
          last_synced_at?: string | null;
          status?: Database["public"]["Enums"]["connection_status"] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          audit_metadata: Json;
          consent_at: string;
          consent_granted: boolean;
          consent_version: string;
          created_at: string;
          currency: string;
          id: string;
          refresh_interval: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          audit_metadata?: Json;
          consent_at?: string;
          consent_granted?: boolean;
          consent_version: string;
          created_at?: string;
          currency?: string;
          id?: string;
          refresh_interval?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          audit_metadata?: Json;
          consent_at?: string;
          consent_granted?: boolean;
          consent_version?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          refresh_interval?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      connection_status: "active" | "invalid" | "disconnected";
      exchange_id: "binance" | "okx";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      connection_status: ["active", "invalid", "disconnected"],
      exchange_id: ["binance", "okx"],
    },
  },
} as const;

// Schema: public
// Enums
export enum ConnectionStatus {
  active = "active",
  invalid = "invalid",
  disconnected = "disconnected",
}

export enum ExchangeId {
  binance = "binance",
  okx = "okx",
}

// Tables
export type Assets = Database["public"]["Tables"]["assets"]["Row"];
export type InsertAssets = Database["public"]["Tables"]["assets"]["Insert"];
export type UpdateAssets = Database["public"]["Tables"]["assets"]["Update"];

export type Portfolios = Database["public"]["Tables"]["portfolios"]["Row"];
export type InsertPortfolios = Database["public"]["Tables"]["portfolios"]["Insert"];
export type UpdatePortfolios = Database["public"]["Tables"]["portfolios"]["Update"];

export type Transactions = Database["public"]["Tables"]["transactions"]["Row"];
export type InsertTransactions = Database["public"]["Tables"]["transactions"]["Insert"];
export type UpdateTransactions = Database["public"]["Tables"]["transactions"]["Update"];

export type UserConnections = Database["public"]["Tables"]["user_connections"]["Row"];
export type InsertUserConnections = Database["public"]["Tables"]["user_connections"]["Insert"];
export type UpdateUserConnections = Database["public"]["Tables"]["user_connections"]["Update"];

export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
export type InsertUserPreferences = Database["public"]["Tables"]["user_preferences"]["Insert"];
export type UpdateUserPreferences = Database["public"]["Tables"]["user_preferences"]["Update"];

export type Users = Database["public"]["Tables"]["users"]["Row"];
export type InsertUsers = Database["public"]["Tables"]["users"]["Insert"];
export type UpdateUsers = Database["public"]["Tables"]["users"]["Update"];

// Functions
export type ArgsShowLimit = Database["public"]["Functions"]["show_limit"]["Args"];
export type ReturnTypeShowLimit = Database["public"]["Functions"]["show_limit"]["Returns"];

export type ArgsShowTrgm = Database["public"]["Functions"]["show_trgm"]["Args"];
export type ReturnTypeShowTrgm = Database["public"]["Functions"]["show_trgm"]["Returns"];
