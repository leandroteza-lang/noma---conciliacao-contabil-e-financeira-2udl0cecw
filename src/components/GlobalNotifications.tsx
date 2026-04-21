import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function GlobalNotifications() {
  const { user, role } = useAuth() as any
  const notifiedQueriesRef = useRef<Set<string>>(new Set())
  const notifiedDeletionsRef = useRef<Set<string>>(new Set())

  const playSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 note
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
        osc.start()
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3)
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      console.error('Audio play failed:', e)
    }
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
      .channel(`global_shared_queries_changes_${Math.random().toString(36).substring(2, 9)}`)
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

            playSound()

            toast.success('Novo Acesso!', {
              description: `O link "${newRecord.prompt}" foi acessado pela primeira vez.`,
              duration: 10000,
              icon: '🔔',
            })
          }
        },
      )
      .subscribe()

    let adminChannel: any = null
    if (role === 'admin') {
      const handleRealtimeEvent = (payload: any) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload

        // Sempre notifica para atualizar os badges e listas
        window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))

        if (table === 'pending_changes') {
          if (eventType === 'INSERT' && newRecord.status === 'pending') {
            playSound()
            toast.success('Nova Aprovação Pendente!', {
              description: 'Uma nova alteração ou criação foi enviada para revisão.',
              duration: 10000,
              icon: '🔔',
            })
          } else if (
            eventType === 'UPDATE' &&
            newRecord.status === 'pending' &&
            oldRecord?.status !== 'pending'
          ) {
            playSound()
            toast.success('Nova Aprovação Pendente!', {
              description: 'Uma nova alteração ou criação foi enviada para revisão.',
              duration: 10000,
              icon: '🔔',
            })
          }
        } else if (table === 'cadastro_usuarios') {
          if (eventType === 'INSERT' && newRecord.approval_status === 'pending') {
            playSound()
            toast.success('Novo Usuário Pendente!', {
              description: 'Um novo usuário solicitou acesso.',
              duration: 10000,
              icon: '🔔',
            })
          } else if (
            eventType === 'UPDATE' &&
            newRecord.approval_status === 'pending' &&
            oldRecord?.approval_status !== 'pending'
          ) {
            playSound()
            toast.success('Novo Usuário Pendente!', {
              description: 'Um novo usuário solicitou acesso.',
              duration: 10000,
              icon: '🔔',
            })
          }
        }

        // Lógica de exclusão/lixeira
        if (eventType === 'UPDATE' && newRecord) {
          const isPending = newRecord.pending_deletion === true && !newRecord.deleted_at
          const isTrash = newRecord.deleted_at !== null

          if (isPending || isTrash) {
            const id = newRecord.id
            if (!notifiedDeletionsRef.current.has(id)) {
              notifiedDeletionsRef.current.add(id)
              playSound()
              const isDesvinculacao = table === 'account_mapping'
              toast.success(
                isTrash
                  ? 'Item na Lixeira!'
                  : isDesvinculacao
                    ? 'Desvinculação Pendente!'
                    : 'Exclusão Pendente!',
                {
                  description: isTrash
                    ? 'Um item foi movido para a lixeira.'
                    : isDesvinculacao
                      ? 'Uma solicitação de desvinculação foi enviada para revisão.'
                      : 'Uma solicitação de exclusão foi enviada para revisão.',
                  duration: 10000,
                  icon: isDesvinculacao && !isTrash ? '🔗' : '🗑️',
                },
              )
            }
          } else if (newRecord.pending_deletion === false && !newRecord.deleted_at) {
            if (newRecord.id) {
              notifiedDeletionsRef.current.delete(newRecord.id)
            }
          }
        }
      }

      adminChannel = supabase.channel(
        `admin_notifications_${Math.random().toString(36).substring(2, 9)}`,
      )

      const realtimeTables = [
        'organizations',
        'departments',
        'cost_centers',
        'chart_of_accounts',
        'bank_accounts',
        'tipo_conta_tga',
        'cadastro_usuarios',
        'account_mapping',
        'pending_changes',
      ]

      realtimeTables.forEach((table) => {
        adminChannel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          handleRealtimeEvent,
        )
      })

      adminChannel.subscribe()
    }

    return () => {
      supabase.removeChannel(channel)
      if (adminChannel) supabase.removeChannel(adminChannel)
    }
  }, [user, role, playSound])

  return null
}
