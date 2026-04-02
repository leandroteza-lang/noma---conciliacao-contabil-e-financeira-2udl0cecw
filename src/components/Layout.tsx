import { Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Wallet,
  LogOut,
  Loader2,
  Home,
  Upload,
  ArrowRightLeft,
  BookOpen,
  Building2,
  PieChart,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'

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
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="z-20">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4 h-16 flex justify-center">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
              <Wallet className="size-5" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight truncate group-data-[collapsible=offcanvas]:hidden">
              Gestão de Contas
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        size="lg"
                        className={cn(
                          'transition-all duration-200',
                          isActive
                            ? 'bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-50 hover:text-blue-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )}
                      >
                        <Link to={item.path}>
                          <item.icon
                            className={cn(
                              'size-4 shrink-0',
                              isActive ? 'text-blue-700' : 'text-slate-400',
                            )}
                          />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                size="lg"
                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="size-4 shrink-0 text-slate-400 group-hover/menu-button:text-red-600" />
                <span className="font-medium">Sair da conta</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-slate-50 min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 sticky top-0 z-30 shadow-sm">
          <SidebarTrigger className="-ml-2 text-slate-600" />
          <div className="flex items-center gap-3 md:hidden ml-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Wallet className="size-5" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight truncate">
              Gestão de Contas
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in w-full overflow-x-hidden">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
