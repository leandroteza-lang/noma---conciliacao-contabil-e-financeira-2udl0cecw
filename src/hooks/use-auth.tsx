import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: 'admin' | 'supervisor' | 'collaborator'
  permissions: string[]
  menuOrder: string[]
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
  const [role, setRole] = useState<'admin' | 'supervisor' | 'collaborator'>('admin')
  const [permissions, setPermissions] = useState<string[]>(['all'])
  const [menuOrder, setMenuOrderState] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = (userId?: string) => {
      if (!userId) return
      supabase
        .from('employees')
        .select('role, permissions, menu_order')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setRole((data.role as any) || 'admin')
            setPermissions(Array.isArray(data.permissions) ? data.permissions : ['all'])
            setMenuOrderState(Array.isArray(data.menu_order) ? data.menu_order : [])
          } else {
            setRole('admin')
            setPermissions(['all'])
            setMenuOrderState([])
          }
        })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.id) {
        fetchRole(session.user.id)
      }
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.id) {
        fetchRole(session.user.id)
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
    if (user?.id) {
      await supabase
        .from('employees')
        .update({ menu_order: order } as any)
        .eq('user_id', user.id)
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
