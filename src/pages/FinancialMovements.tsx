import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  ArrowRight as ArrowRightIcon,
  ChevronsUpDown,
  ChevronRight,
  ChevronDown,
  GripHorizontal,
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
import { Sankey, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

const formatMonthYear = (row: any, dateField: string = 'data_emissao') => {
  const dateStr = row?.[dateField]
  if (!dateStr || typeof dateStr !== 'string') return 'Sem Data'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length >= 3) return `${parts[1]}/${parts[0]}`
  return 'Sem Data'
}

function DraggablePopoverContent({
  children,
  className,
  title,
}: {
  children: React.ReactNode
  className?: string
  title: string
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(
    null,
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('.drag-handle')) {
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initX: pos.x,
        initY: pos.y,
      }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPos({
        x: dragRef.current.initX + dx,
        y: dragRef.current.initY + dy,
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      dragRef.current = null
    }
  }

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 shadow-xl rounded-md flex flex-col w-full h-full pointer-events-auto relative',
        className,
      )}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: dragRef.current ? 'none' : 'transform 0.1s ease-out',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="drag-handle bg-[#800000] hover:bg-[#800000]/90 cursor-move flex items-center justify-between px-4 py-2 border-b border-[#800000] rounded-t-md select-none touch-none active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-white/80" />
          <span className="font-bold text-xs text-white">{title}</span>
        </div>
        {(pos.x !== 0 || pos.y !== 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 text-white/80 hover:text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              setPos({ x: 0, y: 0 })
            }}
          >
            Resetar Posição
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}

