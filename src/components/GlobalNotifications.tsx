import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function GlobalNotifications() {
  const { user, role } = useAuth() as any
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notifiedQueriesRef = useRef<Set<string>>(new Set())
  const notifiedDeletionsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    audioRef.current = audio
  }, [])

  useEffect(() => {
    if (!user) return

    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((e) => console.error('Audio play failed:', e))
      }
    }

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
      const handlePendingDeletion = (payload: any) => {
        window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))

        if (payload.eventType === 'UPDATE' && payload.new) {
          const isPending = payload.new.pending_deletion === true && !payload.new.deleted_at
          const isTrash = payload.new.deleted_at !== null

          if (isPending || isTrash) {
            const id = payload.new.id
            if (!notifiedDeletionsRef.current.has(id)) {
              notifiedDeletionsRef.current.add(id)

              playSound()
              toast.success(isTrash ? 'Item na Lixeira!' : 'Exclusão Pendente!', {
                description: isTrash
                  ? 'Um item foi movido para a lixeira.'
                  : 'Uma solicitação de exclusão foi enviada para revisão.',
                duration: 10000,
                icon: '🗑️',
              })
            }
          } else if (payload.new.pending_deletion === false && !payload.new.deleted_at) {
            if (payload.new.id) {
              notifiedDeletionsRef.current.delete(payload.new.id)
            }
          }
        }
      }

      adminChannel = supabase.channel(
        `admin_notifications_${Math.random().toString(36).substring(2, 9)}`,
      )

      adminChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_changes',
        },
        (payload: any) => {
          if (payload.new.status === 'pending') {
            playSound()
            toast.success('Nova Aprovação Pendente!', {
              description: 'Uma nova alteração ou criação foi enviada para revisão.',
              duration: 10000,
              icon: '🔔',
            })
            window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
          }
        },
      )

      adminChannel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pending_changes',
        },
        (payload: any) => {
          if (payload.new.status === 'pending' && payload.old?.status !== 'pending') {
            playSound()
            toast.success('Nova Aprovação Pendente!', {
              description: 'Uma nova alteração ou criação foi enviada para revisão.',
              duration: 10000,
              icon: '🔔',
            })
            window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
          }
        },
      )

      adminChannel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cadastro_usuarios' },
        (payload: any) => {
          if (payload.new.approval_status === 'pending') {
            playSound()
            toast.success('Novo Usuário Pendente!', {
              description: 'Um novo usuário solicitou acesso.',
              duration: 10000,
              icon: '🔔',
            })
            window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
          }
        },
      )

      adminChannel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cadastro_usuarios' },
        (payload: any) => {
          if (
            payload.new.approval_status === 'pending' &&
            payload.old?.approval_status !== 'pending'
          ) {
            playSound()
            toast.success('Novo Usuário Pendente!', {
              description: 'Um novo usuário solicitou acesso.',
              duration: 10000,
              icon: '🔔',
            })
            window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
          }
        },
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
      ]

      realtimeTables.forEach((table) => {
        adminChannel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          handlePendingDeletion,
        )
      })

      adminChannel.subscribe()
    }

    return () => {
      supabase.removeChannel(channel)
      if (adminChannel) supabase.removeChannel(adminChannel)
    }
  }, [user, role])

  return null
}
