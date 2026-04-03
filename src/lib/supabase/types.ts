// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      account_mapping: {
        Row: {
          chart_account_id: string | null
          cost_center_id: string | null
          created_at: string | null
          id: string
          mapping_type: string | null
          organization_id: string | null
        }
        Insert: {
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          id?: string
          mapping_type?: string | null
          organization_id?: string | null
        }
        Update: {
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          id?: string
          mapping_type?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'account_mapping_chart_account_id_fkey'
            columns: ['chart_account_id']
            isOneToOne: false
            referencedRelation: 'chart_of_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'account_mapping_cost_center_id_fkey'
            columns: ['cost_center_id']
            isOneToOne: false
            referencedRelation: 'cost_centers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'account_mapping_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      accounting_entries: {
        Row: {
          amount: number | null
          cost_center_id: string | null
          created_at: string | null
          credit_account_id: string | null
          debit_account_id: string | null
          description: string | null
          entry_date: string | null
          id: string
          organization_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          cost_center_id?: string | null
          created_at?: string | null
          credit_account_id?: string | null
          debit_account_id?: string | null
          description?: string | null
          entry_date?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          cost_center_id?: string | null
          created_at?: string | null
          credit_account_id?: string | null
          debit_account_id?: string | null
          description?: string | null
          entry_date?: string | null
          id?: string
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'accounting_entries_cost_center_id_fkey'
            columns: ['cost_center_id']
            isOneToOne: false
            referencedRelation: 'cost_centers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'accounting_entries_credit_account_id_fkey'
            columns: ['credit_account_id']
            isOneToOne: false
            referencedRelation: 'chart_of_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'accounting_entries_debit_account_id_fkey'
            columns: ['debit_account_id']
            isOneToOne: false
            referencedRelation: 'chart_of_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'accounting_entries_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_code: string | null
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_code: string | null
          check_digit: string | null
          classification: string | null
          company_name: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          description: string | null
          id: string
          organization_id: string | null
          pending_deletion: boolean | null
        }
        Insert: {
          account_code?: string | null
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          check_digit?: string | null
          classification?: string | null
          company_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Update: {
          account_code?: string | null
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          check_digit?: string | null
          classification?: string | null
          company_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'bank_accounts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      cadastro_usuarios: {
        Row: {
          address: string | null
          approval_status: string | null
          avatar_url: string | null
          color_theme: string | null
          cpf: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          department_id: string | null
          email: string | null
          id: string
          menu_order: Json | null
          name: string
          observations: string | null
          pending_deletion: boolean | null
          permissions: Json | null
          phone: string | null
          role: string | null
          status: boolean | null
          theme_mode: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          avatar_url?: string | null
          color_theme?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          menu_order?: Json | null
          name: string
          observations?: string | null
          pending_deletion?: boolean | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          status?: boolean | null
          theme_mode?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          avatar_url?: string | null
          color_theme?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          menu_order?: Json | null
          name?: string
          observations?: string | null
          pending_deletion?: boolean | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          status?: boolean | null
          theme_mode?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employees_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      cadastro_usuarios_companies: {
        Row: {
          organization_id: string
          usuario_id: string
        }
        Insert: {
          organization_id: string
          usuario_id: string
        }
        Update: {
          organization_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_companies_employee_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'cadastro_usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_companies_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          id: string
          organization_id: string | null
          pending_deletion: boolean | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'chart_of_accounts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      chat_messages: {
        Row: {
          attached_file_name: string | null
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          attached_file_name?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          attached_file_name?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'chat_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          classification: string | null
          code: string | null
          contabiliza: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          description: string | null
          fixed_variable: string | null
          id: string
          observacoes: string | null
          operational: string | null
          organization_id: string | null
          parent_id: string | null
          pending_deletion: boolean | null
          tipo_lcto: string | null
          tipo_tga_id: string | null
          type_tga: string | null
        }
        Insert: {
          classification?: string | null
          code?: string | null
          contabiliza?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          description?: string | null
          fixed_variable?: string | null
          id?: string
          observacoes?: string | null
          operational?: string | null
          organization_id?: string | null
          parent_id?: string | null
          pending_deletion?: boolean | null
          tipo_lcto?: string | null
          tipo_tga_id?: string | null
          type_tga?: string | null
        }
        Update: {
          classification?: string | null
          code?: string | null
          contabiliza?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          description?: string | null
          fixed_variable?: string | null
          id?: string
          observacoes?: string | null
          operational?: string | null
          organization_id?: string | null
          parent_id?: string | null
          pending_deletion?: boolean | null
          tipo_lcto?: string | null
          tipo_tga_id?: string | null
          type_tga?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cost_centers_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cost_centers_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'cost_centers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cost_centers_tipo_tga_id_fkey'
            columns: ['tipo_tga_id']
            isOneToOne: false
            referencedRelation: 'tipo_conta_tga'
            referencedColumns: ['id']
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          id: string
          name: string
          pending_deletion: boolean | null
          user_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          name: string
          pending_deletion?: boolean | null
          user_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          name?: string
          pending_deletion?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      financial_movements: {
        Row: {
          amount: number | null
          bank_account_id: string | null
          cost_center_id: string | null
          created_at: string | null
          description: string | null
          id: string
          movement_date: string | null
          organization_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          bank_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          movement_date?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          bank_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          movement_date?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'financial_movements_bank_account_id_fkey'
            columns: ['bank_account_id']
            isOneToOne: false
            referencedRelation: 'bank_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_movements_cost_center_id_fkey'
            columns: ['cost_center_id']
            isOneToOne: false
            referencedRelation: 'cost_centers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_movements_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      import_history: {
        Row: {
          created_at: string
          error_count: number | null
          file_name: string | null
          id: string
          import_type: string
          status: string | null
          success_count: number | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number | null
          file_name?: string | null
          id?: string
          import_type: string
          status?: string | null
          success_count?: number | null
          total_records?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number | null
          file_name?: string | null
          id?: string
          import_type?: string
          status?: string | null
          success_count?: number | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          email: string | null
          id: string
          name: string | null
          observations: string | null
          pending_deletion: boolean | null
          phone: string | null
          status: boolean | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          email?: string | null
          id?: string
          name?: string | null
          observations?: string | null
          pending_deletion?: boolean | null
          phone?: string | null
          status?: boolean | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          email?: string | null
          id?: string
          name?: string | null
          observations?: string | null
          pending_deletion?: boolean | null
          phone?: string | null
          status?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      shared_queries: {
        Row: {
          access_count: number
          content: string
          created_at: string
          id: string
          is_protected: boolean | null
          password: string | null
          prompt: string
          user_id: string | null
        }
        Insert: {
          access_count?: number
          content: string
          created_at?: string
          id?: string
          is_protected?: boolean | null
          password?: string | null
          prompt: string
          user_id?: string | null
        }
        Update: {
          access_count?: number
          content?: string
          created_at?: string
          id?: string
          is_protected?: boolean | null
          password?: string | null
          prompt?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tipo_conta_tga: {
        Row: {
          abreviacao: string | null
          codigo: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string | null
          pending_deletion: boolean | null
        }
        Insert: {
          abreviacao?: string | null
          codigo?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Update: {
          abreviacao?: string | null
          codigo?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'tipo_conta_tga_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_by_email: { Args: { p_email: string }; Returns: string }
      increment_shared_query_access: {
        Args: { query_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: account_mapping
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   cost_center_id: uuid (nullable)
//   chart_account_id: uuid (nullable)
//   mapping_type: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: accounting_entries
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   entry_date: date (nullable)
//   debit_account_id: uuid (nullable)
//   credit_account_id: uuid (nullable)
//   amount: numeric (nullable)
//   description: character varying (nullable)
//   status: character varying (nullable, default: 'Draft'::character varying)
//   created_at: timestamp with time zone (nullable, default: now())
//   cost_center_id: uuid (nullable)
// Table: bank_accounts
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   account_code: character varying (nullable)
//   account_type: character varying (nullable)
//   description: character varying (nullable)
//   bank_code: character varying (nullable)
//   agency: character varying (nullable)
//   account_number: character varying (nullable)
//   check_digit: character varying (nullable)
//   classification: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   company_name: character varying (nullable)
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
// Table: cadastro_usuarios
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   name: character varying (not null)
//   email: character varying (nullable)
//   phone: character varying (nullable)
//   department_id: uuid (nullable)
//   status: boolean (nullable, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   role: character varying (nullable, default: 'collaborator'::character varying)
//   cpf: character varying (nullable)
//   address: text (nullable)
//   observations: text (nullable)
//   permissions: jsonb (nullable, default: '["all"]'::jsonb)
//   menu_order: jsonb (nullable, default: '[]'::jsonb)
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
//   approval_status: text (nullable, default: 'approved'::text)
//   avatar_url: text (nullable)
//   theme_mode: text (nullable, default: 'system'::text)
//   color_theme: text (nullable, default: 'default'::text)
// Table: cadastro_usuarios_companies
//   usuario_id: uuid (not null)
//   organization_id: uuid (not null)
// Table: chart_of_accounts
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   account_code: character varying (nullable)
//   account_name: character varying (nullable)
//   account_type: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
// Table: chat_messages
//   id: uuid (not null, default: gen_random_uuid())
//   session_id: uuid (not null)
//   role: text (not null)
//   content: text (not null)
//   attached_file_name: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: chat_sessions
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   title: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: cost_centers
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   code: character varying (nullable)
//   description: character varying (nullable)
//   parent_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   type_tga: character varying (nullable)
//   fixed_variable: character varying (nullable)
//   classification: character varying (nullable)
//   operational: character varying (nullable)
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
//   tipo_lcto: character varying (nullable)
//   tipo_tga_id: uuid (nullable)
//   contabiliza: character varying (nullable)
//   observacoes: text (nullable)
// Table: departments
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   code: character varying (nullable)
//   name: character varying (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
// Table: financial_movements
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   movement_date: date (nullable)
//   description: character varying (nullable)
//   amount: numeric (nullable)
//   cost_center_id: uuid (nullable)
//   bank_account_id: uuid (nullable)
//   status: character varying (nullable, default: 'Pending'::character varying)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: import_history
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   import_type: character varying (not null)
//   file_name: character varying (nullable)
//   total_records: integer (nullable, default: 0)
//   success_count: integer (nullable, default: 0)
//   error_count: integer (nullable, default: 0)
//   status: character varying (nullable, default: 'Completed'::character varying)
//   created_at: timestamp with time zone (not null, default: now())
// Table: organizations
//   id: uuid (not null, default: gen_random_uuid())
//   cnpj: character varying (nullable)
//   name: character varying (nullable)
//   status: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   user_id: uuid (nullable)
//   cpf: character varying (nullable)
//   phone: character varying (nullable)
//   email: character varying (nullable)
//   address: text (nullable)
//   observations: text (nullable)
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
// Table: shared_queries
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   prompt: text (not null)
//   content: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   is_protected: boolean (nullable, default: false)
//   password: text (nullable)
//   access_count: integer (not null, default: 0)
// Table: tipo_conta_tga
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   codigo: character varying (not null, default: (nextval('tipo_conta_tga_codigo_seq'::regclass))::character varying)
//   nome: character varying (not null)
//   abreviacao: character (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)

// --- CONSTRAINTS ---
// Table: account_mapping
//   FOREIGN KEY account_mapping_chart_account_id_fkey: FOREIGN KEY (chart_account_id) REFERENCES chart_of_accounts(id) ON DELETE CASCADE
//   FOREIGN KEY account_mapping_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE CASCADE
//   FOREIGN KEY account_mapping_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY account_mapping_pkey: PRIMARY KEY (id)
// Table: accounting_entries
//   FOREIGN KEY accounting_entries_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL
//   FOREIGN KEY accounting_entries_credit_account_id_fkey: FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
//   FOREIGN KEY accounting_entries_debit_account_id_fkey: FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
//   FOREIGN KEY accounting_entries_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY accounting_entries_pkey: PRIMARY KEY (id)
// Table: bank_accounts
//   FOREIGN KEY bank_accounts_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY bank_accounts_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY bank_accounts_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY bank_accounts_pkey: PRIMARY KEY (id)
// Table: cadastro_usuarios
//   FOREIGN KEY employees_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY employees_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY employees_department_id_fkey: FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
//   PRIMARY KEY employees_pkey: PRIMARY KEY (id)
//   FOREIGN KEY employees_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: cadastro_usuarios_companies
//   FOREIGN KEY employee_companies_employee_id_fkey: FOREIGN KEY (usuario_id) REFERENCES cadastro_usuarios(id) ON DELETE CASCADE
//   FOREIGN KEY employee_companies_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY employee_companies_pkey: PRIMARY KEY (usuario_id, organization_id)
// Table: chart_of_accounts
//   FOREIGN KEY chart_of_accounts_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY chart_of_accounts_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY chart_of_accounts_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY chart_of_accounts_pkey: PRIMARY KEY (id)
// Table: chat_messages
//   PRIMARY KEY chat_messages_pkey: PRIMARY KEY (id)
//   FOREIGN KEY chat_messages_session_id_fkey: FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
// Table: chat_sessions
//   PRIMARY KEY chat_sessions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY chat_sessions_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: cost_centers
//   FOREIGN KEY cost_centers_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY cost_centers_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY cost_centers_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   FOREIGN KEY cost_centers_parent_id_fkey: FOREIGN KEY (parent_id) REFERENCES cost_centers(id) ON DELETE CASCADE
//   PRIMARY KEY cost_centers_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cost_centers_tipo_tga_id_fkey: FOREIGN KEY (tipo_tga_id) REFERENCES tipo_conta_tga(id) ON DELETE SET NULL
// Table: departments
//   FOREIGN KEY departments_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY departments_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY departments_pkey: PRIMARY KEY (id)
//   FOREIGN KEY departments_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: financial_movements
//   FOREIGN KEY financial_movements_bank_account_id_fkey: FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
//   FOREIGN KEY financial_movements_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL
//   FOREIGN KEY financial_movements_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_movements_pkey: PRIMARY KEY (id)
// Table: import_history
//   PRIMARY KEY import_history_pkey: PRIMARY KEY (id)
//   FOREIGN KEY import_history_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: organizations
//   FOREIGN KEY organizations_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY organizations_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY organizations_pkey: PRIMARY KEY (id)
//   FOREIGN KEY organizations_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: shared_queries
//   PRIMARY KEY shared_queries_pkey: PRIMARY KEY (id)
//   FOREIGN KEY shared_queries_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: tipo_conta_tga
//   FOREIGN KEY tipo_conta_tga_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY tipo_conta_tga_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY tipo_conta_tga_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY tipo_conta_tga_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: account_mapping
//   Policy "org_account_mapping_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_account_mapping_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_account_mapping_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_account_mapping_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
// Table: accounting_entries
//   Policy "org_accounting_entries_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_accounting_entries_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_accounting_entries_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_accounting_entries_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
// Table: bank_accounts
//   Policy "org_bank_accounts_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_bank_accounts_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_bank_accounts_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_bank_accounts_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
// Table: cadastro_usuarios
//   Policy "auth_users_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "auth_users_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "auth_users_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "auth_users_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: cadastro_usuarios_companies
//   Policy "user_employee_companies_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "user_employee_companies_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "user_employee_companies_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "user_employee_companies_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: chart_of_accounts
//   Policy "org_chart_of_accounts_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_chart_of_accounts_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_chart_of_accounts_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_chart_of_accounts_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
// Table: chat_messages
//   Policy "Users can manage their own chat messages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (session_id IN ( SELECT chat_sessions.id    FROM chat_sessions   WHERE (chat_sessions.user_id = auth.uid())))
//     WITH CHECK: (session_id IN ( SELECT chat_sessions.id    FROM chat_sessions   WHERE (chat_sessions.user_id = auth.uid())))
// Table: chat_sessions
//   Policy "Users can manage their own chat sessions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: cost_centers
//   Policy "org_cost_centers_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_cost_centers_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_cost_centers_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_cost_centers_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
// Table: departments
//   Policy "user_departments_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_departments_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "user_departments_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_departments_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: financial_movements
//   Policy "org_financial_movements_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_financial_movements_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_financial_movements_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_financial_movements_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
// Table: import_history
//   Policy "user_import_history_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_import_history_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "user_import_history_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: organizations
//   Policy "employee_organization_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (id IN ( SELECT ec.organization_id    FROM (cadastro_usuarios_companies ec      JOIN cadastro_usuarios e ON ((e.id = ec.usuario_id)))   WHERE ((e.email)::text = (auth.jwt() ->> 'email'::text))))
//   Policy "user_organization_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_organization_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "user_organization_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_organization_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: shared_queries
//   Policy "Anon can read shared queries" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Anyone can read shared queries" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users can create shared queries" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "Users can delete their own shared queries" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "Users can update their own shared queries" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: tipo_conta_tga
//   Policy "org_tipo_conta_tga_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_tipo_conta_tga_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_tipo_conta_tga_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_tipo_conta_tga_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))

// --- DATABASE FUNCTIONS ---
// FUNCTION get_auth_user_by_email(text)
//   CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(p_email text)
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_user_id UUID;
//   BEGIN
//     SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
//     RETURN v_user_id;
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     org_name text;
//     req_name text;
//     req_role text;
//     req_cpf text;
//     req_phone text;
//     req_dep_id uuid;
//   BEGIN
//     req_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
//     org_name := NEW.raw_user_meta_data->>'organization';
//     req_role := COALESCE(NEW.raw_user_meta_data->>'role', 'collaborator');
//     req_cpf := NEW.raw_user_meta_data->>'cpf';
//     req_phone := NEW.raw_user_meta_data->>'phone';
//
//     BEGIN
//       req_dep_id := (NEW.raw_user_meta_data->>'department_id')::uuid;
//     EXCEPTION WHEN OTHERS THEN
//       req_dep_id := NULL;
//     END;
//
//     IF req_cpf IS NOT NULL AND req_cpf != '' THEN
//       IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE cpf = req_cpf) THEN
//         RAISE EXCEPTION 'CPF_DUPLICATE';
//       END IF;
//     END IF;
//
//     INSERT INTO public.cadastro_usuarios (
//       id, user_id, name, email, role, cpf, phone, department_id, approval_status, status
//     ) VALUES (
//       gen_random_uuid(),
//       NEW.id,
//       req_name,
//       NEW.email,
//       req_role,
//       req_cpf,
//       req_phone,
//       req_dep_id,
//       'pending',
//       true
//     );
//
//     IF org_name IS NOT NULL AND org_name != '' THEN
//       INSERT INTO public.organizations (id, user_id, name)
//       VALUES (gen_random_uuid(), NEW.id, org_name);
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION increment_shared_query_access(uuid)
//   CREATE OR REPLACE FUNCTION public.increment_shared_query_access(query_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     UPDATE public.shared_queries
//     SET access_count = access_count + 1
//     WHERE id = query_id;
//   END;
//   $function$
//

// --- INDEXES ---
// Table: cadastro_usuarios
//   CREATE UNIQUE INDEX cadastro_usuarios_cpf_idx ON public.cadastro_usuarios USING btree (cpf) WHERE ((cpf IS NOT NULL) AND ((cpf)::text <> ''::text))
