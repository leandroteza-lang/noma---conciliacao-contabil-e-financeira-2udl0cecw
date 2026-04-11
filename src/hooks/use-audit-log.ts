import { useAuth } from './use-auth'
import { supabase } from '@/lib/supabase/client'

export function useAuditLog() {
  const { user } = useAuth()

  const normalizeValue = (val: any) => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'string') return val.trim()
    return String(val)
  }

  const logAction = async (
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    changes: Record<string, any>,
  ) => {
    if (!user) return

    const validChanges: Record<string, any> = {}

    if (changes) {
      for (const [key, value] of Object.entries(changes)) {
        if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
          const oldVal = normalizeValue(value.old)
          const newVal = normalizeValue(value.new)

          if (oldVal !== newVal) {
            validChanges[key] = { old: value.old, new: value.new }
          }
        }
      }
    }

    console.log('[Audit Log] Objeto changes original:', changes)
    console.log('[Audit Log] Mudanças válidas detectadas:', validChanges)

    if (action === 'UPDATE' && Object.keys(validChanges).length === 0) {
      console.log('[Audit Log] Nenhuma mudança real detectada, ignorando envio.')
      return
    }

    try {
      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        action,
        performed_by: user.id,
        changes: validChanges,
      }

      console.log('[Audit Log] Enviando para Edge Function:', payload)

      await supabase.functions.invoke('audit-log', {
        body: payload,
      })
    } catch (err) {
      console.error('[Audit Log] Falha ao enviar log:', err)
    }
  }

  return { logAction }
}
