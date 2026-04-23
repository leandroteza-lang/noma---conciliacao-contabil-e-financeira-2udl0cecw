import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Trash2,
  Save,
  EyeOff,
  Eye,
  MoreVertical,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { ImportErpFinancialModal } from '@/components/ImportErpFinancialModal'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Filter, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MultiSelect } from '@/components/MultiSelect'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const tableHeaders = [
  { label: 'Empresa', key: 'empresa' },
  { label: 'Compensado', key: 'compensado', align: 'center' },
  { label: 'Tipo Op.', key: 'tipo_operacao', align: 'center' },
  { label: 'Data Emissão', key: 'data_emissao', align: 'center' },
  { label: 'Dt Compens.', key: 'dt_compens', align: 'center' },
  { label: 'Conta/Caixa', key: 'conta_caixa', align: 'center' },
  { label: 'Nome Caixa', key: 'nome_caixa' },
  { label: 'Conta/Caixa Destino', key: 'conta_caixa_destino', align: 'center' },
  { label: 'Forma Pagto', key: 'forma_pagto' },
  { label: 'C.Custo', key: 'c_custo' },
  { label: 'Descrição C.Custo', key: 'descricao_c_custo', className: 'min-w-[150px]' },
  { label: 'Valor', key: 'valor', align: 'center' },
  { label: 'Valor Líquido', key: 'valor_liquido', align: 'center' },
  { label: 'Nº Documento', key: 'n_documento' },
  { label: 'Nome Cli/Fornec', key: 'nome_cli_fornec' },
  { label: 'Histórico', key: 'historico', className: 'min-w-[200px]' },
  { label: 'FP', key: 'fp', align: 'center' },
  { label: 'Nº Cheque', key: 'n_cheque' },
  { label: 'Data Vencto', key: 'data_vencto', align: 'center' },
  { label: 'Nominal a', key: 'nominal_a' },
  { label: 'Emitente Cheque', key: 'emitente_cheque' },
  { label: 'CNPJ/CPF', key: 'cnpj_cpf' },
  { label: 'Nº Extrato', key: 'n_extrato', align: 'center' },
  { label: 'Filial', key: 'filial', align: 'center' },
  { label: 'Data Canc.', key: 'data_canc', align: 'center' },
  { label: 'Data Estorno', key: 'data_estorno', align: 'center' },
  { label: 'Banco', key: 'banco', align: 'center' },
  { label: 'C.Corrente', key: 'c_corrente' },
  { label: 'Cód.Cli/For', key: 'cod_cli_for' },
  { label: 'Departamento', key: 'departamento', align: 'center' },
  { label: 'Status', key: 'status', align: 'center' },
]

