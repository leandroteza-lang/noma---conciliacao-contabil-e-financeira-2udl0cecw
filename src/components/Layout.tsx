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
  Folder,
  ChevronRight,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { ThemeToggle } from '@/components/ThemeToggle'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export type MenuItem = {
  id: string
  title: string
  path: string
  icon: any
  roles: string[]
  isFolder?: boolean
}

export const MENU_ITEMS: MenuItem[] = [
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
  {
    id: 'cadastros-gerais',
    title: 'Cadastros Gerais',
    path: '#cadastros-gerais',
    icon: Folder,
    roles: ['admin', 'supervisor', 'collaborator'],
    isFolder: true,
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

  const normalizedOrder = useMemo(() => {
    const order = Array.isArray(menuOrder) ? menuOrder : []
    const result: { path: string; children?: string[] }[] = []
    const foundPaths = new Set<string>()

    order.forEach((item) => {
      if (typeof item === 'string') {
        if (allowedItems.some((a) => a.path === item)) {
          result.push({ path: item })
          foundPaths.add(item)
        }
      } else if (item && typeof item === 'object' && item.path) {
        if (allowedItems.some((a) => a.path === item.path)) {
          const children: string[] = []
          if (Array.isArray(item.children)) {
            item.children.forEach((child: string) => {
              if (allowedItems.some((a) => a.path === child) && !foundPaths.has(child)) {
                children.push(child)
                foundPaths.add(child)
              }
            })
          }
          result.push({ path: item.path, children })
          foundPaths.add(item.path)
        }
      }
    })

    allowedItems.forEach((a) => {
      if (!foundPaths.has(a.path)) {
        if (a.isFolder) {
          result.push({ path: a.path, children: [] })
        } else {
          result.push({ path: a.path })
        }
        foundPaths.add(a.path)
      }
    })

    return result
  }, [menuOrder, allowedItems])

  const firstAvailablePath = useMemo(() => {
    for (const node of normalizedOrder) {
      if (!MENU_ITEMS.find((m) => m.path === node.path)?.isFolder) {
        return node.path
      }
      if (node.children && node.children.length > 0) {
        return node.children[0]
      }
    }
    return '/'
  }, [normalizedOrder])

  const hasAccessToCurrentRoute = useMemo(() => {
    const currentMenuItem = MENU_ITEMS.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/' && !item.isFolder && location.pathname.startsWith(item.path)),
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
    e.stopPropagation()
    setDraggedItemPath(path)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (
    e: React.DragEvent,
    targetPath: string,
    dropType: 'before' | 'inside' = 'before',
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItemPath || draggedItemPath === targetPath) return

    let newOrder = JSON.parse(JSON.stringify(normalizedOrder)) as {
      path: string
      children?: string[]
    }[]
    let draggedNode: { path: string; children?: string[] } | null = null
    let draggedIsFolder = false

    newOrder = newOrder
      .map((node) => {
        if (node.path === draggedItemPath) {
          draggedNode = { path: node.path, children: node.children }
          draggedIsFolder = MENU_ITEMS.find((i) => i.path === draggedItemPath)?.isFolder || false
          return null
        }
        if (node.children) {
          const childIdx = node.children.indexOf(draggedItemPath)
          if (childIdx !== -1) {
            draggedNode = { path: draggedItemPath }
            node.children.splice(childIdx, 1)
          }
        }
        return node
      })
      .filter(Boolean) as { path: string; children?: string[] }[]

    if (!draggedNode) return

    let inserted = false

    if (dropType === 'inside') {
      const folderNode = newOrder.find((n) => n.path === targetPath)
      if (folderNode && !draggedIsFolder) {
        folderNode.children = folderNode.children || []
        folderNode.children.push(draggedNode.path)
        inserted = true
      }
    } else {
      for (let i = 0; i < newOrder.length; i++) {
        if (newOrder[i].path === targetPath) {
          newOrder.splice(i, 0, draggedNode)
          inserted = true
          break
        }
        if (newOrder[i].children) {
          const childIdx = newOrder[i].children!.indexOf(targetPath)
          if (childIdx !== -1) {
            if (draggedIsFolder) {
              newOrder.splice(i, 0, draggedNode)
            } else {
              newOrder[i].children!.splice(childIdx, 0, draggedNode.path)
            }
            inserted = true
            break
          }
        }
      }
    }

    if (!inserted) {
      newOrder.push(draggedNode)
    }

    setMenuOrder(newOrder)
    setDraggedItemPath(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.approval_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-sm border border-border p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso em Análise</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
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
            className="w-full py-2.5 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
          >
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  if (!hasAccessToCurrentRoute && normalizedOrder.length > 0) {
    return <Navigate to={firstAvailablePath} replace />
  }

  if (!hasAccessToCurrentRoute && normalizedOrder.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-sm border border-border p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <LogOut className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Você não tem permissão para acessar nenhuma página do sistema. Contate um administrador.
          </p>
          <button
            onClick={async () => {
              await signOut()
              setTimeout(() => {
                window.location.replace('/login')
              }, 50)
            }}
            className="w-full py-2.5 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
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
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-sm flex items-center justify-center shrink-0">
              <Wallet className="size-5" />
            </div>
            <span className="font-bold text-sidebar-foreground tracking-tight truncate group-data-[collapsible=offcanvas]:hidden">
              Gestão de Contas
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {normalizedOrder.map((node) => {
                  const item = allowedItems.find((a) => a.path === node.path)
                  if (!item) return null

                  if (item.isFolder) {
                    const isActive = node.children?.some(
                      (childPath) =>
                        location.pathname === childPath ||
                        location.pathname.startsWith(childPath + '/'),
                    )

                    return (
                      <Collapsible
                        key={node.path}
                        asChild
                        defaultOpen={isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem
                          draggable
                          onDragStart={(e) => handleDragStart(e, node.path)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, node.path, 'before')}
                          className={cn(draggedItemPath === node.path && 'opacity-50')}
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              size="lg"
                              className="flex items-center justify-between w-full cursor-pointer text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="size-4 shrink-0 text-sidebar-foreground/50 group-data-[state=open]/collapsible:text-primary" />
                                <span className="font-medium">{item.title}</span>
                              </div>
                              <ChevronRight className="size-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub className="pr-0 mr-0 border-l border-sidebar-border ml-4 pl-2 py-1">
                              {node.children?.map((childPath) => {
                                const childItem = allowedItems.find((a) => a.path === childPath)
                                if (!childItem) return null
                                const isChildActive = location.pathname === childItem.path
                                return (
                                  <SidebarMenuSubItem
                                    key={childPath}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, childPath)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, childPath, 'before')}
                                    className={cn(draggedItemPath === childPath && 'opacity-50')}
                                  >
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isChildActive}
                                      className={cn(
                                        'transition-all duration-200 group relative my-0.5',
                                        isChildActive
                                          ? 'bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary'
                                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                      )}
                                    >
                                      <Link
                                        to={childItem.path}
                                        className="flex items-center justify-between w-full"
                                      >
                                        <div className="flex items-center gap-2">
                                          <childItem.icon
                                            className={cn(
                                              'size-4 shrink-0',
                                              isChildActive
                                                ? 'text-primary'
                                                : 'text-sidebar-foreground/50',
                                            )}
                                          />
                                          <span className="font-medium">{childItem.title}</span>
                                          {childItem.id === 'aprovacoes' && pendingCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                              {pendingCount}
                                            </span>
                                          )}
                                        </div>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}

                              <SidebarMenuSubItem
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, node.path, 'inside')}
                                className={cn(
                                  'h-8 mt-1 flex items-center justify-center border-2 border-dashed border-transparent rounded-md transition-colors',
                                  draggedItemPath &&
                                    draggedItemPath !== node.path &&
                                    !node.children?.includes(draggedItemPath) &&
                                    !MENU_ITEMS.find((i) => i.path === draggedItemPath)?.isFolder
                                    ? 'border-sidebar-border hover:border-primary/50 hover:bg-primary/5'
                                    : 'hidden',
                                )}
                              >
                                <span className="text-xs text-sidebar-foreground/50 font-medium">
                                  Mover para cá
                                </span>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  const isActive = location.pathname === item.path
                  return (
                    <SidebarMenuItem
                      key={node.path}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.path)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, node.path, 'before')}
                      className={cn(draggedItemPath === node.path && 'opacity-50')}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        size="lg"
                        className={cn(
                          'transition-all duration-200 group relative',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Link to={item.path} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <item.icon
                              className={cn(
                                'size-4 shrink-0',
                                isActive ? 'text-primary' : 'text-sidebar-foreground/50',
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
                className="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4 shrink-0 text-sidebar-foreground/50 group-hover/menu-button:text-destructive" />
                <span className="font-medium">Sair da conta</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-muted/30 min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sticky top-0 z-30 shadow-sm justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 text-muted-foreground" />
            <div className="flex items-center gap-3 md:hidden ml-2">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-sm flex items-center justify-center">
                <Wallet className="size-5" />
              </div>
              <span className="font-bold text-foreground tracking-tight truncate">
                Gestão de Contas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {profile?.name || user.email}
                </span>
                <Avatar className="h-9 w-9 border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
