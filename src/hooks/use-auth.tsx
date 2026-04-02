import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: string | null
  profile: any | null
  permissions: any[]
  menuOrder: any[]
  setMenuOrder: (order: any[]) => void
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
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
  const [role, setRole] = useState<string | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [permissions, setPermissions] = useState<any[]>([])
  const [menuOrder, setMenuOrder] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('cadastro_usuarios')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (data?.approval_status === 'pending') {
        await supabase.auth.signOut()
        setRole(null)
        setProfile(null)
        setPermissions([])
        setMenuOrder([])
      } else {
        setRole(data?.role || null)
        setProfile(data || null)
        setPermissions(Array.isArray(data?.permissions) ? data.permissions : [])
        setMenuOrder(Array.isArray(data?.menu_order) ? data.menu_order : [])
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setRole(null)
        setProfile(null)
        setPermissions([])
        setMenuOrder([])
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setRole(null)
        setProfile(null)
        setPermissions([])
        setMenuOrder([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateMenuOrder = async (newOrder: any[]) => {
    setMenuOrder(newOrder)
    if (user) {
      await supabase
        .from('cadastro_usuarios')
        .update({ menu_order: newOrder })
        .eq('user_id', user.id)
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { error }

    if (signInData.user) {
      const { data: userProfile } = await supabase
        .from('cadastro_usuarios')
        .select('approval_status')
        .eq('user_id', signInData.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (userProfile?.approval_status === 'pending') {
        await supabase.auth.signOut()
        return {
          error: new Error('Sua conta ainda está pendente de aprovação pelo administrador.'),
        }
      }
    }

    return { error: null }
  }

  const signOut = async () => {
    setRole(null)
    setProfile(null)
    setPermissions([])
    setMenuOrder([])
    setUser(null)
    setSession(null)

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('Failed to clear localStorage', e)
    }

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        permissions,
        menuOrder,
        setMenuOrder: updateMenuOrder,
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
