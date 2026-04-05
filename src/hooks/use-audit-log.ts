import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function useAuditLog() {
  const { user, session } = useAuth()

  const logAction = useCallback(
    async (
      entityType: string,
      entityId: string,
      action: string,
      changes?: Record<string, { old?: any; new?: any }>,
    ) => {
      if (!user) return

      try {
        let normalizedEntity = entityType.toLowerCase()
        if (normalizedEntity === 'usuarios') normalizedEntity = 'usuario'

        const { error } = await supabase.functions.invoke('audit-log', {
          body: {
            entityType: normalizedEntity,
            entityId,
            action,
            performedBy: user.id,
            changes,
            userAgent: navigator.userAgent,
            deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        })

        if (error) {
          console.error('Failed to log audit action:', error)
        }
      } catch (err) {
        console.error('Error calling audit log function:', err)
      }
    },
    [user, session],
  )

  return { logAction }
}
