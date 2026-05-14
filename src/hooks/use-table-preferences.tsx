import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface TablePrefs {
  showGridlines: boolean
  gridlineWidth: number
  gridlineColor: string
}

export function useTablePreferences(menuKey: string) {
  const { user, profile } = useAuth()

  const [prefs, setPrefs] = useState<TablePrefs>({
    showGridlines: false,
    gridlineWidth: 1,
    gridlineColor: '#cbd5e1',
  })

  const isFirstLoad = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (profile && (profile as any).table_preferences && isFirstLoad.current) {
      const allPrefs = (profile as any).table_preferences
      if (allPrefs[menuKey]) {
        setPrefs((prev) => ({ ...prev, ...allPrefs[menuKey] }))
      }
      isFirstLoad.current = false
    }
  }, [profile, menuKey])

  const updatePrefs = (newPrefs: Partial<TablePrefs>) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...newPrefs }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (!user) return
        try {
          const { data } = await supabase
            .from('cadastro_usuarios')
            .select('table_preferences')
            .eq('user_id', user.id)
            .maybeSingle()
          const currentTablePrefs = (data as any)?.table_preferences || {}

          await supabase
            .from('cadastro_usuarios')
            .update({
              table_preferences: {
                ...currentTablePrefs,
                [menuKey]: updated,
              },
            } as any)
            .eq('user_id', user.id)
        } catch (err) {
          console.error('Failed to save table preferences', err)
        }
      }, 500)

      return updated
    })
  }

  return { prefs, updatePrefs }
}
