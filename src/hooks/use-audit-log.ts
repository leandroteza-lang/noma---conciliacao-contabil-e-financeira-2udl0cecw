import { useAuth } from './use-auth'
import { supabase } from '@/lib/supabase/client'

export function useAuditLog() {
  const { user } = useAuth()

  const normalizeValue = (val: any) => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'string') return val.trim()
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const logAction = async (
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | string,
    changes: Record<string, any>,
  ) => {
    if (!user) return

    const validChanges: Record<string, any> = {}

    if (changes) {
      for (const [key, value] of Object.entries(changes)) {
        if (value !== null && typeof value === 'object' && ('old' in value || 'new' in value)) {
          const oldValStr = normalizeValue(value.old)
          const newValStr = normalizeValue(value.new)

          if (oldValStr !== newValStr) {
            validChanges[key] = {
              old: oldValStr,
              new: newValStr,
            }
          }
        } else if (value !== undefined) {
          validChanges[key] = {
            old: '',
            new: normalizeValue(value),
          }
        }
      }
    }

    console.log('[Audit Log] Objeto changes original:', changes)
    console.log('[Audit Log] Mudanças válidas detectadas:', validChanges)

    if (
      (action === 'UPDATE' || action === 'EDICAO' || action === 'ALTERADO') &&
      Object.keys(validChanges).length === 0
    ) {
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
