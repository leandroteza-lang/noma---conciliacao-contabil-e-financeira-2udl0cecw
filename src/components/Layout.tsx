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
  Share2,
  Shield,
  FileText,
  Activity,
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
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { supabase } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Chatbot } from '@/components/Chatbot'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
  useSidebar,
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
    path: '/app',
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
    title: 'Centros de Custo TGA',
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
    id: 'compartilhamentos',
    title: 'Meus Compartilhamentos',
    path: '/compartilhamentos',
    icon: Share2,
    roles: ['admin', 'supervisor', 'collaborator'],
  },
  {
    id: 'cadastros-gerais',
    title: 'Cadastros Gerais',
    path: '#cadastros-gerais',
    icon: Folder,
    roles: ['admin', 'supervisor', 'collaborator'],
    isFolder: true,
  },
  {
    id: 'auditoria',
    title: 'Auditoria',
    path: '#auditoria',
    icon: Shield,
    roles: ['admin'],
    isFolder: true,
  },
  {
    id: 'auditoria-central',
    title: 'Central de Auditoria',
    path: '/auditoria/central',
    icon: Activity,
    roles: ['admin'],
  },
  {
    id: 'auditoria-usuarios',
    title: 'Auditoria de Usuários',
    path: '/auditoria/usuarios',
    icon: FileText,
    roles: ['admin'],
  },
]

