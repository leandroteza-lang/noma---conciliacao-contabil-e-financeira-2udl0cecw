import { useState, useEffect, useCallback, useMemo } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  ArrowRightLeft,
  FileSpreadsheet,
  CheckSquare,
  LogOut,
  BarChart3,
  Share2,
  ShieldCheck,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Chatbot } from '@/components/Chatbot'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Layout() {
  const { user, role, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [approvalsCount, setApprovalsCount] = useState(0)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      supabase
        .from('cadastro_usuarios')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data)
        })
    }
  }, [user])

  const fetchApprovalsCount = useCallback(async () => {
    if (role !== 'admin') return
    try {
      const [orgs, depts, emps, costs, charts, banks, tgas, mappings, edits, newUsers] =
        await Promise.all([
          supabase
            .from('organizations')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('departments')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('cadastro_usuarios')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('cost_centers')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('chart_of_accounts')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('bank_accounts')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('tipo_conta_tga')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase
            .from('account_mapping')
            .select('id', { count: 'exact' })
            .eq('pending_deletion', true)
            .is('deleted_at', null),
          supabase.from('pending_changes').select('id', { count: 'exact' }).eq('status', 'pending'),
          supabase
            .from('cadastro_usuarios')
            .select('id', { count: 'exact' })
            .eq('approval_status', 'pending')
            .is('deleted_at', null),
        ])

      const total =
        (orgs.count || 0) +
        (depts.count || 0) +
        (emps.count || 0) +
        (costs.count || 0) +
        (charts.count || 0) +
        (banks.count || 0) +
        (tgas.count || 0) +
        (mappings.count || 0) +
        (edits.count || 0) +
        (newUsers.count || 0)

      setApprovalsCount(total)
    } catch (e) {
      console.error('Error fetching approvals count:', e)
    }
  }, [role])

  useEffect(() => {
    fetchApprovalsCount()
    const handleRefresh = () => fetchApprovalsCount()
    window.addEventListener('refresh-approvals-badge', handleRefresh)
    return () => window.removeEventListener('refresh-approvals-badge', handleRefresh)
  }, [fetchApprovalsCount])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = useMemo(
    () => [
      { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { title: 'Empresas', path: '/empresas', icon: Building2 },
      {
        title: 'Cadastros Gerais',
        icon: FolderTree,
        items: [
          { title: 'Cadastro de Usuários', path: '/usuarios' },
          { title: 'Departamentos', path: '/departamentos' },
          { title: 'Plano de Contas', path: '/plano-de-contas' },
          { title: 'Tipos de Conta TGA', path: '/tipo-conta-tga' },
          { title: 'Centros de Custo', path: '/centros-de-custo' },
          { title: 'Listagem de Contas', path: '/contas' },
          { title: 'Contas Bancárias', path: '/contas-bancarias' },
          { title: 'Mapeamento DE/PARA', path: '/mapeamento' },
        ],
      },
      { title: 'Análises', path: '/analises', icon: BarChart3 },
      { title: 'Lançamentos Contábeis', path: '/lancamentos', icon: FileText },
      { title: 'Movimento Financeiro TGA', path: '/movimento-financeiro', icon: ArrowRightLeft },
      { title: 'Importar Dados', path: '/import', icon: FileSpreadsheet },
      {
        title: 'Aprovações',
        path: '/aprovacoes',
        icon: CheckSquare,
        badge: approvalsCount,
        adminOnly: true,
      },
      { title: 'Meus Compartilhamentos', path: '/compartilhamentos', icon: Share2 },
      {
        title: 'Auditoria',
        icon: ShieldCheck,
        adminOnly: true,
        items: [
          { title: 'Auditoria de Usuários', path: '/auditoria/usuarios' },
          { title: 'Central de Auditorias', path: '/auditoria/central' },
        ],
      },
    ],
    [approvalsCount],
  )

  const flatItems = useMemo(() => {
    return navItems.reduce((acc, item) => {
      if (item.items) acc.push(...item.items)
      else acc.push(item)
      return acc
    }, [] as any[])
  }, [navItems])

  const currentItem = flatItems.find((i) => i.path === location.pathname)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="p-4 flex flex-row items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-600 text-white font-bold text-xl">
              N
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Auditoria NOMA</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems
                    .filter((item) => !item.adminOnly || role === 'admin')
                    .map((item) =>
                      item.items ? (
                        <Collapsible
                          key={item.title}
                          asChild
                          defaultOpen={item.items.some((sub) =>
                            location.pathname.startsWith(sub.path),
                          )}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-2 py-1 space-y-1">
                              {item.items.map((sub) => (
                                <SidebarMenuButton
                                  key={sub.path}
                                  asChild
                                  isActive={location.pathname === sub.path}
                                  className="pl-8"
                                >
                                  <Link to={sub.path}>{sub.title}</Link>
                                </SidebarMenuButton>
                              ))}
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                            <Link
                              to={item.path}
                              className="flex items-center justify-between w-full"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </div>
                              {item.badge !== undefined && item.badge > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] rounded-full bg-red-500 hover:bg-red-600"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ),
                    )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden bg-slate-50">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
            <SidebarTrigger />
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentItem && currentItem.path !== '/dashboard' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider">
                        {currentItem.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex-1" />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 hover:bg-slate-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                      {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline-block text-slate-700">
                    {profile?.name || user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <Chatbot />
    </SidebarProvider>
  )
}
