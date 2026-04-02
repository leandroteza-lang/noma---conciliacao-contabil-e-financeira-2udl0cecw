import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { format } from 'date-fns'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  department_id: z.string().optional().nullable().or(z.literal('')),
  status: z.boolean().default(true),
  companies: z.array(z.string()).default([]),
})
type FormData = z.infer<typeof schema>

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [filterCompany, setFilterCompany] = useState('all')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
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
    defaultValues: { status: true, companies: [] },
  })
  const statusValue = watch('status')

  const fetchData = async () => {
    if (!user) return
    try {
      const [empRes, depRes, orgRes] = await Promise.all([
        supabase
          .from('employees')
          .select(`*, departments(id, name), employee_companies(organization_id)`)
          .order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
        supabase.from('organizations').select('*').order('name'),
      ])
      if (empRes.error) throw empRes.error
      setEmployees(empRes.data || [])
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
    return employees.filter((e) => {
      const matchSearch = search ? e.name?.toLowerCase().includes(search.toLowerCase()) : true
      const matchStatus =
        filterStatus !== 'all' ? (filterStatus === 'active' ? e.status : !e.status) : true
      const matchDept = filterDept !== 'all' ? e.department_id === filterDept : true
      const matchCompany =
        filterCompany !== 'all'
          ? e.employee_companies?.some((ec: any) => ec.organization_id === filterCompany)
          : true
      return matchSearch && matchStatus && matchDept && matchCompany
    })
  }, [employees, search, filterStatus, filterDept, filterCompany])

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
    if (item) {
      setEditingId(item.id)
      reset({
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        department_id: item.department_id || '',
        status: item.status ?? true,
        companies: item.employee_companies?.map((ec: any) => ec.organization_id) || [],
      })
    } else {
      setEditingId(null)
      reset({ name: '', email: '', phone: '', department_id: '', status: true, companies: [] })
    }
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        department_id: data.department_id || null,
        status: data.status,
        user_id: user.id,
      }
      let empId = editingId
      if (editingId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { data: ins, error } = await supabase
          .from('employees')
          .insert([payload])
          .select()
          .single()
        if (error) throw error
        empId = ins.id
      }
      if (empId) {
        await supabase.from('employee_companies').delete().eq('employee_id', empId)
        if (data.companies.length > 0) {
          const links = data.companies.map((oid) => ({ employee_id: empId, organization_id: oid }))
          const { error: linkErr } = await supabase.from('employee_companies').insert(links)
          if (linkErr) throw linkErr
        }
      }
      toast({ title: 'Sucesso', description: 'Funcionário salvo com sucesso!' })
      setIsModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este funcionário?')) return
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Removido com sucesso.' })
      fetchData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
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
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-employees`,
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
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'funcionarios.xlsx'
        link.click()
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'funcionarios.pdf'
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Funcionários</h1>
          <p className="text-slate-500 mt-1">Cadastre e gerencie os usuários do sistema.</p>
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
          <Button onClick={() => openModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Novo Funcionário
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center">
              <Users className="h-12 w-12 text-slate-300 mb-3" />
              <p>Nenhum funcionário encontrado.</p>
            </div>
          ) : (
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Funcionário <ArrowUpDown className="h-3 w-3 text-slate-400" />
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
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead>Vínculos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((e) => (
                    <TableRow key={e.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-2 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                            {e.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-900 text-sm">{e.name}</p>
                            {(e.email || e.phone) && (
                              <p className="text-[11px] text-slate-500">{e.email || e.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-4 text-sm text-slate-600">
                        {e.departments?.name || '-'}
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <Badge
                          variant={e.status ? 'default' : 'secondary'}
                          className={
                            e.status
                              ? 'bg-green-100 text-green-800 text-[11px] h-5'
                              : 'bg-slate-100 text-slate-600 text-[11px] h-5'
                          }
                        >
                          {e.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-4 text-[12px] text-slate-500">
                        {e.employee_companies?.length || 0} empresa(s)
                      </TableCell>
                      <TableCell className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(e)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(e.id)}
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
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
              </p>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
            <DialogDescription>Preencha os dados abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input {...register('name')} placeholder="Ex: João da Silva" />
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
              </div>
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
              <div className="space-y-2 md:col-span-2">
                <Label>Departamento</Label>
                <Select
                  value={watch('department_id') || ''}
                  onValueChange={(v) => setValue('department_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Empresas Vinculadas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded border border-slate-100"
                    >
                      <Checkbox
                        id={`org-${org.id}`}
                        checked={watch('companies')?.includes(org.id)}
                        onCheckedChange={(checked) => {
                          const cur = watch('companies') || []
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
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between md:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-base">Status</Label>
                  <p className="text-xs text-slate-500">Defina se o funcionário está ativo.</p>
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
                {editingId ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
