import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { Wallet, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3 max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate hidden sm:block">
              Gestão de Contas Bancárias e Caixa
            </h1>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight sm:hidden">
              Gestão de Contas
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
