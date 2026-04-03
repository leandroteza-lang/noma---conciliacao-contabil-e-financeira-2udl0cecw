import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  Printer,
  FileText,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function TgaAccountTypes() {
  const [data, setData] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ field: 'codigo', asc: true })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [formData, setFormData] = useState({
    organization_id: '',
    nome: '',
    abreviacao: '',
    observacoes: '',
  })
  const { toast } = useToast()

  const fetchData = async () => {
    const [{ data: tga }, { data: orgData }] = await Promise.all([
      supabase.from('tipo_conta_tga').select('*, organizations(name)').is('deleted_at', null),
      supabase.from('organizations').select('id, name').is('deleted_at', null),
    ])
    if (tga) setData(tga)
    if (orgData) setOrgs(orgData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    return data
      .filter(
        (i) =>
          i.nome?.toLowerCase().includes(search.toLowerCase()) ||
          i.codigo?.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        const fieldA =
          sort.field === 'organization_id' ? a.organizations?.name || '' : a[sort.field] || ''
        const fieldB =
          sort.field === 'organization_id' ? b.organizations?.name || '' : b[sort.field] || ''

        if (sort.field === 'codigo') {
          const numA = parseInt(String(fieldA).replace(/\D/g, ''), 10)
          const numB = parseInt(String(fieldB).replace(/\D/g, ''), 10)
          if (!isNaN(numA) && !isNaN(numB)) {
            return sort.asc ? numA - numB : numB - numA
          }
        }

        return sort.asc
          ? String(fieldA).localeCompare(String(fieldB))
          : String(fieldB).localeCompare(String(fieldA))
      })
  }, [data, search, sort])

  const handleSort = (field: string) => {
    setSort((prev) => ({ field, asc: prev.field === field ? !prev.asc : true }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      organization_id:
        formData.organization_id === 'none' ? null : formData.organization_id || null,
    }

    const req = editingId
      ? supabase.from('tipo_conta_tga').update(payload).eq('id', editingId)
      : supabase.from('tipo_conta_tga').insert(payload)

    const { error } = await req
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' })
      setIsModalOpen(false)
      fetchData()
    }
  }

  const checkDependencies = async (id: string, codigo: string) => {
    const { data: cData } = await supabase
      .from('cost_centers')
      .select('id')
      .or(`type_tga.eq.${codigo},type_tga.eq.${id}`)
      .is('deleted_at', null)
      .limit(1)

    if (cData && cData.length > 0) return true
    return false
  }

  const handleDelete = async (id: string) => {
    const item = data.find((i) => i.id === id)
    if (!item) return

    const hasDeps = await checkDependencies(item.id, item.codigo)
    if (hasDeps) {
      toast({
        title: 'Ação não permitida',
        description: 'Existem centros de custo vinculados a este tipo de conta.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('Deseja realmente excluir este tipo de conta?')) return
    const { error } = await supabase
      .from('tipo_conta_tga')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Registro excluído com sucesso.' })
      setSelectedIds((prev) => prev.filter((selId) => selId !== id))
      fetchData()
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return

    let hasDependencies = false
    for (const id of selectedIds) {
      const item = data.find((i) => i.id === id)
      if (item && (await checkDependencies(item.id, item.codigo))) {
        hasDependencies = true
        break
      }
    }

    if (hasDependencies) {
      toast({
        title: 'Ação não permitida',
        description: 'Um ou mais registros selecionados possuem vínculos em outras tabelas.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Deseja realmente excluir ${selectedIds.length} registros?`)) return

    const { error } = await supabase
      .from('tipo_conta_tga')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', selectedIds)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} registros excluídos com sucesso.`,
      })
      setSelectedIds([])
      fetchData()
    }
  }

  const openModal = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setFormData({
        organization_id: item.organization_id || 'none',
        nome: item.nome,
        abreviacao: item.abreviacao || '',
        observacoes: item.observacoes || '',
      })
    } else {
      setEditingId(null)
      setFormData({ organization_id: 'none', nome: '', abreviacao: '', observacoes: '' })
    }
    setIsModalOpen(true)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Tipos de Conta TGA</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Tipos de Conta TGA</h2>
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Código</th>
                <th>Nome</th>
                <th>Abreviação</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (i) => `
                <tr>
                  <td>${i.organizations?.name || 'Geral / Nenhuma'}</td>
                  <td>${i.codigo}</td>
                  <td>${i.nome}</td>
                  <td>${i.abreviacao || ''}</td>
                  <td>${i.observacoes || ''}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const exportData = async (format: 'pdf' | 'excel') => {
    try {
      setIsExporting(true)
      const payload = filteredData.map((item) => ({
        empresa: item.organizations?.name || 'Geral / Nenhuma',
        codigo: item.codigo,
        nome: item.nome,
        abreviacao: item.abreviacao,
        observacoes: item.observacoes,
      }))

      const { data: result, error } = await supabase.functions.invoke('export-tga-accounts', {
        body: { format, data: payload },
      })

      if (error) throw error

      if (format === 'excel' && result.excel) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.excel}`
        link.download = 'tipos_conta_tga.xlsx'
        link.click()
      } else if (format === 'pdf' && result.pdf) {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'tipos_conta_tga.pdf'
        link.click()
      }

      toast({
        title: 'Exportação concluída',
        description: `Arquivo ${format.toUpperCase()} gerado com sucesso.`,
      })
    } catch (error: any) {
      toast({ title: 'Erro ao exportar', description: error.message, variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Tipos de Conta TGA</h1>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBatchDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedIds.length})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportData('pdf')}>
                <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2 text-blue-500" /> Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> Novo Tipo
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <Search className="w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar por código ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none px-0"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[50px] p-3">
                <Checkbox
                  checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                  onCheckedChange={(c) => {
                    if (c) setSelectedIds(filteredData.map((i) => i.id))
                    else setSelectedIds([])
                  }}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100 p-3"
                onClick={() => handleSort('organization_id')}
              >
                Empresa <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100 p-3"
                onClick={() => handleSort('codigo')}
              >
                Código <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100 p-3"
                onClick={() => handleSort('nome')}
              >
                Nome <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100 p-3"
                onClick={() => handleSort('abreviacao')}
              >
                Abrev. <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="p-3">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow
                key={item.id}
                className={
                  index % 2 === 0
                    ? 'bg-white hover:bg-blue-50/60'
                    : 'bg-blue-50/40 hover:bg-blue-100/50'
                }
              >
                <TableCell className="p-3">
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(c) => {
                      if (c) setSelectedIds([...selectedIds, item.id])
                      else setSelectedIds(selectedIds.filter((id) => id !== item.id))
                    }}
                  />
                </TableCell>
                <TableCell className="p-3 font-medium text-slate-700">
                  {item.organizations?.name || '-'}
                </TableCell>
                <TableCell className="p-3">{item.codigo}</TableCell>
                <TableCell className="p-3">{item.nome}</TableCell>
                <TableCell className="p-3">{item.abreviacao}</TableCell>
                <TableCell className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(item)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} Tipo de Conta TGA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(v) => setFormData({ ...formData, organization_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geral / Nenhuma</SelectItem>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Abreviação</Label>
              <Input
                maxLength={1}
                value={formData.abreviacao}
                onChange={(e) =>
                  setFormData({ ...formData, abreviacao: e.target.value.toUpperCase() })
                }
                placeholder="Ex: D"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Despesas Administrativas"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes adicionais..."
                className="resize-none h-20"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                Salvar Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
