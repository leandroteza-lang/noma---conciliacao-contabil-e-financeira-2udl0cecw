import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link } from 'react-router-dom'
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  Upload,
  Mail,
  Link2,
  Copy,
  MessageSquare,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { MENU_ITEMS } from '@/components/Layout'

const ROUTINES = [
  { id: 'all', label: 'Acesso Total (Todas as Rotinas)' },
  ...MENU_ITEMS.map((item) => ({ id: item.id, label: item.title })),
]

const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0,
    rem
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== parseInt(cpf.substring(9, 10))) return false
  sum = 0
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== parseInt(cpf.substring(10, 11))) return false
  return true
}

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || isValidCPF(val), 'CPF inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  observations: z.string().optional(),
  department_id: z.string().optional().nullable().or(z.literal('')),
  status: z.boolean().default(true),
  companies: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default(['all']),
  role: z.enum(['admin', 'supervisor', 'collaborator', 'client_user']).default('collaborator'),
})
type FormData = z.infer<typeof schema>

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [filterCompany, setFilterCompany] = useState('all')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [inviteLinkInfo, setInviteLinkInfo] = useState<{
    link: string
    name: string
    phone: string | null
  } | null>(null)
  const { user, role: currentUserRole, permissions } = useAuth()
  const { toast } = useToast()

  const canEdit =
    currentUserRole === 'admin' ||
    (Array.isArray(permissions) &&
      (permissions.includes('all') || permissions.includes('usuarios')))
  const canDelete =
    currentUserRole === 'admin' ||
    (Array.isArray(permissions) &&
      (permissions.includes('all') || permissions.includes('usuarios')))

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: true, companies: [], permissions: ['all'], role: 'collaborator' },
  })
  const statusValue = watch('status')

  const fetchData = async () => {
    if (!user) return
    try {
      const [empRes, depRes, orgRes] = await Promise.all([
        supabase
          .from('cadastro_usuarios')
          .select(`*, departments(id, name), cadastro_usuarios_companies(organization_id)`)
          .neq('pending_deletion', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('departments')
          .select('*')
          .neq('pending_deletion', true)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('organizations')
          .select('*')
          .neq('pending_deletion', true)
          .is('deleted_at', null)
          .order('name'),
      ])
      if (empRes.error) throw empRes.error
      setUsers(empRes.data || [])
      setDepartments(depRes.data || [])
      setOrganizations(orgRes.data || [])
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const filtered = useMemo(() => {
    return users.filter((e) => {
      const matchSearch = search
        ? (e.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
          (e.cpf || '').includes(search)
        : true
      const matchStatus =
        filterStatus !== 'all' ? (filterStatus === 'active' ? e.status : !e.status) : true
      const matchDept = filterDept !== 'all' ? e.department_id === filterDept : true
      const matchCompany =
        filterCompany !== 'all'
          ? e.cadastro_usuarios_companies?.some((ec: any) => ec.organization_id === filterCompany)
          : true
      return matchSearch && matchStatus && matchDept && matchCompany
    })
  }, [users, search, filterStatus, filterDept, filterCompany])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sorted = useMemo(() => {
    let sortable = [...filtered]
    if (sortConfig) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] || ''
        let bVal = b[sortConfig.key] || ''
        if (sortConfig.key === 'department') {
          aVal = a.departments?.name || ''
          bVal = b.departments?.name || ''
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [filtered, sortConfig])

  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage))

  const openModal = (item?: any) => {
    setAvatarFile(null)
    if (item) {
      setEditingId(item.id)
      setAvatarPreview(item.avatar_url || '')
      reset({
        name: item.name || '',
        cpf: item.cpf || '',
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || '',
        observations: item.observations || '',
        department_id: item.department_id || '',
        status: item.status ?? true,
        role: item.role || 'collaborator',
        permissions: Array.isArray(item.permissions) ? item.permissions : ['all'],
        companies: item.cadastro_usuarios_companies?.map((ec: any) => ec.organization_id) || [],
      })
    } else {
      setEditingId(null)
      setAvatarPreview('')
      reset({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        address: '',
        observations: '',
        department_id: '',
        status: true,
        role: 'collaborator',
        permissions: ['all'],
        companies: [],
      })
    }
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      let uploadedUrl = editingId ? users.find((u) => u.id === editingId)?.avatar_url || null : null

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}_${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
          uploadedUrl = urlData.publicUrl
        }
      }

      const payload = {
        name: data.name,
        cpf: data.cpf || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        observations: data.observations || null,
        department_id: data.department_id || null,
        status: data.status,
        role: data.role,
        permissions:
          Array.isArray(data.permissions) && data.permissions.length > 0
            ? data.permissions
            : ['all'],
        user_id: user.id,
        avatar_url: uploadedUrl,
      } as any

      let empId = editingId
      let actionLinkToDisplay = null

      if (editingId) {
        if (data.cpf) {
          const { data: existing } = await supabase
            .from('cadastro_usuarios')
            .select('id')
            .eq('cpf', data.cpf)
            .neq('id', editingId)
            .maybeSingle()
          if (existing) throw new Error('CPF já cadastrado no sistema para outro usuário.')
        }
        const { error } = await supabase
          .from('cadastro_usuarios')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        if (data.cpf) {
          const { data: existing } = await supabase
            .from('cadastro_usuarios')
            .select('id')
            .eq('cpf', data.cpf)
            .maybeSingle()
          if (existing) throw new Error('CPF já cadastrado no sistema.')
        }
        if (!data.email) {
          throw new Error('E-mail é obrigatório para enviar o convite.')
        }

        const { data: existingEmail } = await supabase
          .from('cadastro_usuarios')
          .select('id')
          .eq('email', data.email)
          .maybeSingle()
        if (existingEmail) {
          throw new Error('Este e-mail já está cadastrado no sistema.')
        }

        const res = await supabase.functions.invoke('manage-user', {
          body: {
            action: 'invite',
            email: data.email,
            name: data.name,
            role: data.role,
            cpf: data.cpf || null,
            phone: data.phone || null,
            department_id: data.department_id || null,
            admin_id: user.id,
          },
        })

        if (res.error) {
          throw new Error(res.error.message || 'Erro ao comunicar com a função de convite.')
        }

        if (res.data && res.data.success === false) {
          const errorMsg = String(res.data.error || '')
          if (errorMsg.includes('CPF_DUPLICATE')) {
            throw new Error('CPF já cadastrado no sistema.')
          }
          if (errorMsg === 'USER_EXISTS_IN_DB') {
            if (res.data.isDeleted) {
              throw new Error(
                'Este usuário está na Lixeira. Por favor, acesse a Central de Aprovações para restaurá-lo.',
              )
            } else if (res.data.isPendingDeletion) {
              throw new Error(
                'Este usuário está pendente de exclusão. Verifique a Central de Aprovações.',
              )
            } else if (res.data.isPendingApproval) {
              throw new Error(
                'Este usuário já foi cadastrado e está aguardando aprovação na Central de Aprovações.',
              )
            } else {
              throw new Error('Este e-mail já está cadastrado e ativo no sistema.')
            }
          }
          if (errorMsg.includes('already been registered') || errorMsg.includes('already exists')) {
            throw new Error('Este e-mail já está cadastrado no sistema.')
          }
          throw new Error(errorMsg || 'Erro ao enviar convite.')
        }

        let createdUser = null
        for (let i = 0; i < 6; i++) {
          const { data: u } = await supabase
            .from('cadastro_usuarios')
            .select('id')
            .eq('email', data.email)
            .maybeSingle()
          if (u) {
            createdUser = u
            break
          }
          await new Promise((r) => setTimeout(r, 500))
        }

        if (createdUser) {
          empId = createdUser.id
          await supabase
            .from('cadastro_usuarios')
            .update({
              address: data.address || null,
              observations: data.observations || null,
              permissions:
                Array.isArray(data.permissions) && data.permissions.length > 0
                  ? data.permissions
                  : ['all'],
              avatar_url: uploadedUrl,
            })
            .eq('id', empId)
        } else {
          throw new Error('Falha ao sincronizar o usuário criado.')
        }

        actionLinkToDisplay = res.data?.actionLink

        toast({
          title: 'Convite Enviado',
          description: `Um convite foi enviado para ${data.email} e está pendente de aprovação.`,
        })
      }

      if (empId) {
        await supabase.from('cadastro_usuarios_companies').delete().eq('usuario_id', empId)
        if (data.companies.length > 0) {
          const links = data.companies.map((oid) => ({ usuario_id: empId, organization_id: oid }))
          const { error: linkErr } = await supabase
            .from('cadastro_usuarios_companies')
            .insert(links)
          if (linkErr) throw linkErr
        }
      }

      toast({ title: 'Sucesso', description: 'Cadastro de usuário salvo com sucesso!' })
      setIsModalOpen(false)
      fetchData()

      if (actionLinkToDisplay) {
        setInviteLinkInfo({
          link: actionLinkToDisplay,
          name: data.name,
          phone: data.phone || null,
        })
      }
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja solicitar a exclusão deste usuário?')) return
    try {
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .eq('id', id)
        .eq('user_id', user?.id)
      if (error) throw error
      toast({
        title: 'Enviado para Aprovação',
        description: 'A exclusão foi solicitada e aguarda aprovação do administrador.',
      })
      fetchData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} usuário(s)?`)) return

    const { error } = await supabase
      .from('cadastro_usuarios')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .in('id', selectedIds)
      .eq('user_id', user?.id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} usuário(s) enviado(s) para aprovação.`,
      })
    }

    setSelectedIds([])
    fetchData()
  }

  const handleGenerateLink = async (userRecord: any) => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando link de acesso...' })
      const res = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'resend_email',
          user_id: userRecord.user_id,
          email: userRecord.email,
          name: userRecord.name,
        },
      })
      if (res.error) throw res.error
      if (res.data && res.data.success === false) throw new Error(res.data.error)

      setInviteLinkInfo({
        link: res.data.actionLink,
        name: userRecord.name,
        phone: userRecord.phone || null,
      })

      toast({ title: 'Sucesso', description: 'Link gerado com sucesso!' })
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao gerar link',
        variant: 'destructive',
      })
    }
  }

  const handleResendEmail = async (userRecord: any) => {
    try {
      toast({ title: 'Aguarde', description: 'Enviando e-mail...' })
      const res = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'resend_email',
          user_id: userRecord.user_id,
          email: userRecord.email,
          name: userRecord.name,
        },
      })
      if (res.error) throw res.error
      if (res.data && res.data.success === false) throw new Error(res.data.error)

      toast({ title: 'Sucesso', description: 'E-mail reenviado com sucesso!' })
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao reenviar e-mail',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async (formatType: 'pdf' | 'excel') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const payload = {
        format: formatType,
        data: sorted.map((e) => ({
          ...e,
          department: e.departments?.name || '',
          created_at: e.created_at ? format(new Date(e.created_at), 'dd/MM/yyyy') : '',
        })),
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Falha ao exportar')
      const result = await res.json()
      if (formatType === 'excel') {
        const binaryString = atob(result.excel)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'usuarios.xlsx'
        link.click()
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'usuarios.pdf'
        link.click()
      }
      toast({ title: 'Sucesso', description: 'Relatório gerado!' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cadastro de Usuários</h1>
          <p className="text-slate-500 mt-1">Cadastre e gerencie os perfis de acesso do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEdit && (
            <>
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/import">
                  <Upload className="h-4 w-4" /> Importar
                </Link>
              </Button>
              <Button onClick={() => openModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Novo Usuário
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Buscar Nome / CPF</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Departamento</Label>
              <Select
                value={filterDept}
                onValueChange={(v) => {
                  setFilterDept(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Empresa Vinculada</Label>
              <Select
                value={filterCompany}
                onValueChange={(v) => {
                  setFilterCompany(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && canDelete && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} item(ns) selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir Selecionados
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center">
              <Users className="h-12 w-12 text-slate-300 mb-3" />
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    {canDelete && (
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={paginated.length > 0 && selectedIds.length === paginated.length}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds(paginated.map((e) => e.id))
                            else setSelectedIds([])
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Usuário <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center gap-2">
                        Departamento <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-2">
                        Perfil <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead>Vínculos</TableHead>
                    {(canEdit || canDelete) && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((e) => (
                    <TableRow key={e.id} className="hover:bg-slate-50/50">
                      {canDelete && (
                        <TableCell className="py-2 px-4 text-center">
                          <Checkbox
                            checked={selectedIds.includes(e.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, e.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== e.id))
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-2 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200">
                            <AvatarImage src={e.avatar_url || ''} className="object-cover" />
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                              {(e.name || 'U').substring(0, 2).toUpperCase()}
                            </AvatarFallback>{' '}
                          </Avatar>
                          <div>
                            <p className="text-slate-900 text-sm font-semibold">{e.name}</p>
                            {(e.email || e.phone || e.cpf) && (
                              <p className="text-[11px] text-slate-500">
                                {e.email || e.cpf || e.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4 text-sm text-slate-600">
                        {e.departments?.name || '-'}
                      </TableCell>
                      <TableCell className="py-2 px-4 text-sm text-slate-600">
                        {e.role === 'admin'
                          ? 'Administrador'
                          : e.role === 'supervisor'
                            ? 'Supervisor'
                            : e.role === 'client_user'
                              ? 'Usuário Cliente'
                              : 'Colaborador'}
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={e.status ? 'default' : 'secondary'}
                            className={
                              e.status
                                ? 'bg-green-100 text-green-800 text-[11px] h-5 w-fit'
                                : 'bg-slate-100 text-slate-600 text-[11px] h-5 w-fit'
                            }
                          >
                            {e.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {e.approval_status === 'pending' && (
                            <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded-sm w-fit">
                              Pendente Aprovação
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4 text-[12px] text-slate-500">
                        {e.cadastro_usuarios_companies?.length || 0} empresa(s)
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGenerateLink(e)}
                                  className="h-8 w-8 text-slate-500 hover:text-emerald-600"
                                  title="Gerar Link de Acesso"
                                >
                                  <Link2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleResendEmail(e)}
                                  className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                  title="Reenviar E-mail de Acesso"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openModal(e)}
                                  className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(e.id)}
                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 hidden sm:block">Itens por página:</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="1000">1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>Preencha os dados do usuário abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="main">Principal</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="access">Acesso</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4 animate-in fade-in-50">
                <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                  <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
                    <AvatarImage src={avatarPreview} className="object-cover" />
                    <AvatarFallback className="bg-slate-50 text-slate-400">
                      <Upload className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center w-full">
                    <label className="cursor-pointer bg-white border border-slate-200 text-sm font-medium text-slate-700 py-1.5 px-4 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                      <span>Alterar Foto</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAvatarFile(e.target.files[0])
                            setAvatarPreview(URL.createObjectURL(e.target.files[0]))
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input {...register('name')} placeholder="Ex: João da Silva" />
                  {errors.name && (
                    <span className="text-xs text-red-500">{errors.name.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input {...register('cpf')} placeholder="000.000.000-00" />
                  {errors.cpf && <span className="text-xs text-red-500">{errors.cpf.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input {...register('observations')} placeholder="Informações adicionais" />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input {...register('email')} type="email" placeholder="joao@empresa.com" />
                    {errors.email && (
                      <span className="text-xs text-red-500">{errors.email.message}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input {...register('phone')} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço Completo</Label>
                  <Input {...register('address')} placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
              </TabsContent>

              <TabsContent value="access" className="space-y-4 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Select
                      value={watch('department_id') || 'none'}
                      onValueChange={(v) => setValue('department_id', v === 'none' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil de Acesso</Label>
                    <Select value={watch('role')} onValueChange={(v: any) => setValue('role', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="collaborator">Colaborador</SelectItem>
                        <SelectItem value="client_user">Usuário Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Empresas Vinculadas</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-[160px] overflow-y-auto p-1">
                    {organizations.length === 0 ? (
                      <p className="text-sm text-slate-500 col-span-2">
                        Nenhuma empresa cadastrada.
                      </p>
                    ) : (
                      organizations.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded border border-slate-100"
                        >
                          <Checkbox
                            id={`org-${org.id}`}
                            checked={
                              Array.isArray(watch('companies'))
                                ? watch('companies').includes(org.id)
                                : false
                            }
                            onCheckedChange={(checked) => {
                              const cur = Array.isArray(watch('companies'))
                                ? watch('companies')
                                : []
                              setValue(
                                'companies',
                                checked ? [...cur, org.id] : cur.filter((id) => id !== org.id),
                              )
                            }}
                          />
                          <label
                            htmlFor={`org-${org.id}`}
                            className="text-sm cursor-pointer truncate flex-1 leading-none"
                          >
                            {org.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Status</Label>
                    <p className="text-xs text-slate-500">Defina se o usuário está ativo.</p>
                  </div>
                  <Switch
                    checked={statusValue}
                    onCheckedChange={(val) => setValue('status', val)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 animate-in fade-in-50">
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Permissões de Rotina</Label>
                    <p className="text-xs text-slate-500">
                      Selecione quais rotinas este usuário poderá acessar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {ROUTINES.map((routine) => (
                      <div
                        key={routine.id}
                        className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded border border-slate-100"
                      >
                        <Checkbox
                          id={`perm-${routine.id}`}
                          checked={
                            Array.isArray(watch('permissions'))
                              ? watch('permissions').includes(routine.id)
                              : false
                          }
                          onCheckedChange={(checked) => {
                            const cur = Array.isArray(watch('permissions'))
                              ? watch('permissions')
                              : []
                            if (routine.id === 'all') {
                              setValue('permissions', checked ? ['all'] : [])
                            } else {
                              let next = checked
                                ? [...cur, routine.id]
                                : cur.filter((id) => id !== routine.id)
                              if (checked) {
                                next = next.filter((id) => id !== 'all')
                              }
                              setValue('permissions', next)
                            }
                          }}
                        />
                        <label
                          htmlFor={`perm-${routine.id}`}
                          className="text-sm cursor-pointer flex-1 leading-none font-medium"
                        >
                          {routine.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!inviteLinkInfo} onOpenChange={(open) => !open && setInviteLinkInfo(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link de Acesso Gerado</DialogTitle>
            <DialogDescription>
              O link de acesso para <strong>{inviteLinkInfo?.name}</strong> foi gerado com sucesso.
              Você pode copiá-lo ou enviar diretamente pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md break-all">
              <span className="text-sm text-slate-700 flex-1 select-all">
                {inviteLinkInfo?.link}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (inviteLinkInfo?.link) {
                  navigator.clipboard.writeText(inviteLinkInfo.link)
                  toast({
                    title: 'Copiado!',
                    description: 'Link copiado para a área de transferência.',
                  })
                }
              }}
              className="gap-2"
            >
              <Copy className="h-4 w-4" /> Copiar Link
            </Button>
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 gap-2 text-white cursor-pointer"
            >
              <a
                href={
                  inviteLinkInfo?.phone
                    ? `https://wa.me/55${inviteLinkInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${inviteLinkInfo.name}, aqui está o seu link de acesso ao sistema Gestão de Contas:\n\n${inviteLinkInfo.link}`,
                      )}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Olá ${inviteLinkInfo?.name}, aqui está o seu link de acesso ao sistema Gestão de Contas:\n\n${inviteLinkInfo?.link}`,
                      )}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="h-4 w-4" /> Enviar por WhatsApp
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
