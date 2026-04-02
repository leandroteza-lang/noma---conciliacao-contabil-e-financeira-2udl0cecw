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
          description: string | null
          id: string
          organization_id: string | null
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
          description?: string | null
          id?: string
          organization_id?: string | null
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
          description?: string | null
          id?: string
          organization_id?: string | null
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
      chart_of_accounts: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          created_at: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
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
      cost_centers: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string | null
          parent_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          parent_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          parent_id?: string | null
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
        ]
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
      organizations: {
        Row: {
          cnpj: string | null
          created_at: string | null
          id: string
          name: string | null
          status: boolean | null
          user_id: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          status?: boolean | null
          user_id?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          status?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
// Table: chart_of_accounts
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   account_code: character varying (nullable)
//   account_name: character varying (nullable)
//   account_type: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: cost_centers
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   code: character varying (nullable)
//   description: character varying (nullable)
//   parent_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
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
// Table: organizations
//   id: uuid (not null, default: gen_random_uuid())
//   cnpj: character varying (nullable)
//   name: character varying (nullable)
//   status: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   user_id: uuid (nullable)

// --- CONSTRAINTS ---
// Table: account_mapping
//   FOREIGN KEY account_mapping_chart_account_id_fkey: FOREIGN KEY (chart_account_id) REFERENCES chart_of_accounts(id) ON DELETE CASCADE
//   FOREIGN KEY account_mapping_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE CASCADE
//   FOREIGN KEY account_mapping_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY account_mapping_pkey: PRIMARY KEY (id)
// Table: accounting_entries
//   FOREIGN KEY accounting_entries_credit_account_id_fkey: FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
//   FOREIGN KEY accounting_entries_debit_account_id_fkey: FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
//   FOREIGN KEY accounting_entries_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY accounting_entries_pkey: PRIMARY KEY (id)
// Table: bank_accounts
//   FOREIGN KEY bank_accounts_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY bank_accounts_pkey: PRIMARY KEY (id)
// Table: chart_of_accounts
//   FOREIGN KEY chart_of_accounts_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY chart_of_accounts_pkey: PRIMARY KEY (id)
// Table: cost_centers
//   FOREIGN KEY cost_centers_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   FOREIGN KEY cost_centers_parent_id_fkey: FOREIGN KEY (parent_id) REFERENCES cost_centers(id) ON DELETE CASCADE
//   PRIMARY KEY cost_centers_pkey: PRIMARY KEY (id)
// Table: financial_movements
//   FOREIGN KEY financial_movements_bank_account_id_fkey: FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
//   FOREIGN KEY financial_movements_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL
//   FOREIGN KEY financial_movements_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_movements_pkey: PRIMARY KEY (id)
// Table: organizations
//   PRIMARY KEY organizations_pkey: PRIMARY KEY (id)
//   FOREIGN KEY organizations_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: account_mapping
//   Policy "org_account_mapping_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_account_mapping_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_account_mapping_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_account_mapping_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
// Table: accounting_entries
//   Policy "org_accounting_entries_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_accounting_entries_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_accounting_entries_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_accounting_entries_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
// Table: bank_accounts
//   Policy "org_bank_accounts_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_bank_accounts_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_bank_accounts_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_bank_accounts_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
// Table: chart_of_accounts
//   Policy "org_chart_of_accounts_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_chart_of_accounts_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_chart_of_accounts_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_chart_of_accounts_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
// Table: cost_centers
//   Policy "org_cost_centers_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_cost_centers_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_cost_centers_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_cost_centers_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
// Table: financial_movements
//   Policy "org_financial_movements_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_financial_movements_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_financial_movements_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
//   Policy "org_financial_movements_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid())))
// Table: organizations
//   Policy "user_organization_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_organization_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "user_organization_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "user_organization_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.organizations (id, user_id, name)
//     VALUES (gen_random_uuid(), NEW.id, 'Minha Empresa');
//     RETURN NEW;
//   END;
//   $function$
//
