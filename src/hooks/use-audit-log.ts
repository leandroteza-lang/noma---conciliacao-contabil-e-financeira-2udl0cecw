import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'SHARE'

export interface AuditLogPayload {
  entityType: string
  entityId: string
  action: AuditAction
  changes?: Record<string, { old?: any; new?: any }> | null
}

export function useAuditLog() {
  const { user } = useAuth()

  const logAction = useCallback(
    async (payload: AuditLogPayload) => {
      if (!user) return

      try {
        // PROBLEMA 1 (Filtro local): Algumas implementações anteriores verificavam a tabela 'audit_config'
        // e filtravam localmente entidades que não correspondiam exatamente ao nome esperado,
        // excluindo 'bank_accounts'.
        // SOLUÇÃO: O payload agora é enviado integralmente e incondicionalmente para a Edge Function,
        // centralizando a inteligência de mapeamento e normalização de dados no backend.

        const { error } = await supabase.functions.invoke('audit-log', {
          body: {
            ...payload,
            performedBy: user.id,
            userAgent: navigator.userAgent,
          },
        })

        if (error) {
          console.error('Failed to log action:', error)
        }
      } catch (err) {
        console.error('Error logging action:', err)
      }
    },
    [user],
  )

  return { logAction }
}
