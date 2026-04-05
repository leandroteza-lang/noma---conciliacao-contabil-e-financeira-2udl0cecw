import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

function getDeviceType(): string {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile'
  }
  return 'desktop'
}

async function getGeoLocation() {
  try {
    const response = await fetch('https://ipwho.is/')
    if (!response.ok) throw new Error('API failed')
    const data = await response.json()
    if (data.success) {
      return {
        ip: data.ip || 'N/A',
        country: data.country || 'N/A',
        city: data.city || 'N/A',
      }
    }
    throw new Error('Invalid data')
  } catch {
    try {
      const fallbackResponse = await fetch('https://freeipapi.com/api/json/')
      const fallbackData = await fallbackResponse.json()
      return {
        ip: fallbackData.ipAddress || 'N/A',
        country: fallbackData.countryName || 'N/A',
        city: fallbackData.cityName || 'N/A',
      }
    } catch {
      return { ip: 'N/A', country: 'N/A', city: 'N/A' }
    }
  }
}

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
        let sessionId = 'unknown'
        try {
          sessionId = localStorage.getItem('audit_session_id') || ''
          if (!sessionId) {
            sessionId = crypto.randomUUID()
            localStorage.setItem('audit_session_id', sessionId)
          }
        } catch (e) {
          sessionId = crypto.randomUUID()
        }

        const deviceType = getDeviceType()
        const geoData = await getGeoLocation()

        let normalizedEntity = entityType.toLowerCase()
        if (normalizedEntity === 'usuarios') normalizedEntity = 'usuario'

        const payload = {
          entityType: normalizedEntity,
          entityId,
          action,
          performedBy: user.id,
          changes,
          sessionId,
          ipAddress: geoData.ip,
          userAgent: navigator.userAgent,
          country: geoData.country,
          city: geoData.city,
          deviceType,
        }

        const { error } = await supabase.functions.invoke('audit-log', {
          body: payload,
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
