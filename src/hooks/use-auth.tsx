import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  role: string | null
  permissions: string[]
  menuOrder: string[]
  setMenuOrder: (order: string[]) => void
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cadastro_usuarios')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .maybeSingle()

      if (data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setProfile(null)
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Realtime subscription for profile changes to ensure permissions are always up to date
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`profile_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cadastro_usuarios',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    setProfile(null)
    setUser(null)
    setSession(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const setMenuOrder = async (order: string[]) => {
    if (!user) return
    setProfile((prev: any) => (prev ? { ...prev, menu_order: order } : null))
    await supabase.from('cadastro_usuarios').update({ menu_order: order }).eq('user_id', user.id)
  }

  const role = profile?.role || 'collaborator'
  const permissions = Array.isArray(profile?.permissions) ? profile.permissions : ['all']
  const menuOrder = Array.isArray(profile?.menu_order) ? profile.menu_order : []

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        permissions,
        menuOrder,
        setMenuOrder,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
