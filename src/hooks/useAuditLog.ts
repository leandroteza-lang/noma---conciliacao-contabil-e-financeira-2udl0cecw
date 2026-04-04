import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export const useAuditLog = () => {
  const { user } = useAuth()

  const logAction = async (
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    changes?: Record<string, { old: any; new: any }>,
  ) => {
    try {
      let sessionId = localStorage.getItem('audit_session_id')
      if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem('audit_session_id', sessionId)
      }

      const deviceType = getDeviceType()
      const geoData = await getGeoLocation()

      const payload = {
        entityType,
        entityId,
        action,
        performedBy: user?.id,
        changes,
        sessionId,
        ipAddress: geoData.ip,
        userAgent: navigator.userAgent,
        country: geoData.country,
        city: geoData.city,
        deviceType,
      }

      const { data, error } = await supabase.functions.invoke('audit-log', {
        body: payload,
      })

      if (error) {
        throw new Error(`Erro ao registrar auditoria: ${error.message}`)
      }
      return data
    } catch (error: any) {
      console.error('Erro ao registrar log de auditoria:', error.message)
    }
  }

  return { logAction }
}

function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

async function getGeoLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    return {
      ip: data.ip || 'unknown',
      country: data.country_name || 'unknown',
      city: data.city || 'unknown',
    }
  } catch {
    return { ip: 'unknown', country: 'unknown', city: 'unknown' }
  }
}
