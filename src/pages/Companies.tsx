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
} from 'lucide-react'
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
    defaultValues: { status: true },
  })

  const statusValue = watch('status')

  const fetchOrganizations = async () => {
    try {
      if (!user) return
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
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

  const totalPages = Math.max(1, Math.ceil(filteredOrgs.length / itemsPerPage))
  const paginatedOrgs = filteredOrgs.slice(
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
    if (!confirm('Deseja realmente excluir esta empresa? Esta ação não pode ser desfeita.')) return
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Empresa removida.' })
      fetchOrganizations()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleExport = async (formatType: 'pdf' | 'excel') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: formatType,
        data: filteredOrgs.map((org) => ({
          ...org,
          created_at: org.created_at ? format(new Date(org.created_at), 'dd/MM/yyyy') : '',
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
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'empresas.csv'
        link.click()
      } else {
        const w = window.open('')
        if (w) w.document.write(`<iframe width='100%' height='100%' src='${result.pdf}'></iframe>`)
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
                <FileSpreadsheet className="h-4 w-4" /> Excel (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrgs.map((org) => (
                    <TableRow key={org.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs font-bold">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-900">{org.name}</p>
                            {org.address && (
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                {org.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.cnpj && (
                            <p>
                              <span className="font-medium text-slate-500 mr-1">CNPJ:</span>
                              {org.cnpj}
                            </p>
                          )}
                          {org.cpf && (
                            <p>
                              <span className="font-medium text-slate-500 mr-1">CPF:</span>
                              {org.cpf}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {org.email && <p>{org.email}</p>}
                          {org.phone && <p>{org.phone}</p>}
                          {!org.email && !org.phone && <span className="text-slate-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={org.status ? 'default' : 'secondary'}
                          className={
                            org.status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-600'
                          }
                        >
                          {org.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {org.created_at
                          ? format(new Date(org.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(org)}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(org.id)}
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
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
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filteredOrgs.length)} de {filteredOrgs.length}
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
                <Input {...register('cnpj')} placeholder="00.000.000/0000-00" />
                {errors.cnpj && <span className="text-xs text-red-500">{errors.cnpj.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input {...register('cpf')} placeholder="000.000.000-00" />
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
