import { useState } from 'react'
import { Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Wallet,
  LogOut,
  Loader2,
  Menu,
  Home,
  Upload,
  ArrowRightLeft,
  BookOpen,
  Building2,
  PieChart,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const menuItems = [
  { title: 'Dashboard', path: '/dashboard', icon: PieChart },
  { title: 'Listagem de Contas', path: '/', icon: Home },
  { title: 'Empresas', path: '/empresas', icon: Building2 },
  { title: 'Importar Dados', path: '/import', icon: Upload },
  { title: 'Mapeamento DE/PARA', path: '/mapeamento', icon: ArrowRightLeft },
  { title: 'Lançamentos Contábeis', path: '/lancamentos', icon: BookOpen },
]

export default function Layout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const NavLinks = () => (
    <nav className="space-y-1.5">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-700' : 'text-slate-400')} />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-20 shadow-sm">
        <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight truncate">Gestão de Contas</span>
        </div>
        <div className="flex-1 py-6 px-4 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Main Content Layout */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen w-full">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 text-slate-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-white">
                <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
                  <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-slate-800 tracking-tight truncate">
                    Gestão de Contas
                  </span>
                </div>
                <div className="flex-1 py-6 px-4 overflow-y-auto">
                  <NavLinks />
                </div>
                <div className="p-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair da conta
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight truncate">
              Gestão de Contas
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in w-full">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
