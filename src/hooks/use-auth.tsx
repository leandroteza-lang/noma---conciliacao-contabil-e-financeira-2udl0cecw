import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: 'admin' | 'supervisor' | 'collaborator' | 'client_user'
  permissions: string[]
  menuOrder: string[]
  profile: { name: string; avatar_url: string | null; approval_status: string } | null
  setMenuOrder: (order: string[]) => void
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
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
  const [role, setRole] = useState<'admin' | 'supervisor' | 'collaborator' | 'client_user'>('admin')
  const [permissions, setPermissions] = useState<string[]>(['all'])
  const [menuOrder, setMenuOrderState] = useState<string[]>([])
  const [profile, setProfile] = useState<{
    name: string
    avatar_url: string | null
    approval_status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = (userEmail?: string) => {
      if (!userEmail) return
      supabase
        .from('cadastro_usuarios')
        .select('role, permissions, menu_order, approval_status, name, avatar_url')
        .eq('email', userEmail)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setRole((data.role as any) || 'admin')
            setPermissions(Array.isArray(data.permissions) ? data.permissions : ['all'])
            setMenuOrderState(Array.isArray(data.menu_order) ? data.menu_order : [])
            setProfile({
              name: data.name,
              avatar_url: data.avatar_url,
              approval_status: data.approval_status || 'approved',
            })
          } else {
            setRole('admin')
            setPermissions(['all'])
            setMenuOrderState([])
            setProfile(null)
          }
        })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.email) {
        fetchRole(session.user.email)
      }
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.email) {
        fetchRole(session.user.email)
      }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    })
    return { error }
  }
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const setMenuOrder = async (order: string[]) => {
    setMenuOrderState(order)
    if (user?.email) {
      await supabase
        .from('cadastro_usuarios')
        .update({ menu_order: order } as any)
        .eq('email', user.email)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        permissions,
        menuOrder,
        profile,
        setMenuOrder,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