function TopProgressBar() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setProgress(10)

    const timer1 = setTimeout(() => setProgress(40), 50)
    const timer2 = setTimeout(() => setProgress(80), 150)
    const timer3 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => setProgress(0), 200)
      }, 200)
    }, 300)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [location.pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div
        className="h-full bg-red-600 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(220,38,38,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

const SidebarNavLink = ({ to, children, className, onClick, ...props }: any) => {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <Link
      to={to}
      className={className}
      onClick={(e) => {
        if (isMobile) setOpenMobile(false)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </Link>
  )
}

export default function Layout() {
  const { user, loading, signOut, role, permissions, menuOrder, setMenuOrder, profile } = useAuth()
  const { setMode, setColorTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const notifiedSet = useRef<Set<string>>(new Set())
  const initialPendingFetch = useRef(true)

  useEffect(() => {
    if (profile) {
      if (profile.theme_mode) setMode(profile.theme_mode as any)
      if (profile.color_theme) setColorTheme(profile.color_theme as any)
    }
  }, [profile?.theme_mode, profile?.color_theme])

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
    return '/app'
  }, [normalizedOrder])

  const currentMenuItem = useMemo(() => {
    return MENU_ITEMS.find(
      (item) =>
        location.pathname === item.path ||
        (!item.isFolder && location.pathname.startsWith(item.path + '/')),
    )
  }, [location.pathname])

  const hasAccessToCurrentRoute = useMemo(() => {
    if (!currentMenuItem) return true
    return allowedItems.some((item) => item.id === currentMenuItem.id)
  }, [currentMenuItem, allowedItems])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchNotified = async () => {
      const { data } = await supabase
        .from('shared_queries')
        .select('id')
        .eq('user_id', user.id)
        .eq('first_access_notified', true)
      if (data) {
        data.forEach((q) => notifiedSet.current.add(q.id))
      }
    }
    fetchNotified()

    const channel = supabase
      .channel('global_shared_queries_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_queries',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any

          if (newRecord.first_access_notified === false) {
            notifiedSet.current.delete(newRecord.id)
          }

          if (
            newRecord.notify_first_access &&
            newRecord.first_access_notified &&
            !notifiedSet.current.has(newRecord.id)
          ) {
            notifiedSet.current.add(newRecord.id)

            try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext
              if (AudioContext) {
                const ctx = new AudioContext()
                if (ctx.state === 'suspended') {
                  ctx.resume()
                }
                const osc = ctx.createOscillator()
                const gainNode = ctx.createGain()

                osc.type = 'sine'
                osc.frequency.setValueAtTime(880, ctx.currentTime)
                osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1)

                gainNode.gain.setValueAtTime(0, ctx.currentTime)
                gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

                osc.connect(gainNode)
                gainNode.connect(ctx.destination)

                osc.start()
                osc.stop(ctx.currentTime + 0.4)
              }
            } catch (e) {
              console.error('Audio play failed', e)
            }

            toast({
              title: '🔔 Novo Acesso!',
              description: `O link para a consulta "${newRecord.prompt}" foi acessado!`,
              duration: 8000,
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, toast])

  useEffect(() => {
    const hasAprovacoesAccess =
      role === 'admin' ||
      (Array.isArray(permissions) &&
        (permissions.includes('all') || permissions.includes('aprovacoes')))

    if (!hasAprovacoesAccess) return

    const fetchPending = async () => {
      try {
        const tables = [
          'organizations',
          'departments',
          'cost_centers',
          'chart_of_accounts',
          'bank_accounts',
          'tipo_conta_tga',
          'account_mapping',
        ] as const

        const deletionPromises = tables.map((table) =>
          supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('pending_deletion', true)
            .is('deleted_at', null)
            .then((res) => (!res.error && res.count !== null ? res.count : 0))
            .catch((e) => {
              console.error(e)
              return 0
            }),
        )

        const userDeletionPromise = supabase
          .from('cadastro_usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('pending_deletion', true)
          .is('deleted_at', null)
          .then((res) => (!res.error && res.count !== null ? res.count : 0))
          .catch((e) => {
            console.error(e)
            return 0
          })

        const userApprovalPromise = supabase
          .from('cadastro_usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending')
          .is('deleted_at', null)
          .then((res) => (!res.error && res.count !== null ? res.count : 0))
          .catch((e) => {
            console.error(e)
            return 0
          })

        const pendingChangesPromise = supabase
          .from('pending_changes')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .then((res) => (!res.error && res.count !== null ? res.count : 0))
          .catch((e) => {
            console.error(e)
            return 0
          })

        const results = await Promise.all([
          ...deletionPromises,
          userDeletionPromise,
          userApprovalPromise,
          pendingChangesPromise,
        ])

        const total = results.reduce((acc, count) => acc + count, 0)

        setPendingCount((prev) => {
          if (total > prev && !initialPendingFetch.current) {
            try {
              const audio = new Audio(
                'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
              )
              audio.play().catch((e) => console.error('Audio play failed', e))
            } catch (e) {
              console.error('Audio play failed', e)
            }

            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Nova Pendência', {
                  body: 'Você tem novos itens aguardando aprovação ou na lixeira.',
                  icon: '/favicon.ico',
                })
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                  if (permission === 'granted') {
                    new Notification('Nova Pendência', {
                      body: 'Você tem novos itens aguardando aprovação ou na lixeira.',
                      icon: '/favicon.ico',
                    })
                  }
                })
              }
            }
          }
          return total
        })
        initialPendingFetch.current = false
      } catch (error) {
        console.error('Erro ao buscar pendências:', error)
      }
    }

    fetchPending()

    const handleRefresh = () => fetchPending()
    window.addEventListener('refresh-approvals-badge', handleRefresh)

    let channel = supabase.channel(
      `approvals-badge-changes-${Math.random().toString(36).substring(2, 9)}`,
    )
    const realtimeTables = [
      'organizations',
      'departments',
      'cadastro_usuarios',
      'cost_centers',
      'chart_of_accounts',
      'bank_accounts',
      'tipo_conta_tga',
      'account_mapping',
      'pending_changes',
    ]

    realtimeTables.forEach((table) => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () =>
        fetchPending(),
      )
    })

    channel.subscribe()

    return () => {
      window.removeEventListener('refresh-approvals-badge', handleRefresh)
      supabase.removeChannel(channel)
    }
  }, [role, permissions])

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
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
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
          <div className="mx-auto w-16 h-16 bg-red-600/10 text-red-600 rounded-full flex items-center justify-center mb-6">
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
      <TopProgressBar />
      <Sidebar collapsible="offcanvas" className="z-50">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4 h-16 flex justify-center">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="bg-red-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>
            <span className="font-bold text-sidebar-foreground tracking-tight truncate group-data-[collapsible=offcanvas]:hidden">
              Auditoria NOMA
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
                                <item.icon className="size-4 shrink-0 text-sidebar-foreground/50 group-data-[state=open]/collapsible:text-red-600" />
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
                                        'transition-all duration-200 group relative my-0.5 overflow-hidden',
                                        isChildActive
                                          ? 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:text-white font-semibold data-[active=true]:bg-red-600 data-[active=true]:text-white'
                                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                      )}
                                    >
                                      <SidebarNavLink
                                        to={childItem.path}
                                        className="flex items-center justify-between w-full"
                                      >
                                        <div className="flex items-center gap-2">
                                          <childItem.icon
                                            className={cn(
                                              'size-4 shrink-0',
                                              isChildActive
                                                ? 'text-white'
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
                                      </SidebarNavLink>
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
                                    ? 'border-sidebar-border hover:border-red-600/50 hover:bg-red-600/5'
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
                          'transition-all duration-200 group relative overflow-hidden',
                          isActive
                            ? 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:text-white font-semibold data-[active=true]:bg-red-600 data-[active=true]:text-white'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <SidebarNavLink
                          to={item.path}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon
                              className={cn(
                                'size-4 shrink-0',
                                isActive ? 'text-white' : 'text-sidebar-foreground/50',
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
                        </SidebarNavLink>
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

      <SidebarInset className="bg-background min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-card/80 backdrop-blur-md px-4 sticky top-0 z-40 shadow-sm justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 text-muted-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            <Breadcrumb className="hidden md:flex bg-red-600 px-3 py-1.5 rounded-md shadow-sm">
              <BreadcrumbList className="text-white/80 sm:gap-2">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-white hover:text-white/90 font-medium">
                    <Link to="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentMenuItem && currentMenuItem.path !== '/dashboard' && (
                  <>
                    <BreadcrumbSeparator className="text-white/60" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-white font-bold">
                        {currentMenuItem.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3 md:hidden ml-2">
              <div className="bg-red-600 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
                <Building2 className="size-5" />
              </div>
              <span className="font-bold text-foreground tracking-tight truncate">
                Auditoria NOMA
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
                <Avatar className="h-9 w-9 border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-red-600/20 transition-all">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-red-600/10 text-red-600 font-semibold">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
          <div key={location.pathname} className="mx-auto max-w-[1400px] animate-fade-in">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </SidebarInset>
      <ChangePasswordModal open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
      <Chatbot />
    </SidebarProvider>
  )
}
