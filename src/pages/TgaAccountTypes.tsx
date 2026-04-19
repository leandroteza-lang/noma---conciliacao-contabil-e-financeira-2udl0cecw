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
    if (sortField !== field)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />
    return sortDesc ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Conta TGA</h1>
          <p className="text-muted-foreground">Gerencie as tipificações de contas TGA.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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

      <div className="border-2 border-[#800000] rounded-md bg-card/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-[40px] text-center py-2 px-2 text-black dark:text-white font-bold text-[15px]">
                <Checkbox
                  checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedItems(sortedData.map((u) => u.id))
                    else setSelectedItems([])
                  }}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-black dark:text-white font-bold text-[15px]"
                onClick={() => toggleSort('codigo')}
              >
                <div className="flex items-center">
                  Código <SortIcon field="codigo" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-black dark:text-white font-bold text-[15px]"
                onClick={() => toggleSort('nome')}
              >
                <div className="flex items-center">
                  Nome <SortIcon field="nome" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-black dark:text-white font-bold text-[15px]"
                onClick={() => toggleSort('abreviacao')}
              >
                <div className="flex items-center">
                  Abreviação <SortIcon field="abreviacao" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none py-2 px-2 text-black dark:text-white font-bold text-[15px]"
                onClick={() => toggleSort('empresa')}
              >
                <div className="flex items-center">
                  Empresa <SortIcon field="empresa" />
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-right py-2 px-2 text-black dark:text-white font-bold text-[15px]">
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
                  className={cn(
                    'border-0 group/row even:bg-[#800000] even:text-white even:font-bold hover:even:bg-[#800000]/90',
                    selectedItems.includes(item.id) ? 'bg-muted/50' : '',
                  )}
                >
                  <TableCell className="text-center py-0.5 px-2">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedItems([...selectedItems, item.id])
                        else setSelectedItems(selectedItems.filter((id) => id !== item.id))
                      }}
                      className="group-even/row:border-white group-even/row:data-[state=checked]:bg-white group-even/row:data-[state=checked]:text-[#800000]"
                    />
                  </TableCell>
                  <TableCell className="font-medium py-0.5 px-2">{item.codigo}</TableCell>
                  <TableCell className="text-muted-foreground group-even/row:text-white group-even/row:font-bold py-0.5 px-2">
                    {item.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground group-even/row:text-white group-even/row:font-bold py-0.5 px-2">
                    {item.abreviacao || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground group-even/row:text-white group-even/row:font-bold py-0.5 px-2">
                    {item.organizations?.name || 'Geral'}
                  </TableCell>
                  <TableCell className="text-right py-0.5 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-even/row:text-white group-even/row:hover:text-blue-100 group-even/row:hover:bg-white/20"
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
                        className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 group-even/row:text-white group-even/row:hover:text-red-100 group-even/row:hover:bg-white/20"
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
