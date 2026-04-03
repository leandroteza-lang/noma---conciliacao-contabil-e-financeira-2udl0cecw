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
  Key,
  Tag,
} from 'lucide-react'
import { ChangePasswordModal } from '@/components/ChangePasswordModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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
    id: 'tipo-conta-tga',
    title: 'Tipos de Conta TGA',
    path: '/tipo-conta-tga',
    icon: Tag,
    roles: ['admin', 'supervisor'],
  },
  {
    id: 'usuarios',
    title: 'Cadastro de Usuários',
    path: '/usuarios',
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
  const { user, loading, signOut, role, permissions, menuOrder, setMenuOrder, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [draggedItemPath, setDraggedItemPath] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  const allowedItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const userRole = role || 'collaborator'
      if (userRole === 'admin') return true

      const perms = Array.isArray(permissions) ? permissions : []
      if (perms.includes('all') || perms.includes(item.id)) return true

      if (item.roles && item.roles.includes(userRole)) return true

      return false
    })
  }, [role, permissions])

  const sortedItems = useMemo(() => {
    return [...allowedItems].sort((a, b) => {
      const safeMenuOrder = Array.isArray(menuOrder) ? menuOrder : []
      const idxA = safeMenuOrder.indexOf(a.path)
      const idxB = safeMenuOrder.indexOf(b.path)
      if (idxA === -1 && idxB === -1) return 0
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    })
  }, [allowedItems, menuOrder])

  const hasAccessToCurrentRoute = useMemo(() => {
    const currentMenuItem = MENU_ITEMS.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/' && location.pathname.startsWith(item.path)),
    )
    if (!currentMenuItem) return true
    return allowedItems.some((item) => item.id === currentMenuItem.id)
  }, [location.pathname, allowedItems])

  useEffect(() => {
    const hasAprovacoesAccess =
      role === 'admin' ||
      (Array.isArray(permissions) &&
        (permissions.includes('all') || permissions.includes('aprovacoes')))
    if (!hasAprovacoesAccess) return
    const fetchPending = async () => {
      const [orgs, depts, emps, newUsers, costs, charts, banks] = await Promise.all([
        supabase
          .from('organizations')
          .select('id', { count: 'exact' })
          .eq('pending_deletion', true),
        supabase.from('departments').select('id', { count: 'exact' }).eq('pending_deletion', true),
        supabase
          .from('cadastro_usuarios')
          .select('id', { count: 'exact' })
          .eq('pending_deletion', true),
        supabase
          .from('cadastro_usuarios')
          .select('id', { count: 'exact' })
          .eq('approval_status', 'pending')
          .is('deleted_at', null),
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
        (newUsers.count || 0) +
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cadastro_usuarios' },
        fetchPending,
      )
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
  }, [role, permissions, location.pathname])

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

  if (profile?.approval_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso em Análise</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Seu cadastro foi recebido com sucesso e está aguardando aprovação de um administrador.
            Você receberá um aviso assim que seu acesso for liberado.
          </p>
          <button
            onClick={async () => {
              await signOut()
              setTimeout(() => {
                window.location.replace('/login')
              }, 50)
            }}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  if (!hasAccessToCurrentRoute && sortedItems.length > 0) {
    return <Navigate to={sortedItems[0].path} replace />
  }

  if (!hasAccessToCurrentRoute && sortedItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
            <LogOut className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Você não tem permissão para acessar nenhuma página do sistema. Contate um administrador.
          </p>
          <button
            onClick={async () => {
              await signOut()
              setTimeout(() => {
                window.location.replace('/login')
              }, 50)
            }}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut()
    setTimeout(() => {
      window.location.replace('/login')
    }, 50)
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
                {sortedItems.map((item) => {
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 sticky top-0 z-30 shadow-sm justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 text-slate-600" />
            <div className="flex items-center gap-3 md:hidden ml-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
                <Wallet className="size-5" />
              </div>
              <span className="font-bold text-slate-800 tracking-tight truncate">
                Gestão de Contas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {profile?.name || user.email}
                </span>
                <Avatar className="h-9 w-9 border border-slate-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                    {(profile?.name || user.email || 'U').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="cursor-pointer"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in w-full overflow-x-hidden">
          <div className="mx-auto max-w-[1400px]">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </SidebarInset>
      <ChangePasswordModal open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </SidebarProvider>
  )
}
