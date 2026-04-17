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
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          id: string
          mapping_type: string | null
          observations: string | null
          organization_id: string | null
          pending_deletion: boolean | null
        }
        Insert: {
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          mapping_type?: string | null
          observations?: string | null
          organization_id?: string | null
          pending_deletion?: boolean | null
        }
        Update: {
          chart_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          mapping_type?: string | null
          observations?: string | null
          organization_id?: string | null
          pending_deletion?: boolean | null
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
      audit_config: {
        Row: {
          created_at: string | null
          entity_type: string
          id: string
          log_level: string
          retention_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          id?: string
          log_level?: string
          retention_days?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          id?: string
          log_level?: string
          retention_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_details: {
        Row: {
          audit_log_id: string
          created_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          audit_log_id: string
          created_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          audit_log_id?: string
          created_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_details_audit_log_id_fkey'
            columns: ['audit_log_id']
            isOneToOne: false
            referencedRelation: 'audit_logs'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          performed_at: string | null
          performed_by: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
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
          account_behavior: string | null
          account_code: string | null
          account_level: string | null
          account_name: string | null
          account_type: string | null
          classification: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_requested_at: string | null
          deletion_requested_by: string | null
          id: string
          nature: string | null
          organization_id: string | null
          pending_deletion: boolean | null
          purpose: string | null
        }
        Insert: {
          account_behavior?: string | null
          account_code?: string | null
          account_level?: string | null
          account_name?: string | null
          account_type?: string | null
          classification?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          nature?: string | null
          organization_id?: string | null
          pending_deletion?: boolean | null
          purpose?: string | null
        }
        Update: {
          account_behavior?: string | null
          account_code?: string | null
          account_level?: string | null
          account_name?: string | null
          account_type?: string | null
          classification?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_requested_at?: string | null
          deletion_requested_by?: string | null
          id?: string
          nature?: string | null
          organization_id?: string | null
          pending_deletion?: boolean | null
          purpose?: string | null
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
      chart_of_accounts_backup: {
        Row: {
          backup_date: string | null
          data: Json
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          backup_date?: string | null
          data: Json
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          backup_date?: string | null
          data?: Json
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'chart_of_accounts_backup_organization_id_fkey'
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
      cost_centers_backup: {
        Row: {
          backup_date: string | null
          data: Json
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          backup_date?: string | null
          data: Json
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          backup_date?: string | null
          data?: Json
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cost_centers_backup_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
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
      pending_changes: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          proposed_changes: Json
          requested_at: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          proposed_changes: Json
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          proposed_changes?: Json
          requested_at?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_queries: {
        Row: {
          access_count: number
          content: string
          created_at: string
          first_access_notified: boolean | null
          id: string
          is_protected: boolean | null
          is_revoked: boolean | null
          notify_first_access: boolean | null
          password: string | null
          prompt: string
          single_view: boolean | null
          user_id: string | null
        }
        Insert: {
          access_count?: number
          content: string
          created_at?: string
          first_access_notified?: boolean | null
          id?: string
          is_protected?: boolean | null
          is_revoked?: boolean | null
          notify_first_access?: boolean | null
          password?: string | null
          prompt: string
          single_view?: boolean | null
          user_id?: string | null
        }
        Update: {
          access_count?: number
          content?: string
          created_at?: string
          first_access_notified?: boolean | null
          id?: string
          is_protected?: boolean | null
          is_revoked?: boolean | null
          notify_first_access?: boolean | null
          password?: string | null
          prompt?: string
          single_view?: boolean | null
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
      delete_organization_chart_accounts: {
        Args: { p_org_id: string }
        Returns: Json
      }
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
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
//   observations: text (nullable)
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
// Table: audit_config
//   id: uuid (not null, default: gen_random_uuid())
//   entity_type: character varying (not null)
//   retention_days: integer (not null, default: 365)
//   log_level: character varying (not null, default: 'DETAILED'::character varying)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: audit_details
//   id: uuid (not null, default: gen_random_uuid())
//   audit_log_id: uuid (not null)
//   field_name: character varying (not null)
//   old_value: text (nullable)
//   new_value: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   entity_type: character varying (not null)
//   entity_id: uuid (not null)
//   action: character varying (not null)
//   performed_by: uuid (nullable)
//   performed_at: timestamp with time zone (nullable, default: now())
//   ip_address: character varying (nullable)
//   user_agent: text (nullable)
//   session_id: character varying (nullable)
//   country: character varying (nullable)
//   city: character varying (nullable)
//   device_type: character varying (nullable)
//   changes: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: bank_accounts
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   account_code: text (nullable)
//   account_type: character varying (nullable)
//   description: character varying (nullable)
//   bank_code: character varying (nullable)
//   agency: text (nullable)
//   account_number: text (nullable)
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
//   account_code: text (nullable)
//   account_name: text (nullable)
//   account_type: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
//   classification: text (nullable)
//   account_level: character varying (nullable)
//   account_behavior: character varying (nullable)
//   nature: character varying (nullable)
//   purpose: text (nullable)
// Table: chart_of_accounts_backup
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   user_id: uuid (nullable)
//   backup_date: timestamp with time zone (nullable, default: now())
//   data: jsonb (not null)
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
//   code: text (nullable)
//   description: text (nullable)
//   parent_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   type_tga: text (nullable)
//   fixed_variable: text (nullable)
//   classification: text (nullable)
//   operational: text (nullable)
//   pending_deletion: boolean (nullable, default: false)
//   deletion_requested_at: timestamp with time zone (nullable)
//   deletion_requested_by: uuid (nullable)
//   deleted_at: timestamp with time zone (nullable)
//   deleted_by: uuid (nullable)
//   tipo_lcto: text (nullable)
//   tipo_tga_id: uuid (nullable)
//   contabiliza: text (nullable)
//   observacoes: text (nullable)
// Table: cost_centers_backup
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   user_id: uuid (nullable)
//   backup_date: timestamp with time zone (nullable, default: now())
//   data: jsonb (not null)
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
// Table: pending_changes
//   id: uuid (not null, default: gen_random_uuid())
//   entity_type: character varying (not null)
//   entity_id: uuid (not null)
//   proposed_changes: jsonb (not null)
//   status: character varying (not null, default: 'pending'::character varying)
//   requested_by: uuid (nullable)
//   requested_at: timestamp with time zone (not null, default: now())
//   reviewed_by: uuid (nullable)
//   reviewed_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: shared_queries
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   prompt: text (not null)
//   content: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   is_protected: boolean (nullable, default: false)
//   password: text (nullable)
//   access_count: integer (not null, default: 0)
//   notify_first_access: boolean (nullable, default: false)
//   first_access_notified: boolean (nullable, default: false)
//   single_view: boolean (nullable, default: false)
//   is_revoked: boolean (nullable, default: false)
// Table: tipo_conta_tga
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   codigo: text (not null, default: (nextval('tipo_conta_tga_codigo_seq'::regclass))::character varying)
//   nome: text (not null)
//   abreviacao: text (nullable)
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
//   FOREIGN KEY account_mapping_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY account_mapping_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY account_mapping_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY account_mapping_pkey: PRIMARY KEY (id)
// Table: accounting_entries
//   FOREIGN KEY accounting_entries_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE RESTRICT
//   FOREIGN KEY accounting_entries_credit_account_id_fkey: FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT
//   FOREIGN KEY accounting_entries_debit_account_id_fkey: FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT
//   FOREIGN KEY accounting_entries_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY accounting_entries_pkey: PRIMARY KEY (id)
// Table: audit_config
//   UNIQUE audit_config_entity_type_key: UNIQUE (entity_type)
//   PRIMARY KEY audit_config_pkey: PRIMARY KEY (id)
// Table: audit_details
//   FOREIGN KEY audit_details_audit_log_id_fkey: FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE CASCADE
//   PRIMARY KEY audit_details_pkey: PRIMARY KEY (id)
// Table: audit_logs
//   FOREIGN KEY audit_logs_performed_by_fkey: FOREIGN KEY (performed_by) REFERENCES auth.users(id)
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
// Table: bank_accounts
//   FOREIGN KEY bank_accounts_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY bank_accounts_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY bank_accounts_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY bank_accounts_pkey: PRIMARY KEY (id)
// Table: cadastro_usuarios
//   FOREIGN KEY employees_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY employees_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY employees_department_id_fkey: FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
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
// Table: chart_of_accounts_backup
//   FOREIGN KEY chart_of_accounts_backup_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY chart_of_accounts_backup_pkey: PRIMARY KEY (id)
//   FOREIGN KEY chart_of_accounts_backup_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
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
//   FOREIGN KEY cost_centers_tipo_tga_id_fkey: FOREIGN KEY (tipo_tga_id) REFERENCES tipo_conta_tga(id) ON DELETE RESTRICT
// Table: cost_centers_backup
//   FOREIGN KEY cost_centers_backup_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY cost_centers_backup_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cost_centers_backup_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: departments
//   FOREIGN KEY departments_deleted_by_fkey: FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY departments_deletion_requested_by_fkey: FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY departments_pkey: PRIMARY KEY (id)
//   FOREIGN KEY departments_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: financial_movements
//   FOREIGN KEY financial_movements_bank_account_id_fkey: FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT
//   FOREIGN KEY financial_movements_cost_center_id_fkey: FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE RESTRICT
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
// Table: pending_changes
//   PRIMARY KEY pending_changes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY pending_changes_requested_by_fkey: FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY pending_changes_reviewed_by_fkey: FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL
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
// Table: audit_config
//   Policy "Allow authenticated users to view audit config" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Allow service role to update audit config" (UPDATE, PERMISSIVE) roles={public}
//     USING: true
// Table: audit_details
//   Policy "Allow authenticated users to delete audit details" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated users to view audit details" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Allow service role to insert audit details" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
// Table: audit_logs
//   Policy "Allow authenticated users to delete audit logs" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated users to view audit logs" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Allow service role to insert audit logs" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
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
// Table: chart_of_accounts_backup
//   Policy "org_chart_of_accounts_backup_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cuc.organization_id    FROM (cadastro_usuarios_companies cuc      JOIN cadastro_usuarios cu ON ((cuc.usuario_id = cu.id)))   WHERE ((cu.email)::text = (auth.jwt() ->> 'email'::text)))))
//   Policy "org_chart_of_accounts_backup_select" (SELECT, PERMISSIVE) roles={authenticated}
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
// Table: cost_centers_backup
//   Policy "org_cost_centers_backup_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cadastro_usuarios_companies.organization_id    FROM cadastro_usuarios_companies   WHERE (cadastro_usuarios_companies.usuario_id IN ( SELECT cadastro_usuarios.id            FROM cadastro_usuarios           WHERE ((cadastro_usuarios.email)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)))))))
//   Policy "org_cost_centers_backup_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cadastro_usuarios_companies.organization_id    FROM cadastro_usuarios_companies   WHERE (cadastro_usuarios_companies.usuario_id IN ( SELECT cadastro_usuarios.id            FROM cadastro_usuarios           WHERE ((cadastro_usuarios.email)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)))))))
//   Policy "org_cost_centers_backup_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((organization_id IN ( SELECT organizations.id    FROM organizations   WHERE (organizations.user_id = auth.uid()))) OR (organization_id IN ( SELECT cadastro_usuarios_companies.organization_id    FROM cadastro_usuarios_companies   WHERE (cadastro_usuarios_companies.usuario_id IN ( SELECT cadastro_usuarios.id            FROM cadastro_usuarios           WHERE ((cadastro_usuarios.email)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)))))))
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
// Table: pending_changes
//   Policy "authenticated_pending_changes_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_pending_changes_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "authenticated_pending_changes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_pending_changes_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
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
// FUNCTION audit_table_update_trigger()
//   CREATE OR REPLACE FUNCTION public.audit_table_update_trigger()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_old jsonb;
//     v_new jsonb;
//     v_changes jsonb := '{}'::jsonb;
//     v_key text;
//     v_old_val text;
//     v_new_val text;
//     v_audit_id uuid;
//     v_entity_type text;
//     v_user_id uuid;
//     v_action text;
//     v_ignored_cols text[] := ARRAY['created_at', 'updated_at', 'deleted_at', 'deleted_by', 'deletion_requested_at', 'deletion_requested_by', 'pending_deletion', 'id', 'organization_id', 'user_id', 'password', 'encrypted_password'];
//   BEGIN
//     CASE TG_TABLE_NAME
//       WHEN 'cadastro_usuarios' THEN v_entity_type := 'Usuários';
//       WHEN 'bank_accounts' THEN v_entity_type := 'Contas Bancárias';
//       WHEN 'cost_centers' THEN v_entity_type := 'Centros de Custo';
//       WHEN 'chart_of_accounts' THEN v_entity_type := 'Plano de Contas';
//       WHEN 'tipo_conta_tga' THEN v_entity_type := 'Tipos de Conta TGA';
//       WHEN 'departments' THEN v_entity_type := 'Departamentos';
//       WHEN 'organizations' THEN v_entity_type := 'Empresas';
//       WHEN 'account_mapping' THEN v_entity_type := 'Mapeamento de Contas';
//       WHEN 'financial_movements' THEN v_entity_type := 'Movimentações Financeiras';
//       ELSE v_entity_type := TG_TABLE_NAME;
//     END CASE;
//
//     v_user_id := auth.uid();
//
//     IF TG_OP = 'INSERT' THEN
//       v_new := to_jsonb(NEW);
//       FOR v_key IN SELECT key FROM jsonb_each(v_new)
//       LOOP
//         IF v_key = ANY(v_ignored_cols) THEN CONTINUE; END IF;
//         v_new_val := trim(COALESCE(v_new->>v_key, ''));
//         IF v_new_val != '' THEN
//           v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('new', v_new_val));
//         END IF;
//       END LOOP;
//
//       IF v_changes != '{}'::jsonb THEN
//         INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
//         VALUES (v_entity_type, NEW.id, 'CREATE', v_user_id, v_changes)
//         RETURNING id INTO v_audit_id;
//
//         FOR v_key IN SELECT key FROM jsonb_each(v_changes)
//         LOOP
//           INSERT INTO public.audit_details (audit_log_id, field_name, new_value)
//           VALUES (v_audit_id, v_key, v_changes->v_key->>'new');
//         END LOOP;
//       END IF;
//
//       RETURN NEW;
//     ELSIF TG_OP = 'UPDATE' THEN
//       v_old := to_jsonb(OLD);
//       v_new := to_jsonb(NEW);
//       v_action := 'UPDATE';
//
//       IF (v_new->>'deleted_at') IS NOT NULL AND (v_old->>'deleted_at') IS NULL THEN
//         v_action := 'DELETE';
//       END IF;
//
//       FOR v_key IN SELECT key FROM jsonb_each(v_old)
//       LOOP
//         IF v_key = ANY(v_ignored_cols) THEN CONTINUE; END IF;
//         v_old_val := trim(COALESCE(v_old->>v_key, ''));
//         v_new_val := trim(COALESCE(v_new->>v_key, ''));
//
//         IF v_old_val IS DISTINCT FROM v_new_val THEN
//           v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('old', v_old_val, 'new', v_new_val));
//         END IF;
//       END LOOP;
//
//       IF v_changes != '{}'::jsonb OR v_action = 'DELETE' THEN
//         INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
//         VALUES (v_entity_type, NEW.id, v_action, v_user_id, CASE WHEN v_changes = '{}'::jsonb THEN NULL ELSE v_changes END)
//         RETURNING id INTO v_audit_id;
//
//         IF v_changes != '{}'::jsonb THEN
//           FOR v_key IN SELECT key FROM jsonb_each(v_changes)
//           LOOP
//             INSERT INTO public.audit_details (audit_log_id, field_name, old_value, new_value)
//             VALUES (v_audit_id, v_key, v_changes->v_key->>'old', v_changes->v_key->>'new');
//           END LOOP;
//         END IF;
//       END IF;
//
//       RETURN NEW;
//     ELSIF TG_OP = 'DELETE' THEN
//       v_old := to_jsonb(OLD);
//       FOR v_key IN SELECT key FROM jsonb_each(v_old)
//       LOOP
//         IF v_key = ANY(v_ignored_cols) THEN CONTINUE; END IF;
//         v_old_val := trim(COALESCE(v_old->>v_key, ''));
//         IF v_old_val != '' THEN
//           v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('old', v_old_val));
//         END IF;
//       END LOOP;
//
//       INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
//       VALUES (v_entity_type, OLD.id, 'DELETE', v_user_id, CASE WHEN v_changes = '{}'::jsonb THEN NULL ELSE v_changes END)
//       RETURNING id INTO v_audit_id;
//
//       IF v_changes != '{}'::jsonb THEN
//         FOR v_key IN SELECT key FROM jsonb_each(v_changes)
//         LOOP
//           INSERT INTO public.audit_details (audit_log_id, field_name, old_value)
//           VALUES (v_audit_id, v_key, v_changes->v_key->>'old');
//         END LOOP;
//       END IF;
//
//       RETURN OLD;
//     END IF;
//
//     RETURN NULL;
//   END;
//   $function$
//
// FUNCTION check_bank_account_soft_delete()
//   CREATE OR REPLACE FUNCTION public.check_bank_account_soft_delete()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
//       IF EXISTS (SELECT 1 FROM public.financial_movements WHERE bank_account_id = OLD.id) THEN
//         RAISE EXCEPTION 'Não é possível excluir a conta bancária pois existem movimentações vinculadas a ela.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_chart_account_soft_delete()
//   CREATE OR REPLACE FUNCTION public.check_chart_account_soft_delete()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
//       IF EXISTS (SELECT 1 FROM public.accounting_entries WHERE debit_account_id = OLD.id OR credit_account_id = OLD.id) OR
//          EXISTS (SELECT 1 FROM public.account_mapping WHERE chart_account_id = OLD.id) THEN
//         RAISE EXCEPTION 'Não é possível excluir a conta contábil pois existem lançamentos ou mapeamentos vinculados a ela.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_cost_center_soft_delete()
//   CREATE OR REPLACE FUNCTION public.check_cost_center_soft_delete()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
//       IF EXISTS (SELECT 1 FROM public.financial_movements WHERE cost_center_id = OLD.id) OR
//          EXISTS (SELECT 1 FROM public.accounting_entries WHERE cost_center_id = OLD.id) OR
//          EXISTS (SELECT 1 FROM public.account_mapping WHERE cost_center_id = OLD.id) THEN
//         RAISE EXCEPTION 'Não é possível excluir o centro de custo pois existem movimentações, lançamentos ou mapeamentos vinculados a ele.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_department_soft_delete()
//   CREATE OR REPLACE FUNCTION public.check_department_soft_delete()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
//       IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE department_id = OLD.id AND deleted_at IS NULL) THEN
//         RAISE EXCEPTION 'Não é possível excluir o departamento pois existem usuários vinculados a ele.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_organization_soft_delete()
//   CREATE OR REPLACE FUNCTION public.check_organization_soft_delete()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
//       IF EXISTS (SELECT 1 FROM public.cadastro_usuarios_companies WHERE organization_id = OLD.id) THEN
//         RAISE EXCEPTION 'Não é possível excluir a empresa pois existem usuários vinculados a ela.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION check_tga_account_soft_delete()
//   CREATE OR REPLACE FUNCTION public.check_tga_account_soft_delete()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
//       IF EXISTS (SELECT 1 FROM public.cost_centers WHERE tipo_tga_id = OLD.id AND deleted_at IS NULL) THEN
//         RAISE EXCEPTION 'Não é possível excluir o tipo de conta TGA pois existem centros de custo vinculados a ele.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION delete_organization_chart_accounts(uuid)
//   CREATE OR REPLACE FUNCTION public.delete_organization_chart_accounts(p_org_id uuid)
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_total_count int;
//     v_blocked_count int;
//     v_deleted_count int;
//   BEGIN
//     -- Total
//     SELECT count(*) INTO v_total_count
//     FROM public.chart_of_accounts
//     WHERE organization_id = p_org_id;
//
//     -- Blocked
//     SELECT count(DISTINCT id) INTO v_blocked_count
//     FROM public.chart_of_accounts c
//     WHERE c.organization_id = p_org_id
//       AND (
//         EXISTS (SELECT 1 FROM public.accounting_entries WHERE debit_account_id = c.id) OR
//         EXISTS (SELECT 1 FROM public.accounting_entries WHERE credit_account_id = c.id) OR
//         EXISTS (SELECT 1 FROM public.account_mapping WHERE chart_account_id = c.id)
//       );
//
//     -- Delete unblocked
//     DELETE FROM public.chart_of_accounts c
//     WHERE c.organization_id = p_org_id
//       AND NOT EXISTS (SELECT 1 FROM public.accounting_entries WHERE debit_account_id = c.id)
//       AND NOT EXISTS (SELECT 1 FROM public.accounting_entries WHERE credit_account_id = c.id)
//       AND NOT EXISTS (SELECT 1 FROM public.account_mapping WHERE chart_account_id = c.id);
//
//     GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
//
//     RETURN jsonb_build_object(
//       'total', v_total_count,
//       'deleted', v_deleted_count,
//       'blocked', v_blocked_count
//     );
//   END;
//   $function$
//
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
//       -- Ignore users that are soft-deleted when checking for duplicates
//       IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE cpf = req_cpf AND deleted_at IS NULL) THEN
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
//     SET
//       access_count = access_count + 1,
//       first_access_notified = CASE
//         WHEN notify_first_access = true AND first_access_notified = false THEN true
//         ELSE first_access_notified
//       END
//     WHERE id = query_id;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: account_mapping
//   trg_audit_account_mapping: CREATE TRIGGER trg_audit_account_mapping AFTER INSERT OR DELETE OR UPDATE ON public.account_mapping FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
// Table: bank_accounts
//   trg_audit_bank_accounts: CREATE TRIGGER trg_audit_bank_accounts AFTER INSERT OR DELETE OR UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
//   trg_check_bank_account_soft_delete: CREATE TRIGGER trg_check_bank_account_soft_delete BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION check_bank_account_soft_delete()
// Table: cadastro_usuarios
//   trg_audit_cadastro_usuarios: CREATE TRIGGER trg_audit_cadastro_usuarios AFTER INSERT OR DELETE OR UPDATE ON public.cadastro_usuarios FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
// Table: chart_of_accounts
//   trg_audit_chart_of_accounts: CREATE TRIGGER trg_audit_chart_of_accounts AFTER INSERT OR DELETE OR UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
//   trg_check_chart_account_soft_delete: CREATE TRIGGER trg_check_chart_account_soft_delete BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION check_chart_account_soft_delete()
// Table: cost_centers
//   trg_audit_cost_centers: CREATE TRIGGER trg_audit_cost_centers AFTER INSERT OR DELETE OR UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
//   trg_check_cost_center_soft_delete: CREATE TRIGGER trg_check_cost_center_soft_delete BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION check_cost_center_soft_delete()
// Table: departments
//   trg_audit_departments: CREATE TRIGGER trg_audit_departments AFTER INSERT OR DELETE OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
//   trg_check_department_soft_delete: CREATE TRIGGER trg_check_department_soft_delete BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION check_department_soft_delete()
// Table: organizations
//   trg_audit_organizations: CREATE TRIGGER trg_audit_organizations AFTER INSERT OR DELETE OR UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
//   trg_check_organization_soft_delete: CREATE TRIGGER trg_check_organization_soft_delete BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION check_organization_soft_delete()
// Table: tipo_conta_tga
//   trg_audit_tipo_conta_tga: CREATE TRIGGER trg_audit_tipo_conta_tga AFTER INSERT OR DELETE OR UPDATE ON public.tipo_conta_tga FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()
//   trg_check_tga_account_soft_delete: CREATE TRIGGER trg_check_tga_account_soft_delete BEFORE UPDATE ON public.tipo_conta_tga FOR EACH ROW EXECUTE FUNCTION check_tga_account_soft_delete()

// --- INDEXES ---
// Table: audit_config
//   CREATE UNIQUE INDEX audit_config_entity_type_key ON public.audit_config USING btree (entity_type)
// Table: cadastro_usuarios
//   CREATE UNIQUE INDEX cadastro_usuarios_cpf_idx ON public.cadastro_usuarios USING btree (cpf) WHERE ((cpf IS NOT NULL) AND ((cpf)::text <> ''::text) AND (deleted_at IS NULL))
