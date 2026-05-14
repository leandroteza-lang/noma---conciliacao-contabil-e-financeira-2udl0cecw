import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  FileType,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useTablePreferences } from '@/hooks/use-table-preferences'
import { TableSettingsControls } from '@/components/TableSettingsControls'

type SortField = 'codigo' | 'nome' | 'abreviacao' | 'empresa'

export default function TgaAccountTypes() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<any>(null)
  const [sortField, setSortField] = useState<SortField>('codigo')
  const [sortDesc, setSortDesc] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  const [tableFontSize, setTableFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('tga_types_table_font_size')
    return saved ? parseInt(saved, 10) : 11
  })

  useEffect(() => {
    localStorage.setItem('tga_types_table_font_size', tableFontSize.toString())
  }, [tableFontSize])

  const { prefs, updatePrefs } = useTablePreferences('tga_account_types')

  const loadData = async () => {
    setLoading(true)
    const { data: records, error } = await supabase
      .from('tipo_conta_tga')
      .select('*, organizations(name)')
      .is('deleted_at', null)
      .not('pending_deletion', 'eq', true)
      .order('created_at', { ascending: false })

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message })
    } else {
      setData(records || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = data.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      item.abreviacao?.toLowerCase().includes(search.toLowerCase()),
  )

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = ''
    let valB = ''

    switch (sortField) {
      case 'codigo':
        valA = a.codigo || ''
        valB = b.codigo || ''
        break
      case 'nome':
        valA = a.nome || ''
        valB = b.nome || ''
        break
      case 'abreviacao':
        valA = a.abreviacao || ''
        valB = b.abreviacao || ''
        break
      case 'empresa':
        valA = a.organizations?.name || ''
        valB = b.organizations?.name || ''
        break
    }

    if (valA < valB) return sortDesc ? 1 : -1
    if (valA > valB) return sortDesc ? -1 : 1
    return 0
  })

  const handleExport = async (formatType: 'excel' | 'pdf' | 'csv' | 'txt' | 'browser') => {
    try {
      const exportData = sortedData.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        abreviacao: item.abreviacao,
        observacoes: item.observacoes,
        empresa: item.organizations?.name || 'Geral',
      }))

      const { data: respData, error } = await supabase.functions.invoke('export-tga-accounts', {
        body: { format: formatType, data: exportData },
      })
      if (error) throw error

      if (formatType === 'browser') {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(respData.html)
          newWindow.document.close()
        }
        return
      }

      let linkUrl = ''
      let downloadName = `Tipos_Conta_TGA_${format(new Date(), 'ddMMyyyy')}`

      if (formatType === 'excel') {
        linkUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${respData.excel}`
        downloadName += '.xlsx'
      } else if (formatType === 'pdf') {
        linkUrl = respData.pdf
        downloadName += '.pdf'
      } else if (formatType === 'csv') {
        const blob = new Blob([respData.csv], { type: 'text/csv;charset=utf-8;' })
        linkUrl = URL.createObjectURL(blob)
        downloadName += '.csv'
      } else if (formatType === 'txt') {
        const blob = new Blob([respData.txt], { type: 'text/plain;charset=utf-8;' })
        linkUrl = URL.createObjectURL(blob)
        downloadName += '.txt'
      }

      const link = document.createElement('a')
      link.href = linkUrl
      link.download = downloadName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao exportar', description: err.message })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja enviar este tipo de conta para exclusão?')) return
    try {
      const { error } = await supabase
        .from('tipo_conta_tga')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .eq('id', id)
      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Enviado para a lixeira (pendente de aprovação).',
      })
      setSelectedItems((prev) => prev.filter((uid) => uid !== id))
      loadData()
      window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja enviar ${selectedItems.length} itens para exclusão?`)) return
    try {
      const { error } = await supabase
        .from('tipo_conta_tga')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .in('id', selectedItems)
      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `${selectedItems.length} itens enviados para exclusão.`,
      })
      setSelectedItems([])
      loadData()
      window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortField(field)
      setSortDesc(false)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-white/50" />
    return sortDesc ? (
      <ArrowDown className="ml-2 h-4 w-4 text-white" />
    ) : (
      <ArrowUp className="ml-2 h-4 w-4 text-white" />
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Conta TGA</h1>
          <p className="text-muted-foreground">Gerencie as tipificações de contas TGA.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div
            className="hidden sm:flex items-center gap-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm"
            title="Tamanho da Fonte das Tabelas"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-transparent"
              onClick={() => setTableFontSize((p) => Math.max(8, p - 1))}
            >
              A-
            </Button>
            <span className="text-[12px] font-medium text-slate-500 w-5 text-center select-none">
              {tableFontSize}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[14px] font-bold text-slate-600 hover:text-slate-900 bg-transparent"
              onClick={() => setTableFontSize((p) => Math.min(24, p + 1))}
            >
              A+
            </Button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
            <TableSettingsControls prefs={prefs} updatePrefs={updatePrefs} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> XLSX (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileType className="w-4 h-4 mr-2 text-blue-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileIcon className="w-4 h-4 mr-2 text-red-600" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="w-4 h-4 mr-2 text-gray-600" /> TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('browser')}>
                <Search className="w-4 h-4 mr-2 text-purple-600" /> Visualizar / Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => {
              setItemToEdit(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Tipo TGA
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome ou abreviação..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="w-4 h-4 mr-2" /> Excluir Selecionados ({selectedItems.length})
            </Button>
          </div>
        )}
      </div>

      <div className="border-2 border-indigo-950 rounded-md bg-card/20 overflow-hidden">
        <Table
          style={{ fontSize: `${tableFontSize}px` }}
          showGridlines={prefs.showGridlines}
          gridlineWidth={prefs.gridlineWidth}
          gridlineColor={prefs.gridlineColor}
        >
          <TableHeader className="bg-indigo-950">
            <TableRow className="bg-indigo-950 hover:bg-indigo-950 border-0">
              <TableHead className="w-[40px] text-center py-2 px-2 text-white bg-indigo-950 font-normal text-[15px] border-0">
                <Checkbox
                  checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedItems(sortedData.map((u) => u.id))
                    else setSelectedItems([])
                  }}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-white bg-indigo-950 font-normal text-[15px] border-0 hover:text-white"
                onClick={() => toggleSort('codigo')}
              >
                <div className="flex items-center text-white">
                  Código <SortIcon field="codigo" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-white bg-indigo-950 font-bold text-[15px] border-0 hover:text-white"
                onClick={() => toggleSort('nome')}
              >
                <div className="flex items-center text-white">
                  Nome <SortIcon field="nome" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-white bg-indigo-950 font-normal text-[15px] border-0 hover:text-white"
                onClick={() => toggleSort('abreviacao')}
              >
                <div className="flex items-center text-white">
                  Abreviação <SortIcon field="abreviacao" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-white bg-indigo-950 font-normal text-[15px] border-0 hover:text-white"
                onClick={() => toggleSort('empresa')}
              >
                <div className="flex items-center text-white">
                  Empresa <SortIcon field="empresa" />
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-right py-2 px-2 text-white bg-indigo-950 font-normal text-[15px] border-0 hover:text-white">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-0">
                <TableCell colSpan={6} className="text-center h-24">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow className="border-0">
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  style={{ fontSize: `${tableFontSize}px` }}
                  className={cn(
                    'border-0 group/row transition-colors',
                    selectedItems.includes(item.id)
                      ? 'bg-indigo-950 hover:bg-indigo-950 selected'
                      : 'even:bg-[#bfdbfe] hover:even:bg-[#93c5fd]',
                  )}
                >
                  <TableCell className="text-center py-0.5 px-2">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedItems([...selectedItems, item.id])
                        else setSelectedItems(selectedItems.filter((id) => id !== item.id))
                      }}
                      className={cn(
                        'border-indigo-950',
                        selectedItems.includes(item.id)
                          ? 'border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950'
                          : 'data-[state=checked]:bg-indigo-950 data-[state=checked]:text-white',
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-[1em] py-0.5 px-2 text-black dark:text-white group-even/row:text-black group-[.selected]:text-white dark:group-even/row:text-black dark:group-[.selected]:text-white">
                    {item.codigo}
                  </TableCell>
                  <TableCell className="text-[1em] py-0.5 px-2 text-black dark:text-white group-even/row:text-black group-[.selected]:text-white dark:group-even/row:text-black dark:group-[.selected]:text-white">
                    {item.nome}
                  </TableCell>
                  <TableCell className="text-[1em] py-0.5 px-2 text-black dark:text-white group-even/row:text-black group-[.selected]:text-white dark:group-even/row:text-black dark:group-[.selected]:text-white">
                    {item.abreviacao || '-'}
                  </TableCell>
                  <TableCell className="text-[1em] py-0.5 px-2 text-black dark:text-white group-even/row:text-black group-[.selected]:text-white dark:group-even/row:text-black dark:group-[.selected]:text-white">
                    {item.organizations?.name || 'Geral'}
                  </TableCell>
                  <TableCell className="text-right py-0.5 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-6 w-6',
                          selectedItems.includes(item.id)
                            ? 'text-white hover:text-white hover:bg-white/20'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-even/row:hover:bg-white/40',
                        )}
                        title="Editar"
                        onClick={() => {
                          setItemToEdit(item)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-6 w-6',
                          selectedItems.includes(item.id)
                            ? 'text-white hover:text-red-300 hover:bg-white/20'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 group-even/row:hover:bg-white/40',
                        )}
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setItemToEdit(null)
        }}
        item={itemToEdit}
        onSaved={loadData}
      />
    </div>
  )
}

function EditModal({
  isOpen,
  onClose,
  item,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  item: any
  onSaved: () => void
}) {
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [abreviacao, setAbreviacao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [orgId, setOrgId] = useState('none')
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setCodigo(item?.codigo || '')
      setNome(item?.nome || '')
      setAbreviacao(item?.abreviacao || '')
      setObservacoes(item?.observacoes || '')
      setOrgId(item?.organization_id || 'none')

      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setOrgs(data || []))
    }
  }, [isOpen, item])

  const handleSave = async () => {
    if (!codigo || !nome) return
    setLoading(true)
    try {
      const payload = {
        codigo,
        nome,
        abreviacao,
        observacoes,
        organization_id: orgId === 'none' ? null : orgId,
      }

      if (item) {
        const { error } = await supabase.from('tipo_conta_tga').update(payload).eq('id', item.id)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Registro atualizado.' })
      } else {
        const { error } = await supabase.from('tipo_conta_tga').insert(payload)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Registro criado.' })
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Tipo TGA' : 'Novo Tipo TGA'}</DialogTitle>
          <DialogDescription>Preencha os dados abaixo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geral (Todas)</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Código</label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Abreviação</label>
            <Input value={abreviacao} onChange={(e) => setAbreviacao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !codigo || !nome}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
