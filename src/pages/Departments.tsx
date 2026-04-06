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
import { ImportDepartmentsModal } from '@/components/ImportDepartmentsModal'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { user, role, permissions } = useAuth()
  const { toast } = useToast()

  const safePerms = Array.isArray(permissions) ? permissions : []
  const hasFullAccess = safePerms.includes('all') || safePerms.includes('departamentos')

  const canEdit = role === 'admin' || role === 'supervisor' || hasFullAccess
  const canDelete = role === 'admin' || hasFullAccess

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
        .neq('pending_deletion', true)
        .is('deleted_at', null)
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
        .is('deleted_at', null)
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
        .is('deleted_at', null)
        .limit(1)

      if (linked && linked.length > 0) {
        toast({
          title: 'Ação Bloqueada',
          description: 'Este departamento possui funcionários vinculados e não pode ser excluído.',
          variant: 'destructive',
        })
        return
      }

      if (!confirm('Deseja solicitar a exclusão deste departamento?')) return

      const { error } = await supabase
        .from('departments')
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
      fetchDepartments()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} departamento(s)?`)) return

    const checkPromises = selectedIds.map(async (id) => {
      const { data: linked } = await supabase
        .from('employees')
        .select('id')
        .eq('department_id', id)
        .is('deleted_at', null)
        .limit(1)
      return { id, hasRelations: linked && linked.length > 0 }
    })

    const results = await Promise.all(checkPromises)
    const toDelete = results.filter((r) => !r.hasRelations).map((r) => r.id)
    const blocked = results.filter((r) => r.hasRelations).map((r) => r.id)

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('departments')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .in('id', toDelete)
        .eq('user_id', user?.id)

      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else
        toast({
          title: 'Sucesso',
          description: `${toDelete.length} departamento(s) enviado(s) para aprovação.`,
        })
    }

    if (blocked.length > 0) {
      toast({
        title: 'Ação Parcialmente Bloqueada',
        description: `${blocked.length} departamento(s) possuem funcionários vinculados e não puderam ser excluídos.`,
        variant: 'destructive',
      })
    }

    setSelectedIds([])
    fetchDepartments()
  }

  const handleDownloadTemplate = async () => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando modelo...' })
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      const payload = {
        format: 'excel',
        template: true,
        data: [
          { NOME: 'Recursos Humanos', CODIGO: 'RH' },
          { NOME: 'Tecnologia da Informação', CODIGO: 'TI' },
          { NOME: 'Financeiro', CODIGO: 'FIN' },
        ],
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-departments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) throw new Error('Falha ao gerar modelo')
      const result = await res.json()
      const binaryString = atob(result.excel)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'modelo_importacao_departamentos.xlsx'
      link.click()
      toast({ title: 'Sucesso', description: 'Modelo baixado!' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'csv' | 'txt') => {
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
      } else if (formatType === 'csv') {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'departamentos.csv'
        link.click()
      } else if (formatType === 'txt') {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'departamentos.txt'
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Departamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os departamentos da sua organização.
          </p>
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
                <FileText className="h-4 w-4 text-red-500" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" /> Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('csv')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4 text-blue-500" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('txt')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4 text-gray-500" /> TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEdit && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 no-underline bg-[#1bc3c8] opacity-[1] shadow-[0px_0px_6px_0px_transparent] text-[#f4f4f4] not-italic inline-flex"
                  >
                    <Upload className="h-4 w-4" /> Importar em Lote
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDownloadTemplate}
                    className="cursor-pointer gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-500" /> Baixar Modelo XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsImportModalOpen(true)}
                    className="cursor-pointer gap-2"
                  >
                    <Upload className="h-4 w-4" /> Importar em Lote
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => openModal()}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Novo Departamento
              </Button>
            </>
          )}
        </div>
      </div>

      <ImportDepartmentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchDepartments}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-1.5">
            <Label>Buscar por Código ou Nome</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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

      {selectedIds.length > 0 && canDelete && (
        <div className="bg-muted/50 border border-border rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-foreground">
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
            <div className="py-12 flex justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p>Nenhum departamento encontrado.</p>
            </div>
          ) : (
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {canDelete && (
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={paginated.length > 0 && selectedIds.length === paginated.length}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds(paginated.map((d) => d.id))
                            else setSelectedIds([])
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center gap-2">
                        Código <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Nome <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Criado em <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    {(canEdit || canDelete) && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      {canDelete && (
                        <TableCell className="py-2 px-4 text-center">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, item.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== item.id))
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-2 px-4 font-medium text-foreground/80">
                        {item.code}
                      </TableCell>
                      <TableCell className="py-2 px-4 text-foreground">{item.name}</TableCell>
                      <TableCell className="py-2 px-4 text-[13px] text-muted-foreground">
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
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border gap-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground hidden sm:block">Itens por página:</p>
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
              {errors.code && (
                <span className="text-xs text-destructive">{errors.code.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input {...register('name')} placeholder="Ex: Recursos Humanos" />
              {errors.name && (
                <span className="text-xs text-destructive">{errors.name.message}</span>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
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