function SummaryTable({
  data,
  type,
  dateField = 'data_emissao',
}: {
  data: any[]
  type: 'month_account' | 'account_month' | 'month_cost' | 'cost_month'
  dateField?: string
}) {
  let col1Label = ''
  let col2Label = ''
  let primaryKeyFn: (r: any) => string
  let secondaryKeyFn: (r: any) => string

  const formatAccount = (r: any) => {
    const code = r.conta_caixa || ''
    const name = r.nome_caixa || ''
    if (code && name) return `${code} - ${name}`
    return code || name || 'Sem Conta/Caixa'
  }

  const formatCostCenter = (r: any) => {
    const code = r.c_custo || ''
    const name = r.descricao_c_custo || ''
    if (code && name) return `${code} - ${name}`
    return code || name || 'Sem C. Custo'
  }

  switch (type) {
    case 'month_account':
      col1Label = 'Mês/Ano'
      col2Label = 'Caixa/Banco'
      primaryKeyFn = (r) => formatMonthYear(r, dateField)
      secondaryKeyFn = formatAccount
      break
    case 'account_month':
      col1Label = 'Caixa/Banco'
      col2Label = 'Mês/Ano'
      primaryKeyFn = formatAccount
      secondaryKeyFn = (r) => formatMonthYear(r, dateField)
      break
    case 'month_cost':
      col1Label = 'Mês/Ano'
      col2Label = 'Centro de Custo'
      primaryKeyFn = (r) => formatMonthYear(r, dateField)
      secondaryKeyFn = formatCostCenter
      break
    case 'cost_month':
      col1Label = 'Centro de Custo'
      col2Label = 'Mês/Ano'
      primaryKeyFn = formatCostCenter
      secondaryKeyFn = (r) => formatMonthYear(r, dateField)
      break
  }

  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      { name: string; pos: number; neg: number; diff: number; items: Map<string, any> }
    >()
    for (const row of data) {
      const pKey = primaryKeyFn(row)
      const sKey = secondaryKeyFn(row)
      const val = Number(row.valor_liquido || 0)

      if (!map.has(pKey)) {
        map.set(pKey, { name: pKey, pos: 0, neg: 0, diff: 0, items: new Map() })
      }
      const pGroup = map.get(pKey)!

      if (!pGroup.items.has(sKey)) {
        pGroup.items.set(sKey, { name: sKey, pos: 0, neg: 0, diff: 0 })
      }
      const sGroup = pGroup.items.get(sKey)!

      if (val > 0) {
        pGroup.pos += val
        sGroup.pos += val
      } else {
        pGroup.neg += val
        sGroup.neg += val
      }
      pGroup.diff += val
      sGroup.diff += val
    }

    const result = Array.from(map.values()).map((p) => ({
      ...p,
      items: Array.from(p.items.values()).sort((a, b) => {
        const aIsDate = /^\d{2}\/\d{4}$/.test(a.name)
        const bIsDate = /^\d{2}\/\d{4}$/.test(b.name)
        if (aIsDate && bIsDate) {
          const [am, ay] = a.name.split('/')
          const [bm, by] = b.name.split('/')
          if (ay !== by) return parseInt(ay) - parseInt(by)
          return parseInt(am) - parseInt(bm)
        }
        return a.name.localeCompare(b.name)
      }),
    }))

    result.sort((a, b) => {
      const aIsDate = /^\d{2}\/\d{4}$/.test(a.name)
      const bIsDate = /^\d{2}\/\d{4}$/.test(b.name)
      if (aIsDate && bIsDate) {
        const [am, ay] = a.name.split('/')
        const [bm, by] = b.name.split('/')
        if (ay !== by) return parseInt(ay) - parseInt(by)
        return parseInt(am) - parseInt(bm)
      }
      return a.name.localeCompare(b.name)
    })
    return result
  }, [data, primaryKeyFn, secondaryKeyFn])

  const formatVal = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Table
      className="w-full text-xs"
      wrapperClassName="max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <TableHeader className="sticky top-0 z-10 shadow-sm border-b border-black">
        <TableRow disableZebra className="bg-blue-500 hover:bg-blue-400 border-none">
          <TableHead className="w-[20%] font-medium text-white text-center border-r border-black px-2 py-1 h-8">
            {col1Label}
          </TableHead>
          <TableHead className="w-[35%] font-medium text-white text-center border-r border-black px-2 py-1 h-8">
            {col2Label}
          </TableHead>
          <TableHead className="w-[15%] text-center font-bold text-emerald-700 border-r border-black px-2 py-1 h-8">
            Entradas (+)
          </TableHead>
          <TableHead className="w-[15%] text-center font-bold text-rose-700 border-r border-black px-2 py-1 h-8">
            Saídas (-)
          </TableHead>
          <TableHead className="w-[15%] text-center font-bold text-blue-700 px-2 py-1 h-8">
            Diferença
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregated.map((group) => (
          <React.Fragment key={group.name}>
            <TableRow disableZebra className="bg-slate-200/60 font-bold border-b border-black">
              <TableCell className="px-2 py-1 border-r border-black text-slate-900">
                {group.name}
              </TableCell>
              <TableCell className="px-2 py-1 border-r border-black text-slate-500 font-medium">
                Totais do agrupamento
              </TableCell>
              <TableCell className="px-2 py-1 text-right text-emerald-700 border-r border-black">
                {formatVal(group.pos)}
              </TableCell>
              <TableCell className="px-2 py-1 text-right text-rose-700 border-r border-black">
                {formatVal(group.neg)}
              </TableCell>
              <TableCell className="px-2 py-1 text-right text-blue-800">
                {formatVal(group.diff)}
              </TableCell>
            </TableRow>
            {group.items.map((item) => (
              <TableRow
                disableZebra
                key={item.name}
                className="border-b border-black last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <TableCell className="px-2 py-1 border-r border-black text-slate-400"></TableCell>
                <TableCell className="px-2 py-1 border-r border-black text-slate-700 font-medium">
                  {item.name}
                </TableCell>
                <TableCell className="px-2 py-1 text-right text-emerald-600/90 border-r border-black">
                  {formatVal(item.pos)}
                </TableCell>
                <TableCell className="px-2 py-1 text-right text-rose-600/90 border-r border-black">
                  {formatVal(item.neg)}
                </TableCell>
                <TableCell className="px-2 py-1 text-right font-semibold text-slate-700">
                  {formatVal(item.diff)}
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
        {aggregated.length === 0 && (
          <TableRow disableZebra>
            <TableCell
              colSpan={5}
              className="text-center py-4 text-slate-500 border-t border-black"
            >
              Nenhum dado para resumir.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

const tableHeaders = [
  { label: 'Prontidão', key: 'prontidao', align: 'center' },
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
  { label: 'Status Importação', key: 'status', align: 'center' },
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
  const [summaryData, setSummaryData] = useState<any[]>([])
  const [summaryDateBase, setSummaryDateBase] = useState('data_emissao')

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [activeTab, setActiveTab] = useState('grade')

  const defaultFilterOrder = ['natureza', ...tableHeaders.map((h) => h.key)]
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('fin_mov_filter_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validKeys = new Set(defaultFilterOrder)
        const validParsed = parsed.filter((key: string) => validKeys.has(key))
        const missingKeys = defaultFilterOrder.filter((key) => !validParsed.includes(key))
        return [...validParsed, ...missingKeys]
      } catch (e) {
        return defaultFilterOrder
      }
    }
    return defaultFilterOrder
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_filter_order', JSON.stringify(filterOrder))
  }, [filterOrder])

  const [draggedFilter, setDraggedFilter] = useState<string | null>(null)

  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [mappingRow, setMappingRow] = useState<any | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const bridgeRef = useRef<HTMLDivElement>(null)
  const [bridgeLines, setBridgeLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; mapped: boolean }[]
  >([])

  const fetchAuxData = async () => {
    if (!user) return
    const [{ data: coa }, { data: cc }, { data: map }] = await Promise.all([
      supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, organization_id')
        .is('deleted_at', null),
      supabase
        .from('cost_centers')
        .select('id, code, description, organization_id')
        .is('deleted_at', null),
      supabase
        .from('account_mapping')
        .select('cost_center_id, chart_account_id, organization_id')
        .is('deleted_at', null)
        .neq('pending_deletion', true),
    ])
    if (coa) setChartOfAccounts(coa)
    if (cc) setCostCenters(cc)
    if (map) setMappings(map)
  }

  useEffect(() => {
    fetchAuxData()
  }, [user, refreshKey])

  const getMappedAccountForCC = (cCustoCode: string | null, orgId: string | null) => {
    if (!cCustoCode || !orgId) return null
    const cleanCode = cCustoCode.trim().toUpperCase()

    const matchingCcs = costCenters.filter(
      (c) => c.organization_id === orgId && (c.code || '').trim().toUpperCase() === cleanCode,
    )

    if (matchingCcs.length === 0) return null

    for (const cc of matchingCcs) {
      const mapping = mappings.find((m) => m.cost_center_id === cc.id)
      if (mapping) {
        return chartOfAccounts.find((coa) => coa.id === mapping.chart_account_id) || null
      }
    }

    return null
  }

  const getMappedAccount = (row: any) => {
    if (row.mapped_account_id) {
      return chartOfAccounts.find((coa) => coa.id === row.mapped_account_id) || null
    }
    return getMappedAccountForCC(row.c_custo, row.organization_id)
  }

  useEffect(() => {
    if (mappingRow) {
      const mapped = getMappedAccount(mappingRow)
      setSelectedAccountId(mapped?.id || '')
    }
  }, [mappingRow])

  const handleSaveMapping = async () => {
    if (!mappingRow || !selectedAccountId) return
    const orgId = mappingRow.organization_id
    const cCustoCode = mappingRow.c_custo

    const cleanCode = cCustoCode ? cCustoCode.trim().toUpperCase() : null

    const matchingCcs = costCenters.filter(
      (c) => c.organization_id === orgId && (c.code || '').trim().toUpperCase() === cleanCode,
    )

    let ccId = null
    let existingMap = null

    for (const cc of matchingCcs) {
      const map = mappings.find((m) => m.cost_center_id === cc.id)
      if (map) {
        ccId = cc.id
        existingMap = map
        break
      }
    }

    if (!ccId && matchingCcs.length > 0) {
      ccId = matchingCcs[0].id
    }

    if (!ccId && cCustoCode) {
      const newCcId = crypto.randomUUID()
      await supabase.from('cost_centers').insert({
        id: newCcId,
        organization_id: orgId,
        code: cCustoCode.trim(),
        description: cCustoCode.trim(),
      })
      ccId = newCcId
    }

    if (ccId) {
      if (existingMap) {
        await supabase
          .from('account_mapping')
          .update({
            chart_account_id: selectedAccountId,
            deleted_at: null,
            pending_deletion: false,
          })
          .eq('cost_center_id', ccId)
          .eq('organization_id', orgId)
      } else {
        await supabase.from('account_mapping').insert({
          organization_id: orgId,
          cost_center_id: ccId,
          chart_account_id: selectedAccountId,
          mapping_type: 'DE/PARA',
        })
      }
    }

    if (cCustoCode) {
      await supabase
        .from('erp_financial_movements')
        .update({ mapped_account_id: selectedAccountId })
        .eq('organization_id', orgId)
        .ilike('c_custo', cCustoCode.trim())
    } else {
      await supabase
        .from('erp_financial_movements')
        .update({ mapped_account_id: selectedAccountId })
        .eq('id', mappingRow.id)
    }

    toast.success('Mapeamento salvo com sucesso!')
    setMappingRow(null)
    setRefreshKey((k) => k + 1)
  }

  const [savedFilters, setSavedFilters] = useState<any[]>(() => {
    const saved = localStorage.getItem('fin_mov_saved_filters')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((f: any) => {
          const newFilt = f.filters || {}
          const migratedFilters: Record<string, string[]> = {}
          const mappingsMap: Record<string, string> = {
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
            const newKey = mappingsMap[k] || k
            migratedFilters[newKey] = Array.isArray(v) ? v : v && v !== 'all' ? [v] : []
          })
          return { ...f, filters: migratedFilters }
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
    Record<string, { label: string; value: string; isParent?: boolean; parent?: string }[]>
  >({})
  const [expandedDateGroups, setExpandedDateGroups] = useState<Record<string, boolean>>({})
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
      filterOrder: [...filterOrder],
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
    if (sf.filterOrder) {
      const validKeys = new Set(defaultFilterOrder)
      const validParsed = sf.filterOrder.filter((key: string) => validKeys.has(key))
      const missingKeys = defaultFilterOrder.filter((key) => !validParsed.includes(key))
      setFilterOrder([...validParsed, ...missingKeys])
    }
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

    const dateCols = ['data_emissao', 'dt_compens', 'data_vencto', 'data_canc', 'data_estorno']

    tableHeaders.forEach((h) => {
      if (h.key === 'empresa') return
      if (h.key === 'prontidao') {
        options['prontidao'] = [
          { label: 'Mapeado', value: 'Mapeado' },
          { label: 'Pendente', value: 'Pendente' },
          { label: 'Incompleto', value: 'Incompleto' },
        ]
        return
      }
      if (h.key === 'status') {
        options['status'] = [
          { label: 'Pendente', value: 'Pendente' },
          { label: 'Concluído', value: 'Concluído' },
          { label: 'Erro', value: 'Erro' },
        ]
        return
      }

      if (movs) {
        if (dateCols.includes(h.key)) {
          const uniqueDates = Array.from(
            new Set(
              movs
                .map((m) => {
                  const val = m[h.key]
                  if (!val) return null
                  return String(val).substring(0, 10)
                })
                .filter(Boolean),
            ),
          ).sort((a, b) => (b as string).localeCompare(a as string))

          const grouped: Record<string, string[]> = {}
          uniqueDates.forEach((d) => {
            const ym = (d as string).substring(0, 7)
            if (!grouped[ym]) grouped[ym] = []
            grouped[ym].push(d as string)
          })

          const dateOptions: {
            label: string
            value: string
            isParent?: boolean
            parent?: string
          }[] = []

          Object.keys(grouped)
            .sort((a, b) => b.localeCompare(a))
            .forEach((ym) => {
              const [y, m] = ym.split('-')
              dateOptions.push({ label: `${m}/${y}`, value: ym, isParent: true })
              grouped[ym].forEach((d) => {
                const [dy, dm, dd] = d.split('-')
                dateOptions.push({ label: `${dd}/${dm}/${dy}`, value: d, parent: ym })
              })
            })

          options[h.key] = dateOptions
        } else {
          const uniqueVals = Array.from(
            new Set(
              movs.map((m) => m[h.key]).filter((v) => v !== null && v !== undefined && v !== ''),
            ),
          ).sort()
          options[h.key] = uniqueVals.map((v) => {
            let label = String(v)
            if (['valor', 'valor_liquido'].includes(h.key)) {
              label = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                Number(v),
              )
            }
            return { label, value: String(v) }
          })
        }
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

  const toggleColumn = (key: string) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  const selectAllColumns = () =>
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: true }), {}))
  const selectNoColumns = () =>
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: false }), {}))
  const invertColumns = () =>
    setVisibleColumns((prev) =>
      tableHeaders.reduce(
        (acc, h) => ({ ...acc, [h.key]: prev[h.key] === false ? true : false }),
        {},
      ),
    )

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

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleAllPage = () => {
    const pageIds = data.map((d) => d.id)
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
    if (allSelected) setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    else setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
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
      toast.error('Erro ao excluir: ' + error.message)
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setDeleteMode(null)
    }
  }

  const handleSort = (key: string) => {
    if (sortColumn === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else {
      setSortColumn(key)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const renderSortIcon = (key: string) => {
    if (sortColumn !== key) return <ArrowUpDown className="h-3 w-3 ml-1 text-indigo-300" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-white" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-white" />
    )
  }

  const dismissImport = () => {
    if (activeImport) localStorage.setItem('dismissed_import_erp_fin', activeImport.id)
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
      if (dismissedId === data.id && (data.status === 'Completed' || data.status === 'Error'))
        return
      setActiveImport(data)
      if (data.status === 'Completed' || data.status === 'Error') {
        const saved = localStorage.getItem('last_import_time_erp_fin')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed.id === data.id) setElapsedSeconds(parsed.elapsed)
          } catch {
            /* ignored */
          }
        }
      }
    }
  }

  const applyQueryFilters = (query: any) => {
    let q = query
    if (search)
      q = q.or(
        `historico.ilike.%${search}%,nome_cli_fornec.ilike.%${search}%,c_custo.ilike.%${search}%`,
      )

    const dateCols = ['data_emissao', 'dt_compens', 'data_vencto', 'data_canc', 'data_estorno']

    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        if (key === 'natureza') {
          const orParts: string[] = []
          if (values.includes('positivo')) {
            orParts.push('valor.gt.0', 'valor_liquido.gt.0')
          }
          if (values.includes('negativo')) {
            orParts.push('valor.lt.0', 'valor_liquido.lt.0')
          }
          if (orParts.length > 0) {
            q = q.or(orParts.join(','))
          }
        } else if (key === 'empresa') {
          q = q.in('organization_id', values)
        } else if (key === 'prontidao') {
          const hasIncompleto = values.includes('Incompleto')
          const hasMapeado = values.includes('Mapeado')
          const hasPendente = values.includes('Pendente')

          const allMappedCodes = Array.from(
            new Set(
              costCenters
                .filter((cc) => mappings.some((m) => m.cost_center_id === cc.id))
                .map((cc) => cc.code?.trim())
                .filter(Boolean),
            ),
          )
          const inList =
            allMappedCodes.length > 0
              ? `(${allMappedCodes.map((c) => `"${c?.replace(/"/g, '""')}"`).join(',')})`
              : '("@@NONE@@")'

          const orParts: string[] = []

          if (hasIncompleto) {
            orParts.push('data_emissao.is.null', 'c_custo.is.null', 'valor_liquido.is.null')
          }
          if (hasMapeado) {
            orParts.push('mapped_account_id.not.is.null', `c_custo.in.${inList}`)
          }
          if (hasPendente) {
            orParts.push(
              `and(mapped_account_id.is.null,c_custo.not.in.${inList},data_emissao.not.is.null,c_custo.not.is.null,valor_liquido.not.is.null)`,
            )
          }

          if (orParts.length > 0) {
            q = q.or(orParts.join(','))
          }
        } else if (dateCols.includes(key)) {
          const orParts = values.map((val) => {
            if (val.length === 7) {
              const [y, m] = val.split('-')
              const startDate = `${val}-01`
              const lastDay = new Date(Date.UTC(parseInt(y), parseInt(m), 0)).getUTCDate()
              const endDate = `${val}-${String(lastDay).padStart(2, '0')}`
              return `and(${key}.gte.${startDate},${key}.lte.${endDate})`
            } else {
              return `${key}.eq.${val}`
            }
          })
          q = q.or(orParts.join(','))
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
    if (sortColumn === 'prontidao') orderCol = 'data_emissao'

    let query = supabase
      .from('erp_financial_movements')
      .select('*, organizations(name)', { count: 'exact' })
      .is('deleted_at', null)
      .order(orderCol, { ascending: sortDirection === 'asc' })
    query = applyQueryFilters(query)

    let totalsQuery = supabase
      .from('erp_financial_movements')
      .select(
        'valor, valor_liquido, data_emissao, dt_compens, conta_caixa, nome_caixa, c_custo, descricao_c_custo, organization_id, mapped_account_id',
      )
      .is('deleted_at', null)
      .limit(100000)
    totalsQuery = applyQueryFilters(totalsQuery)

    const [{ data: result, count, error }, { data: totalsData }] = await Promise.all([
      query.range(page * pageSize, (page + 1) * pageSize - 1),
      totalsQuery,
    ])

    if (!error && result) {
      let finalData = result

      if (filters['prontidao'] && filters['prontidao'].length > 0) {
        finalData = finalData.filter((row) => {
          const missing =
            !row.data_emissao ||
            !row.c_custo ||
            row.valor_liquido === null ||
            row.valor_liquido === undefined
          let statusText = 'Pendente'
          if (missing) statusText = 'Incompleto'
          else if (getMappedAccount(row)) statusText = 'Mapeado'
          return filters['prontidao'].includes(statusText)
        })
      }

      if (sortColumn === 'prontidao') {
        finalData.sort((a, b) => {
          const getStatus = (row: any) => {
            const missing =
              !row.data_emissao ||
              !row.c_custo ||
              row.valor_liquido === null ||
              row.valor_liquido === undefined
            if (missing) return 2
            if (getMappedAccount(row)) return 0
            return 1
          }
          const statA = getStatus(a)
          const statB = getStatus(b)
          if (statA < statB) return sortDirection === 'asc' ? -1 : 1
          if (statA > statB) return sortDirection === 'asc' ? 1 : -1
          return 0
        })
      }

      setData(finalData)
      setTotalCount(count || 0)
    }

    if (totalsData) {
      let finalTotalsData = totalsData
      if (filters['prontidao'] && filters['prontidao'].length > 0) {
        finalTotalsData = finalTotalsData.filter((row) => {
          const missing =
            !row.data_emissao ||
            !row.c_custo ||
            row.valor_liquido === null ||
            row.valor_liquido === undefined
          let statusText = 'Pendente'
          if (missing) statusText = 'Incompleto'
          else if (getMappedAccount(row)) statusText = 'Mapeado'
          return filters['prontidao'].includes(statusText)
        })
      }
      setSummaryData(finalTotalsData)

      const sumV = finalTotalsData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
      const sumVL = finalTotalsData.reduce(
        (acc, curr) => acc + (Number(curr.valor_liquido) || 0),
        0,
      )
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
    if (sortColumn === 'prontidao') orderCol = 'data_emissao'

    let query = supabase
      .from('erp_financial_movements')
      .select('*, organizations(name)', { count: 'exact' })
      .is('deleted_at', null)
      .order(orderCol, { ascending: sortDirection === 'asc' })
    query = applyQueryFilters(query)

    let totalsQuery = supabase
      .from('erp_financial_movements')
      .select(
        'valor, valor_liquido, data_emissao, dt_compens, conta_caixa, nome_caixa, c_custo, descricao_c_custo, organization_id, mapped_account_id',
      )
      .is('deleted_at', null)
      .limit(100000)
    totalsQuery = applyQueryFilters(totalsQuery)

    const [{ data: result, count, error }, { data: totalsData }] = await Promise.all([
      query.range(page * pageSize, (page + 1) * pageSize - 1),
      totalsQuery,
    ])

    if (!error && result) {
      let finalData = result

      if (filters['prontidao'] && filters['prontidao'].length > 0) {
        finalData = finalData.filter((row) => {
          const missing =
            !row.data_emissao ||
            !row.c_custo ||
            row.valor_liquido === null ||
            row.valor_liquido === undefined
          let statusText = 'Pendente'
          if (missing) statusText = 'Incompleto'
          else if (getMappedAccount(row)) statusText = 'Mapeado'
          return filters['prontidao'].includes(statusText)
        })
      }

      if (sortColumn === 'prontidao') {
        finalData.sort((a, b) => {
          const getStatus = (row: any) => {
            const missing =
              !row.data_emissao ||
              !row.c_custo ||
              row.valor_liquido === null ||
              row.valor_liquido === undefined
            if (missing) return 2
            if (getMappedAccount(row)) return 0
            return 1
          }
          const statA = getStatus(a)
          const statB = getStatus(b)
          if (statA < statB) return sortDirection === 'asc' ? -1 : 1
          if (statA > statB) return sortDirection === 'asc' ? 1 : -1
          return 0
        })
      }

      setData(finalData)
      setTotalCount(count || 0)
    }

    if (totalsData) {
      let finalTotalsData = totalsData
      if (filters['prontidao'] && filters['prontidao'].length > 0) {
        finalTotalsData = finalTotalsData.filter((row) => {
          const missing =
            !row.data_emissao ||
            !row.c_custo ||
            row.valor_liquido === null ||
            row.valor_liquido === undefined
          let statusText = 'Pendente'
          if (missing) statusText = 'Incompleto'
          else if (getMappedAccount(row)) statusText = 'Mapeado'
          return filters['prontidao'].includes(statusText)
        })
      }
      setSummaryData(finalTotalsData)

      const sumV = finalTotalsData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
      const sumVL = finalTotalsData.reduce(
        (acc, curr) => acc + (Number(curr.valor_liquido) || 0),
        0,
      )
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

  useEffect(() => {
    if (activeTab !== 'bridge') return
    const updateLines = () => {
      if (!bridgeRef.current) return
      const containerRect = bridgeRef.current.getBoundingClientRect()
      const newLines: any[] = []

      const ccs = Array.from(new Set(data.map((d) => d.c_custo || 'SEM_CC')))

      ccs.forEach((cc) => {
        const el1 = document.getElementById(`bridge-cc-${cc}`)
        if (!el1) return
        const rect1 = el1.getBoundingClientRect()
        const startX = rect1.right - containerRect.left
        const startY = rect1.top + rect1.height / 2 - containerRect.top

        const rowForCc = data.find((d) => (d.c_custo || 'SEM_CC') === cc)
        const mappedAcct = getMappedAccountForCC(
          cc === 'SEM_CC' ? null : cc,
          rowForCc?.organization_id || null,
        )
        if (mappedAcct) {
          const el2 = document.getElementById(`bridge-coa-${mappedAcct.id}`)
          if (el2) {
            const rect2 = el2.getBoundingClientRect()
            newLines.push({
              x1: startX,
              y1: startY,
              x2: rect2.left - containerRect.left,
              y2: rect2.top + rect2.height / 2 - containerRect.top,
              mapped: true,
            })
          }
        } else {
          newLines.push({
            x1: startX,
            y1: startY,
            x2: startX + 60,
            y2: startY,
            mapped: false,
          })
        }
      })
      setBridgeLines(newLines)
    }

    const timeout = setTimeout(updateLines, 300)
    window.addEventListener('resize', updateLines)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', updateLines)
    }
  }, [data, mappings, activeTab])

  const drawPath = (x1: number, y1: number, x2: number, y2: number) => {
    const curve = Math.abs(x2 - x1) * 0.4
    return `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`
  }

  const getSankeyData = () => {
    const nodesMap = new Map()
    const linksMap = new Map()

    data.forEach((row) => {
      const ccName = row.c_custo || 'Sem C.Custo'
      const mapped = getMappedAccount(row)
      const coaName = mapped
        ? `${mapped.account_code} - ${mapped.account_name}`
        : 'Não Mapeado (Pendente)'

      if (!nodesMap.has(ccName)) nodesMap.set(ccName, nodesMap.size)
      if (!nodesMap.has(coaName)) nodesMap.set(coaName, nodesMap.size)

      const source = nodesMap.get(ccName)
      const target = nodesMap.get(coaName)
      const key = `${source}-${target}`

      const val = Number(row.valor_liquido || row.valor || 0)
      if (val > 0) {
        if (!linksMap.has(key)) linksMap.set(key, { source, target, value: 0 })
        linksMap.get(key).value += val
      }
    })

    const nodes = Array.from(nodesMap.entries()).map(([name]) => ({ name }))
    const links = Array.from(linksMap.values())

    return nodes.length > 0 && links.length > 0 ? { nodes, links } : null
  }
  const sankeyData = getSankeyData()

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 w-full sm:w-auto flex overflow-x-auto justify-start border border-slate-200">
          <TabsTrigger value="grade" className="whitespace-nowrap">
            Grade de Movimentos
          </TabsTrigger>
          <TabsTrigger value="resumo" className="whitespace-nowrap">
            Resumo Consolidado
          </TabsTrigger>
          <TabsTrigger value="bridge" className="whitespace-nowrap">
            Accounting Bridge
          </TabsTrigger>
          <TabsTrigger value="sankey" className="whitespace-nowrap">
            Análise Sankey
          </TabsTrigger>
          <TabsTrigger value="dry-run" className="whitespace-nowrap">
            Dry Run TXT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grade" className="m-0">
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
                  <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
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
                    <PopoverContent
                      align="end"
                      className="w-[calc(100vw-2rem)] sm:w-[600px] md:w-[800px] lg:w-[1000px] p-0 bg-transparent border-none shadow-none"
                    >
                      <DraggablePopoverContent title="Filtros">
                        <Tabs defaultValue="filters" className="w-full">
                          <div className="px-4 pt-4 pb-2 border-b">
                            <TabsList className="w-full grid grid-cols-2 bg-slate-100 p-1">
                              <TabsTrigger
                                value="filters"
                                className="bg-[#800000] text-white font-bold hover:bg-[#800000]/90 data-[state=active]:bg-[#600000] data-[state=active]:text-white data-[state=inactive]:bg-[#800000] data-[state=inactive]:text-white transition-colors"
                              >
                                Filtros
                              </TabsTrigger>
                              <TabsTrigger
                                value="saved"
                                className="bg-[#800000] text-white font-bold hover:bg-[#800000]/90 data-[state=active]:bg-[#600000] data-[state=active]:text-white data-[state=inactive]:bg-[#800000] data-[state=inactive]:text-white transition-colors"
                              >
                                Salvos
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          <TabsContent
                            value="filters"
                            className="m-0 p-4 max-h-[70vh] overflow-y-auto flex flex-col gap-4"
                          >
                            <div className="flex items-center justify-between">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {filterOrder.map((key) => {
                                if (key === 'natureza') {
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        'space-y-1.5 p-1.5 -m-1.5 border border-transparent hover:border-slate-200 rounded-md cursor-grab active:cursor-grabbing transition-colors',
                                        draggedFilter === key ? 'opacity-50 bg-slate-100' : '',
                                      )}
                                      draggable
                                      onDragStart={(e) => {
                                        setDraggedFilter(key)
                                        e.dataTransfer.effectAllowed = 'move'
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = 'move'
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault()
                                        if (!draggedFilter || draggedFilter === key) return
                                        const newOrder = [...filterOrder]
                                        const draggedIdx = newOrder.indexOf(draggedFilter)
                                        const targetIdx = newOrder.indexOf(key)
                                        newOrder.splice(draggedIdx, 1)
                                        newOrder.splice(targetIdx, 0, draggedFilter)
                                        setFilterOrder(newOrder)
                                        setDraggedFilter(null)
                                      }}
                                      onDragEnd={() => setDraggedFilter(null)}
                                    >
                                      <Label className="text-xs flex items-center gap-1.5 text-slate-700 font-semibold">
                                        <GripHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                        Natureza
                                      </Label>
                                      <MultiSelect
                                        title="Ambas"
                                        options={[
                                          { label: 'Entradas (+)', value: 'positivo' },
                                          { label: 'Saídas (-)', value: 'negativo' },
                                        ]}
                                        selected={filters['natureza'] || []}
                                        onChange={(v) => {
                                          setFilters((p) => ({ ...p, natureza: v }))
                                          setPage(0)
                                        }}
                                      />
                                    </div>
                                  )
                                }

                                const h = tableHeaders.find((th) => th.key === key)
                                if (!h) return null

                                return (
                                  <div
                                    key={h.key}
                                    className={cn(
                                      'space-y-1.5 p-1.5 -m-1.5 border border-transparent hover:border-slate-200 rounded-md cursor-grab active:cursor-grabbing transition-colors',
                                      draggedFilter === h.key ? 'opacity-50 bg-slate-100' : '',
                                    )}
                                    draggable
                                    onDragStart={(e) => {
                                      setDraggedFilter(h.key)
                                      e.dataTransfer.effectAllowed = 'move'
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      e.dataTransfer.dropEffect = 'move'
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault()
                                      if (!draggedFilter || draggedFilter === h.key) return
                                      const newOrder = [...filterOrder]
                                      const draggedIdx = newOrder.indexOf(draggedFilter)
                                      const targetIdx = newOrder.indexOf(h.key)
                                      newOrder.splice(draggedIdx, 1)
                                      newOrder.splice(targetIdx, 0, draggedFilter)
                                      setFilterOrder(newOrder)
                                      setDraggedFilter(null)
                                    }}
                                    onDragEnd={() => setDraggedFilter(null)}
                                  >
                                    <Label
                                      className="text-xs truncate flex items-center gap-1.5 text-slate-700 font-semibold"
                                      title={h.label}
                                    >
                                      <GripHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                      {h.label}
                                    </Label>
                                    <MultiSelect
                                      title="Todos"
                                      options={filterOptions[h.key] || []}
                                      selected={filters[h.key] || []}
                                      onChange={(v) => {
                                        setFilters((p) => ({ ...p, [h.key]: v }))
                                        setPage(0)
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
                              <Input
                                value={newFilterName}
                                onChange={(e) => setNewFilterName(e.target.value)}
                                placeholder="Nome para salvar filtro..."
                                className="h-8 text-xs flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap"
                                onClick={() => setFiltersOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap bg-[#800000] hover:bg-[#800000]/90 text-white"
                                onClick={saveCurrentFilter}
                              >
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Salvar
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent
                            value="saved"
                            className="m-0 p-4 max-h-[60vh] overflow-y-auto"
                          >
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
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DraggablePopoverContent>
                    </PopoverContent>
                  </Popover>

                  <Popover open={columnsOpen} onOpenChange={setColumnsOpen}>
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
                    <PopoverContent
                      align="end"
                      className="w-[calc(100vw-2rem)] sm:w-[500px] md:w-[700px] lg:w-[800px] p-0 bg-transparent border-none shadow-none"
                    >
                      <DraggablePopoverContent title="Configuração de Colunas">
                        <Tabs defaultValue="columns" className="w-full">
                          <div className="px-4 pt-4 pb-2 border-b">
                            <TabsList className="w-full grid grid-cols-2 bg-slate-100 p-1">
                              <TabsTrigger
                                value="columns"
                                className="bg-[#800000] text-white font-bold hover:bg-[#800000]/90 data-[state=active]:bg-[#600000] data-[state=active]:text-white data-[state=inactive]:bg-[#800000] data-[state=inactive]:text-white transition-colors"
                              >
                                Colunas
                              </TabsTrigger>
                              <TabsTrigger
                                value="saved"
                                className="bg-[#800000] text-white font-bold hover:bg-[#800000]/90 data-[state=active]:bg-[#600000] data-[state=active]:text-white data-[state=inactive]:bg-[#800000] data-[state=inactive]:text-white transition-colors"
                              >
                                Salvas
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          <TabsContent value="columns" className="m-0 p-4 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm">Gerenciar Colunas</h4>
                              <div className="flex flex-wrap items-center gap-1">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={selectAllColumns}
                                >
                                  Todos
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={selectNoColumns}
                                >
                                  Nenhum
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={invertColumns}
                                >
                                  Inverter
                                </Button>
                                {(hiddenColumnsCount > 0 ||
                                  JSON.stringify(columnOrder) !==
                                    JSON.stringify(defaultColumnOrder)) && (
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
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto pr-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5">
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
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
                              <Input
                                value={newColumnPresetName}
                                onChange={(e) => setNewColumnPresetName(e.target.value)}
                                placeholder="Nome da visualização..."
                                className="h-8 text-xs flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap"
                                onClick={() => setColumnsOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap bg-[#800000] hover:bg-[#800000]/90 text-white"
                                onClick={saveCurrentColumns}
                              >
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Salvar
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent
                            value="saved"
                            className="m-0 p-4 max-h-[60vh] overflow-y-auto"
                          >
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
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                              {savedColumns.length === 0 && (
                                <div className="text-xs text-slate-500 text-center py-6">
                                  Nenhuma visualização salva ainda.
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DraggablePopoverContent>
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
                wrapperClassName="transform scale-y-[-1] overflow-x-auto overflow-y-hidden finance-table-scrollbar pb-3 border-4 border-indigo-950"
                className="transform scale-y-[-1] w-full min-w-max"
              >
                <TableHeader>
                  <TableRow
                    disableZebra
                    className="bg-indigo-950 text-white font-bold hover:bg-indigo-900 border-none [&>th]:border-none [&>th]:text-white"
                  >
                    <TableHead className="w-[40px] px-2 py-1 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={data.length > 0 && data.every((d) => selectedIds.includes(d.id))}
                          onCheckedChange={toggleAllPage}
                          aria-label="Selecionar todos da página"
                          className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950"
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
                              'h-8 px-2 py-1 text-sm font-bold whitespace-nowrap select-none transition-colors cursor-grab active:cursor-grabbing',
                              h.className,
                              draggedColumn === h.key ? 'opacity-50 bg-indigo-900' : '',
                            )}
                          >
                            <div className="flex items-center justify-between gap-1 w-full">
                              <div
                                className={cn(
                                  'flex items-center cursor-pointer hover:bg-indigo-800/50 rounded px-1 -ml-1 flex-1',
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
                                          ? 'text-white bg-primary/40'
                                          : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50',
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
                                      <CommandInput
                                        placeholder="Buscar..."
                                        className="h-8 text-xs"
                                      />
                                      <CommandList className="max-h-[200px] overflow-y-auto">
                                        <CommandEmpty className="py-2 text-xs text-center text-slate-500">
                                          Nenhum encontrado.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {options.map((opt) => {
                                            if (
                                              opt.parent &&
                                              !expandedDateGroups[`${h.key}-${opt.parent}`]
                                            ) {
                                              return null
                                            }

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
                                                className={cn(
                                                  'text-xs cursor-pointer',
                                                  opt.parent ? 'pl-6' : '',
                                                )}
                                              >
                                                {opt.isParent && (
                                                  <div
                                                    className="mr-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm hover:bg-slate-200"
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      e.preventDefault()
                                                      setExpandedDateGroups((prev) => ({
                                                        ...prev,
                                                        [`${h.key}-${opt.value}`]:
                                                          !prev[`${h.key}-${opt.value}`],
                                                      }))
                                                    }}
                                                  >
                                                    {expandedDateGroups[`${h.key}-${opt.value}`] ? (
                                                      <ChevronDown className="h-3 w-3" />
                                                    ) : (
                                                      <ChevronRight className="h-3 w-3" />
                                                    )}
                                                  </div>
                                                )}
                                                {!opt.isParent && opt.parent && (
                                                  <div className="w-4 mr-1 flex-shrink-0"></div>
                                                )}
                                                <div
                                                  className={cn(
                                                    'mr-2 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-sm border border-primary',
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
                                      className="h-5 w-5 rounded-sm text-indigo-200 hover:text-white hover:bg-indigo-800/50 relative ml-0.5"
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
                    <TableHead className="h-8 px-2 py-1 text-sm font-bold whitespace-nowrap text-center">
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
                      {data.map((row, index) => {
                        const missingFields = []
                        if (!row.data_emissao) missingFields.push('Data de Emissão')
                        if (!row.c_custo) missingFields.push('Centro de Custo')
                        if (row.valor_liquido === null || row.valor_liquido === undefined)
                          missingFields.push('Valor Líquido')

                        const isBlueRow = index % 2 === 1

                        return (
                          <TableRow
                            disableZebra
                            key={row.id}
                            className={cn(
                              'transition-colors',
                              isBlueRow
                                ? 'bg-blue-800 text-white font-semibold hover:bg-blue-700 border-b border-black'
                                : 'bg-white text-black font-bold hover:bg-slate-50 border-b border-black',
                            )}
                          >
                            <TableCell className="px-2 py-0.5 border-r border-black text-center align-middle">
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={selectedIds.includes(row.id)}
                                  onCheckedChange={() => toggleRow(row.id)}
                                  aria-label="Selecionar registro"
                                  className={
                                    isBlueRow
                                      ? 'border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-800'
                                      : ''
                                  }
                                />
                              </div>
                            </TableCell>
                            {columnOrder
                              .filter((key) => visibleColumns[key] !== false)
                              .map((key) => {
                                switch (key) {
                                  case 'prontidao': {
                                    const mapped = getMappedAccount(row)
                                    const isMissingData = missingFields.length > 0
                                    let statusColor = 'bg-amber-100 text-amber-800 border-amber-200'
                                    let statusText = 'Parcial'

                                    if (isMissingData) {
                                      statusColor = 'bg-red-100 text-red-800 border-red-200'
                                      statusText = 'Incompleto'
                                    } else if (mapped) {
                                      statusColor =
                                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      statusText = 'Mapeado'
                                    } else {
                                      statusColor =
                                        'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 hover:text-rose-900 shadow-sm'
                                      statusText = 'Pendente'
                                    }

                                    return (
                                      <TableCell
                                        key={key}
                                        className="px-2 py-0.5 text-xs text-center border-r border-black"
                                      >
                                        <Button
                                          variant="ghost"
                                          className={cn(
                                            'h-6 px-2.5 py-0 text-[10px] font-bold rounded-full border cursor-pointer transition-all',
                                            statusColor,
                                          )}
                                          onClick={() => setMappingRow(row)}
                                        >
                                          {statusText}
                                        </Button>
                                      </TableCell>
                                    )
                                  }
                                  case 'empresa':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap max-w-[150px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.organizations?.name}
                                      >
                                        {row.organizations?.name || '-'}
                                      </TableCell>
                                    )
                                  case 'compensado':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.compensado || '-'}
                                      </TableCell>
                                    )
                                  case 'tipo_operacao':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.tipo_operacao || '-'}
                                      </TableCell>
                                    )
                                  case 'data_emissao':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            type="date"
                                            className="h-6 text-xs px-1.5 w-32 !text-slate-900"
                                            value={editForm.data_emissao || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                data_emissao: e.target.value,
                                              })
                                            }
                                          />
                                        ) : (
                                          <span
                                            className={
                                              !row.data_emissao
                                                ? isBlueRow
                                                  ? 'text-white font-bold'
                                                  : 'text-black font-bold'
                                                : ''
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {formatDate(row.dt_compens)}
                                      </TableCell>
                                    )
                                  case 'conta_caixa':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs text-center max-w-[150px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.conta_caixa || ''}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 w-28 !text-slate-900"
                                            value={editForm.conta_caixa || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                conta_caixa: e.target.value,
                                              })
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap max-w-[150px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.nome_caixa}
                                      >
                                        {row.nome_caixa || '-'}
                                      </TableCell>
                                    )
                                  case 'conta_caixa_destino':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.conta_caixa_destino || '-'}
                                      </TableCell>
                                    )
                                  case 'forma_pagto':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 w-24 !text-slate-900"
                                            value={editForm.forma_pagto || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                forma_pagto: e.target.value,
                                              })
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 w-24 !text-slate-900"
                                            value={editForm.c_custo || ''}
                                            onChange={(e) =>
                                              setEditForm({ ...editForm, c_custo: e.target.value })
                                            }
                                          />
                                        ) : (
                                          <span
                                            className={
                                              !row.c_custo
                                                ? isBlueRow
                                                  ? 'text-white font-bold'
                                                  : 'text-black font-bold'
                                                : ''
                                            }
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap max-w-[150px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.descricao_c_custo}
                                      >
                                        {row.descricao_c_custo || '-'}
                                      </TableCell>
                                    )
                                  case 'valor':
                                    return (
                                      <TableCell
                                        key={key}
                                        className="px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black"
                                      >
                                        {row.valor !== null ? (
                                          <span
                                            className={cn(
                                              'font-medium',
                                              isBlueRow ? 'text-white' : 'text-black font-bold',
                                            )}
                                          >
                                            {new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                            }).format(row.valor)}
                                          </span>
                                        ) : (
                                          <span
                                            className={
                                              isBlueRow ? 'text-white' : 'text-black font-bold'
                                            }
                                          >
                                            -
                                          </span>
                                        )}
                                      </TableCell>
                                    )
                                  case 'valor_liquido':
                                    return (
                                      <TableCell
                                        key={key}
                                        className="px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black"
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            type="number"
                                            step="0.01"
                                            className="h-6 text-xs px-1.5 w-28 text-center mx-auto !text-slate-900"
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
                                            className={cn(
                                              'font-semibold',
                                              isBlueRow
                                                ? row.valor_liquido === null
                                                  ? 'text-white font-bold'
                                                  : 'text-white'
                                                : 'text-black font-bold',
                                            )}
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 w-28 !text-slate-900"
                                            value={editForm.n_documento || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                n_documento: e.target.value,
                                              })
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs max-w-[200px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.nome_cli_fornec}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 !text-slate-900"
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs max-w-[250px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.historico}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 !text-slate-900"
                                            value={editForm.historico || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                historico: e.target.value,
                                              })
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.fp || '-'}
                                      </TableCell>
                                    )
                                  case 'n_cheque':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.n_cheque || '-'}
                                      </TableCell>
                                    )
                                  case 'data_vencto':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            type="date"
                                            className="h-6 text-xs px-1.5 w-32 !text-slate-900"
                                            value={editForm.data_vencto || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                data_vencto: e.target.value,
                                              })
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.nominal_a || '-'}
                                      </TableCell>
                                    )
                                  case 'emitente_cheque':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs max-w-[150px] truncate border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                        title={row.emitente_cheque}
                                      >
                                        {row.emitente_cheque || '-'}
                                      </TableCell>
                                    )
                                  case 'cnpj_cpf':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.cnpj_cpf || '-'}
                                      </TableCell>
                                    )
                                  case 'n_extrato':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.n_extrato || '-'}
                                      </TableCell>
                                    )
                                  case 'filial':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.filial || '-'}
                                      </TableCell>
                                    )
                                  case 'data_canc':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {formatDate(row.data_canc)}
                                      </TableCell>
                                    )
                                  case 'data_estorno':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {formatDate(row.data_estorno)}
                                      </TableCell>
                                    )
                                  case 'banco':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-6 text-xs px-1.5 w-24 !text-slate-900"
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
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.c_corrente || '-'}
                                      </TableCell>
                                    )
                                  case 'cod_cli_for':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.cod_cli_for || '-'}
                                      </TableCell>
                                    )
                                  case 'departamento':
                                    return (
                                      <TableCell
                                        key={key}
                                        className={cn(
                                          'px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black',
                                          isBlueRow ? 'text-white' : 'text-black font-bold',
                                        )}
                                      >
                                        {row.departamento || '-'}
                                      </TableCell>
                                    )
                                  case 'status':
                                    return (
                                      <TableCell
                                        key={key}
                                        className="px-2 py-0.5 text-xs text-center border-r border-black"
                                      >
                                        {missingFields.length > 0 ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                                            Dados Incompletos
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 !text-black border border-slate-200">
                                            {row.status || 'Pendente'}
                                          </span>
                                        )}
                                      </TableCell>
                                    )
                                  default:
                                    return null
                                }
                              })}
                            <TableCell className="px-2 py-0.5 text-xs text-center border-r border-black last:border-r-0">
                              {editingId === row.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={cn(
                                      'h-6 px-2 text-[10px] text-green-600 font-semibold hover:text-green-700',
                                      isBlueRow ? 'bg-white/90 hover:bg-white' : '',
                                    )}
                                    onClick={async () => {
                                      const newMappedAccount = getMappedAccountForCC(
                                        editForm.c_custo,
                                        row.organization_id,
                                      )
                                      const payload = {
                                        ...editForm,
                                        mapped_account_id: newMappedAccount
                                          ? newMappedAccount.id
                                          : null,
                                      }
                                      const { error } = await supabase
                                        .from('erp_financial_movements')
                                        .update(payload)
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
                                    className={cn(
                                      'h-6 px-2 text-[10px] text-red-600 hover:text-red-700',
                                      isBlueRow ? 'bg-white/90 hover:bg-white' : '',
                                    )}
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={cn(
                                    'h-6 px-2 text-[10px]',
                                    isBlueRow
                                      ? 'bg-blue-800 text-white border-white/30 hover:bg-blue-700 hover:text-white'
                                      : '',
                                  )}
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
                        className="bg-slate-100 hover:bg-slate-100 font-bold border-t-2 border-black border-b border-b-black shadow-inner"
                      >
                        <TableCell className="border-r border-black" />
                        {columnOrder
                          .filter((key) => visibleColumns[key] !== false)
                          .map((key, i) => {
                            if (key === 'valor')
                              return (
                                <TableCell
                                  key={key}
                                  className="px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black"
                                >
                                  <span
                                    className={cn(
                                      'font-bold',
                                      totals.valor > 0
                                        ? 'text-emerald-600'
                                        : totals.valor < 0
                                          ? 'text-rose-600'
                                          : 'text-slate-800',
                                    )}
                                  >
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(totals.valor)}
                                  </span>
                                </TableCell>
                              )
                            if (key === 'valor_liquido')
                              return (
                                <TableCell
                                  key={key}
                                  className="px-2 py-0.5 text-xs whitespace-nowrap text-center border-r border-black"
                                >
                                  <span
                                    className={cn(
                                      'font-bold',
                                      totals.valor_liquido > 0
                                        ? 'text-emerald-600'
                                        : totals.valor_liquido < 0
                                          ? 'text-rose-600'
                                          : 'text-slate-900',
                                    )}
                                  >
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(totals.valor_liquido)}
                                  </span>
                                </TableCell>
                              )
                            const isFirstVisible = i === 0
                            return (
                              <TableCell
                                key={key}
                                className="px-2 py-0.5 text-xs whitespace-nowrap text-right text-slate-600 border-r border-black"
                              >
                                {isFirstVisible ? 'TOTAIS (Filtro Atual):' : ''}
                              </TableCell>
                            )
                          })}
                        <TableCell className="border-r border-black" />
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
        </TabsContent>

        <TabsContent value="resumo" className="m-0 animate-in fade-in-up duration-500">
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
              <span className="text-sm font-medium text-slate-600 px-2">Data Base:</span>
              <Tabs
                value={summaryDateBase}
                onValueChange={setSummaryDateBase}
                className="w-[300px]"
              >
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="data_emissao" className="text-xs">
                    Emissão
                  </TabsTrigger>
                  <TabsTrigger value="dt_compens" className="text-xs">
                    Compensação
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
              <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors">
                <h2 className="text-base font-bold text-center w-full">
                  Financeiro (Mês ➔ Conta/Caixa)
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <SummaryTable data={summaryData} type="month_account" dateField={summaryDateBase} />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
              <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors">
                <h2 className="text-base font-bold text-center w-full">
                  Financeiro (Conta/Caixa ➔ Mês)
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <SummaryTable data={summaryData} type="account_month" dateField={summaryDateBase} />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
              <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors">
                <h2 className="text-base font-bold text-center w-full">Custos (Mês ➔ C. Custo)</h2>
              </CardHeader>
              <CardContent className="p-0">
                <SummaryTable data={summaryData} type="month_cost" dateField={summaryDateBase} />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
              <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors">
                <h2 className="text-base font-bold text-center w-full">Custos (C. Custo ➔ Mês)</h2>
              </CardHeader>
              <CardContent className="p-0">
                <SummaryTable data={summaryData} type="cost_month" dateField={summaryDateBase} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bridge" className="m-0 animate-in fade-in-up duration-500">
          <Card className="border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightIcon className="h-5 w-5 text-primary" />
                Accounting Bridge (Ponte Contábil)
              </h2>
              <p className="text-sm text-slate-500">
                Visualização interativa dos mapeamentos DE/PARA entre centros de custo do ERP e
                contas contábeis.
              </p>
            </CardHeader>
            <CardContent className="p-0 bg-slate-50">
              <div ref={bridgeRef} className="relative min-h-[600px] p-8 grid grid-cols-2 gap-32">
                <div className="space-y-4 flex flex-col items-end z-10 w-full pr-8 border-r border-slate-200/50">
                  <h3 className="font-bold text-slate-800 text-lg mb-6 text-right w-full">
                    Origem (ERP)
                  </h3>
                  {Array.from(new Set(data.map((d) => d.c_custo || 'SEM_CC'))).map((cc) => (
                    <div
                      id={`bridge-cc-${cc}`}
                      key={cc}
                      className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 w-64 flex justify-between items-center transition-all hover:border-primary/50 relative group"
                    >
                      <span
                        className="font-medium text-sm text-slate-700 truncate pr-2"
                        title={cc === 'SEM_CC' ? 'Sem C.Custo' : cc}
                      >
                        {cc === 'SEM_CC' ? 'Sem C.Custo' : cc}
                      </span>
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full shadow-sm ring-2 ring-white',
                          getMappedAccountForCC(
                            cc === 'SEM_CC' ? null : cc,
                            data.find((d) => (d.c_custo || 'SEM_CC') === cc)?.organization_id ||
                              null,
                          )
                            ? 'bg-primary'
                            : 'bg-red-400',
                        )}
                      ></div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 flex flex-col items-start z-10 w-full pl-8">
                  <h3 className="font-bold text-slate-800 text-lg mb-6 w-full">
                    Destino (Contábil)
                  </h3>
                  {Array.from(
                    new Set(
                      data
                        .map((d) => {
                          const m = getMappedAccountForCC(d.c_custo, d.organization_id)
                          return m ? m.id : null
                        })
                        .filter(Boolean),
                    ),
                  ).map((coaId) => {
                    const coa = chartOfAccounts.find((c) => c.id === coaId)
                    if (!coa) return null
                    return (
                      <div
                        id={`bridge-coa-${coa.id}`}
                        key={coa.id}
                        className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 w-72 flex items-center gap-3 transition-all hover:border-primary/50 relative group"
                      >
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm ring-2 ring-white"></div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-mono text-xs text-slate-500">
                            {coa.account_code}
                          </span>
                          <span
                            className="font-medium text-sm text-slate-800 truncate"
                            title={coa.account_name}
                          >
                            {coa.account_name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {bridgeLines.some((l) => !l.mapped) && (
                    <div className="bg-red-50 border border-red-200 border-dashed rounded-lg p-4 w-72 flex items-center justify-center text-red-600 font-medium text-sm mt-8 opacity-70">
                      Pendente de Mapeamento
                    </div>
                  )}
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <linearGradient id="bridge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {bridgeLines.map((line, i) =>
                    line.mapped ? (
                      <path
                        key={i}
                        d={drawPath(line.x1, line.y1, line.x2, line.y2)}
                        stroke="url(#bridge-gradient)"
                        strokeWidth="2.5"
                        fill="none"
                        className="opacity-60"
                      />
                    ) : (
                      <path
                        key={i}
                        d={`M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        fill="none"
                        className="opacity-50"
                      />
                    ),
                  )}
                </svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sankey" className="m-0 animate-in fade-in-up duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <h2 className="text-lg font-bold text-slate-800">Diagrama Sankey de Fluxo</h2>
              <p className="text-sm text-slate-500">
                Representação visual do volume financeiro fluindo dos Centros de Custo para o Plano
                de Contas.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[500px] w-full bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                {sankeyData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                      data={sankeyData}
                      nodePadding={40}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      link={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                      node={{ fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2 }}
                    >
                      <RechartsTooltip
                        content={({ payload }) => {
                          if (!payload || !payload.length) return null
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-xs font-medium">
                              {data.source
                                ? `${data.source.name} → ${data.target.name}`
                                : data.name}
                              <br />
                              <span className="text-emerald-400">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(data.value)}
                              </span>
                            </div>
                          )
                        }}
                      />
                    </Sankey>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full flex-col gap-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Calculando fluxos ou dados insuficientes para exibição.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dry-run" className="m-0 animate-in fade-in-up duration-500">
          <Card className="border-slate-200 shadow-sm bg-[#0d1117] border-0 text-slate-300">
            <CardHeader className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                Pré-Visualização do TXT (Dry Run)
              </h2>
              <p className="text-sm text-slate-400">
                Simulação do formato de arquivo de exportação contábil. Linhas com dados
                inconsistentes são destacadas.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 font-mono text-[11px] overflow-x-auto whitespace-pre space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="text-slate-500 border-b border-slate-800 pb-2 mb-4 sticky top-0 bg-[#0d1117] z-10">
                  {
                    'DATA       | CONTA DÉBITO   | CONTA CRÉDITO  | VALOR       | C.CUSTO   | HISTÓRICO'
                  }
                </div>
                {data.map((row) => {
                  const mapped = getMappedAccount(row)
                  const dt = formatDate(row.data_emissao).padEnd(10, ' ')
                  const cc = (row.c_custo || '').padEnd(9, ' ')
                  const hist = (row.historico || '').substring(0, 40).padEnd(40, ' ')
                  const val = Number(row.valor_liquido || row.valor || 0)
                    .toFixed(2)
                    .padStart(11, ' ')

                  const conta = mapped ? mapped.account_code.padEnd(14, ' ') : 'PENDENTE      '
                  const isError = !mapped || !row.data_emissao || !row.valor_liquido

                  return (
                    <div
                      key={row.id}
                      className={cn(
                        'py-1.5 px-3 rounded transition-colors',
                        isError
                          ? 'bg-red-950/30 text-red-300 border-l-2 border-red-500'
                          : 'hover:bg-slate-800 text-emerald-300',
                      )}
                    >
                      {`${dt} | ${conta} | ${'CAIXA/BANCO'.padEnd(14, ' ')} | ${val} | ${cc} | ${hist}`}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      <Sheet open={!!mappingRow} onOpenChange={(open) => !open && setMappingRow(null)}>
        <SheetContent className="w-full sm:max-w-md border-l shadow-2xl overflow-y-auto bg-white p-6 sm:p-8">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-bold text-slate-900">Mapeamento Rápido</SheetTitle>
            <SheetDescription className="text-base text-slate-500">
              Vincule este lançamento a uma Conta Contábil do plano de contas para resolver a
              pendência de integração.
            </SheetDescription>
          </SheetHeader>

          {mappingRow && (
            <div className="space-y-8">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 border-b pb-2 uppercase tracking-wider">
                  Detalhes do Lançamento ERP
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Data Emissão</span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(mappingRow.data_emissao)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Valor</span>
                    <span className="font-bold text-slate-900 text-lg">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(mappingRow.valor_liquido || mappingRow.valor)}
                    </span>
                  </div>
                  <div className="col-span-2 bg-white p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block mb-1 font-medium">Histórico</span>
                    <span className="font-medium text-slate-700">
                      {mappingRow.historico || 'Sem histórico'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block mb-1 font-medium">
                      Centro de Custo (Referência)
                    </span>
                    <span className="font-mono px-3 py-1.5 bg-slate-200 rounded-md text-slate-900 font-bold border border-slate-300 inline-block shadow-sm">
                      {mappingRow.c_custo || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold text-slate-800">
                  Conta Contábil Correspondente
                </Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between h-12 px-4 border-slate-300 shadow-sm font-medium text-slate-700"
                    >
                      {selectedAccountId
                        ? chartOfAccounts.find((c) => c.id === selectedAccountId)?.account_name
                        : 'Selecione uma conta contábil...'}
                      <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-slate-200">
                    <Command className="bg-white">
                      <CommandInput placeholder="Buscar por código ou nome..." className="h-11" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-4 text-center text-slate-500">
                          Nenhuma conta encontrada.
                        </CommandEmpty>
                        <CommandGroup>
                          {chartOfAccounts.map((account) => (
                            <CommandItem
                              key={account.id}
                              value={`${account.account_code} ${account.account_name}`}
                              onSelect={() => {
                                setSelectedAccountId(account.id)
                                setComboboxOpen(false)
                              }}
                              className="py-3 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-5 w-5 text-primary',
                                  selectedAccountId === account.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">
                                  {account.account_name}
                                </span>
                                <span className="font-mono text-xs text-slate-500">
                                  {account.account_code}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ao salvar, este mapeamento será aplicado automaticamente a todos os lançamentos
                  futuros que utilizarem o mesmo centro de custo.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  className="h-11 sm:flex-1"
                  onClick={() => setMappingRow(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="h-11 shadow-sm sm:flex-1"
                  onClick={handleSaveMapping}
                  disabled={!selectedAccountId}
                >
                  <Save className="h-5 w-5 mr-2" />
                  Salvar Mapeamento
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
