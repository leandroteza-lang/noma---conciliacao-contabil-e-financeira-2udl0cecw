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
} from '@/components/ui/dropdown-menu'
import { ImportErpFinancialModal } from '@/components/ImportErpFinancialModal'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const tableHeaders = [
  { label: 'Compensado', key: 'compensado' },
  { label: 'Tipo Op.', key: 'tipo_operacao' },
  { label: 'Data Emissão', key: 'data_emissao' },
  { label: 'Dt Compens.', key: 'dt_compens' },
  { label: 'Conta/Caixa', key: 'conta_caixa' },
  { label: 'Nome Caixa', key: 'nome_caixa' },
  { label: 'Conta/Caixa Destino', key: 'conta_caixa_destino' },
  { label: 'Forma Pagto', key: 'forma_pagto' },
  { label: 'C.Custo', key: 'c_custo' },
  { label: 'Descrição C.Custo', key: 'descricao_c_custo', className: 'min-w-[150px]' },
  { label: 'Valor', key: 'valor', align: 'right' },
  { label: 'Valor Líquido', key: 'valor_liquido', align: 'right' },
  { label: 'Nº Documento', key: 'n_documento' },
  { label: 'Nome Cli/Fornec', key: 'nome_cli_fornec' },
  { label: 'Histórico', key: 'historico', className: 'min-w-[200px]' },
  { label: 'FP', key: 'fp' },
  { label: 'Nº Cheque', key: 'n_cheque' },
  { label: 'Data Vencto', key: 'data_vencto' },
  { label: 'Nominal a', key: 'nominal_a' },
  { label: 'Emitente Cheque', key: 'emitente_cheque' },
  { label: 'CNPJ/CPF', key: 'cnpj_cpf' },
  { label: 'Nº Extrato', key: 'n_extrato' },
  { label: 'Filial', key: 'filial' },
  { label: 'Data Canc.', key: 'data_canc' },
  { label: 'Data Estorno', key: 'data_estorno' },
  { label: 'Banco', key: 'banco' },
  { label: 'C.Corrente', key: 'c_corrente' },
  { label: 'Cód.Cli/For', key: 'cod_cli_for' },
  { label: 'Departamento', key: 'departamento' },
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

  const [selectedIds, setSelectedIds] = useState<string[]>([])
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
      const chunkSize = 150 // Reduzido para evitar URI Too Long (Bad Request)

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
      fetchData()
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
      await fetchData()
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
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  const fetchDataSilent = async () => {
    if (!user) return
    let query = supabase
      .from('erp_financial_movements')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order(sortColumn, { ascending: sortDirection === 'asc' })

    if (search) {
      query = query.or(
        `historico.ilike.%${search}%,nome_cli_fornec.ilike.%${search}%,c_custo.ilike.%${search}%`,
      )
    }

    const {
      data: result,
      count,
      error,
    } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (!error && result) {
      setData(result)
      setTotalCount(count || 0)
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
  ])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('erp_financial_movements')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order(sortColumn, { ascending: sortDirection === 'asc' })

    if (search) {
      query = query.or(
        `historico.ilike.%${search}%,nome_cli_fornec.ilike.%${search}%,c_custo.ilike.%${search}%`,
      )
    }

    const {
      data: result,
      count,
      error,
    } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (!error && result) {
      setData(result)
      setTotalCount(count || 0)
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
  }, [user, page, search, pageSize, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const visibleCount = tableHeaders.filter((h) => visibleColumns[h.key] !== false).length + 2
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex items-center gap-1.5 px-2"
                  >
                    <Columns className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Colunas</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[60vh] overflow-y-auto">
                  <DropdownMenuLabel>Visibilidade das Colunas</DropdownMenuLabel>
                  <div className="flex items-center justify-between px-2 pb-2 gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 px-2 text-[10px] flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        selectAllColumns()
                      }}
                    >
                      Todos
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 px-2 text-[10px] flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        selectNoColumns()
                      }}
                    >
                      Nenhum
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 px-2 text-[10px] flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        invertColumns()
                      }}
                    >
                      Inverter
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  {tableHeaders.map((h) => (
                    <DropdownMenuCheckboxItem
                      key={h.key}
                      checked={visibleColumns[h.key] !== false}
                      onCheckedChange={() => toggleColumn(h.key)}
                      className="text-xs cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      {h.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

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
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b">
                <TableHead className="w-[40px] px-2 py-1 border-r text-center align-middle">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={data.length > 0 && data.every((d) => selectedIds.includes(d.id))}
                      onCheckedChange={toggleAllPage}
                      aria-label="Selecionar todos da página"
                    />
                  </div>
                </TableHead>
                {tableHeaders
                  .filter((h) => visibleColumns[h.key] !== false)
                  .map((h) => (
                    <TableHead
                      key={h.key}
                      className={cn(
                        'h-8 px-2 py-1 text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-200/50 select-none transition-colors border-r last:border-r-0',
                        h.className,
                      )}
                      onClick={() => handleSort(h.key)}
                    >
                      <div
                        className={cn(
                          'flex items-center',
                          h.align === 'right'
                            ? 'justify-end'
                            : h.align === 'center'
                              ? 'justify-center'
                              : 'justify-start',
                        )}
                      >
                        {h.label}
                        {renderSortIcon(h.key)}
                      </div>
                    </TableHead>
                  ))}
                <TableHead className="h-8 px-2 py-1 text-xs font-semibold text-slate-600 whitespace-nowrap text-center border-r last:border-r-0">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleCount} className="text-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCount} className="text-center h-48 text-slate-500">
                    Nenhum movimento financeiro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => {
                  const missingFields = []
                  if (!row.data_emissao) missingFields.push('Data de Emissão')
                  if (!row.c_custo) missingFields.push('Centro de Custo')
                  if (row.valor_liquido === null || row.valor_liquido === undefined)
                    missingFields.push('Valor Líquido')
                  const isMissing = missingFields.length > 0

                  return (
                    <TableRow
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
                      {visibleColumns['compensado'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.compensado || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['tipo_operacao'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.tipo_operacao || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['data_emissao'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
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
                            <span className={!row.data_emissao ? 'text-red-500 font-bold' : ''}>
                              {row.data_emissao ? formatDate(row.data_emissao) : 'Indisponível'}
                            </span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns['dt_compens'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {formatDate(row.dt_compens)}
                        </TableCell>
                      )}
                      {visibleColumns['conta_caixa'] !== false && (
                        <TableCell
                          className="px-2 py-1.5 text-xs text-slate-600 max-w-[150px] truncate border-r"
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
                      )}
                      {visibleColumns['nome_caixa'] !== false && (
                        <TableCell
                          className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 max-w-[150px] truncate border-r"
                          title={row.nome_caixa}
                        >
                          {row.nome_caixa || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['conta_caixa_destino'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.conta_caixa_destino || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['forma_pagto'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
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
                      )}
                      {visibleColumns['c_custo'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {editingId === row.id ? (
                            <Input
                              className="h-6 text-xs px-1.5 w-24"
                              value={editForm.c_custo || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, c_custo: e.target.value })
                              }
                            />
                          ) : (
                            <span className={!row.c_custo ? 'text-red-500 font-bold' : ''}>
                              {row.c_custo || 'Sem C. Custo'}
                            </span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns['descricao_c_custo'] !== false && (
                        <TableCell
                          className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 max-w-[150px] truncate border-r"
                          title={row.descricao_c_custo}
                        >
                          {row.descricao_c_custo || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['valor'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-right text-slate-600 border-r">
                          {row.valor !== null
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(row.valor)
                            : '-'}
                        </TableCell>
                      )}
                      {visibleColumns['valor_liquido'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-right font-semibold text-slate-900 border-r">
                          {editingId === row.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="h-6 text-xs px-1.5 w-28 text-right ml-auto"
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
                              className={row.valor_liquido === null ? 'text-red-500 font-bold' : ''}
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
                      )}
                      {visibleColumns['n_documento'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap font-medium text-slate-700 border-r">
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
                      )}
                      {visibleColumns['nome_cli_fornec'] !== false && (
                        <TableCell
                          className="px-2 py-1.5 text-xs text-slate-600 max-w-[200px] truncate border-r"
                          title={row.nome_cli_fornec}
                        >
                          {editingId === row.id ? (
                            <Input
                              className="h-6 text-xs px-1.5"
                              value={editForm.nome_cli_fornec || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, nome_cli_fornec: e.target.value })
                              }
                            />
                          ) : (
                            row.nome_cli_fornec || '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns['historico'] !== false && (
                        <TableCell
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
                      )}
                      {visibleColumns['fp'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.fp || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['n_cheque'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.n_cheque || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['data_vencto'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
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
                            <span>{row.data_vencto ? formatDate(row.data_vencto) : '-'}</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns['nominal_a'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.nominal_a || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['emitente_cheque'] !== false && (
                        <TableCell
                          className="px-2 py-1.5 text-xs text-slate-600 max-w-[150px] truncate border-r"
                          title={row.emitente_cheque}
                        >
                          {row.emitente_cheque || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['cnpj_cpf'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.cnpj_cpf || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['n_extrato'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.n_extrato || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['filial'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.filial || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['data_canc'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {formatDate(row.data_canc)}
                        </TableCell>
                      )}
                      {visibleColumns['data_estorno'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {formatDate(row.data_estorno)}
                        </TableCell>
                      )}
                      {visibleColumns['banco'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {editingId === row.id ? (
                            <Input
                              className="h-6 text-xs px-1.5 w-24"
                              value={editForm.banco || ''}
                              onChange={(e) => setEditForm({ ...editForm, banco: e.target.value })}
                            />
                          ) : (
                            row.banco || '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns['c_corrente'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.c_corrente || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['cod_cli_for'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.cod_cli_for || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['departamento'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs whitespace-nowrap text-slate-600 border-r">
                          {row.departamento || '-'}
                        </TableCell>
                      )}
                      {visibleColumns['status'] !== false && (
                        <TableCell className="px-2 py-1.5 text-xs text-center border-r">
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
                                  O registro foi importado com sucesso, mas ainda não foi conciliado
                                  ou exportado.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
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
                                  setData(
                                    data.map((d) => (d.id === row.id ? { ...d, ...editForm } : d)),
                                  )
                                  setEditingId(null)
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
                })
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
