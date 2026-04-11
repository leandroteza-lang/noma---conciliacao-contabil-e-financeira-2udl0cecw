import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export const useAuditLog = () => {
  const { user } = useAuth()

  const logAction = useCallback(
    async (entityType: string, entityId: string, action: string, changes?: Record<string, any>) => {
      if (!user || !entityType || !entityId) return

      try {
        let sanitizedChanges = changes

        // Proteção extra contra payloads de alterações massivas que podem derrubar a Edge Function
        if (changes) {
          try {
            const stringified = JSON.stringify(changes)
            if (stringified.length > 100000) {
              sanitizedChanges = {
                _warning: {
                  new: 'Objeto de mudanças muito grande, foi omitido para estabilidade.',
                },
              }
            }
          } catch (e) {
            sanitizedChanges = {
              _warning: {
                new: 'Falha ao processar as alterações (objeto não pode ser formatado).',
              },
            }
          }
        }

        const payload = {
          entityType,
          entityId,
          action,
          performedBy: user.id,
          changes: sanitizedChanges,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }

        await supabase.functions.invoke('audit-log', {
          body: payload,
        })
      } catch (error) {
        console.error('Failed to log action:', error)
      }
    },
    [user],
  )

  return { logAction }
}
