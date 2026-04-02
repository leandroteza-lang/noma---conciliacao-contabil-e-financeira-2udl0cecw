import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Building2,
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
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  let sum = 0,
    rest
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf.substring(9, 10))) return false
  sum = 0
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf.substring(10, 11))) return false
  return true
}

const isValidCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false
  let size = cnpj.length - 2
  let numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  size = size + 1
  numbers = cnpj.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false
  return true
}

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    cnpj: z.string().optional(),
    cpf: z.string().optional(),
    status: z.boolean().default(true),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    observations: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasCnpj = data.cnpj && data.cnpj.trim().length > 0
      const hasCpf = data.cpf && data.cpf.trim().length > 0
      return hasCnpj || hasCpf
    },
    {
      message: 'Preencha ao menos o CNPJ ou CPF',
      path: ['cnpj'],
    },
  )
  .refine(
    (data) => {
      if (data.cpf && data.cpf.trim().length > 0) {
        return isValidCPF(data.cpf)
      }
      return true
    },
    {
      message: 'CPF inválido',
      path: ['cpf'],
    },
  )
  .refine(
    (data) => {
      if (data.cnpj && data.cnpj.trim().length > 0) {
        return isValidCNPJ(data.cnpj)
      }
      return true
    },
    {
      message: 'CNPJ inválido',
      path: ['cnpj'],
    },
  )

type FormData = z.infer<typeof schema>

