import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search, Upload, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImportErpFinancialModal } from '@/components/ImportErpFinancialModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { key: 'compensado', label: 'Compensado' },
  { key: 'tipo_operacao', label: 'Tipo Operação' },
  { key: 'data_emissao', label: 'Data Emissão', type: 'date' },
  { key: 'dt_compens', label: 'Dt Compens.', type: 'date' },
  { key: 'conta_caixa', label: 'Conta/Caixa' },
  { key: 'nome_caixa', label: 'Nome Caixa' },
  { key: 'conta_caixa_destino', label: 'Conta/Caixa Destino' },
  { key: 'forma_pagto', label: 'Forma Pagto' },
  { key: 'c_custo', label: 'C.Custo' },
  { key: 'descricao_c_custo', label: 'Descrição C.Custo' },
  { key: 'valor', label: 'Valor', type: 'currency' },
  { key: 'valor_liquido', label: 'Valor Líquido', type: 'currency' },
  { key: 'n_documento', label: 'Nº Documento' },
  { key: 'nome_cli_fornec', label: 'Nome Cli/Fornec' },
  { key: 'historico', label: 'Histórico' },
  { key: 'fp', label: 'FP' },
  { key: 'n_cheque', label: 'Nº Cheque' },
  { key: 'data_vencto', label: 'Data Vencto', type: 'date' },
  { key: 'nominal_a', label: 'Nominal a' },
  { key: 'emitente_cheque', label: 'Emitente Cheque' },
  { key: 'cnpj_cpf', label: 'CNPJ/CPF' },
  { key: 'n_extrato', label: 'Nº Extrato' },
  { key: 'filial', label: 'Filial' },
  { key: 'data_canc', label: 'Data Canc.', type: 'date' },
  { key: 'data_estorno', label: 'Data Estorno', type: 'date' },
  { key: 'banco', label: 'Banco' },
  { key: 'c_corrente', label: 'C.Corrente' },
  { key: 'cod_cli_for', label: 'Cód.Cli/For' },
  { key: 'departamento', label: 'Departamento' },
]

export default function FinancialMovements() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    // Fetch Orgs
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)

    if (orgsData) {
      setOrgs(orgsData)
    }

    // Fetch Movements
    let query = supabase.from('erp_financial_movements').select('*').is('deleted_at', null)

    if (selectedOrg && selectedOrg !== 'all') {
      query = query.eq('organization_id', selectedOrg)
    }

    // Limit to 5000 to prevent browser crash
    query = query.limit(5000).order('created_at', { ascending: false })

    const { data: movementsData, error } = await query

    if (error) {
      toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' })
    } else {
      setData(movementsData || [])
    }

    setSelectedRows(new Set())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user, selectedOrg])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const formatValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return ''
    if (type === 'currency') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(value),
      )
    }
    if (type === 'date') {
      const [year, month, day] = value.split('T')[0].split('-')
      if (year && month && day) return `${day}/${month}/${year}`
      return value
    }
    return String(value)
  }

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (row) =>
          (row.nome_cli_fornec && row.nome_cli_fornec.toLowerCase().includes(lowerSearch)) ||
          (row.historico && row.historico.toLowerCase().includes(lowerSearch)) ||
          (row.n_documento && row.n_documento.toLowerCase().includes(lowerSearch)),
      )
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key]
        const valB = b[sortConfig.key]

        if (valA === null || valA === undefined) return sortConfig.direction === 'asc' ? -1 : 1
        if (valB === null || valB === undefined) return sortConfig.direction === 'asc' ? 1 : -1

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        }

        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()

        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, search, sortConfig])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredAndSortedData.map((r) => r.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      let query = supabase
        .from('erp_financial_movements')
        .update({ deleted_at: new Date().toISOString() })
        .is('deleted_at', null)
      if (selectedOrg !== 'all') {
        query = query.eq('organization_id', selectedOrg)
      } else {
        const orgIds = orgs.map((o) => o.id)
        query = query.in('organization_id', orgIds)
      }

      const { error } = await query
      if (error) throw error

      toast({ title: 'Sucesso', description: 'Todos os registros foram excluídos.' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setIsDeleteAllOpen(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return
    setIsDeleting(true)
    try {
      const ids = Array.from(selectedRows)
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100)
        const { error } = await supabase
          .from('erp_financial_movements')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', chunk)
        if (error) throw error
      }

      toast({ title: 'Sucesso', description: `${selectedRows.size} registros foram excluídos.` })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setIsDeleteSelectedOpen(false)
    }
  }

  const allSelected =
    filteredAndSortedData.length > 0 && selectedRows.size === filteredAndSortedData.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < filteredAndSortedData.length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Movimento Financeiro TGA
          </h1>
          <p className="text-slate-500 text-sm">Gerencie os dados financeiros importados do ERP.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedRows.size > 0 && (
            <Button variant="destructive" onClick={() => setIsDeleteSelectedOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir ({selectedRows.size})
            </Button>
          )}
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsDeleteAllOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir Tudo
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" /> Importar Planilha
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-3 rounded-lg border shadow-sm">
        <div className="w-full sm:w-64">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as Empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, documento ou histórico..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto text-sm text-slate-500 font-medium">
          {filteredAndSortedData.length} registros
        </div>
      </div>

      <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-1">Nenhum registro encontrado</p>
            <p>Tente ajustar os filtros ou importe uma nova planilha.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 relative">
            <Table className="relative w-max min-w-full border-collapse">
              <TableHeader className="sticky top-0 bg-slate-100 z-20 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-2 py-1 sticky left-0 bg-slate-100 z-30 shadow-[1px_0_0_#e2e8f0]">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                  </TableHead>
                  {COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      className="whitespace-nowrap px-2 py-1 h-8 text-xs font-semibold text-slate-700 border-x border-slate-200 cursor-pointer select-none hover:bg-slate-200 transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-20" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'hover:bg-slate-50 transition-colors group cursor-default',
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                      selectedRows.has(row.id) && 'bg-blue-50 hover:bg-blue-50',
                    )}
                  >
                    <TableCell
                      className="px-2 py-1 border border-slate-100 sticky left-0 z-10 shadow-[1px_0_0_#f1f5f9] group-hover:shadow-[1px_0_0_#e2e8f0] transition-colors"
                      style={{ backgroundColor: 'inherit' }}
                    >
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={(c) => handleSelectRow(row.id, !!c)}
                        />
                      </div>
                    </TableCell>
                    {COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className="px-2 py-1 text-xs border border-slate-100 whitespace-nowrap truncate max-w-[200px]"
                        title={String(row[col.key] || '')}
                      >
                        {formatValue(row[col.key], col.type)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      <ImportErpFinancialModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={fetchData}
      />

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todos os registros?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá todos os registros na empresa atual. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAll()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteSelectedOpen} onOpenChange={setIsDeleteSelectedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registros selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedRows.size} registro(s). Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteSelected()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Selecionados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
