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
  Users,
  Briefcase,
  LineChart,
  List,
  CheckSquare,
  GripVertical,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: PieChart,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'analises',
    title: 'Análises',
    path: '/analises',
    icon: LineChart,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'listagem',
    title: 'Listagem de Contas',
    path: '/',
    icon: Home,
    roles: ['admin', 'supervisor', 'collaborator'],
  },
  {
    id: 'lancamentos',
    title: 'Lançamentos Contábeis',
    path: '/lancamentos',
    icon: BookOpen,
    roles: ['admin', 'supervisor', 'collaborator'],
  },
  {
    id: 'empresas',
    title: 'Empresas',
    path: '/empresas',
    icon: Building2,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'departamentos',
    title: 'Departamentos',
    path: '/departamentos',
    icon: Briefcase,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'centros-de-custo',
    title: 'Centros de Custo',
    path: '/centros-de-custo',
    icon: Briefcase,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'plano-de-contas',
    title: 'Plano de Contas',
    path: '/plano-de-contas',
    icon: List,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'mapeamento',
    title: 'Mapeamento DE/PARA',
    path: '/mapeamento',
    icon: ArrowRightLeft,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'funcionarios',
    title: 'Funcionários',
    path: '/funcionarios',
    icon: Users,
    roles: ['admin'],
  },
  { id: 'import', title: 'Importar Dados', path: '/import', icon: Upload, roles: ['admin'] },
  {
    id: 'aprovacoes',
    title: 'Aprovações',
    path: '/aprovacoes',
    icon: CheckSquare,
    roles: ['admin'],
  },
]

export default function Layout() {
  const { user, loading, signOut, role, permissions, menuOrder, setMenuOrder } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [draggedItemPath, setDraggedItemPath] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (role !== 'admin') return
    const fetchPending = async () => {
      const [orgs, depts, emps, costs, charts, banks] = await Promise.all([
        supabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('pending_deletion', true),
        supabase.from('departments').select('id', { count: 'exact' }).eq('pending_deletion', true),
        supabase.from('employees').select('id', { count: 'exact' }).eq('pending_deletion', true),
        supabase.from('cost_centers').select('id', { count: 'exact' }).eq('pending_deletion', true),
        supabase
          .from('chart_of_accounts')
          .select('id', { count: 'exact' })
          .eq('pending_deletion', true),
        supabase
          .from('bank_accounts')
          .select('id', { count: 'exact' })
          .eq('pending_deletion', true),
      ])
      const total =
        (orgs.count || 0) +
        (depts.count || 0) +
        (emps.count || 0) +
        (costs.count || 0) +
        (charts.count || 0) +
        (banks.count || 0)
      setPendingCount(total)
    }

    fetchPending()

    const channel = supabase
      .channel('schema-db-changes-layout')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        fetchPending,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, fetchPending)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchPending)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_centers' }, fetchPending)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chart_of_accounts' },
        fetchPending,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bank_accounts' },
        fetchPending,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [role, location.pathname])

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggedItemPath(path)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetPath: string, sortedItems: any[]) => {
    e.preventDefault()
    if (!draggedItemPath || draggedItemPath === targetPath) return

    const currentOrder = sortedItems.map((item) => item.path)
    const draggedIdx = currentOrder.indexOf(draggedItemPath)
    const targetIdx = currentOrder.indexOf(targetPath)

    if (draggedIdx !== -1 && targetIdx !== -1) {
      currentOrder.splice(draggedIdx, 1)
      currentOrder.splice(targetIdx, 0, draggedItemPath)
      setMenuOrder(currentOrder)
    }
    setDraggedItemPath(null)
  }

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
                {(() => {
                  const allowedItems = MENU_ITEMS.filter((item) => {
                    if (item.roles && !item.roles.includes(role)) return false
                    if (permissions.includes('all')) return true
                    return permissions.includes(item.id)
                  })

                  // Apply custom ordering
                  const sortedItems = [...allowedItems].sort((a, b) => {
                    const idxA = menuOrder.indexOf(a.path)
                    const idxB = menuOrder.indexOf(b.path)
                    if (idxA === -1 && idxB === -1) return 0
                    if (idxA === -1) return 1
                    if (idxB === -1) return -1
                    return idxA - idxB
                  })

                  return sortedItems.map((item, index) => {
                    const isActive = location.pathname === item.path
                    return (
                      <SidebarMenuItem
                        key={item.path}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.path)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item.path, sortedItems)}
                        className={cn(draggedItemPath === item.path && 'opacity-50')}
                      >
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          size="lg"
                          className={cn(
                            'transition-all duration-200 group relative',
                            isActive
                              ? 'bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-50 hover:text-blue-700'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          )}
                        >
                          <Link to={item.path} className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <item.icon
                                className={cn(
                                  'size-4 shrink-0',
                                  isActive ? 'text-blue-700' : 'text-slate-400',
                                )}
                              />
                              <span className="font-medium">{item.title}</span>
                              {item.id === 'aprovacoes' && pendingCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {pendingCount}
                                </span>
                              )}
                            </div>
                            <div className="hidden group-hover:flex items-center opacity-40 hover:opacity-100 cursor-grab active:cursor-grabbing">
                              <GripVertical className="size-4" />
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                })()}
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