export default function Companies() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDoc, setFilterDoc] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { user } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: true },
  })

  const statusValue = watch('status')

  const fetchOrganizations = async () => {
    try {
      if (!user) return
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .neq('pending_deletion', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrganizations(data || [])
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [user])

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      const matchSearch = search ? org.name?.toLowerCase().includes(search.toLowerCase()) : true
      const matchStatus =
        filterStatus !== 'all' ? (filterStatus === 'active' ? org.status : !org.status) : true
      const matchDoc = filterDoc
        ? org.cnpj?.includes(filterDoc) || org.cpf?.includes(filterDoc)
        : true
      const matchDate = filterDate ? org.created_at?.startsWith(filterDate) : true
      return matchSearch && matchStatus && matchDoc && matchDate
    })
  }, [organizations, search, filterStatus, filterDoc, filterDate])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedOrgs = useMemo(() => {
    let sortableItems = [...filteredOrgs]
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        if (aValue === null || aValue === undefined) aValue = ''
        if (bValue === null || bValue === undefined) bValue = ''
        if (typeof aValue === 'string') aValue = aValue.toLowerCase()
        if (typeof bValue === 'string') bValue = bValue.toLowerCase()
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [filteredOrgs, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedOrgs.length / itemsPerPage))
  const paginatedOrgs = sortedOrgs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const openModal = (org?: any) => {
    if (org) {
      setEditingId(org.id)
      reset({
        name: org.name || '',
        cnpj: org.cnpj || '',
        cpf: org.cpf || '',
        status: org.status ?? true,
        phone: org.phone || '',
        email: org.email || '',
        address: org.address || '',
        observations: org.observations || '',
      })
    } else {
      setEditingId(null)
      reset({
        status: true,
        name: '',
        cnpj: '',
        cpf: '',
        phone: '',
        email: '',
        address: '',
        observations: '',
      })
    }
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('organizations')
          .update(data)
          .eq('id', editingId)
          .eq('user_id', user.id)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Empresa atualizada com sucesso!' })
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert([{ ...data, user_id: user.id }])
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Empresa cadastrada com sucesso!' })
      }
      setIsModalOpen(false)
      fetchOrganizations()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const [{ data: banks }, { data: costs }, { data: emps }] = await Promise.all([
        supabase
          .from('bank_accounts')
          .select('id')
          .eq('organization_id', id)
          .is('deleted_at', null)
          .limit(1),
        supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', id)
          .is('deleted_at', null)
          .limit(1),
        supabase
          .from('employee_companies')
          .select('employee_id')
          .eq('organization_id', id)
          .limit(1),
      ])

      if ((banks && banks.length > 0) || (costs && costs.length > 0) || (emps && emps.length > 0)) {
        toast({
          title: 'Ação Bloqueada',
          description:
            'Esta empresa possui contas bancárias, centros de custo ou funcionários vinculados e não pode ser excluída.',
          variant: 'destructive',
        })
        return
      }

      if (!confirm('Deseja solicitar a exclusão desta empresa?')) return

      const { error } = await supabase
        .from('organizations')
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
      fetchOrganizations()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} empresa(s)?`)) return

    const checkPromises = selectedIds.map(async (id) => {
      const [{ data: banks }, { data: costs }, { data: emps }] = await Promise.all([
        supabase
          .from('bank_accounts')
          .select('id')
          .eq('organization_id', id)
          .is('deleted_at', null)
          .limit(1),
        supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', id)
          .is('deleted_at', null)
          .limit(1),
        supabase
          .from('employee_companies')
          .select('employee_id')
          .eq('organization_id', id)
          .limit(1),
      ])
      const hasRelations =
        (banks && banks.length > 0) || (costs && costs.length > 0) || (emps && emps.length > 0)
      return { id, hasRelations }
    })

    const results = await Promise.all(checkPromises)
    const toDelete = results.filter((r) => !r.hasRelations).map((r) => r.id)
    const blocked = results.filter((r) => r.hasRelations).map((r) => r.id)

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('organizations')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .in('id', toDelete)
        .eq('user_id', user?.id)

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      } else {
        toast({
          title: 'Sucesso',
          description: `${toDelete.length} empresa(s) enviada(s) para aprovação.`,
        })
      }
    }

    if (blocked.length > 0) {
      toast({
        title: 'Ação Parcialmente Bloqueada',
        description: `${blocked.length} empresa(s) possuem vínculos (contas, centros ou funcionários) e não puderam ser excluídas.`,
        variant: 'destructive',
      })
    }

    setSelectedIds([])
    fetchOrganizations()
  }

  const handleExport = async (formatType: 'pdf' | 'excel') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: formatType,
        data: sortedOrgs.map((org) => ({
          ...org,
          created_at: org.created_at ? format(new Date(org.created_at), 'dd/MM/yyyy') : '',
          cnpj: formatCNPJ(org.cnpj || ''),
          cpf: formatCPF(org.cpf || ''),
        })),
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) throw new Error('Falha ao exportar')

      const result = await res.json()

      if (formatType === 'excel') {
        const binaryString = atob(result.excel)
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'empresas.xlsx'
        link.click()
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'empresas.pdf'
        link.click()
      }
      toast({ title: 'Sucesso', description: 'Relatório gerado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Empresas</h1>
          <p className="text-slate-500 mt-1">Cadastre e gerencie as organizações do sistema.</p>
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
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/import">
              <Upload className="h-4 w-4" /> Importar
            </Link>
          </Button>
          <Button onClick={() => openModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Buscar por Nome</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Ex: NOMA PARTS..."
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
              <Label>Documento (CNPJ/CPF)</Label>
              <Input
                placeholder="Ex: 00.000.000/0000-00"
                value={filterDoc}
                onChange={(e) => {
                  setFilterDoc(e.target.value)
                  setCurrentPage(1)
                }}
              />
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
            <div className="space-y-1.5">
              <Label>Data de Criação</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
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
            <div className="py-12 flex justify-center items-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-300 mb-3" />
              <p>Nenhuma empresa encontrada.</p>
            </div>
          ) : (
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={
                          paginatedOrgs.length > 0 && selectedIds.length === paginatedOrgs.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedIds(paginatedOrgs.map((o) => o.id))
                          else setSelectedIds([])
                        }}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Empresa <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('cnpj')}
                    >
                      <div className="flex items-center gap-2">
                        Documentos <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Contato <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Criado em <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrgs.map((org) => (
                    <TableRow key={org.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-2 px-4 text-center">
                        <Checkbox
                          checked={selectedIds.includes(org.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds((prev) => [...prev, org.id])
                            else setSelectedIds((prev) => prev.filter((id) => id !== org.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-2 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-900 text-sm">{org.name}</p>
                            {org.address && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                {org.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <div className="text-[13px]">
                          {org.cnpj && (
                            <p>
                              <span className="font-medium text-slate-500 mr-1">CNPJ:</span>
                              {formatCNPJ(org.cnpj)}
                            </p>
                          )}
                          {org.cpf && (
                            <p>
                              <span className="font-medium text-slate-500 mr-1">CPF:</span>
                              {formatCPF(org.cpf)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <div className="text-[13px] text-slate-600">
                          {org.email && <p>{org.email}</p>}
                          {org.phone && <p>{org.phone}</p>}
                          {!org.email && !org.phone && <span className="text-slate-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <Badge
                          variant={org.status ? 'default' : 'secondary'}
                          className={
                            org.status
                              ? 'bg-green-100 text-green-800 text-[11px] h-5'
                              : 'bg-slate-100 text-slate-600 text-[11px] h-5'
                          }
                        >
                          {org.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-4 text-[13px] text-slate-500">
                        {org.created_at
                          ? format(new Date(org.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(org)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(org.id)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredOrgs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filteredOrgs.length)} de {filteredOrgs.length}
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo. CNPJ ou CPF é obrigatório.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>
                  Nome / Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input {...register('name')} placeholder="Ex: NOMA PARTS LTDA" />
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  {...(() => {
                    const { onChange, ...rest } = register('cnpj')
                    return {
                      ...rest,
                      onChange: (e) => {
                        e.target.value = formatCNPJ(e.target.value)
                        onChange(e)
                      },
                    }
                  })()}
                  placeholder="00.000.000/0000-00"
                />
                {errors.cnpj && <span className="text-xs text-red-500">{errors.cnpj.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  {...(() => {
                    const { onChange, ...rest } = register('cpf')
                    return {
                      ...rest,
                      onChange: (e) => {
                        e.target.value = formatCPF(e.target.value)
                        onChange(e)
                      },
                    }
                  })()}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <span className="text-xs text-red-500">{errors.cpf.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input {...register('email')} type="email" placeholder="contato@empresa.com" />
                {errors.email && (
                  <span className="text-xs text-red-500">{errors.email.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register('phone')} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço Completo</Label>
                <Input {...register('address')} placeholder="Rua, Número, Bairro, Cidade - UF" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  {...register('observations')}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between md:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-base">Status da Empresa</Label>
                  <p className="text-xs text-slate-500">Defina se a empresa está ativa.</p>
                </div>
                <Switch checked={statusValue} onCheckedChange={(val) => setValue('status', val)} />
              </div>
            </div>
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
                {editingId ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