export default function FinancialMovements() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [sortColumn, setSortColumn] = useState<string>('data_emissao')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [activeImport, setActiveImport] = useState<any>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [totals, setTotals] = useState({ valor: 0, valor_liquido: 0 })

  const [filters, setFilters] = useState<Record<string, string[]>>({})

  const [savedFilters, setSavedFilters] = useState<any[]>(() => {
    const saved = localStorage.getItem('fin_mov_saved_filters')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((f: any) => {
          const newFilt = f.filters || {}
          const migratedFilters: Record<string, string[]> = {}
          const mappings: Record<string, string> = {
            empresas: 'empresa',
            contas: 'conta_caixa',
            tipos: 'tipo_operacao',
            status: 'status',
            contas_destino: 'conta_caixa_destino',
            formas_pagto: 'forma_pagto',
            c_custos: 'c_custo',
            descricoes_c_custo: 'descricao_c_custo',
          }
          Object.entries(newFilt).forEach(([k, v]) => {
            const newKey = mappings[k] || k
            migratedFilters[newKey] = Array.isArray(v) ? v : v && v !== 'all' ? [v] : []
          })
          return {
            ...f,
            filters: migratedFilters,
          }
        })
      } catch (e) {
        return []
      }
    }
    return []
  })
  const [newFilterName, setNewFilterName] = useState('')

  const [savedColumns, setSavedColumns] = useState<any[]>(() => {
    const saved = localStorage.getItem('fin_mov_saved_columns')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return []
      }
    }
    return []
  })
  const [newColumnPresetName, setNewColumnPresetName] = useState('')

  const saveCurrentColumns = () => {
    if (!newColumnPresetName.trim()) {
      toast.error('Informe um nome para a preferência de colunas.')
      return
    }
    const newPreset = {
      id: crypto.randomUUID(),
      name: newColumnPresetName,
      columns: { ...visibleColumns },
      order: [...columnOrder],
    }
    const updated = [...savedColumns, newPreset]
    setSavedColumns(updated)
    localStorage.setItem('fin_mov_saved_columns', JSON.stringify(updated))
    setNewColumnPresetName('')
    toast.success('Preferência de colunas salva com sucesso!')
  }

  const applySavedColumns = (sc: any) => {
    setVisibleColumns(sc.columns)
    if (sc.order) {
      const validKeys = new Set(defaultColumnOrder)
      const validParsed = sc.order.filter((key: string) => validKeys.has(key))
      const missingKeys = defaultColumnOrder.filter((key) => !validParsed.includes(key))
      setColumnOrder([...validParsed, ...missingKeys])
    } else {
      setColumnOrder(defaultColumnOrder)
    }
    toast.success(`Preferência "${sc.name}" aplicada.`)
  }

  const deleteSavedColumns = (id: string) => {
    const updated = savedColumns.filter((c) => c.id !== id)
    setSavedColumns(updated)
    localStorage.setItem('fin_mov_saved_columns', JSON.stringify(updated))
  }

  const [filterOptions, setFilterOptions] = useState<
    Record<string, { label: string; value: string }[]>
  >({})

  const hasActiveFilters = Object.values(filters).some((arr) => arr && arr.length > 0)

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(0)
  }

  const saveCurrentFilter = () => {
    if (!newFilterName.trim()) {
      toast.error('Informe um nome para o filtro.')
      return
    }
    const newFilter = {
      id: crypto.randomUUID(),
      name: newFilterName,
      filters: { ...filters },
      search,
    }
    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem('fin_mov_saved_filters', JSON.stringify(updated))
    setNewFilterName('')
    toast.success('Filtro salvo com sucesso!')
  }

  const applySavedFilter = (sf: any) => {
    setFilters(sf.filters)
    setSearch(sf.search || '')
    setPage(0)
    toast.success(`Filtro "${sf.name}" aplicado.`)
  }

  const deleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id)
    setSavedFilters(updated)
    localStorage.setItem('fin_mov_saved_filters', JSON.stringify(updated))
  }

  const loadFilterOptions = async () => {
    if (!user) return
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')

    const { data: movs } = await supabase
      .from('erp_financial_movements')
      .select('*')
      .is('deleted_at', null)
      .limit(5000)

    const options: Record<string, { label: string; value: string }[]> = {}

    options['empresa'] = (orgs || []).map((e) => ({ label: e.name, value: e.id }))

    tableHeaders.forEach((h) => {
      if (h.key === 'empresa') return
      if (h.key === 'status') {
        options['status'] = [
          { label: 'Pendente', value: 'Pendente' },
          { label: 'Concluído', value: 'Concluído' },
          { label: 'Erro', value: 'Erro' },
        ]
        return
      }

      if (movs) {
        const uniqueVals = Array.from(
          new Set(
            movs.map((m) => m[h.key]).filter((v) => v !== null && v !== undefined && v !== ''),
          ),
        ).sort()
        options[h.key] = uniqueVals.map((v) => {
          let label = String(v)
          if (
            ['data_emissao', 'dt_compens', 'data_vencto', 'data_canc', 'data_estorno'].includes(
              h.key,
            )
          ) {
            const parts = label.split('T')[0].split('-')
            if (parts.length === 3) {
              label = `${parts[2]}/${parts[1]}/${parts[0]}`
            }
          } else if (['valor', 'valor_liquido'].includes(h.key)) {
            label = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              Number(v),
            )
          }
          return { label, value: String(v) }
        })
      } else {
        options[h.key] = []
      }
    })

    setFilterOptions(options)
  }

  useEffect(() => {
    loadFilterOptions()
  }, [user, refreshKey])

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'selected' | 'all' | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [deletionState, setDeletionState] = useState({
    active: false,
    progress: 0,
    total: 0,
    processed: 0,
    status: 'Processing' as 'Processing' | 'Completed' | 'Error',
  })

  const defaultVisibleColumns = tableHeaders.reduce(
    (acc, h) => ({ ...acc, [h.key]: true }),
    {} as Record<string, boolean>,
  )

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('fin_mov_visible_cols')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...defaultVisibleColumns, ...parsed }
      } catch (e) {
        // ignore parse error
      }
    }
    return defaultVisibleColumns
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_visible_cols', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAllColumns = () => {
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: true }), {}))
  }

  const selectNoColumns = () => {
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: false }), {}))
  }

  const invertColumns = () => {
    setVisibleColumns((prev) =>
      tableHeaders.reduce(
        (acc, h) => ({ ...acc, [h.key]: prev[h.key] === false ? true : false }),
        {},
      ),
    )
  }

  const defaultColumnOrder = tableHeaders.map((h) => h.key)

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('fin_mov_column_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validKeys = new Set(defaultColumnOrder)
        const validParsed = parsed.filter((key: string) => validKeys.has(key))
        const missingKeys = defaultColumnOrder.filter((key) => !validParsed.includes(key))
        return [...validParsed, ...missingKeys]
      } catch (e) {
        return defaultColumnOrder
      }
    }
    return defaultColumnOrder
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_column_order', JSON.stringify(columnOrder))
  }, [columnOrder])

  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleColumns)
    setColumnOrder(defaultColumnOrder)
    toast.success('Visualização e ordem padrão restauradas.')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60)
      .toString()
      .padStart(2, '0')
    const s = (Math.max(0, seconds) % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAllPage = () => {
    const pageIds = data.map((d) => d.id)
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const updateWithRetry = async (ids: string[], retries = 3) => {
    if (!user) return { error: new Error('Usuário não autenticado') }
    for (let attempt = 1; attempt <= retries; attempt++) {
      const { error } = await supabase
        .from('erp_financial_movements')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
        .in('id', ids)

      if (!error) return { error: null }
      if (attempt === retries) return { error }

      await new Promise((res) => setTimeout(res, 1000 * attempt))
    }
    return { error: new Error('Falha após múltiplas tentativas') }
  }

  const startBulkDelete = async () => {
    if (!user) return
    setDeleteModalOpen(false)
    setDeleteMode(null)

    const { count, error: countErr } = await supabase
      .from('erp_financial_movements')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)

    if (countErr) {
      toast.error('Erro ao preparar exclusão: ' + countErr.message)
      return
    }

    const accurateTotal = count || 0
    if (accurateTotal === 0) {
      toast.info('Nenhum registro para excluir.')
      return
    }

    setDeletionState({
      active: true,
      progress: 0,
      total: accurateTotal,
      processed: 0,
      status: 'Processing',
    })

    try {
      let processed = 0
      const chunkSize = 150

      while (true) {
        const { data, error: fetchErr } = await supabase
          .from('erp_financial_movements')
          .select('id')
          .is('deleted_at', null)
          .limit(chunkSize)

        if (fetchErr) throw fetchErr
        if (!data || data.length === 0) break

        const ids = data.map((d) => d.id)

        const { error: updateErr } = await updateWithRetry(ids)

        if (updateErr) throw updateErr

        processed += ids.length
        setDeletionState((prev) => ({
          ...prev,
          processed,
          progress:
            accurateTotal > 0 ? Math.min(100, Math.round((processed / accurateTotal) * 100)) : 100,
        }))
      }

      setDeletionState((prev) => ({ ...prev, status: 'Completed', progress: 100 }))
      toast.success('Todos os registros foram excluídos com sucesso!')
      setSelectedIds([])
      setPage(0)
      setRefreshKey((k) => k + 1)
    } catch (error: any) {
      console.error('Erro na exclusão em lote:', error)
      setDeletionState((prev) => ({ ...prev, status: 'Error' }))
      toast.error('Erro ao excluir registros: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteMode) return

    if (deleteMode === 'all') {
      await startBulkDelete()
      return
    }

    setIsDeleting(true)
    try {
      const chunkSize = 150
      for (let i = 0; i < selectedIds.length; i += chunkSize) {
        const chunk = selectedIds.slice(i, i + chunkSize)
        const { error } = await updateWithRetry(chunk)
        if (error) throw error
      }
      toast.success(`${selectedIds.length} registros excluídos com sucesso!`)
      setSelectedIds([])
      setPage(0)
      setRefreshKey((k) => k + 1)
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir: ' + error.message)
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setDeleteMode(null)
    }
  }

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const renderSortIcon = (key: string) => {
    if (sortColumn !== key) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-300" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    )
  }

  const dismissImport = () => {
    if (activeImport) {
      localStorage.setItem('dismissed_import_erp_fin', activeImport.id)
    }
    setActiveImport(null)
  }

  const fetchActiveImport = async () => {
    if (!user) return
    const { data } = await supabase
      .from('import_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('import_type', 'ERP_FINANCIAL_MOVEMENTS')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      const dismissedId = localStorage.getItem('dismissed_import_erp_fin')
      if (dismissedId === data.id && (data.status === 'Completed' || data.status === 'Error')) {
        return
      }

      setActiveImport(data)
      if (data.status === 'Completed' || data.status === 'Error') {
        const saved = localStorage.getItem('last_import_time_erp_fin')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed.id === data.id) {
              setElapsedSeconds(parsed.elapsed)
            }
          } catch {
            /* intentionally ignored */
          }
        }
      }
    }
  }

  const applyQueryFilters = (query: any) => {
    let q = query
    if (search) {
      q = q.or(
        `historico.ilike.%${search}%,nome_cli_fornec.ilike.%${search}%,c_custo.ilike.%${search}%`,
      )
    }
    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        if (key === 'empresa') {
          q = q.in('organization_id', values)
        } else {
          q = q.in(key, values)
        }
      }
    })
    return q
  }

  const fetchDataSilent = async () => {
    if (!user) return
    let orderCol = sortColumn
    if (sortColumn === 'empresa') orderCol = 'organization_id'

    let query = supabase
      .from('erp_financial_movements')
      .select('*, organizations(name)', { count: 'exact' })
      .is('deleted_at', null)
      .order(orderCol, { ascending: sortDirection === 'asc' })

    query = applyQueryFilters(query)

    let totalsQuery = supabase
      .from('erp_financial_movements')
      .select('valor, valor_liquido')
      .is('deleted_at', null)
      .limit(100000)
    totalsQuery = applyQueryFilters(totalsQuery)

    const [{ data: result, count, error }, { data: totalsData }] = await Promise.all([
      query.range(page * pageSize, (page + 1) * pageSize - 1),
      totalsQuery,
    ])

    if (!error && result) {
      setData(result)
      setTotalCount(count || 0)
    }

    if (totalsData) {
      const sumV = totalsData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
      const sumVL = totalsData.reduce((acc, curr) => acc + (Number(curr.valor_liquido) || 0), 0)
      setTotals({ valor: sumV, valor_liquido: sumVL })
    }
  }

  useEffect(() => {
    fetchActiveImport()
  }, [user])

  useEffect(() => {
    let interval: any
    let timerInterval: any

    if (activeImport) {
      if (['Processing', 'Pending'].includes(activeImport.status)) {
        const start = new Date(activeImport.created_at).getTime()
        const updateTimer = () => {
          const now = new Date().getTime()
          setElapsedSeconds(Math.floor((now - start) / 1000))
        }
        updateTimer()
        timerInterval = setInterval(updateTimer, 1000)

        interval = setInterval(async () => {
          if (!user) return
          const { data } = await supabase
            .from('import_history')
            .select('*')
            .eq('id', activeImport.id)
            .single()

          if (data) {
            setActiveImport(data)
            fetchDataSilent()
            if (data.status === 'Completed' || data.status === 'Error') {
              clearInterval(interval)
              clearInterval(timerInterval)
              setRefreshKey((k) => k + 1)
              setElapsedSeconds((prev) => {
                localStorage.setItem(
                  'last_import_time_erp_fin',
                  JSON.stringify({ id: data.id, elapsed: prev }),
                )
                return prev
              })
            }
          }
        }, 3000)
      }
    } else {
      setElapsedSeconds(0)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [
    activeImport?.status,
    activeImport?.id,
    activeImport?.created_at,
    user,
    page,
    search,
    pageSize,
    sortColumn,
    sortDirection,
    filters,
  ])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    let orderCol = sortColumn
    if (sortColumn === 'empresa') orderCol = 'organization_id'

    let query = supabase
      .from('erp_financial_movements')
      .select('*, organizations(name)', { count: 'exact' })
      .is('deleted_at', null)
      .order(orderCol, { ascending: sortDirection === 'asc' })

    query = applyQueryFilters(query)

    let totalsQuery = supabase
      .from('erp_financial_movements')
      .select('valor, valor_liquido')
      .is('deleted_at', null)
      .limit(100000)
    totalsQuery = applyQueryFilters(totalsQuery)

    const [{ data: result, count, error }, { data: totalsData }] = await Promise.all([
      query.range(page * pageSize, (page + 1) * pageSize - 1),
      totalsQuery,
    ])

    if (!error && result) {
      setData(result)
      setTotalCount(count || 0)
    }

    if (totalsData) {
      const sumV = totalsData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
      const sumVL = totalsData.reduce((acc, curr) => acc + (Number(curr.valor_liquido) || 0), 0)
      setTotals({ valor: sumV, valor_liquido: sumVL })
    }

    setLoading(false)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  useEffect(() => {
    fetchData()
  }, [user, page, search, pageSize, sortColumn, sortDirection, refreshKey, filters])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const visibleCount = tableHeaders.filter((h) => visibleColumns[h.key] !== false).length + 2
  const hiddenColumnsCount = tableHeaders.filter((h) => visibleColumns[h.key] === false).length

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
      {deletionState.active && (
        <Card
          className={cn(
            'shadow-sm border relative',
            deletionState.status === 'Error'
              ? 'border-red-200 bg-red-50/50'
              : deletionState.status === 'Completed'
                ? 'border-green-200 bg-green-50/50'
                : 'border-orange-200 bg-orange-50/50',
          )}
        >
          {['Completed', 'Error'].includes(deletionState.status) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-slate-200/50 text-slate-500"
              onClick={() => setDeletionState((prev) => ({ ...prev, active: false }))}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {deletionState.status === 'Processing' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                ) : deletionState.status === 'Error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium text-slate-800">
                  {deletionState.status === 'Processing' && 'Excluindo registros em lote...'}
                  {deletionState.status === 'Error' && 'Erro na exclusão'}
                  {deletionState.status === 'Completed' && 'Exclusão Concluída'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                <span>
                  {deletionState.processed} / {deletionState.total} registros (
                  {deletionState.progress}%)
                </span>
              </div>
            </div>
            <Progress
              value={deletionState.progress}
              className={cn(
                'h-2',
                deletionState.status === 'Error'
                  ? 'bg-red-100 [&>div]:bg-red-600'
                  : deletionState.status === 'Completed'
                    ? 'bg-green-100 [&>div]:bg-green-600'
                    : 'bg-orange-100 [&>div]:bg-orange-600',
              )}
            />
          </CardContent>
        </Card>
      )}

      {activeImport && (
        <Card
          className={`shadow-sm border relative ${activeImport.status === 'Error' ? 'border-red-200 bg-red-50/50' : activeImport.status === 'Completed' ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50'}`}
        >
          {['Completed', 'Error'].includes(activeImport.status) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-slate-200/50 text-slate-500"
              onClick={dismissImport}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeImport.status === 'Processing' || activeImport.status === 'Pending' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : activeImport.status === 'Error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium text-slate-800">
                  {activeImport.status === 'Processing' &&
                    activeImport.total_records === 0 &&
                    'Lendo e preparando arquivo...'}
                  {activeImport.status === 'Processing' &&
                    activeImport.total_records > 0 &&
                    'Processando importação...'}
                  {activeImport.status === 'Pending' && 'Aguardando processamento...'}
                  {activeImport.status === 'Error' && 'Última Importação: Erro'}
                  {activeImport.status === 'Completed' && 'Última Importação: Concluída'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                <div
                  className="flex items-center gap-1.5 font-mono bg-white/60 px-2.5 py-1 rounded-md border border-slate-200/60 text-slate-700"
                  title="Tempo de importação"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {formatTime(elapsedSeconds)}
                </div>
                <span>
                  {activeImport.total_records > 0
                    ? `${activeImport.processed_records || 0} / ${activeImport.total_records} registros (${Math.round(((activeImport.processed_records || 0) / activeImport.total_records) * 100)}%)`
                    : 'Iniciando...'}
                </span>
              </div>
            </div>

            <Progress
              value={
                activeImport.total_records > 0
                  ? ((activeImport.processed_records || 0) / activeImport.total_records) * 100
                  : 0
              }
              className={`h-2 ${activeImport.status === 'Error' ? 'bg-red-100 [&>div]:bg-red-600' : activeImport.status === 'Completed' ? 'bg-green-100 [&>div]:bg-green-600' : 'bg-blue-100 [&>div]:bg-blue-600'}`}
            />

            {activeImport.status === 'Processing' && (
              <p className="text-xs text-slate-500">
                Isso pode levar alguns minutos dependendo do tamanho do arquivo. Você pode continuar
                usando o sistema. A grade será atualizada automaticamente.
              </p>
            )}

            {['Completed', 'Processing', 'Error'].includes(activeImport.status) && (
              <div className="text-xs text-slate-700 bg-white/60 p-2.5 rounded-md border border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 font-medium">
                <div className="flex items-center gap-1.5" title="Registros Inseridos (Novos)">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                  {activeImport.success_count || 0} Inseridos
                </div>
                <div
                  className="flex items-center gap-1.5"
                  title="Registros Atualizados (Substituídos)"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span>
                  {activeImport.updated_count || 0} Atualizados
                </div>
                <div className="flex items-center gap-1.5" title="Registros Ignorados (Duplicados)">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shadow-sm shadow-slate-200"></span>
                  {activeImport.ignored_count || 0} Ignorados
                </div>
                <div className="flex items-center gap-1.5" title="Registros com Erro">
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200"></span>
                  <span className={activeImport.error_count > 0 ? 'text-red-600' : ''}>
                    {activeImport.error_count || 0} Erros
                  </span>
                </div>
              </div>
            )}

            {activeImport.status === 'Error' &&
              activeImport.errors_list &&
              activeImport.errors_list.length > 0 && (
                <div className="text-xs text-red-600 mt-1 max-h-32 overflow-y-auto bg-red-50 border border-red-200 p-3 rounded-md shadow-sm">
                  <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Últimos erros encontrados:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {activeImport.errors_list.slice(0, 10).map((err: any, idx: number) => (
                      <li key={idx}>
                        Linha {err.row > 0 ? err.row : '?'}: {err.error}
                      </li>
                    ))}
                    {activeImport.errors_list.length > 10 && (
                      <li className="font-medium pt-1 text-red-700">
                        ... e mais {activeImport.errors_list.length - 10} erros.
                      </li>
                    )}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Movimento Financeiro TGA
          </h1>
          <p className="text-slate-500 mt-1">
            Gestão, visualização e conciliação de lançamentos do ERP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteMode('all')
              setDeleteModalOpen(true)
            }}
            className="shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            disabled={totalCount === 0 || loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Todos
          </Button>
          <Button onClick={() => setIsImportOpen(true)} className="shadow-sm">
            <UploadCloud className="mr-2 h-4 w-4" />
            Importar Planilha
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium text-blue-900">registros selecionados</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="bg-white hover:bg-slate-100 flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDeleteMode('selected')
                setDeleteModalOpen(true)
              }}
              className="flex-1 sm:flex-none shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Selecionados
            </Button>
          </div>
        </div>
      )}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b bg-slate-50/50 flex flex-col gap-3">
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por histórico, cliente ou centro de custo..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                  setSelectedIds([])
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 xl:ml-auto bg-white p-1.5 rounded-md border shadow-sm">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex items-center gap-1.5 px-2 relative"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filtros</span>
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                        {Object.values(filters).reduce(
                          (acc: number, val: any) => acc + (val?.length > 0 ? 1 : 0),
                          0,
                        )}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 flex flex-col">
                  <Tabs defaultValue="filters" className="w-full">
                    <div className="px-4 pt-4 pb-2 border-b">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="filters">Filtros</TabsTrigger>
                        <TabsTrigger value="saved">Salvos</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent
                      value="filters"
                      className="m-0 p-4 max-h-[60vh] overflow-y-auto space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Filtros Combinados</h4>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-6 text-xs px-2 text-slate-500 hover:text-slate-800"
                          >
                            Limpar todos
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Empresa</Label>
                          <MultiSelect
                            title="Todas as empresas"
                            options={filterOptions['empresa'] || []}
                            selected={filters['empresa'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, empresa: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Conta/Caixa</Label>
                          <MultiSelect
                            title="Todas as contas"
                            options={filterOptions['conta_caixa'] || []}
                            selected={filters['conta_caixa'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, conta_caixa: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Tipo de Operação</Label>
                          <MultiSelect
                            title="Todos os tipos"
                            options={filterOptions['tipo_operacao'] || []}
                            selected={filters['tipo_operacao'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, tipo_operacao: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Conta/Caixa Destino</Label>
                          <MultiSelect
                            title="Todas as contas destino"
                            options={filterOptions['conta_caixa_destino'] || []}
                            selected={filters['conta_caixa_destino'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, conta_caixa_destino: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Forma de Pagto</Label>
                          <MultiSelect
                            title="Todas as formas de pagto"
                            options={filterOptions['forma_pagto'] || []}
                            selected={filters['forma_pagto'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, forma_pagto: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">C.Custo</Label>
                          <MultiSelect
                            title="Todos os C.Custo"
                            options={filterOptions['c_custo'] || []}
                            selected={filters['c_custo'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, c_custo: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Descrição C.Custo</Label>
                          <MultiSelect
                            title="Todas as descrições"
                            options={filterOptions['descricao_c_custo'] || []}
                            selected={filters['descricao_c_custo'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, descricao_c_custo: v }))
                              setPage(0)
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <MultiSelect
                            title="Todos os status"
                            options={filterOptions['status'] || []}
                            selected={filters['status'] || []}
                            onChange={(v) => {
                              setFilters((p) => ({ ...p, status: v }))
                              setPage(0)
                            }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 mt-4 flex items-center gap-2">
                        <Input
                          value={newFilterName}
                          onChange={(e) => setNewFilterName(e.target.value)}
                          placeholder="Nome para salvar filtro..."
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs whitespace-nowrap"
                          onClick={saveCurrentFilter}
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="saved" className="m-0 p-4 max-h-[60vh] overflow-y-auto">
                      <div className="space-y-2">
                        {savedFilters.map((sf) => (
                          <div
                            key={sf.id}
                            className="flex items-center justify-between p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-md text-sm transition-colors"
                          >
                            <span
                              className="font-medium text-slate-700 cursor-pointer flex-1"
                              onClick={() => applySavedFilter(sf)}
                            >
                              {sf.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSavedFilter(sf.id)}
                              className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Excluir filtro salvo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        {savedFilters.length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-6">
                            Nenhum filtro salvo ainda.
                            <br />
                            Configure os filtros e salve-os para acesso rápido.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex items-center gap-1.5 px-2 relative"
                  >
                    <Columns className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      Colunas {hiddenColumnsCount > 0 ? `(${hiddenColumnsCount})` : ''}
                    </span>
                    {hiddenColumnsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground sm:hidden">
                        {hiddenColumnsCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 flex flex-col">
                  <Tabs defaultValue="columns" className="w-full">
                    <div className="px-4 pt-4 pb-2 border-b">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="columns">Colunas</TabsTrigger>
                        <TabsTrigger value="saved">Salvas</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="columns" className="m-0 p-4 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Gerenciar Colunas</h4>
                        {(hiddenColumnsCount > 0 ||
                          JSON.stringify(columnOrder) !== JSON.stringify(defaultColumnOrder)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetColumns}
                            className="h-6 text-xs px-2 text-slate-500 hover:text-slate-800"
                          >
                            Restaurar padrão
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 px-2 text-[10px] flex-1"
                          onClick={selectAllColumns}
                        >
                          Todos
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 px-2 text-[10px] flex-1"
                          onClick={selectNoColumns}
                        >
                          Nenhum
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 px-2 text-[10px] flex-1"
                          onClick={invertColumns}
                        >
                          Inverter
                        </Button>
                      </div>

                      <div className="max-h-[40vh] overflow-y-auto space-y-1.5 pr-2">
                        {columnOrder.map((key) => {
                          const h = tableHeaders.find((th) => th.key === key)!
                          return (
                            <div key={h.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`col-${h.key}`}
                                checked={visibleColumns[h.key] !== false}
                                onCheckedChange={() => toggleColumn(h.key)}
                              />
                              <Label
                                htmlFor={`col-${h.key}`}
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {h.label}
                              </Label>
                            </div>
                          )
                        })}
                      </div>

                      <div className="pt-4 border-t border-slate-200 mt-4 flex items-center gap-2">
                        <Input
                          value={newColumnPresetName}
                          onChange={(e) => setNewColumnPresetName(e.target.value)}
                          placeholder="Nome da visualização..."
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs whitespace-nowrap"
                          onClick={saveCurrentColumns}
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="saved" className="m-0 p-4 max-h-[60vh] overflow-y-auto">
                      <div className="space-y-2">
                        {savedColumns.map((sc) => (
                          <div
                            key={sc.id}
                            className="flex items-center justify-between p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-md text-sm transition-colors"
                          >
                            <span
                              className="font-medium text-slate-700 cursor-pointer flex-1"
                              onClick={() => applySavedColumns(sc)}
                            >
                              {sc.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSavedColumns(sc.id)}
                              className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Excluir visualização"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        {savedColumns.length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-6">
                            Nenhuma visualização salva ainda.
                            <br />
                            Configure as colunas e salve para acesso rápido.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

              <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1"></div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
                  Por página:
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                    <SelectItem value="5000">5000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
                <span>
                  Pág {page + 1} de {totalPages}
                </span>
                <span className="font-semibold text-slate-700 hidden sm:inline">
                  ({totalCount} regs)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage(0)}
                  disabled={page === 0 || loading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <Table
            wrapperClassName="transform scale-y-[-1] overflow-x-auto overflow-y-hidden"
            className="transform scale-y-[-1] w-full min-w-max"
          >
            <TableHeader>
              <TableRow disableZebra className="bg-slate-50 hover:bg-slate-50 border-b">
                <TableHead className="w-[40px] px-2 py-1 border-r text-center align-middle">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={data.length > 0 && data.every((d) => selectedIds.includes(d.id))}
                      onCheckedChange={toggleAllPage}
                      aria-label="Selecionar todos da página"
                    />
                  </div>
                </TableHead>
                {columnOrder
                  .filter((key) => visibleColumns[key] !== false)
                  .map((key) => {
                    const h = tableHeaders.find((th) => th.key === key)!
                    const activeFilterCount = filters[h.key]?.length || 0
                    const options = filterOptions[h.key] || []

                    return (
                      <TableHead
                        key={h.key}
                        draggable
                        onDragStart={(e) => {
                          setDraggedColumn(h.key)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (!draggedColumn || draggedColumn === h.key) return
                          const newOrder = [...columnOrder]
                          const draggedIdx = newOrder.indexOf(draggedColumn)
                          const targetIdx = newOrder.indexOf(h.key)
                          newOrder.splice(draggedIdx, 1)
                          newOrder.splice(targetIdx, 0, draggedColumn)
                          setColumnOrder(newOrder)
                          setDraggedColumn(null)
                        }}
                        onDragEnd={() => setDraggedColumn(null)}
                        className={cn(
                          'h-8 px-2 py-1 text-sm font-bold text-black whitespace-nowrap select-none transition-colors border-r last:border-r-0 cursor-grab active:cursor-grabbing',
                          h.className,
                          draggedColumn === h.key ? 'opacity-50 bg-slate-100' : '',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <div
                            className={cn(
                              'flex items-center cursor-pointer hover:bg-slate-200/50 rounded px-1 -ml-1 flex-1',
                              h.align === 'right'
                                ? 'justify-end'
                                : h.align === 'center'
                                  ? 'justify-center'
                                  : 'justify-start',
                            )}
                            onClick={() => handleSort(h.key)}
                          >
                            {h.label}
                            {renderSortIcon(h.key)}
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    'h-5 w-5 rounded-sm relative',
                                    activeFilterCount > 0
                                      ? 'text-primary bg-primary/10'
                                      : 'text-slate-400 hover:text-slate-600',
                                  )}
                                  title="Filtrar coluna"
                                >
                                  <Filter className="h-3 w-3" />
                                  {activeFilterCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground"></span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
                                  <CommandList className="max-h-[200px] overflow-y-auto">
                                    <CommandEmpty className="py-2 text-xs text-center text-slate-500">
                                      Nenhum encontrado.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {options.map((opt) => {
                                        const isSelected = filters[h.key]?.includes(opt.value)
                                        return (
                                          <CommandItem
                                            key={opt.value}
                                            onSelect={() => {
                                              const current = filters[h.key] || []
                                              const updated = isSelected
                                                ? current.filter((v) => v !== opt.value)
                                                : [...current, opt.value]
                                              setFilters((prev) => ({
                                                ...prev,
                                                [h.key]: updated,
                                              }))
                                              setPage(0)
                                            }}
                                            className="text-xs cursor-pointer"
                                          >
                                            <div
                                              className={cn(
                                                'mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'opacity-50 [&_svg]:invisible',
                                              )}
                                            >
                                              <Check className="h-2 w-2" />
                                            </div>
                                            <span>{opt.label}</span>
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-sm text-slate-400 hover:text-slate-600 relative ml-0.5"
                                  title="Opções de visualização"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => toggleColumn(h.key)}
                                  className="text-xs cursor-pointer"
                                >
                                  <EyeOff className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                  <span>Ocultar coluna</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="text-xs cursor-pointer">
                                    <Columns className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                    <span>Reexibir colunas</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-56 max-h-[300px] overflow-y-auto">
                                    {tableHeaders.map((col) => (
                                      <DropdownMenuCheckboxItem
                                        key={col.key}
                                        className="text-xs cursor-pointer"
                                        checked={visibleColumns[col.key] !== false}
                                        onCheckedChange={(checked) => {
                                          setVisibleColumns((prev) => ({
                                            ...prev,
                                            [col.key]: checked,
                                          }))
                                        }}
                                      >
                                        {col.label}
                                      </DropdownMenuCheckboxItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </TableHead>
                    )
                  })}
                <TableHead className="h-8 px-2 py-1 text-sm font-bold text-black whitespace-nowrap text-center border-r last:border-r-0">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow disableZebra>
                  <TableCell colSpan={visibleCount} className="text-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow disableZebra>
                  <TableCell colSpan={visibleCount} className="text-center h-48 text-slate-500">
                    Nenhum movimento financeiro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((row) => {
                    const missingFields = []
                    if (!row.data_emissao) missingFields.push('Data de Emissão')
                    if (!row.c_custo) missingFields.push('Centro de Custo')
                    if (row.valor_liquido === null || row.valor_liquido === undefined)
                      missingFields.push('Valor Líquido')
                    const isMissing = missingFields.length > 0

                    return (
                      <TableRow
                        disableZebra
                        key={row.id}
                        className="hover:bg-slate-50/80 transition-colors border-b"
                      >
                        <TableCell className="px-2 py-1.5 border-r text-center align-middle">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedIds.includes(row.id)}
                              onCheckedChange={() => toggleRow(row.id)}
                              aria-label="Selecionar registro"
                            />
                          </div>
                        </TableCell>
                        {columnOrder
                          .filter((key) => visibleColumns[key] !== false)
                          .map((key) => {
                            switch (key) {
                              case 'empresa':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-800 font-medium max-w-[150px] truncate border-r"
                                    title={row.organizations?.name}
                                  >
                                    {row.organizations?.name || '-'}
                                  </TableCell>
                                )
                              case 'compensado':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.compensado || '-'}
                                  </TableCell>
                                )
                              case 'tipo_operacao':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.tipo_operacao || '-'}
                                  </TableCell>
                                )
                              case 'data_emissao':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        type="date"
                                        className="h-6 text-xs px-1.5 w-32"
                                        value={editForm.data_emissao || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, data_emissao: e.target.value })
                                        }
                                      />
                                    ) : (
                                      <span
                                        className={
                                          !row.data_emissao ? 'text-red-500 font-bold' : ''
                                        }
                                      >
                                        {row.data_emissao
                                          ? formatDate(row.data_emissao)
                                          : 'Indisponível'}
                                      </span>
                                    )}
                                  </TableCell>
                                )
                              case 'dt_compens':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {formatDate(row.dt_compens)}
                                  </TableCell>
                                )
                              case 'conta_caixa':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs text-slate-600 text-center max-w-[150px] truncate border-r"
                                    title={row.conta_caixa || ''}
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5 w-28"
                                        value={editForm.conta_caixa || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, conta_caixa: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.conta_caixa || '-'
                                    )}
                                  </TableCell>
                                )
                              case 'nome_caixa':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 max-w-[150px] truncate border-r"
                                    title={row.nome_caixa}
                                  >
                                    {row.nome_caixa || '-'}
                                  </TableCell>
                                )
                              case 'conta_caixa_destino':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.conta_caixa_destino || '-'}
                                  </TableCell>
                                )
                              case 'forma_pagto':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5 w-24"
                                        value={editForm.forma_pagto || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, forma_pagto: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.forma_pagto || '-'
                                    )}
                                  </TableCell>
                                )
                              case 'c_custo':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5 w-24"
                                        value={editForm.c_custo || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, c_custo: e.target.value })
                                        }
                                      />
                                    ) : (
                                      <span
                                        className={!row.c_custo ? 'text-red-500 font-bold' : ''}
                                      >
                                        {row.c_custo || 'Sem C. Custo'}
                                      </span>
                                    )}
                                  </TableCell>
                                )
                              case 'descricao_c_custo':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 max-w-[150px] truncate border-r"
                                    title={row.descricao_c_custo}
                                  >
                                    {row.descricao_c_custo || '-'}
                                  </TableCell>
                                )
                              case 'valor':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-center text-slate-600 border-r"
                                  >
                                    {row.valor !== null
                                      ? new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(row.valor)
                                      : '-'}
                                  </TableCell>
                                )
                              case 'valor_liquido':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-center font-semibold text-slate-900 border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="h-6 text-xs px-1.5 w-28 text-center mx-auto"
                                        value={editForm.valor_liquido || ''}
                                        onChange={(e) =>
                                          setEditForm({
                                            ...editForm,
                                            valor_liquido: parseFloat(e.target.value),
                                          })
                                        }
                                      />
                                    ) : (
                                      <span
                                        className={
                                          row.valor_liquido === null ? 'text-red-500 font-bold' : ''
                                        }
                                      >
                                        {row.valor_liquido !== null
                                          ? new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                            }).format(row.valor_liquido)
                                          : 'R$ 0,00'}
                                      </span>
                                    )}
                                  </TableCell>
                                )
                              case 'n_documento':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap font-medium text-slate-700 border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5 w-28"
                                        value={editForm.n_documento || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, n_documento: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.n_documento || '-'
                                    )}
                                  </TableCell>
                                )
                              case 'nome_cli_fornec':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs text-slate-600 max-w-[200px] truncate border-r"
                                    title={row.nome_cli_fornec}
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5"
                                        value={editForm.nome_cli_fornec || ''}
                                        onChange={(e) =>
                                          setEditForm({
                                            ...editForm,
                                            nome_cli_fornec: e.target.value,
                                          })
                                        }
                                      />
                                    ) : (
                                      row.nome_cli_fornec || '-'
                                    )}
                                  </TableCell>
                                )
                              case 'historico':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs text-slate-600 max-w-[250px] truncate border-r"
                                    title={row.historico}
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5"
                                        value={editForm.historico || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, historico: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.historico || '-'
                                    )}
                                  </TableCell>
                                )
                              case 'fp':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.fp || '-'}
                                  </TableCell>
                                )
                              case 'n_cheque':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {row.n_cheque || '-'}
                                  </TableCell>
                                )
                              case 'data_vencto':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        type="date"
                                        className="h-6 text-xs px-1.5 w-32"
                                        value={editForm.data_vencto || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, data_vencto: e.target.value })
                                        }
                                      />
                                    ) : (
                                      <span>
                                        {row.data_vencto ? formatDate(row.data_vencto) : '-'}
                                      </span>
                                    )}
                                  </TableCell>
                                )
                              case 'nominal_a':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {row.nominal_a || '-'}
                                  </TableCell>
                                )
                              case 'emitente_cheque':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs text-slate-600 max-w-[150px] truncate border-r"
                                    title={row.emitente_cheque}
                                  >
                                    {row.emitente_cheque || '-'}
                                  </TableCell>
                                )
                              case 'cnpj_cpf':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {row.cnpj_cpf || '-'}
                                  </TableCell>
                                )
                              case 'n_extrato':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.n_extrato || '-'}
                                  </TableCell>
                                )
                              case 'filial':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.filial || '-'}
                                  </TableCell>
                                )
                              case 'data_canc':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {formatDate(row.data_canc)}
                                  </TableCell>
                                )
                              case 'data_estorno':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {formatDate(row.data_estorno)}
                                  </TableCell>
                                )
                              case 'banco':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {editingId === row.id ? (
                                      <Input
                                        className="h-6 text-xs px-1.5 w-24"
                                        value={editForm.banco || ''}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, banco: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.banco || '-'
                                    )}
                                  </TableCell>
                                )
                              case 'c_corrente':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {row.c_corrente || '-'}
                                  </TableCell>
                                )
                              case 'cod_cli_for':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r"
                                  >
                                    {row.cod_cli_for || '-'}
                                  </TableCell>
                                )
                              case 'departamento':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 text-center border-r"
                                  >
                                    {row.departamento || '-'}
                                  </TableCell>
                                )
                              case 'status':
                                return (
                                  <TableCell
                                    key={key}
                                    className="px-2 py-1.5 text-xs text-center border-r"
                                  >
                                    {isMissing ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200 cursor-help">
                                            Dados Incompletos
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-red-50 border-red-200 text-red-900 shadow-md">
                                          <p className="font-semibold mb-1">Campos ausentes:</p>
                                          <ul className="list-disc pl-4 text-xs">
                                            {missingFields.map((f) => (
                                              <li key={f}>{f}</li>
                                            ))}
                                          </ul>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 cursor-help">
                                            {row.status || 'Pendente'}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-800 text-white border-slate-700 shadow-md">
                                          <p className="text-xs max-w-[200px]">
                                            O registro foi importado com sucesso, mas ainda não foi
                                            conciliado ou exportado.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                )
                              default:
                                return null
                            }
                          })}
                        <TableCell className="px-2 py-1.5 text-xs text-center border-r last:border-r-0">
                          {editingId === row.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px] text-green-600 font-semibold hover:text-green-700"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('erp_financial_movements')
                                    .update(editForm)
                                    .eq('id', row.id)
                                  if (!error) {
                                    setEditingId(null)
                                    setRefreshKey((k) => k + 1)
                                  } else {
                                    toast.error('Erro ao salvar: ' + error.message)
                                  }
                                }}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700"
                                onClick={() => setEditingId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => {
                                setEditingId(row.id)
                                setEditForm(row)
                              }}
                            >
                              Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow
                    disableZebra
                    className="bg-slate-100 hover:bg-slate-100 font-bold border-t-2 border-slate-300 shadow-inner"
                  >
                    <TableCell className="border-r" />
                    {columnOrder
                      .filter((key) => visibleColumns[key] !== false)
                      .map((key, i) => {
                        if (key === 'valor') {
                          return (
                            <TableCell
                              key={key}
                              className="px-2 py-2 text-xs whitespace-nowrap text-center text-slate-800 border-r"
                            >
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(totals.valor)}
                            </TableCell>
                          )
                        }
                        if (key === 'valor_liquido') {
                          return (
                            <TableCell
                              key={key}
                              className="px-2 py-2 text-xs whitespace-nowrap text-center text-slate-900 border-r"
                            >
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(totals.valor_liquido)}
                            </TableCell>
                          )
                        }
                        const isFirstVisible = i === 0
                        return (
                          <TableCell
                            key={key}
                            className="px-2 py-2 text-xs whitespace-nowrap text-right text-slate-600 border-r"
                          >
                            {isFirstVisible ? 'TOTAIS (Filtro Atual):' : ''}
                          </TableCell>
                        )
                      })}
                    <TableCell className="border-r" />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t bg-slate-50/50 gap-4">
            <div className="text-xs text-slate-500">
              Mostrando {Math.min(page * pageSize + 1, totalCount)} a{' '}
              {Math.min((page + 1) * pageSize, totalCount)} de {totalCount} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                <ArrowLeft className="h-3 w-3 mr-1" /> Anterior
              </Button>
              <span className="text-xs font-medium text-slate-600 px-2 hidden sm:inline">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1 || loading}
              >
                Próxima <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ImportErpFinancialModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={() => {
          setPage(0)
          setRefreshKey((k) => k + 1)
          fetchActiveImport()
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={
          deleteMode === 'all' ? 'Excluir Todos os Registros' : 'Excluir Registros Selecionados'
        }
        description={
          deleteMode === 'all'
            ? 'Tem certeza que deseja excluir TODOS os registros de movimento financeiro da base? Esta ação enviará todos os dados para a lixeira.'
            : `Tem certeza que deseja excluir os ${selectedIds.length} registros selecionados?`
        }
      />
    </div>
  )
}
