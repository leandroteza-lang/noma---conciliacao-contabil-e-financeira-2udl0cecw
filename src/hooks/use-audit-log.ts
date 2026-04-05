import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAuditLog() {
  const logAction = useCallback(
    async (
      entityType: string,
      entityId: string,
      action: string,
      changes?: Record<string, { old?: any; new?: any }>,
    ) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) return

        await supabase.functions.invoke('audit-log', {
          body: {
            entityType,
            entityId,
            action,
            performedBy: session.user.id,
            changes,
            userAgent: navigator.userAgent,
          },
        })
      } catch (error) {
        console.error('Failed to log action:', error)
      }
    },
    [],
  )

  return { logAction }
}
