import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Briefcase,
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
import { format } from 'date-fns'

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { user, role } = useAuth()
  const { toast } = useToast()

  const canEdit = role === 'admin' || role === 'supervisor'
  const canDelete = role === 'admin'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const fetchDepartments = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDepartments(data || [])
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [user])

  const filtered = useMemo(() => {
    return departments.filter((d) =>
      search
        ? d.name?.toLowerCase().includes(search.toLowerCase()) ||
          d.code?.toLowerCase().includes(search.toLowerCase())
        : true,
    )
  }, [departments, search])

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
      reset({ code: item.code || '', name: item.name || '' })
    } else {
      setEditingId(null)
      reset({ code: '', name: '' })
    }
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      let finalCode = data.code?.trim() || ''
      if (!finalCode) {
        finalCode = `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }

      let query = supabase
        .from('departments')
        .select('id')
        .eq('code', finalCode)
        .eq('user_id', user.id)
      if (editingId) query = query.neq('id', editingId)
      const { data: existing } = await query.maybeSingle()
      if (existing) {
        toast({
          title: 'Erro',
          description: 'Este código já está em uso.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      if (editingId) {
        const { error } = await supabase
          .from('departments')
          .update({ code: finalCode, name: data.name })
          .eq('id', editingId)
          .eq('user_id', user.id)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Departamento atualizado!' })
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([{ code: finalCode, name: data.name, user_id: user.id }])
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Departamento criado!' })
      }
      setIsModalOpen(false)
      fetchDepartments()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { data: linked } = await supabase
        .from('employees')
        .select('id')
        .eq('department_id', id)
        .limit(1)

      if (linked && linked.length > 0) {
        toast({
          title: 'Ação Bloqueada',
          description: 'Este departamento possui funcionários vinculados e não pode ser excluído.',
          variant: 'destructive',
        })
        return
      }

      if (!confirm('Deseja excluir este departamento?')) return

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Removido com sucesso.' })
      fetchDepartments()
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
        data: sorted.map((d) => ({
          ...d,
          created_at: d.created_at ? format(new Date(d.created_at), 'dd/MM/yyyy') : '',
        })),
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-departments`,
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
        link.download = 'departamentos.xlsx'
        link.click()
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'departamentos.pdf'
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Departamentos</h1>
          <p className="text-slate-500 mt-1">Gerencie os departamentos da sua organização.</p>
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
                <Plus className="h-4 w-4" /> Novo Departamento
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
          <div className="max-w-md space-y-1.5">
            <Label>Buscar por Código ou Nome</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center">
              <Briefcase className="h-12 w-12 text-slate-300 mb-3" />
              <p>Nenhum departamento encontrado.</p>
            </div>
          ) : (
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center gap-2">
                        Código <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Nome <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Criado em <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </TableHead>
                    {(canEdit || canDelete) && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-2 px-4 font-medium text-slate-600">
                        {item.code}
                      </TableCell>
                      <TableCell className="py-2 px-4 text-slate-900">{item.name}</TableCell>
                      <TableCell className="py-2 px-4 text-[13px] text-slate-500">
                        {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openModal(item)}
                                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
            <DialogDescription>Preencha os dados do departamento abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                {...register('code')}
                placeholder="Ex: RH (Deixe em branco para gerar automático)"
              />
              {errors.code && <span className="text-xs text-red-500">{errors.code.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Ex: Recursos Humanos" />
              {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
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
