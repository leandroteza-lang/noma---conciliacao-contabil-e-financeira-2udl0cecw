import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function GlobalNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notifiedQueriesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    audioRef.current = audio
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchNotifiedQueries = async () => {
      const { data } = await supabase
        .from('shared_queries')
        .select('id')
        .eq('user_id', user.id)
        .eq('first_access_notified', true)

      if (data) {
        data.forEach((q) => notifiedQueriesRef.current.add(q.id))
      }
    }

    fetchNotifiedQueries()

    const channel = supabase
      .channel('global_shared_queries_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_queries',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any

          if (newRecord.first_access_notified === false) {
            notifiedQueriesRef.current.delete(newRecord.id)
          }

          if (
            newRecord.notify_first_access &&
            newRecord.first_access_notified &&
            !notifiedQueriesRef.current.has(newRecord.id)
          ) {
            notifiedQueriesRef.current.add(newRecord.id)

            if (audioRef.current) {
              audioRef.current.play().catch((e) => console.error('Audio play failed:', e))
            }

            toast({
              title: '🔔 Novo Acesso!',
              description: `O link "${newRecord.prompt}" foi acessado pela primeira vez.`,
              duration: 10000,
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, toast])

  return null
}
