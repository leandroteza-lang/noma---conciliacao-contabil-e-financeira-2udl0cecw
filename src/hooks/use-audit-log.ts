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

        if (changes) {
          try {
            const stringified = JSON.stringify(changes)
            if (stringified.length > 100000) {
              sanitizedChanges = {
                _warning: {
                  new: 'Change object too large; omitted for stability.',
                },
              }
            }
          } catch (e) {
            sanitizedChanges = {
              _warning: {
                new: 'Failed to process changes (object could not be formatted).',
              },
            }
          }
        }

        const payload = {
          entity_type: entityType,
          entity_id: entityId,
          action,
          performed_by: user.id,
          changes: sanitizedChanges,
          ip_address: null,
          user_agent: navigator.userAgent,
          session_id: null,
          country: null,
          city: null,
          device_type: null,
        }

        console.log('[useAuditLog] Sending payload:', payload)

        await supabase.functions.invoke('audit-log', {
          body: payload,
        })
      } catch (error) {
        console.error('[useAuditLog] Failed to log action:', error)
      }
    },
    [user],
  )

  return { logAction }
}
