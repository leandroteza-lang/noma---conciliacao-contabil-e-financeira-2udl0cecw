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
  Download,
  FileSpreadsheet,
  FileText,
  Wallet,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  RefreshCw,
  Link,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'
import { TableSettingsControls } from '@/components/TableSettingsControls'
import { useTablePreferences } from '@/hooks/use-table-preferences'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
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
  DropdownMenuGroup,
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
import {
  Sankey,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Label as RechartsLabel,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const formatMonthYear = (row: any, dateField: string = 'data_emissao') => {
  const dateStr = row?.[dateField]
  if (!dateStr || typeof dateStr !== 'string') return 'Sem Data'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length >= 3) return `${parts[1]}/${parts[0]}`
  return 'Sem Data'
}

function FloatingPanel({
  open,
  onClose,
  title,
  children,
  widthClass = 'w-[calc(100vw-2rem)] max-w-5xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  widthClass?: string
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />
      <div className={cn('pointer-events-none relative flex flex-col max-h-full', widthClass)}>
        <DraggablePopoverContent
          title={title}
          onClose={onClose}
          className="pointer-events-auto shadow-2xl border-slate-300"
        >
          {children}
        </DraggablePopoverContent>
      </div>
    </div>
  )
}

function DraggablePopoverContent({
  children,
  className,
  title,
  onClose,
}: {
  children: React.ReactNode
  className?: string
  title: string
  onClose?: () => void
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(
    null,
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return // Prevent dragging when clicking buttons
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
        maxHeight: 'calc(100vh - 2rem)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="drag-handle bg-[#800000] hover:bg-[#800000]/90 cursor-move flex items-center justify-between px-4 py-2 border-b border-[#800000] rounded-t-md select-none touch-none active:cursor-grabbing shrink-0">
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-white/80" />
          <span className="font-bold text-xs text-white">{title}</span>
        </div>
        <div className="flex items-center gap-1">
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
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20 rounded-full ml-1"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative bg-white rounded-b-md">
        {children}
      </div>
    </div>
  )
}

function ColumnFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-1 w-full relative">
      <span>{title}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 text-white hover:bg-white/20 shrink-0',
              selected.length > 0 && 'bg-white/20',
            )}
          >
            <Filter className="h-3 w-3" />
            {selected.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"></span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="py-2 text-xs text-center text-slate-500">
                Nenhum encontrado.
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    className="text-xs cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onSelect={() => {
                      onChange(
                        selected.includes(opt)
                          ? selected.filter((x) => x !== opt)
                          : [...selected, opt],
                      )
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-3 w-3 shrink-0 items-center justify-center border rounded-sm',
                        selected.includes(opt)
                          ? 'bg-primary border-primary text-white'
                          : 'opacity-50 border-slate-400',
                      )}
                    >
                      <Check className="h-2 w-2" />
                    </div>
                    <span className="truncate" title={opt}>
                      {opt}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="p-1 border-t border-slate-100 bg-slate-50 flex flex-col gap-1">
              <div className="flex items-center gap-1 w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 flex-1 text-[10px]"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(options)
                  }}
                >
                  Todos
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 flex-1 text-[10px]"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange([])
                  }}
                >
                  Nenhum
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-full text-[10px]"
                onClick={() => setOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function PeriodConsolidatedTable({
  data,
  type,
  tableFontSize,
  filterText = '',
}: {
  data: any[]
  type: 'account' | 'cost'
  tableFontSize?: number
  filterText?: string
}) {
  const [colFilter, setColFilter] = useState<string[]>([])

  const getKey = (r: any) => {
    if (type === 'account') {
      const code = r.conta_caixa || ''
      const name = r.nome_caixa || ''
      if (code && name) return `${code} - ${name}`
      return code || name || 'Sem Conta/Caixa'
    } else {
      const code = r.c_custo || ''
      const name = r.descricao_c_custo || ''
      if (code && name) return `${code} - ${name}`
      return code || name || 'Sem C. Custo'
    }
  }

  const baseMap = useMemo(() => {
    const map = new Map<string, { name: string; pos: number; neg: number; diff: number }>()

    for (const row of data) {
      const key = getKey(row)
      const val = Number(row.valor_liquido || 0)

      if (!map.has(key)) {
        map.set(key, { name: key, pos: 0, neg: 0, diff: 0 })
      }
      const group = map.get(key)!
      if (val > 0) {
        group.pos += val
      } else {
        group.neg += val
      }
      group.diff += val
    }
    return map
  }, [data, type])

  const options = useMemo(() => {
    return Array.from(baseMap.keys()).sort((a, b) => a.localeCompare(b))
  }, [baseMap])

  const aggregated = useMemo(() => {
    let result = Array.from(baseMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    if (filterText) {
      const q = filterText.toLowerCase()
      result = result.filter((item) => item.name.toLowerCase().includes(q))
    }
    if (colFilter.length > 0) {
      result = result.filter((item) => colFilter.includes(item.name))
    }
    return result
  }, [baseMap, filterText, colFilter])

  const formatVal = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalPos = aggregated.reduce((acc, curr) => acc + curr.pos, 0)
  const totalNeg = aggregated.reduce((acc, curr) => acc + curr.neg, 0)
  const totalDiff = aggregated.reduce((acc, curr) => acc + curr.diff, 0)

  return (
    <Table
      className="w-full"
      style={{ fontSize: tableFontSize ? `${tableFontSize}px` : undefined }}
      wrapperClassName="max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <TableHeader className="sticky top-0 z-10 shadow-sm border-b border-black">
        <TableRow disableZebra className="bg-blue-500 hover:bg-blue-400 border-none">
          <TableHead className="font-medium text-white text-left border-r border-black px-2 py-1 h-8 w-[40%]">
            <ColumnFilter
              title={type === 'account' ? 'Caixa/Banco' : 'Centro de Custo'}
              options={options}
              selected={colFilter}
              onChange={setColFilter}
            />
          </TableHead>
          <TableHead className="w-[20%] text-left font-bold text-emerald-700 border-r border-black px-2 py-1 h-8">
            Entradas (+)
          </TableHead>
          <TableHead className="w-[20%] text-left font-bold text-rose-700 border-r border-black px-2 py-1 h-8">
            Saídas (-)
          </TableHead>
          <TableHead className="w-[20%] text-left font-bold text-blue-700 px-2 py-1 h-8">
            Diferença
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregated.map((item) => (
          <TableRow
            key={item.name}
            className="border-b border-black last:border-b-0 transition-colors"
          >
            <TableCell className="px-2 py-1 border-r border-black text-slate-700 font-medium">
              {item.name}
            </TableCell>
            <TableCell className="px-2 py-1 text-left text-emerald-600/90 border-r border-black">
              {formatVal(item.pos)}
            </TableCell>
            <TableCell className="px-2 py-1 text-left text-rose-600/90 border-r border-black">
              {formatVal(item.neg)}
            </TableCell>
            <TableCell className="px-2 py-1 text-left font-semibold text-slate-700">
              {formatVal(item.diff)}
            </TableCell>
          </TableRow>
        ))}
        {aggregated.length === 0 ? (
          <TableRow disableZebra>
            <TableCell
              colSpan={4}
              className="text-center py-4 text-slate-500 border-t border-black"
            >
              Nenhum dado para resumir.
            </TableCell>
          </TableRow>
        ) : (
          <TableRow
            disableZebra
            className="bg-slate-200/80 font-bold border-t-2 border-black border-b border-b-black shadow-inner"
          >
            <TableCell className="px-2 py-1 border-r border-black text-right text-slate-900 uppercase">
              Total Geral do Período:
            </TableCell>
            <TableCell className="px-2 py-1 text-left text-emerald-700 border-r border-black">
              {formatVal(totalPos)}
            </TableCell>
            <TableCell className="px-2 py-1 text-left text-rose-700 border-r border-black">
              {formatVal(totalNeg)}
            </TableCell>
            <TableCell className="px-2 py-1 text-left text-blue-800">
              {formatVal(totalDiff)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

function AccountingConsolidatedTable({
  data,
  tableFontSize,
  getAccountingEntriesSimulation,
}: {
  data: any[]
  tableFontSize?: number
  getAccountingEntriesSimulation: (row: any) => any
}) {
  const [colFilter, setColFilter] = useState<string[]>([])

  const {
    map: baseMap,
    unmappedDebit,
    unmappedCredit,
  } = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        code: string
        name: string
        classification: string
        debit: number
        credit: number
      }
    >()
    let unmappedDebit = 0
    let unmappedCredit = 0

    const getOrAdd = (acc: any) => {
      if (!acc) return null
      const key = acc.id
      if (!map.has(key)) {
        map.set(key, {
          id: acc.id,
          code: acc.account_code || '',
          name: acc.account_name || '',
          classification: acc.classification || '',
          debit: 0,
          credit: 0,
        })
      }
      return map.get(key)!
    }

    for (const row of data) {
      const sim = getAccountingEntriesSimulation(row)
      const amt = Math.abs(Number(row.valor_liquido || row.valor || 0))

      const dAcc = getOrAdd(sim.debitAccount)
      if (dAcc) dAcc.debit += amt
      else unmappedDebit += amt

      const cAcc = getOrAdd(sim.creditAccount)
      if (cAcc) cAcc.credit += amt
      else unmappedCredit += amt
    }
    return { map, unmappedDebit, unmappedCredit }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const formatKey = (item: any) =>
    `${item.code} ${item.classification ? item.classification + ' ' : ''}- ${item.name}`

  const options = useMemo(() => {
    return Array.from(baseMap.values())
      .map(formatKey)
      .sort((a, b) => a.localeCompare(b))
  }, [baseMap])

  const aggregated = useMemo(() => {
    let result = Array.from(baseMap.values()).sort((a, b) => a.code.localeCompare(b.code))
    if (colFilter.length > 0) {
      result = result.filter((item) => colFilter.includes(formatKey(item)))
    }
    return result
  }, [baseMap, colFilter])

  const formatVal = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalMappedDebit = aggregated.reduce((acc, curr) => acc + curr.debit, 0)
  const totalMappedCredit = aggregated.reduce((acc, curr) => acc + curr.credit, 0)

  const totalDebit = totalMappedDebit + unmappedDebit
  const totalCredit = totalMappedCredit + unmappedCredit
  const totalDiff = Math.abs(totalDebit - totalCredit)

  return (
    <Table
      className="w-full"
      style={{ fontSize: tableFontSize ? `${tableFontSize}px` : undefined }}
      wrapperClassName="max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <TableHeader className="sticky top-0 z-10 shadow-sm border-b border-black">
        <TableRow disableZebra className="bg-indigo-950 hover:bg-indigo-900 border-none">
          <TableHead className="font-medium text-white text-left border-r border-slate-600 px-2 py-1 h-8 w-[40%]">
            <ColumnFilter
              title="Conta Contábil"
              options={options}
              selected={colFilter}
              onChange={setColFilter}
            />
          </TableHead>
          <TableHead className="w-[20%] text-right font-bold text-white border-r border-slate-600 px-2 py-1 h-8">
            Débito (D)
          </TableHead>
          <TableHead className="w-[20%] text-right font-bold text-white border-r border-slate-600 px-2 py-1 h-8">
            Crédito (C)
          </TableHead>
          <TableHead className="w-[20%] text-right font-bold text-white px-2 py-1 h-8">
            Saldo
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregated.map((item) => {
          const saldo = item.debit - item.credit
          return (
            <TableRow
              key={item.id}
              className="border-b border-slate-200 last:border-b-0 transition-colors"
            >
              <TableCell className="px-2 py-1 border-r border-slate-200 text-slate-700 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-slate-200">
                    {item.code}
                  </span>
                  {item.classification && (
                    <span className="font-mono text-[0.85em] font-semibold text-slate-500">
                      {item.classification}
                    </span>
                  )}
                  <span className="truncate max-w-[300px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-2 py-1 text-right text-slate-700 border-r border-slate-200">
                {formatVal(item.debit)}
              </TableCell>
              <TableCell className="px-2 py-1 text-right text-slate-700 border-r border-slate-200">
                {formatVal(item.credit)}
              </TableCell>
              <TableCell
                className={cn(
                  'px-2 py-1 text-right font-bold',
                  saldo > 0 ? 'text-blue-700' : saldo < 0 ? 'text-rose-700' : 'text-slate-700',
                )}
              >
                {formatVal(Math.abs(saldo))} {saldo !== 0 ? (saldo > 0 ? 'D' : 'C') : ''}
              </TableCell>
            </TableRow>
          )
        })}
        {aggregated.length === 0 ? (
          <TableRow disableZebra>
            <TableCell
              colSpan={4}
              className="text-center py-4 text-slate-500 border-t border-slate-200"
            >
              Nenhum dado para resumir.
            </TableCell>
          </TableRow>
        ) : (
          <>
            {(unmappedDebit > 0 || unmappedCredit > 0) && (
              <TableRow disableZebra className="bg-rose-50/50 border-t border-slate-200">
                <TableCell className="px-2 py-2 border-r border-slate-200 text-slate-600 italic flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  Valores Pendentes de Mapeamento Contábil
                </TableCell>
                <TableCell className="px-2 py-2 text-right text-rose-600 font-medium border-r border-slate-200">
                  {formatVal(unmappedDebit)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right text-rose-600 font-medium border-r border-slate-200">
                  {formatVal(unmappedCredit)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right text-rose-600 font-bold">
                  {formatVal(Math.abs(unmappedDebit - unmappedCredit))}{' '}
                  {unmappedDebit - unmappedCredit !== 0
                    ? unmappedDebit > unmappedCredit
                      ? 'D'
                      : 'C'
                    : ''}
                </TableCell>
              </TableRow>
            )}
            <TableRow
              disableZebra
              className="bg-slate-100 font-bold border-t-2 border-slate-300 shadow-inner"
            >
              <TableCell className="px-2 py-2 border-r border-slate-300 text-right text-slate-900 uppercase">
                Total Geral:
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-slate-900 border-r border-slate-300">
                {formatVal(totalDebit)}
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-slate-900 border-r border-slate-300">
                {formatVal(totalCredit)}
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-indigo-700">
                {formatVal(totalDiff)}{' '}
                {totalDiff !== 0 ? (totalDebit > totalCredit ? 'D' : 'C') : ''}
              </TableCell>
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
  )
}

function AccountingCrossReferenceTable({
  data,
  tableFontSize,
  getAccountingEntriesSimulation,
}: {
  data: any[]
  tableFontSize?: number
  getAccountingEntriesSimulation: (row: any) => any
}) {
  const [debitFilter, setDebitFilter] = useState<string[]>([])
  const [creditFilter, setCreditFilter] = useState<string[]>([])

  const { map: crossMap, unmappedAmount } = useMemo(() => {
    const map = new Map<
      string,
      {
        debitAccount: any
        creditAccount: any
        count: number
        amount: number
      }
    >()
    let unmappedAmount = 0

    for (const row of data) {
      const sim = getAccountingEntriesSimulation(row)
      const amt = Math.abs(Number(row.valor_liquido || row.valor || 0))

      if (!sim.debitAccount || !sim.creditAccount) {
        unmappedAmount += amt
        continue
      }

      const key = `${sim.debitAccount.id}_${sim.creditAccount.id}`
      if (!map.has(key)) {
        map.set(key, {
          debitAccount: sim.debitAccount,
          creditAccount: sim.creditAccount,
          count: 0,
          amount: 0,
        })
      }
      const group = map.get(key)!
      group.count += 1
      group.amount += amt
    }
    return { map, unmappedAmount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const formatKey = (item: any) =>
    `${item.account_code} ${item.classification ? item.classification + ' ' : ''}- ${item.account_name}`

  const { debitOptions, creditOptions } = useMemo(() => {
    const deb = new Set<string>()
    const cred = new Set<string>()
    crossMap.forEach((val) => {
      deb.add(formatKey(val.debitAccount))
      cred.add(formatKey(val.creditAccount))
    })
    return {
      debitOptions: Array.from(deb).sort((a, b) => a.localeCompare(b)),
      creditOptions: Array.from(cred).sort((a, b) => a.localeCompare(b)),
    }
  }, [crossMap])

  const aggregated = useMemo(() => {
    let result = Array.from(crossMap.values())
    if (debitFilter.length > 0) {
      result = result.filter((item) => debitFilter.includes(formatKey(item.debitAccount)))
    }
    if (creditFilter.length > 0) {
      result = result.filter((item) => creditFilter.includes(formatKey(item.creditAccount)))
    }
    result.sort((a, b) => {
      const da = a.debitAccount.account_code || ''
      const db = b.debitAccount.account_code || ''
      if (da !== db) return da.localeCompare(db)
      const ca = a.creditAccount.account_code || ''
      const cb = b.creditAccount.account_code || ''
      return ca.localeCompare(cb)
    })
    return result
  }, [crossMap, debitFilter, creditFilter])

  const formatVal = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalAmount = aggregated.reduce((acc, curr) => acc + curr.amount, 0)
  const totalCount = aggregated.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <Table
      className="w-full"
      style={{ fontSize: tableFontSize ? `${tableFontSize}px` : undefined }}
      wrapperClassName="max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <TableHeader className="sticky top-0 z-10 shadow-sm border-b border-slate-600">
        <TableRow disableZebra className="bg-indigo-950 hover:bg-indigo-900 border-none">
          <TableHead className="font-medium text-white text-left border-r border-slate-600 px-2 py-1 h-8 w-[40%]">
            <ColumnFilter
              title="Conta Débito (D)"
              options={debitOptions}
              selected={debitFilter}
              onChange={setDebitFilter}
            />
          </TableHead>
          <TableHead className="font-medium text-white text-left border-r border-slate-600 px-2 py-1 h-8 w-[40%]">
            <ColumnFilter
              title="Conta Crédito (C)"
              options={creditOptions}
              selected={creditFilter}
              onChange={setCreditFilter}
            />
          </TableHead>
          <TableHead className="w-[10%] text-center font-bold text-white border-r border-slate-600 px-2 py-1 h-8">
            Lançamentos
          </TableHead>
          <TableHead className="w-[10%] text-right font-bold text-white px-2 py-1 h-8">
            Valor Total
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregated.map((item, idx) => (
          <TableRow
            key={idx}
            className="border-b border-slate-200 last:border-b-0 transition-colors"
          >
            <TableCell className="px-2 py-1 border-r border-slate-200 text-slate-700 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-blue-200">
                  {item.debitAccount.account_code}
                </span>
                {item.debitAccount.classification && (
                  <span className="font-mono text-[0.85em] font-semibold text-slate-500">
                    {item.debitAccount.classification}
                  </span>
                )}
                <span className="truncate max-w-[250px]" title={item.debitAccount.account_name}>
                  {item.debitAccount.account_name}
                </span>
              </div>
            </TableCell>
            <TableCell className="px-2 py-1 border-r border-slate-200 text-slate-700 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-rose-200">
                  {item.creditAccount.account_code}
                </span>
                {item.creditAccount.classification && (
                  <span className="font-mono text-[0.85em] font-semibold text-slate-500">
                    {item.creditAccount.classification}
                  </span>
                )}
                <span className="truncate max-w-[250px]" title={item.creditAccount.account_name}>
                  {item.creditAccount.account_name}
                </span>
              </div>
            </TableCell>
            <TableCell className="px-2 py-1 text-center text-slate-700 border-r border-slate-200 font-semibold">
              {item.count}
            </TableCell>
            <TableCell className="px-2 py-1 text-right text-slate-700 font-bold">
              {formatVal(item.amount)}
            </TableCell>
          </TableRow>
        ))}
        {aggregated.length === 0 ? (
          <TableRow disableZebra>
            <TableCell
              colSpan={4}
              className="text-center py-4 text-slate-500 border-t border-slate-200"
            >
              Nenhum dado para resumir.
            </TableCell>
          </TableRow>
        ) : (
          <>
            {unmappedAmount > 0 && (
              <TableRow disableZebra className="bg-rose-50/50 border-t border-slate-200">
                <TableCell
                  colSpan={2}
                  className="px-2 py-2 border-r border-slate-200 text-slate-600 italic flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  Valores Pendentes de Mapeamento Contábil (Ignorados no Cruzamento)
                </TableCell>
                <TableCell className="px-2 py-2 text-center text-rose-600 font-medium border-r border-slate-200">
                  -
                </TableCell>
                <TableCell className="px-2 py-2 text-right text-rose-600 font-bold">
                  {formatVal(unmappedAmount)}
                </TableCell>
              </TableRow>
            )}
            <TableRow
              disableZebra
              className="bg-slate-100 font-bold border-t-2 border-slate-300 shadow-inner"
            >
              <TableCell
                colSpan={2}
                className="px-2 py-2 border-r border-slate-300 text-right text-slate-900 uppercase"
              >
                Total Geral:
              </TableCell>
              <TableCell className="px-2 py-2 text-center text-slate-900 border-r border-slate-300">
                {totalCount}
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-indigo-700">
                {formatVal(totalAmount)}
              </TableCell>
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
  )
}

function SummaryTable({
  data,
  type,
  dateField = 'data_emissao',
  tableFontSize,
  filterText = '',
}: {
  data: any[]
  type: 'month_account' | 'account_month' | 'month_cost' | 'cost_month'
  dateField?: string
  tableFontSize?: number
  filterText?: string
}) {
  const [col1Filter, setCol1Filter] = useState<string[]>([])
  const [col2Filter, setCol2Filter] = useState<string[]>([])

  let col1Label = ''
  let col2Label = ''
  let col1Width = 'w-[15%]'
  let col2Width = 'w-[40%]'
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
      col1Width = 'w-[40%]'
      col2Width = 'w-[15%]'
      primaryKeyFn = formatAccount
      secondaryKeyFn = (r) => formatMonthYear(r, dateField)
      break
    case 'month_cost':
      col1Label = 'Mês/Ano'
      col2Label = 'Centro de Custo'
      col1Width = 'w-[15%]'
      col2Width = 'w-[40%]'
      primaryKeyFn = (r) => formatMonthYear(r, dateField)
      secondaryKeyFn = formatCostCenter
      break
    case 'cost_month':
      col1Label = 'Centro de Custo'
      col2Label = 'Mês/Ano'
      col1Width = 'w-[40%]'
      col2Width = 'w-[15%]'
      primaryKeyFn = formatCostCenter
      secondaryKeyFn = (r) => formatMonthYear(r, dateField)
      break
  }

  const { baseMap, col1Options, col2Options } = useMemo(() => {
    const map = new Map<
      string,
      { name: string; pos: number; neg: number; diff: number; items: Map<string, any> }
    >()
    const sKeys = new Set<string>()

    for (const row of data) {
      const pKey = primaryKeyFn(row)
      const sKey = secondaryKeyFn(row)
      const val = Number(row.valor_liquido || 0)

      sKeys.add(sKey)

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

    const sortDatesOrStrings = (a: string, b: string) => {
      const aIsDate = /^\d{2}\/\d{4}$/.test(a)
      const bIsDate = /^\d{2}\/\d{4}$/.test(b)
      if (aIsDate && bIsDate) {
        const [am, ay] = a.split('/')
        const [bm, by] = b.split('/')
        if (ay !== by) return parseInt(ay) - parseInt(by)
        return parseInt(am) - parseInt(bm)
      }
      return a.localeCompare(b)
    }

    const c1Opt = Array.from(map.keys()).sort(sortDatesOrStrings)
    const c2Opt = Array.from(sKeys).sort(sortDatesOrStrings)

    return { baseMap: map, col1Options: c1Opt, col2Options: c2Opt }
  }, [data, primaryKeyFn, secondaryKeyFn])

  const aggregated = useMemo(() => {
    const sortDatesOrStrings = (a: string, b: string) => {
      const aIsDate = /^\d{2}\/\d{4}$/.test(a)
      const bIsDate = /^\d{2}\/\d{4}$/.test(b)
      if (aIsDate && bIsDate) {
        const [am, ay] = a.split('/')
        const [bm, by] = b.split('/')
        if (ay !== by) return parseInt(ay) - parseInt(by)
        return parseInt(am) - parseInt(bm)
      }
      return a.localeCompare(b)
    }

    let result = Array.from(baseMap.values())

    if (col1Filter.length > 0) {
      result = result.filter((p) => col1Filter.includes(p.name))
    }

    result = result
      .map((p) => {
        let filteredItems = Array.from(p.items.values())

        if (col2Filter.length > 0) {
          filteredItems = filteredItems.filter((i) => col2Filter.includes(i.name))
        }

        if (filterText) {
          const q = filterText.toLowerCase()
          filteredItems = filteredItems.filter(
            (i) => i.name.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
          )
        }

        const groupPos = filteredItems.reduce((acc, curr) => acc + curr.pos, 0)
        const groupNeg = filteredItems.reduce((acc, curr) => acc + curr.neg, 0)
        const groupDiff = filteredItems.reduce((acc, curr) => acc + curr.diff, 0)

        return {
          ...p,
          pos: groupPos,
          neg: groupNeg,
          diff: groupDiff,
          items: filteredItems.sort((a, b) => sortDatesOrStrings(a.name, b.name)),
        }
      })
      .filter((p) => p.items.length > 0)

    result.sort((a, b) => sortDatesOrStrings(a.name, b.name))
    return result
  }, [baseMap, filterText, col1Filter, col2Filter])

  const formatVal = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Table
      className="w-full"
      style={{ fontSize: tableFontSize ? `${tableFontSize}px` : undefined }}
      wrapperClassName="max-h-[500px] overflow-y-auto custom-scrollbar"
    >
      <TableHeader className="sticky top-0 z-10 shadow-sm border-b border-black">
        <TableRow disableZebra className="bg-blue-500 hover:bg-blue-400 border-none">
          <TableHead
            className={cn(
              'font-medium text-white text-left border-r border-black px-2 py-1 h-8',
              col1Width,
            )}
          >
            <ColumnFilter
              title={col1Label}
              options={col1Options}
              selected={col1Filter}
              onChange={setCol1Filter}
            />
          </TableHead>
          <TableHead
            className={cn(
              'font-medium text-white text-left border-r border-black px-2 py-1 h-8',
              col2Width,
            )}
          >
            <ColumnFilter
              title={col2Label}
              options={col2Options}
              selected={col2Filter}
              onChange={setCol2Filter}
            />
          </TableHead>
          <TableHead className="w-[15%] text-left font-bold text-emerald-700 border-r border-black px-2 py-1 h-8">
            Entradas (+)
          </TableHead>
          <TableHead className="w-[15%] text-left font-bold text-rose-700 border-r border-black px-2 py-1 h-8">
            Saídas (-)
          </TableHead>
          <TableHead className="w-[15%] text-left font-bold text-blue-700 px-2 py-1 h-8">
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
              <TableCell className="px-2 py-1 text-left text-emerald-700 border-r border-black">
                {formatVal(group.pos)}
              </TableCell>
              <TableCell className="px-2 py-1 text-left text-rose-700 border-r border-black">
                {formatVal(group.neg)}
              </TableCell>
              <TableCell className="px-2 py-1 text-left text-blue-800">
                {formatVal(group.diff)}
              </TableCell>
            </TableRow>
            {group.items.map((item) => (
              <TableRow
                key={item.name}
                className="border-b border-black last:border-b-0 transition-colors"
              >
                <TableCell className="px-2 py-1 border-r border-black text-slate-400"></TableCell>
                <TableCell className="px-2 py-1 border-r border-black text-slate-700 font-medium">
                  {item.name}
                </TableCell>
                <TableCell className="px-2 py-1 text-left text-emerald-600/90 border-r border-black">
                  {formatVal(item.pos)}
                </TableCell>
                <TableCell className="px-2 py-1 text-left text-rose-600/90 border-r border-black">
                  {formatVal(item.neg)}
                </TableCell>
                <TableCell className="px-2 py-1 text-left font-semibold text-slate-700">
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
  { label: 'Conta Débito (Prevista)', key: 'conta_debito', className: 'min-w-[250px]' },
  { label: 'Conta Crédito (Prevista)', key: 'conta_credito', className: 'min-w-[250px]' },
  { label: 'Conta/Caixa Destino', key: 'conta_caixa_destino', align: 'center' },
  { label: 'Forma Pagto', key: 'forma_pagto' },
  { label: 'C.Custo', key: 'c_custo' },
  { label: 'Descrição C.Custo', key: 'descricao_c_custo', className: 'min-w-[150px]' },
  { label: 'Valor', key: 'valor', align: 'left' },
  { label: 'Valor Líquido', key: 'valor_liquido', align: 'left' },
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
  { label: 'Status Lançamento', key: 'status', align: 'center' },
]

const defaultTabsOrderConfig = [
  {
    id: 'grade',
    label: 'Grade de Movimentos',
    activeClass: 'data-[state=active]:bg-indigo-900 data-[state=active]:text-white',
    inactiveClass:
      'data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/50',
  },
  {
    id: 'resumo',
    label: 'Resumo Consolidado',
    activeClass: 'data-[state=active]:bg-indigo-800 data-[state=active]:text-white',
    inactiveClass:
      'data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/50',
  },
  {
    id: 'balancete',
    label: 'Balancete Comparativo',
    activeClass:
      'data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-700',
    inactiveClass: 'data-[state=inactive]:hover:bg-emerald-50',
  },
  {
    id: 'dashboard',
    label: 'Dashboard Gerencial',
    activeClass: 'data-[state=active]:bg-blue-700 data-[state=active]:text-white text-blue-700',
    inactiveClass: 'data-[state=inactive]:hover:bg-blue-50',
  },
  {
    id: 'resumo-mapeamento',
    label: 'Resumo DE/PARA',
    activeClass: 'data-[state=active]:bg-[#800000] data-[state=active]:text-white text-[#800000]',
    inactiveClass: 'data-[state=inactive]:hover:bg-red-50',
  },
  {
    id: 'sankey',
    label: 'Análise Sankey',
    activeClass: 'data-[state=active]:bg-violet-700 data-[state=active]:text-white',
    inactiveClass:
      'data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/50',
  },
  {
    id: 'analise-grupos',
    label: 'Análise por Grupos',
    activeClass: 'data-[state=active]:bg-orange-700 data-[state=active]:text-white',
    inactiveClass:
      'data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/50',
  },
  {
    id: 'dry-run',
    label: 'Dry Run TXT',
    activeClass: 'data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-400',
    inactiveClass:
      'data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/50',
  },
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

  const [tableFontSize, setTableFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('fin_mov_table_font_size')
    return saved ? parseInt(saved, 10) : 11
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_table_font_size', tableFontSize.toString())
  }, [tableFontSize])

  const { prefs, updatePrefs } = useTablePreferences('fin_mov_grade')

  const getCellProps = (key: string, defaultAlign?: string, extraClass?: string) => {
    const align = prefs.alignments?.[key] || defaultAlign || 'left'
    const alignClass =
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
    const style = prefs.showGridlines
      ? {
          borderRight: `${prefs.gridlineWidth}px solid ${prefs.gridlineColor}`,
          borderBottom: `${prefs.gridlineWidth}px solid ${prefs.gridlineColor}`,
        }
      : undefined

    return {
      className: cn('px-2 py-0.5 border-0', alignClass, extraClass),
      style,
    }
  }

  const getGridlineStyle = () => {
    if (!prefs.showGridlines) return undefined
    return {
      borderRight: `${prefs.gridlineWidth}px solid ${prefs.gridlineColor}`,
      borderBottom: `${prefs.gridlineWidth}px solid ${prefs.gridlineColor}`,
    }
  }

  const { prefs: deparaPrefs, updatePrefs: updateDeparaPrefs } =
    useTablePreferences('fin_mov_resumo_depara')

  const getDeparaCellProps = (key: string, defaultAlign?: string, extraClass?: string) => {
    const align = deparaPrefs.alignments?.[key] || defaultAlign || 'left'
    const alignClass =
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
    const style = deparaPrefs.showGridlines
      ? {
          borderRight: `${deparaPrefs.gridlineWidth}px solid ${deparaPrefs.gridlineColor}`,
          borderBottom: `${deparaPrefs.gridlineWidth}px solid ${deparaPrefs.gridlineColor}`,
        }
      : undefined

    return {
      className: cn('px-2 py-0.5 border-0', alignClass, extraClass),
      style,
    }
  }

  const getDeparaGridlineStyle = () => {
    if (!deparaPrefs.showGridlines) return undefined
    return {
      borderRight: `${deparaPrefs.gridlineWidth}px solid ${deparaPrefs.gridlineColor}`,
      borderBottom: `${deparaPrefs.gridlineWidth}px solid ${deparaPrefs.gridlineColor}`,
    }
  }

  const { prefs: analiseGruposPrefs, updatePrefs: updateAnaliseGruposPrefs } = useTablePreferences(
    'fin_mov_analise_grupos_table',
  )

  const getAnaliseGruposCellProps = (key: string, defaultAlign?: string, extraClass?: string) => {
    const align = analiseGruposPrefs.alignments?.[key] || defaultAlign || 'left'
    const alignClass =
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
    const style = analiseGruposPrefs.showGridlines
      ? {
          borderRight: `${analiseGruposPrefs.gridlineWidth}px solid ${analiseGruposPrefs.gridlineColor}`,
          borderBottom: `${analiseGruposPrefs.gridlineWidth}px solid ${analiseGruposPrefs.gridlineColor}`,
        }
      : undefined

    return {
      className: cn('px-4 py-2 border-0', alignClass, extraClass),
      style,
    }
  }

  const getAnaliseGruposGridlineStyle = () => {
    if (!analiseGruposPrefs.showGridlines) return undefined
    return {
      borderRight: `${analiseGruposPrefs.gridlineWidth}px solid ${analiseGruposPrefs.gridlineColor}`,
      borderBottom: `${analiseGruposPrefs.gridlineWidth}px solid ${analiseGruposPrefs.gridlineColor}`,
    }
  }

  const { prefs: balancetePrefs, updatePrefs: updateBalancetePrefs } =
    useTablePreferences('fin_mov_balancete_table')

  const getBalanceteCellProps = (
    key: string,
    defaultAlign: 'left' | 'center' | 'right' = 'left',
    extraClass?: string,
  ) => {
    const align = balancetePrefs.alignments?.[key] || defaultAlign
    const alignClass =
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
    const style = balancetePrefs.showGridlines
      ? {
          borderRight: `${balancetePrefs.gridlineWidth}px solid ${balancetePrefs.gridlineColor}`,
          borderBottom: `${balancetePrefs.gridlineWidth}px solid ${balancetePrefs.gridlineColor}`,
        }
      : undefined

    return {
      className: cn('border-0', alignClass, extraClass),
      style,
    }
  }

  const getBalanceteGridlineStyle = () => {
    if (!balancetePrefs.showGridlines) return undefined
    return {
      borderRight: `${balancetePrefs.gridlineWidth}px solid ${balancetePrefs.gridlineColor}`,
      borderBottom: `${balancetePrefs.gridlineWidth}px solid ${balancetePrefs.gridlineColor}`,
    }
  }

  const analiseGruposHeaders = [
    { key: 'codigo', label: 'Código', defaultAlign: 'left' },
    { key: 'descricao', label: 'Descrição', defaultAlign: 'left' },
    { key: 'receitas', label: 'Receitas', defaultAlign: 'right' },
    { key: 'despesas', label: 'Despesas', defaultAlign: 'right' },
    { key: 'resultado', label: 'Resultado', defaultAlign: 'right' },
    { key: 'acoes', label: 'Ações', defaultAlign: 'center' },
  ]

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [totals, setTotals] = useState({ valor: 0, valor_liquido: 0, entradas: 0, saidas: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const [resumoData, setResumoData] = useState<any[]>([])
  const [resumoLoading, setResumoLoading] = useState(false)
  const [resumoSearch, setResumoSearch] = useState('')
  const [resumoFilters, setResumoFilters] = useState<Record<string, string[]>>({})
  const [resumoFiltersOpen, setResumoFiltersOpen] = useState(false)

  const syncMappings = async () => {
    if (!user) return
    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando mapeamentos...')
    try {
      let allMovs: any[] = []
      let hasMore = true
      let pageIdx = 0
      while (hasMore) {
        const { data, error } = await supabase
          .from('erp_financial_movements')
          .select('id, c_custo, organization_id, mapped_account_id')
          .is('deleted_at', null)
          .range(pageIdx * 1000, (pageIdx + 1) * 1000 - 1)

        if (error) throw error
        if (data && data.length > 0) {
          allMovs = allMovs.concat(data)
          pageIdx++
          if (data.length < 1000) hasMore = false
        } else {
          hasMore = false
        }
      }

      const updates: { id: string; mapped_account_id: string | null }[] = []

      for (const row of allMovs) {
        const mapped = getMappedAccountForCC(row.c_custo, row.organization_id)
        const expectedId = mapped ? mapped.id : null
        if (row.mapped_account_id !== expectedId) {
          updates.push({
            id: row.id,
            mapped_account_id: expectedId,
          })
        }
      }

      if (updates.length > 0) {
        const chunkSize = 200
        for (let i = 0; i < updates.length; i += chunkSize) {
          const chunk = updates.slice(i, i + chunkSize)
          const groupedByAccount: Record<string, string[]> = {}
          for (const u of chunk) {
            const key = u.mapped_account_id || 'NULL'
            if (!groupedByAccount[key]) groupedByAccount[key] = []
            groupedByAccount[key].push(u.id)
          }

          for (const [accId, ids] of Object.entries(groupedByAccount)) {
            await supabase
              .from('erp_financial_movements')
              .update({ mapped_account_id: accId === 'NULL' ? null : accId })
              .in('id', ids)
          }
        }
        toast.success(updates.length + ' lançamentos foram sincronizados!', { id: toastId })
        setRefreshKey((k) => k + 1)
      } else {
        toast.info('Tudo já está sincronizado.', { id: toastId })
      }
    } catch (error: any) {
      toast.error('Erro ao sincronizar: ' + error.message, { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExport = async (scope: 'filtered' | 'all', format: 'excel' | 'pdf' | 'txt') => {
    if (!user) return
    setIsExporting(true)
    try {
      let allData: any[] = []
      let hasMore = true
      let pageIdx = 0
      const limit = 1000

      let q = supabase
        .from('erp_financial_movements')
        .select('*, organizations(name)')
        .is('deleted_at', null)
        .order(
          sortColumn === 'empresa'
            ? 'organization_id'
            : sortColumn === 'prontidao'
              ? 'data_emissao'
              : sortColumn,
          { ascending: sortDirection === 'asc' },
        )
        .order('id', { ascending: true })

      if (scope === 'filtered') {
        q = applyQueryFilters(q, search, filters)
      }

      while (hasMore) {
        const { data, error } = await q.range(pageIdx * limit, (pageIdx + 1) * limit - 1)
        if (error) throw error
        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData = allData.concat(data)
          pageIdx++
          if (data.length < limit) {
            hasMore = false
          }
        }
      }

      if (scope === 'filtered' && filters['prontidao'] && filters['prontidao'].length > 0) {
        allData = allData.filter((row) => {
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

      const exportTotals = {
        valor: allData.reduce((acc, row) => acc + (Number(row.valor) || 0), 0),
        valor_liquido: allData.reduce((acc, row) => acc + (Number(row.valor_liquido) || 0), 0),
        entradas: allData.reduce((acc, row) => {
          const v = Number(row.valor_liquido) || 0
          return v > 0 ? acc + v : acc
        }, 0),
        saidas: allData.reduce((acc, row) => {
          const v = Number(row.valor_liquido) || 0
          return v < 0 ? acc + v : acc
        }, 0),
      }

      const exportData = allData.map((row) => {
        const mappedRow: any = {}
        const colsToExport =
          format === 'pdf'
            ? columnOrder.filter((k) => visibleColumns[k] !== false).slice(0, 10)
            : columnOrder.filter((k) => visibleColumns[k] !== false)

        colsToExport.forEach((key) => {
          const h = tableHeaders.find((th) => th.key === key)
          if (h) {
            let val = row[key]
            if (key === 'empresa') val = row.organizations?.name || '-'
            if (key === 'valor' || key === 'valor_liquido') val = val !== null ? Number(val) : 0
            if (
              ['data_emissao', 'dt_compens', 'data_vencto', 'data_canc', 'data_estorno'].includes(
                key,
              )
            ) {
              val = formatDate(val)
            }
            if (key === 'prontidao') {
              const missing =
                !row.data_emissao ||
                !row.c_custo ||
                row.valor_liquido === null ||
                row.valor_liquido === undefined
              if (missing) val = 'Incompleto'
              else if (getMappedAccount(row)) val = 'Mapeado'
              else val = 'Pendente'
            }
            mappedRow[h.label] = val
          }
        })
        return mappedRow
      })

      if (exportData.length === 0) {
        toast.info('Nenhum dado para exportar.')
        return
      }

      const { data: result, error } = await supabase.functions.invoke('export-erp-movements', {
        body: { format, data: exportData, totals: exportTotals },
      })

      if (error) throw error

      if (format === 'excel' && result.excel) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.excel}`
        link.download = `movimento_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
      } else if (format === 'txt' && result.txt) {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `movimento_financeiro_${new Date().toISOString().split('T')[0]}.txt`
        link.click()
      } else if (format === 'pdf') {
        if (result.html) {
          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(result.html)
            printWindow.document.close()
          } else {
            toast.error('Por favor, permita pop-ups para visualizar o PDF.')
          }
        } else if (result.pdf) {
          const link = document.createElement('a')
          link.href = result.pdf
          link.download = `movimento_financeiro_${new Date().toISOString().split('T')[0]}.pdf`
          link.click()
        }
      }
      toast.success('Exportação concluída com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao exportar: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }
  const [summaryData, setSummaryData] = useState<any[]>([])
  const [summaryDateBase, setSummaryDateBase] = useState('data_emissao')

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [activeTab, setActiveTab] = useState('grade')
  const [draggedTab, setDraggedTab] = useState<string | null>(null)

  const [tabsOrder, setTabsOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('fin_mov_tabs_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validKeys = new Set(defaultTabsOrderConfig.map((t) => t.id))
        const validParsed = parsed.filter((key: string) => validKeys.has(key))
        const missingKeys = defaultTabsOrderConfig
          .map((t) => t.id)
          .filter((key) => !validParsed.includes(key))
        return [...validParsed, ...missingKeys]
      } catch (e) {
        return defaultTabsOrderConfig.map((t) => t.id)
      }
    }
    return defaultTabsOrderConfig.map((t) => t.id)
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_tabs_order', JSON.stringify(tabsOrder))
  }, [tabsOrder])

  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownData, setDrillDownData] = useState<any[]>([])
  const [drillDownTitle, setDrillDownTitle] = useState('')

  // Dashboard Gerencial State
  const [dashSelectedPeriodStart, setDashSelectedPeriodStart] = useState<string>('')
  const [dashSelectedPeriodEnd, setDashSelectedPeriodEnd] = useState<string>('')
  const [dashSelectedCCs, setDashSelectedCCs] = useState<string[]>([])

  // Balancete Comparativo State
  const [balanceteView, setBalanceteView] = useState<'c_custo' | 'conta_caixa'>('c_custo')
  const [avEnabled, setAvEnabled] = useState(false)
  const [ahEnabled, setAhEnabled] = useState(false)
  const [balanceteSearch, setBalanceteSearch] = useState('')
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])

  const availableMonths = useMemo(() => {
    return Array.from(new Set(summaryData.map((d) => d[summaryDateBase]?.substring(0, 7))))
      .filter(Boolean)
      .sort()
  }, [summaryData, summaryDateBase])

  const activePeriods = selectedPeriods.length > 0 ? selectedPeriods : availableMonths
  const sortedActivePeriods = [...activePeriods].sort()

  const matrixData = useMemo(() => {
    const map = new Map<string, { code: string; name: string; values: Record<string, number> }>()
    const monthTotalsAbs: Record<string, number> = {}

    summaryData.forEach((row) => {
      const month = row[summaryDateBase]?.substring(0, 7)
      if (!month || !sortedActivePeriods.includes(month)) return

      const code = balanceteView === 'c_custo' ? row.c_custo || 'S/C' : row.conta_caixa || 'S/C'
      const name =
        balanceteView === 'c_custo'
          ? row.descricao_c_custo || 'Sem Centro de Custo'
          : row.nome_caixa || 'Sem Conta'
      const key = `${code}::${name}`
      const val = Number(row.valor_liquido || 0)

      if (!map.has(key)) map.set(key, { code, name, values: {} })
      const group = map.get(key)!
      group.values[month] = (group.values[month] || 0) + val
      monthTotalsAbs[month] = (monthTotalsAbs[month] || 0) + Math.abs(val)
    })

    let rows = Array.from(map.values())
    if (balanceteSearch) {
      const q = balanceteSearch.toLowerCase()
      rows = rows.filter(
        (r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
      )
    }
    rows.sort((a, b) => a.code.localeCompare(b.code))

    return { rows, monthTotalsAbs }
  }, [summaryData, summaryDateBase, balanceteView, sortedActivePeriods, balanceteSearch])

  const handleExportBalancete = () => {
    const separator = ';'
    let csv = `Código${separator}Descrição`
    sortedActivePeriods.forEach((p) => {
      const [y, m] = p.split('-')
      const colName = `${m}/${y}`
      csv += `${separator}${colName}`
      if (avEnabled) csv += `${separator}${colName} (AV%)`
      if (ahEnabled) csv += `${separator}${colName} (AH%)`
    })
    csv += '\n'

    matrixData.rows.forEach((row) => {
      csv += `"${row.code}"${separator}"${row.name}"`
      sortedActivePeriods.forEach((month, mIdx) => {
        const val = row.values[month] || 0
        csv += `${separator}${val.toFixed(2).replace('.', ',')}`

        if (avEnabled) {
          const totalAbs = matrixData.monthTotalsAbs[month] || 1
          const av = (Math.abs(val) / totalAbs) * 100
          csv += `${separator}${val === 0 ? '0' : av.toFixed(2).replace('.', ',')}`
        }
        if (ahEnabled) {
          const prevMonth = mIdx > 0 ? sortedActivePeriods[mIdx - 1] : null
          const prevVal = prevMonth ? row.values[prevMonth] || 0 : 0
          let ah = 0
          if (prevMonth && prevVal !== 0) {
            ah = ((val - prevVal) / Math.abs(prevVal)) * 100
          } else if (prevMonth && prevVal === 0 && val !== 0) {
            ah = 100
          }
          csv += `${separator}${mIdx === 0 ? '0' : ah.toFixed(2).replace('.', ',')}`
        }
      })
      csv += '\n'
    })

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `balancete_comparativo_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDrillDown = (costCenterLabel: string) => {
    setDrillDownTitle(costCenterLabel)

    const matchingRows = summaryData.filter((row) => {
      const val = Number(row.valor_liquido || 0)
      if (val >= 0) return false
      const ccName = row.descricao_c_custo || row.c_custo || 'Sem C. Custo'
      return ccName === costCenterLabel
    })

    matchingRows.sort((a, b) => {
      const valA = Number(a.valor_liquido || 0)
      const valB = Number(b.valor_liquido || 0)
      return valA - valB
    })

    setDrillDownData(matchingRows)
    setDrillDownOpen(true)
  }

  const defaultFilterOrder = ['natureza', ...tableHeaders.map((h) => h.key)]
  const resumoHeaders = [
    { key: 'c_custo', label: 'Centro de Custo (Origem ERP)' },
    { key: 'conta_contabil', label: 'Conta Contábil (Destino)' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'count', label: 'Lançamentos', align: 'center' },
    { key: 'total_bruto', label: 'Total Bruto', align: 'left' },
    { key: 'total_liquido', label: 'Total Líquido', align: 'left' },
    { key: 'acao', label: 'Ação', align: 'center' },
  ]

  const [resumoColOrder, setResumoColOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('fin_mov_resumo_cols')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validKeys = new Set(resumoHeaders.map((h) => h.key))
        const validParsed = parsed.filter((key: string) => validKeys.has(key))
        const missingKeys = resumoHeaders
          .map((h) => h.key)
          .filter((key) => !validParsed.includes(key))
        return [...validParsed, ...missingKeys]
      } catch (e) {
        return resumoHeaders.map((h) => h.key)
      }
    }
    return resumoHeaders.map((h) => h.key)
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_resumo_cols', JSON.stringify(resumoColOrder))
  }, [resumoColOrder])

  const [draggedResumoCol, setDraggedResumoCol] = useState<string | null>(null)

  const handleDrillDownResumo = (item: any) => {
    setDrillDownTitle(
      item.c_custo ? `${item.c_custo} - ${item.descricao_c_custo || ''}` : 'Sem Centro de Custo',
    )
    setDrillDownData(item.rows)
    setDrillDownOpen(true)
  }

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
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [mappingRow, setMappingRow] = useState<any | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [isGeneratingEntries, setIsGeneratingEntries] = useState(false)

  const fetchAuxData = async () => {
    if (!user) return

    const fetchAll = async (table: string, columns: string) => {
      let all: any[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        let q = supabase.from(table).select(columns).is('deleted_at', null)
        if (table === 'account_mapping') {
          q = q.neq('pending_deletion', true)
        }
        const { data, error } = await q.range(page * 1000, (page + 1) * 1000 - 1)
        if (error || !data || data.length === 0) {
          hasMore = false
        } else {
          all = all.concat(data)
          page++
          if (data.length < 1000) hasMore = false
        }
      }
      return all
    }

    const [coa, cc, map, ba] = await Promise.all([
      fetchAll(
        'chart_of_accounts',
        'id, account_code, account_name, classification, account_level, organization_id',
      ),
      fetchAll('cost_centers', 'id, code, description, organization_id, parent_id, classification'),
      fetchAll('account_mapping', 'cost_center_id, chart_account_id, organization_id'),
      fetchAll(
        'bank_accounts',
        'id, code, description, account_number, account_code, organization_id',
      ),
    ])

    setChartOfAccounts(coa)
    setCostCenters(cc)
    setMappings(map)
    setBankAccounts(ba)
  }

  useEffect(() => {
    fetchAuxData()
  }, [user, refreshKey])

  const getCostCenterId = (code: string | null, orgId: string | null) => {
    if (!code || !orgId) return null
    const cleanCode = code.trim().toUpperCase()
    const cc = costCenters.find(
      (c) => c.organization_id === orgId && (c.code || '').trim().toUpperCase() === cleanCode,
    )
    return cc ? cc.id : null
  }

  const getAccountingEntriesSimulation = (row: any) => {
    const mappedCCAccount = getMappedAccount(row)

    const cleanContaCaixa = (row.conta_caixa || '').trim().toUpperCase()
    const cleanNomeCaixa = (row.nome_caixa || '').trim().toUpperCase()
    const bankAccount = bankAccounts.find((ba) => {
      if (ba.organization_id !== row.organization_id) return false
      const baCode = (ba.code || '').trim().toUpperCase()
      const baDesc = (ba.description || '').trim().toUpperCase()
      const baAccNum = (ba.account_number || '').trim().toUpperCase()

      if (cleanContaCaixa && (baCode === cleanContaCaixa || baAccNum === cleanContaCaixa))
        return true
      if (cleanNomeCaixa && baDesc === cleanNomeCaixa) return true
      return false
    })

    let bankChartAccount = null
    if (bankAccount && bankAccount.account_code) {
      bankChartAccount = chartOfAccounts.find(
        (coa) =>
          coa.id === bankAccount.account_code || coa.account_code === bankAccount.account_code,
      )
    }

    const ccCode = row.c_custo || ''
    const prefix = ccCode.trim().charAt(0)
    const isPrefix1 = prefix === '1'
    const isPrefix2or3 = prefix === '2' || prefix === '3'

    const val = Number(row.valor_liquido || row.valor || 0)

    let debitAccount = null
    let creditAccount = null

    if (isPrefix1) {
      if (val > 0) {
        debitAccount = bankChartAccount
        creditAccount = mappedCCAccount
      } else {
        debitAccount = mappedCCAccount
        creditAccount = bankChartAccount
      }
    } else if (isPrefix2or3) {
      if (val > 0) {
        debitAccount = bankChartAccount
        creditAccount = mappedCCAccount
      } else {
        debitAccount = mappedCCAccount
        creditAccount = bankChartAccount
      }
    } else {
      if (val > 0) {
        debitAccount = bankChartAccount
        creditAccount = mappedCCAccount
      } else {
        debitAccount = mappedCCAccount
        creditAccount = bankChartAccount
      }
    }

    return { debitAccount, creditAccount, isMapped: !!debitAccount && !!creditAccount }
  }

  const startGenerateEntries = async () => {
    if (!user) return
    setIsGeneratingEntries(true)
    const toastId = toast.loading('Gerando lançamentos contábeis...')
    try {
      let idsToProcess = selectedIds.length > 0 ? selectedIds : []
      if (idsToProcess.length === 0) {
        let allData: any[] = []
        let hasMore = true
        let pageIdx = 0
        const limit = 1000
        while (hasMore) {
          let q = supabase
            .from('erp_financial_movements')
            .select('id, status')
            .is('deleted_at', null)
            .neq('status', 'Concluído')
          q = applyQueryFilters(q, search, filters)
          const { data, error } = await q.range(pageIdx * limit, (pageIdx + 1) * limit - 1)
          if (error) throw error
          if (!data || data.length === 0) {
            hasMore = false
          } else {
            allData = allData.concat(data)
            pageIdx++
            if (data.length < limit) hasMore = false
          }
        }
        idsToProcess = allData.map((d) => d.id)
      } else {
        const { data: selData } = await supabase
          .from('erp_financial_movements')
          .select('id, status')
          .in('id', selectedIds)
          .neq('status', 'Concluído')
        idsToProcess = selData ? selData.map((d) => d.id) : []
      }

      if (idsToProcess.length === 0) {
        toast.info('Nenhum movimento pendente para gerar lançamento.', { id: toastId })
        setGenerateModalOpen(false)
        setIsGeneratingEntries(false)
        return
      }

      const rowsToProcess = []
      const chunkSize = 200
      for (let i = 0; i < idsToProcess.length; i += chunkSize) {
        const chunk = idsToProcess.slice(i, i + chunkSize)
        const { data } = await supabase
          .from('erp_financial_movements')
          .select('*, organizations(name)')
          .in('id', chunk)
        if (data) rowsToProcess.push(...data)
      }

      const entriesToInsert = []
      const movementsToUpdate = []
      let errorsCount = 0

      for (const row of rowsToProcess) {
        const sim = getAccountingEntriesSimulation(row)
        if (!sim.debitAccount || !sim.creditAccount || !row.data_emissao) {
          errorsCount++
          continue
        }

        const entryId = crypto.randomUUID()
        entriesToInsert.push({
          id: entryId,
          organization_id: row.organization_id,
          entry_date: row.data_emissao,
          amount: Math.abs(Number(row.valor_liquido || row.valor || 0)),
          description: row.historico || 'Lançamento gerado via TGA',
          debit_account_id: sim.debitAccount.id,
          credit_account_id: sim.creditAccount.id,
          status: 'Concluído',
          cost_center_id: getCostCenterId(row.c_custo, row.organization_id),
        })

        movementsToUpdate.push(row.id)
      }

      if (entriesToInsert.length > 0) {
        for (let i = 0; i < entriesToInsert.length; i += 200) {
          const chunk = entriesToInsert.slice(i, i + 200)
          const { error } = await supabase.from('accounting_entries').insert(chunk)
          if (error) throw error
        }

        for (let i = 0; i < movementsToUpdate.length; i += 200) {
          const chunk = movementsToUpdate.slice(i, i + 200)
          const { error } = await supabase
            .from('erp_financial_movements')
            .update({ status: 'Concluído' })
            .in('id', chunk)
          if (error) throw error
        }
      }

      if (entriesToInsert.length > 0) {
        toast.success(
          `${entriesToInsert.length} lançamentos gerados com sucesso! ${errorsCount > 0 ? '(' + errorsCount + ' ignorados por pendências)' : ''}`,
          { id: toastId },
        )
      } else {
        toast.error(
          `Nenhum lançamento foi gerado. Verifique se os mapeamentos (Débito/Crédito) e Datas estão corretos.`,
          { id: toastId },
        )
      }

      setGenerateModalOpen(false)
      setSelectedIds([])
      setRefreshKey((k) => k + 1)
    } catch (e: any) {
      toast.error('Erro ao gerar lançamentos: ' + e.message, { id: toastId })
    } finally {
      setIsGeneratingEntries(false)
    }
  }

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
    const fromMapeamento = getMappedAccountForCC(row.c_custo, row.organization_id)
    if (fromMapeamento) return fromMapeamento

    if (row.mapped_account_id) {
      return chartOfAccounts.find((coa) => coa.id === row.mapped_account_id) || null
    }
    return null
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
    setIsSimplifiedMode(false)
    localStorage.setItem('fin_mov_simplified_mode', 'false')
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

    let allMovs: any[] = []
    let fetchHasMore = true
    let fetchPage = 0
    const fetchLimit = 1000

    while (fetchHasMore) {
      const { data, error } = await supabase
        .from('erp_financial_movements')
        .select(
          'data_emissao, dt_compens, data_vencto, data_canc, data_estorno, organization_id, tipo_operacao, status, conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, c_custo, descricao_c_custo, valor, valor_liquido, n_documento, nome_cli_fornec, historico, fp, n_cheque, nominal_a, emitente_cheque, cnpj_cpf, n_extrato, filial, banco, c_corrente, cod_cli_for, departamento, compensado',
        )
        .is('deleted_at', null)
        .range(fetchPage * fetchLimit, (fetchPage + 1) * fetchLimit - 1)

      if (error || !data || data.length === 0) {
        fetchHasMore = false
      } else {
        allMovs = allMovs.concat(data)
        fetchPage++
        if (data.length < fetchLimit) {
          fetchHasMore = false
        }
      }
    }

    const movs = allMovs

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

          const dateOptions: any[] = []
          const groupedByMonth = new Map<string, string[]>()

          uniqueDates.forEach((d: string) => {
            const [dy, dm, dd] = d.split('-')
            const monthKey = `${dy}-${dm}`
            if (!groupedByMonth.has(monthKey)) {
              groupedByMonth.set(monthKey, [])
            }
            groupedByMonth.get(monthKey)!.push(d)
          })

          Array.from(groupedByMonth.entries()).forEach(([monthKey, days]) => {
            const [dy, dm] = monthKey.split('-')
            dateOptions.push({
              label: `${dm}/${dy}`,
              value: monthKey,
              isParent: true,
            })
            days.forEach((d) => {
              const [dy2, dm2, dd2] = d.split('-')
              dateOptions.push({
                label: `${dd2}/${dm2}/${dy2}`,
                value: d,
                parent: monthKey,
              })
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

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
    setIsSimplifiedMode(false)
    localStorage.setItem('fin_mov_simplified_mode', 'false')
  }
  const selectAllColumns = () => {
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: true }), {}))
    setIsSimplifiedMode(false)
    localStorage.setItem('fin_mov_simplified_mode', 'false')
  }
  const selectNoColumns = () => {
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: false }), {}))
    setIsSimplifiedMode(false)
    localStorage.setItem('fin_mov_simplified_mode', 'false')
  }
  const invertColumns = () => {
    setVisibleColumns((prev) =>
      tableHeaders.reduce(
        (acc, h) => ({ ...acc, [h.key]: prev[h.key] === false ? true : false }),
        {},
      ),
    )
    setIsSimplifiedMode(false)
    localStorage.setItem('fin_mov_simplified_mode', 'false')
  }

  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const [isSimplifiedMode, setIsSimplifiedMode] = useState(() => {
    return localStorage.getItem('fin_mov_simplified_mode') === 'true'
  })

  const toggleSimplifiedMode = (checked: boolean) => {
    if (checked) {
      localStorage.setItem('fin_mov_pre_simplified_cols', JSON.stringify(visibleColumns))
      localStorage.setItem('fin_mov_pre_simplified_order', JSON.stringify(columnOrder))

      const simplifiedList = [
        'prontidao',
        'data_emissao',
        'conta_debito',
        'conta_credito',
        'valor_liquido',
        'historico',
        'conta_caixa',
        'c_custo',
      ]

      const newVisible = tableHeaders.reduce(
        (acc, h) => ({ ...acc, [h.key]: simplifiedList.includes(h.key) }),
        {},
      )
      setVisibleColumns(newVisible)

      const newOrder = [
        ...simplifiedList,
        ...tableHeaders.map((h) => h.key).filter((k) => !simplifiedList.includes(k)),
      ]
      setColumnOrder(newOrder)

      setIsSimplifiedMode(true)
      localStorage.setItem('fin_mov_simplified_mode', 'true')
      toast.success('Modo simplificado ativado.')
    } else {
      const savedCols = localStorage.getItem('fin_mov_pre_simplified_cols')
      const savedOrder = localStorage.getItem('fin_mov_pre_simplified_order')
      if (savedCols) {
        try {
          setVisibleColumns(JSON.parse(savedCols))
        } catch {
          /* intentionally ignored */
        }
      } else {
        setVisibleColumns(defaultVisibleColumns)
      }
      if (savedOrder) {
        try {
          setColumnOrder(JSON.parse(savedOrder))
        } catch {
          /* intentionally ignored */
        }
      } else {
        setColumnOrder(defaultColumnOrder)
      }
      setIsSimplifiedMode(false)
      localStorage.setItem('fin_mov_simplified_mode', 'false')
      toast.info('Modo completo restaurado.')
    }
  }

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleColumns)
    setColumnOrder(defaultColumnOrder)
    setIsSimplifiedMode(false)
    localStorage.setItem('fin_mov_simplified_mode', 'false')
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

  const applyQueryFilters = (
    query: any,
    searchStr: string,
    filterObj: Record<string, string[]>,
  ) => {
    let q = query
    if (searchStr) {
      const cleanW = searchStr
        .trim()
        .replace(/\s+/g, '%')
        .replace(/[aeiouáàãâäéèêëíìîïóòõôöúùûücç]/gi, '_')
      q = q.or(
        `historico.ilike.%${cleanW}%,nome_cli_fornec.ilike.%${cleanW}%,c_custo.ilike.%${cleanW}%,descricao_c_custo.ilike.%${cleanW}%,n_documento.ilike.%${cleanW}%`,
      )
    }

    const dateCols = ['data_emissao', 'dt_compens', 'data_vencto', 'data_canc', 'data_estorno']

    Object.entries(filterObj).forEach(([key, values]) => {
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
          // Filtragem client-side é aplicada após a busca dos resultados da query
          // em fetchData, fetchDataSilent, e handleExport para garantir precisão
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

    const fetchAllData = async () => {
      let allData: any[] = []
      let hasMore = true
      let pageIdx = 0
      const limit = 1000
      while (hasMore) {
        let q = supabase
          .from('erp_financial_movements')
          .select('*, organizations(name)')
          .is('deleted_at', null)
          .order(orderCol, { ascending: sortDirection === 'asc' })
          .order('id', { ascending: true })

        q = applyQueryFilters(q, search, filters)

        const { data, error } = await q.range(pageIdx * limit, (pageIdx + 1) * limit - 1)
        if (error) {
          hasMore = false
        } else if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData = allData.concat(data)
          pageIdx++
          if (data.length < limit) {
            hasMore = false
          }
        }
      }
      return allData
    }

    const allData = await fetchAllData()

    let finalData = allData

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

    setSummaryData(finalData)

    const sumV = finalData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
    const sumVL = finalData.reduce((acc, curr) => acc + (Number(curr.valor_liquido) || 0), 0)
    const sumEntradas = finalData.reduce((acc, curr) => {
      const val = Number(curr.valor_liquido) || 0
      return val > 0 ? acc + val : acc
    }, 0)
    const sumSaidas = finalData.reduce((acc, curr) => {
      const val = Number(curr.valor_liquido) || 0
      return val < 0 ? acc + val : acc
    }, 0)

    setTotals({ valor: sumV, valor_liquido: sumVL, entradas: sumEntradas, saidas: sumSaidas })

    setTotalCount(finalData.length)
    setData(finalData.slice(page * pageSize, (page + 1) * pageSize))
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

  const fetchResumoData = async () => {
    if (!user) return
    setResumoLoading(true)
    let allData: any[] = []
    let hasMore = true
    let pageIdx = 0
    const limit = 1000

    let q = supabase
      .from('erp_financial_movements')
      .select('*, organizations(name)')
      .is('deleted_at', null)
      .order('data_emissao', { ascending: false })
      .order('id', { ascending: true })

    q = applyQueryFilters(q, resumoSearch, resumoFilters)

    while (hasMore) {
      const { data, error } = await q.range(pageIdx * limit, (pageIdx + 1) * limit - 1)
      if (error) {
        toast.error('Erro ao buscar dados do resumo: ' + error.message)
        hasMore = false
      } else if (!data || data.length === 0) {
        hasMore = false
      } else {
        allData = allData.concat(data)
        pageIdx++
        if (data.length < limit) {
          hasMore = false
        }
      }
    }

    if (resumoFilters['prontidao'] && resumoFilters['prontidao'].length > 0) {
      allData = allData.filter((row) => {
        const missing =
          !row.data_emissao ||
          !row.c_custo ||
          row.valor_liquido === null ||
          row.valor_liquido === undefined
        let statusText = 'Pendente'
        if (missing) statusText = 'Incompleto'
        else if (getMappedAccount(row)) statusText = 'Mapeado'
        return resumoFilters['prontidao'].includes(statusText)
      })
    }

    setResumoData(allData)
    setResumoLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'resumo') {
      fetchResumoData()
    }
  }, [user, resumoSearch, resumoFilters, refreshKey, activeTab])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    let orderCol = sortColumn
    if (sortColumn === 'empresa') orderCol = 'organization_id'
    if (sortColumn === 'prontidao') orderCol = 'data_emissao'

    const fetchAllData = async () => {
      let allData: any[] = []
      let hasMore = true
      let pageIdx = 0
      const limit = 1000
      while (hasMore) {
        let q = supabase
          .from('erp_financial_movements')
          .select('*, organizations(name)')
          .is('deleted_at', null)
          .order(orderCol, { ascending: sortDirection === 'asc' })
          .order('id', { ascending: true })

        q = applyQueryFilters(q, search, filters)

        const { data, error } = await q.range(pageIdx * limit, (pageIdx + 1) * limit - 1)
        if (error) {
          toast.error('Erro ao buscar dados: ' + error.message)
          hasMore = false
        } else if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData = allData.concat(data)
          pageIdx++
          if (data.length < limit) {
            hasMore = false
          }
        }
      }
      return allData
    }

    const allData = await fetchAllData()

    let finalData = allData

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

    setSummaryData(finalData)

    const sumV = finalData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
    const sumVL = finalData.reduce((acc, curr) => acc + (Number(curr.valor_liquido) || 0), 0)
    const sumEntradas = finalData.reduce((acc, curr) => {
      const val = Number(curr.valor_liquido) || 0
      return val > 0 ? acc + val : acc
    }, 0)
    const sumSaidas = finalData.reduce((acc, curr) => {
      const val = Number(curr.valor_liquido) || 0
      return val < 0 ? acc + val : acc
    }, 0)

    setTotals({ valor: sumV, valor_liquido: sumVL, entradas: sumEntradas, saidas: sumSaidas })

    setTotalCount(finalData.length)
    setData(finalData.slice(page * pageSize, (page + 1) * pageSize))

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

  const getSankeyData = () => {
    const nodesMap = new Map()
    const linksMap = new Map()

    data.forEach((row) => {
      const ccName = row.c_custo || 'Sem C.Custo'
      const mapped = getMappedAccount(row)
      const coaName = mapped
        ? `${mapped.account_code} ${mapped.classification ? mapped.classification + ' ' : ''}- ${mapped.account_name}`
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

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const deParaTree = useMemo(() => {
    const nodesMap = new Map<string, any>()

    const getOrCreateNode = (ccId: string, orgId: string): any => {
      const key = `${orgId}_${ccId}`
      if (nodesMap.has(key)) return nodesMap.get(key)

      const cc = costCenters.find((c) => c.id === ccId)
      if (!cc) return null

      const mappedAccount = getMappedAccountForCC(cc.code, cc.organization_id)

      let hierarchyArray: any[] = []
      if (mappedAccount && mappedAccount.classification) {
        const parts = mappedAccount.classification.split('.')
        let currentClass = ''
        for (let i = 0; i < parts.length; i++) {
          currentClass += (i === 0 ? '' : '.') + parts[i]
          const parentAcc = chartOfAccounts.find(
            (c) =>
              c.classification === currentClass &&
              c.organization_id === mappedAccount.organization_id,
          )
          if (parentAcc) hierarchyArray.push(parentAcc)
        }
      }

      const node = {
        id: key,
        dbId: cc.id,
        c_custo: cc.code,
        descricao_c_custo: cc.description,
        org_id: cc.organization_id,
        mappedAccount,
        hierarchyArray,
        status: mappedAccount ? 'Mapeado' : 'Pendente',
        count: 0,
        total: 0,
        total_bruto: 0,
        rows: [],
        children: [],
        isSynthetic: false,
        level: 0,
        parentId: cc.parent_id,
      }
      nodesMap.set(key, node)
      return node
    }

    summaryData.forEach((row) => {
      const orgId = row.organization_id || 'UNKNOWN'
      const ccCode = row.c_custo?.trim().toUpperCase()

      let cc = null
      if (ccCode && orgId !== 'UNKNOWN') {
        cc = costCenters.find(
          (c) => c.organization_id === orgId && c.code?.trim().toUpperCase() === ccCode,
        )
      }

      if (cc) {
        let currId = cc.id
        let leafNode = null
        while (currId) {
          const node = getOrCreateNode(currId, orgId)
          if (!node) break
          node.count++
          node.total += Number(row.valor_liquido || row.valor || 0)
          node.total_bruto += Number(row.valor || 0)
          if (currId === cc.id) {
            node.rows.push(row)
            leafNode = node
          }
          currId = node.parentId
        }
      } else {
        const key = `UNMAPPED_${orgId}_${ccCode || 'SEM_CC'}`
        if (!nodesMap.has(key)) {
          const mappedAccount = getMappedAccountForCC(row.c_custo, orgId)

          let hierarchyArray: any[] = []
          if (mappedAccount && mappedAccount.classification) {
            const parts = mappedAccount.classification.split('.')
            let currentClass = ''
            for (let i = 0; i < parts.length; i++) {
              currentClass += (i === 0 ? '' : '.') + parts[i]
              const parentAcc = chartOfAccounts.find(
                (c) =>
                  c.classification === currentClass &&
                  c.organization_id === mappedAccount.organization_id,
              )
              if (parentAcc) hierarchyArray.push(parentAcc)
            }
          }

          nodesMap.set(key, {
            id: key,
            dbId: null,
            c_custo: row.c_custo || 'SEM_CC',
            descricao_c_custo: row.descricao_c_custo || 'Sem Centro de Custo',
            org_id: orgId,
            mappedAccount,
            hierarchyArray,
            status: mappedAccount ? 'Mapeado' : 'Pendente',
            count: 0,
            total: 0,
            total_bruto: 0,
            rows: [],
            children: [],
            isSynthetic: false,
            level: 0,
            parentId: null,
          })
        }
        const node = nodesMap.get(key)
        node.count++
        node.total += Number(row.valor_liquido || row.valor || 0)
        node.total_bruto += Number(row.valor || 0)
        node.rows.push(row)
      }
    })

    const roots: any[] = []
    nodesMap.forEach((node) => {
      if (node.parentId) {
        const parentKey = `${node.org_id}_${node.parentId}`
        const parent = nodesMap.get(parentKey)
        if (parent) {
          parent.children.push(node)
          parent.isSynthetic = true
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    const sortTree = (nodes: any[], level: number) => {
      nodes.sort((a, b) => {
        if (a.c_custo === 'SEM_CC') return 1
        if (b.c_custo === 'SEM_CC') return -1
        return (a.c_custo || '').localeCompare(b.c_custo || '')
      })
      nodes.forEach((n) => {
        n.level = level
        sortTree(n.children, level + 1)
      })
    }
    sortTree(roots, 0)

    return roots
  }, [summaryData, costCenters, mappings, chartOfAccounts])

  const flatLeaves = useMemo(() => {
    const result: any[] = []
    const traverse = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (!n.isSynthetic) result.push(n)
        if (n.children) traverse(n.children)
      })
    }
    traverse(deParaTree)
    return result
  }, [deParaTree])

  const [resumoSortColumn, setResumoSortColumn] = useState<string>('c_custo')
  const [resumoSortDirection, setResumoSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showSyntheticLevels, setShowSyntheticLevels] = useState(true)

  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('fin_mov_visible_cards')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.cruzamento_contabil === undefined) {
          parsed.cruzamento_contabil = true
        }
        return parsed
      } catch (e) {
        return {}
      }
    }
    return {
      consolidado_contabil: true,
      cruzamento_contabil: true,
      consolidado_conta: true,
      consolidado_custo: true,
      mes_conta: true,
      conta_mes: true,
      mes_custo: true,
      custo_mes: true,
    }
  })

  useEffect(() => {
    localStorage.setItem('fin_mov_visible_cards', JSON.stringify(visibleCards))
  }, [visibleCards])

  const resumoFilterOptions = useMemo(() => {
    const options: Record<string, { label: string; value: string }[]> = {}
    const cCustoSet = new Set<string>()
    const contaContabilSet = new Set<string>()
    const statusSet = new Set<string>()
    const acaoSet = new Set<string>()

    flatLeaves.forEach((item) => {
      cCustoSet.add(
        item.c_custo ? `${item.c_custo} - ${item.descricao_c_custo || ''}` : 'Sem Centro de Custo',
      )
      contaContabilSet.add(
        item.mappedAccount
          ? `${item.mappedAccount.account_code} ${item.mappedAccount.classification ? item.mappedAccount.classification + ' ' : ''}${item.mappedAccount.account_name}`
          : 'Não vinculado',
      )
      statusSet.add(item.status)
      acaoSet.add(item.mappedAccount ? 'Editar' : 'Mapear')
    })

    options['c_custo'] = Array.from(cCustoSet)
      .sort()
      .map((v) => ({ label: v, value: v }))
    options['conta_contabil'] = Array.from(contaContabilSet)
      .sort()
      .map((v) => ({ label: v, value: v }))
    options['status'] = Array.from(statusSet)
      .sort()
      .map((v) => ({ label: v, value: v }))
    options['acao'] = Array.from(acaoSet)
      .sort()
      .map((v) => ({ label: v, value: v }))

    return options
  }, [flatLeaves])

  const filteredAndSortedTree = useMemo(() => {
    const filterNode = (node: any): any => {
      let match = true

      Object.entries(resumoFilters).forEach(([key, values]) => {
        if (!values || values.length === 0) return
        if (key === 'c_custo') {
          const val = node.c_custo
            ? `${node.c_custo} - ${node.descricao_c_custo || ''}`
            : 'Sem Centro de Custo'
          if (!values.includes(val)) match = false
        }
        if (key === 'conta_contabil') {
          const val = node.mappedAccount
            ? `${node.mappedAccount.account_code} ${node.mappedAccount.classification ? node.mappedAccount.classification + ' ' : ''}${node.mappedAccount.account_name}`
            : 'Não vinculado'
          if (!values.includes(val)) match = false
        }
        if (key === 'status') {
          if (!values.includes(node.status)) match = false
        }
        if (key === 'acao') {
          const val = node.mappedAccount ? 'Editar' : 'Mapear'
          if (!values.includes(val)) match = false
        }
      })

      const filteredChildren = node.children.map(filterNode).filter(Boolean)

      if (match || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren, isMatch: match }
      }
      return null
    }

    const filtered = deParaTree.map(filterNode).filter(Boolean)

    const sortNodes = (nodes: any[]) => {
      nodes.sort((a, b) => {
        let valA: any, valB: any
        if (resumoSortColumn === 'c_custo' || resumoSortColumn === 'c_custo_codigo') {
          valA = a.c_custo || ''
          valB = b.c_custo || ''
        } else if (resumoSortColumn === 'c_custo_nome') {
          valA = a.descricao_c_custo || ''
          valB = b.descricao_c_custo || ''
        } else if (
          resumoSortColumn === 'conta_contabil' ||
          resumoSortColumn === 'conta_contabil_reduzido'
        ) {
          valA = a.mappedAccount ? a.mappedAccount.account_code : ''
          valB = b.mappedAccount ? b.mappedAccount.account_code : ''
        } else if (resumoSortColumn === 'conta_contabil_classificacao') {
          valA = a.mappedAccount ? a.mappedAccount.classification || '' : ''
          valB = b.mappedAccount ? b.mappedAccount.classification || '' : ''
        } else if (resumoSortColumn === 'conta_contabil_nome') {
          valA = a.mappedAccount ? a.mappedAccount.account_name || '' : ''
          valB = b.mappedAccount ? b.mappedAccount.account_name || '' : ''
        } else if (resumoSortColumn === 'status') {
          valA = a.status
          valB = b.status
        } else if (resumoSortColumn === 'count') {
          valA = a.count
          valB = b.count
        } else if (resumoSortColumn === 'total_bruto') {
          valA = a.total_bruto
          valB = b.total_bruto
        } else if (resumoSortColumn === 'total_liquido') {
          valA = a.total
          valB = b.total
        } else if (resumoSortColumn === 'acao') {
          valA = a.mappedAccount ? 1 : 0
          valB = b.mappedAccount ? 1 : 0
        }

        if (valA < valB) return resumoSortDirection === 'asc' ? -1 : 1
        if (valA > valB) return resumoSortDirection === 'asc' ? 1 : -1
        return 0
      })
      nodes.forEach((n) => sortNodes(n.children))
    }

    sortNodes(filtered)
    return filtered
  }, [deParaTree, resumoFilters, resumoSortColumn, resumoSortDirection])

  const flattenedTreeRows = useMemo(() => {
    const result: any[] = []

    if (!showSyntheticLevels) {
      const getLeaves = (nodes: any[]) => {
        nodes.forEach((node) => {
          if (!node.isSynthetic) {
            result.push({ type: 'node', data: node })
            if (expandedNodes[node.id] && node.hierarchyArray && node.hierarchyArray.length > 0) {
              result.push({ type: 'inline-header', data: node })
              node.hierarchyArray.forEach((hNode: any) => {
                result.push({ type: 'inline-node', data: node, hNode })
              })
            }
          }
          if (node.children && node.children.length > 0) {
            getLeaves(node.children)
          }
        })
      }
      getLeaves(filteredAndSortedTree)
      return result
    }

    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        result.push({ type: 'node', data: node })
        if (expandedNodes[node.id]) {
          if (node.children && node.children.length > 0) {
            traverse(node.children)
          } else if (node.hierarchyArray && node.hierarchyArray.length > 0) {
            result.push({ type: 'inline-header', data: node })
            node.hierarchyArray.forEach((hNode: any) => {
              result.push({ type: 'inline-node', data: node, hNode })
            })
          }
        }
      })
    }
    traverse(filteredAndSortedTree)
    return result
  }, [filteredAndSortedTree, expandedNodes, showSyntheticLevels])

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    const traverse = (nodes: any[]) => {
      nodes.forEach((n) => {
        all[n.id] = true
        traverse(n.children)
      })
    }
    traverse(deParaTree)
    setExpandedNodes(all)
  }

  const expandAnalytic = () => {
    const analytic: Record<string, boolean> = {}
    const traverse = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          analytic[n.id] = true
          traverse(n.children)
        }
      })
    }
    traverse(deParaTree)
    setExpandedNodes(analytic)
  }

  const collapseAll = () => setExpandedNodes({})

  const handleSortResumo = (col: string) => {
    if (resumoSortColumn === col) {
      setResumoSortDirection(resumoSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setResumoSortColumn(col)
      setResumoSortDirection('asc')
    }
  }

  const renderResumoSortIcon = (key: string) => {
    const isActive = resumoSortColumn.startsWith(key) || resumoSortColumn === key
    if (!isActive) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50 text-indigo-300" />
    return resumoSortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-white" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-white" />
    )
  }

  const dashboardData = useMemo(() => {
    let revenue = 0
    let expense = 0

    const costCenterMap = new Map<string, number>()
    const monthlyMap = new Map<string, { month: string; revenue: number; expense: number }>()
    const ccMonthlyMap = new Map<string, Record<string, number>>()

    const availableMonthsSet = new Set<string>()

    summaryData.forEach((row) => {
      const dateStr = row[summaryDateBase] as string
      if (!dateStr) return
      const month = dateStr.substring(0, 7) // YYYY-MM
      availableMonthsSet.add(month)
    })

    const allMonths = Array.from(availableMonthsSet).sort()

    let startM = dashSelectedPeriodStart
    let endM = dashSelectedPeriodEnd
    if (!startM && allMonths.length > 0) startM = allMonths[Math.max(0, allMonths.length - 12)]
    if (!endM && allMonths.length > 0) endM = allMonths[allMonths.length - 1]

    const filteredData = summaryData.filter((row) => {
      const dateStr = row[summaryDateBase] as string
      if (!dateStr) return false
      const m = dateStr.substring(0, 7)
      if (startM && m < startM) return false
      if (endM && m > endM) return false
      return true
    })

    filteredData.forEach((row) => {
      const val = Number(row.valor_liquido || 0)
      if (val > 0) revenue += val
      else expense += Math.abs(val)

      const ccName = row.descricao_c_custo || row.c_custo || 'Sem C. Custo'

      if (val < 0) {
        costCenterMap.set(ccName, (costCenterMap.get(ccName) || 0) + Math.abs(val))
      }

      const dateStr = row[summaryDateBase] as string
      if (dateStr) {
        const month = dateStr.substring(0, 7)

        if (!monthlyMap.has(month)) monthlyMap.set(month, { month, revenue: 0, expense: 0 })
        const mData = monthlyMap.get(month)!
        if (val > 0) mData.revenue += val
        else mData.expense += Math.abs(val)

        if (val < 0) {
          if (!ccMonthlyMap.has(month)) ccMonthlyMap.set(month, {})
          const ccMonth = ccMonthlyMap.get(month)!
          ccMonth[ccName] = (ccMonth[ccName] || 0) + Math.abs(val)
        }
      }
    })

    const COLORS = [
      '#4f46e5',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#0ea5e9',
      '#f97316',
      '#ec4899',
      '#14b8a6',
      '#84cc16',
    ]

    const topExpenses = Array.from(costCenterMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length],
      }))

    const pieConfig = topExpenses.reduce(
      (acc, curr, index) => {
        acc[`expense_${index}`] = { label: curr.name, color: curr.fill }
        return acc
      },
      {} as Record<string, any>,
    )

    const activeMonths = allMonths.filter((m) => (!startM || m >= startM) && (!endM || m <= endM))

    const monthlyTrends = activeMonths.map((month) => {
      const [y, mo] = month.split('-')
      const mData = monthlyMap.get(month) || { month, revenue: 0, expense: 0 }
      const ccData = ccMonthlyMap.get(month) || {}
      return {
        ...mData,
        monthLabel: `${mo}/${y}`,
        ...ccData,
      }
    })

    const availableCCs = Array.from(costCenterMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map((e) => e[0])
    let compareCCs = dashSelectedCCs.length > 0 ? dashSelectedCCs : availableCCs.slice(0, 5)

    const ccMetrics = compareCCs.map((ccName, idx) => {
      const values = activeMonths.map((m) => ccMonthlyMap.get(m)?.[ccName] || 0)
      const firstVal = values[0] || 0
      const lastVal = values[values.length - 1] || 0
      const growth =
        firstVal === 0 ? (lastVal > 0 ? 100 : 0) : ((lastVal - firstVal) / firstVal) * 100
      const peakValue = Math.max(...values, 0)
      const color = COLORS[idx % COLORS.length]

      return {
        name: ccName,
        growth,
        peakValue,
        color,
      }
    })

    const compareConfig = compareCCs.reduce(
      (acc, ccName, idx) => {
        acc[ccName] = { label: ccName, color: COLORS[idx % COLORS.length] }
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      revenue,
      expense,
      balance: revenue - expense,
      topExpenses,
      pieConfig,
      monthlyTrends,
      allMonths,
      startM,
      endM,
      availableCCs,
      compareCCs,
      ccMetrics,
      compareConfig,
    }
  }, [
    summaryData,
    summaryDateBase,
    dashSelectedPeriodStart,
    dashSelectedPeriodEnd,
    dashSelectedCCs,
  ])

  // --- New states for "Análise por Grupos" ---
  const [analiseGrupoTipo, setAnaliseGrupoTipo] = useState<string[]>([
    'receita',
    'despesa',
    'resultado',
  ])
  const [groupAnalysisPath, setGroupAnalysisPath] = useState<any[]>([])

  // --- States for Comparativo Inter-Grupos ---
  const [compareGroup1, setCompareGroup1] = useState<string>('')
  const [compareGroup2, setCompareGroup2] = useState<string>('')

  // --- States for Group Analysis Period Filters ---
  const [grupoGlobalPeriodStart, setGrupoGlobalPeriodStart] = useState<string>('')
  const [grupoGlobalPeriodEnd, setGrupoGlobalPeriodEnd] = useState<string>('')

  const [isPartSynced, setIsPartSynced] = useState<boolean>(true)
  const [grupoPartPeriodStart, setGrupoPartPeriodStart] = useState<string>('')
  const [grupoPartPeriodEnd, setGrupoPartPeriodEnd] = useState<string>('')
  const [grupoPartDateBase, setGrupoPartDateBase] = useState<string>('')
  const [grupoPartTipo, setGrupoPartTipo] = useState<string[]>([])

  const [isEvolSynced, setIsEvolSynced] = useState<boolean>(true)
  const [grupoEvolPeriodStart, setGrupoEvolPeriodStart] = useState<string>('')
  const [grupoEvolPeriodEnd, setGrupoEvolPeriodEnd] = useState<string>('')
  const [grupoEvolDateBase, setGrupoEvolDateBase] = useState<string>('')
  const [grupoEvolTipo, setGrupoEvolTipo] = useState<string[]>([])

  const [isCompSynced, setIsCompSynced] = useState<boolean>(true)
  const [grupoCompPeriodStart, setGrupoCompPeriodStart] = useState<string>('')
  const [grupoCompPeriodEnd, setGrupoCompPeriodEnd] = useState<string>('')
  const [grupoCompDateBase, setGrupoCompDateBase] = useState<string>('')
  const [grupoCompTipo, setGrupoCompTipo] = useState<string[]>([])

  const [isTableSynced, setIsTableSynced] = useState<boolean>(true)
  const [grupoTablePeriodStart, setGrupoTablePeriodStart] = useState<string>('')
  const [grupoTablePeriodEnd, setGrupoTablePeriodEnd] = useState<string>('')
  const [grupoTableDateBase, setGrupoTableDateBase] = useState<string>('')
  const [grupoTableTipo, setGrupoTableTipo] = useState<string[]>([])

  const effPartStart = isPartSynced ? grupoGlobalPeriodStart : grupoPartPeriodStart
  const effPartEnd = isPartSynced ? grupoGlobalPeriodEnd : grupoPartPeriodEnd
  const effPartDateBase = isPartSynced ? summaryDateBase : grupoPartDateBase || summaryDateBase
  const effPartTipo = isPartSynced ? analiseGrupoTipo : grupoPartTipo

  const effEvolStart = isEvolSynced ? grupoGlobalPeriodStart : grupoEvolPeriodStart
  const effEvolEnd = isEvolSynced ? grupoGlobalPeriodEnd : grupoEvolPeriodEnd
  const effEvolDateBase = isEvolSynced ? summaryDateBase : grupoEvolDateBase || summaryDateBase
  const effEvolTipo = isEvolSynced ? analiseGrupoTipo : grupoEvolTipo

  const effCompStart = isCompSynced ? grupoGlobalPeriodStart : grupoCompPeriodStart
  const effCompEnd = isCompSynced ? grupoGlobalPeriodEnd : grupoCompPeriodEnd
  const effCompDateBase = isCompSynced ? summaryDateBase : grupoCompDateBase || summaryDateBase
  const effCompTipo = isCompSynced ? analiseGrupoTipo : grupoCompTipo

  const effTableStart = isTableSynced ? grupoGlobalPeriodStart : grupoTablePeriodStart
  const effTableEnd = isTableSynced ? grupoGlobalPeriodEnd : grupoTablePeriodEnd
  const effTableDateBase = isTableSynced ? summaryDateBase : grupoTableDateBase || summaryDateBase
  const effTableTipo = isTableSynced ? analiseGrupoTipo : grupoTableTipo

  const groupAnalysisData = useMemo(() => {
    const monthsSetEmissao = new Set<string>()
    const monthsSetCompens = new Set<string>()

    summaryData.forEach((row) => {
      const de = row.data_emissao
      if (de) monthsSetEmissao.add(de.substring(0, 7))
      const dc = row.dt_compens
      if (dc) monthsSetCompens.add(dc.substring(0, 7))
    })

    const monthsEmissao = Array.from(monthsSetEmissao).sort()
    const monthsCompens = Array.from(monthsSetCompens).sort()

    const nodesMap = new Map<string, any>()
    costCenters.forEach((cc) => {
      nodesMap.set(cc.id, {
        ...cc,
        children: [],
        total: 0,
        revenue: 0,
        expense: 0,
        monthlyTotals: { data_emissao: {}, dt_compens: {} },
        monthlyRevenue: { data_emissao: {}, dt_compens: {} },
        monthlyExpense: { data_emissao: {}, dt_compens: {} },
      })
    })

    const roots: any[] = []
    costCenters.forEach((cc) => {
      if (cc.parent_id && nodesMap.has(cc.parent_id)) {
        nodesMap.get(cc.parent_id).children.push(nodesMap.get(cc.id))
      } else {
        roots.push(nodesMap.get(cc.id))
      }
    })

    const unmappedRoot = {
      id: 'unmapped',
      code: 'S/C',
      description: 'Sem Centro de Custo',
      children: [],
      total: 0,
      revenue: 0,
      expense: 0,
      monthlyTotals: { data_emissao: {}, dt_compens: {} } as any,
      monthlyRevenue: { data_emissao: {}, dt_compens: {} } as any,
      monthlyExpense: { data_emissao: {}, dt_compens: {} } as any,
    }

    const addValueToNodeAndAncestors = (
      nodeId: string,
      monthEmissao: string,
      monthCompens: string,
      value: number,
    ) => {
      let curr = nodesMap.get(nodeId)
      while (curr) {
        curr.total += value
        if (value > 0) curr.revenue += value
        else curr.expense += Math.abs(value)

        curr.monthlyTotals.data_emissao[monthEmissao] =
          (curr.monthlyTotals.data_emissao[monthEmissao] || 0) + value
        curr.monthlyTotals.dt_compens[monthCompens] =
          (curr.monthlyTotals.dt_compens[monthCompens] || 0) + value

        if (value > 0) {
          curr.monthlyRevenue.data_emissao[monthEmissao] =
            (curr.monthlyRevenue.data_emissao[monthEmissao] || 0) + value
          curr.monthlyRevenue.dt_compens[monthCompens] =
            (curr.monthlyRevenue.dt_compens[monthCompens] || 0) + value
        } else {
          curr.monthlyExpense.data_emissao[monthEmissao] =
            (curr.monthlyExpense.data_emissao[monthEmissao] || 0) + Math.abs(value)
          curr.monthlyExpense.dt_compens[monthCompens] =
            (curr.monthlyExpense.dt_compens[monthCompens] || 0) + Math.abs(value)
        }

        curr = curr.parent_id ? nodesMap.get(curr.parent_id) : null
      }
    }

    summaryData.forEach((row) => {
      const val = Number(row.valor_liquido || row.valor || 0)
      const de = row.data_emissao
      const dc = row.dt_compens
      const monthEmissao = de ? de.substring(0, 7) : 'unknown'
      const monthCompens = dc ? dc.substring(0, 7) : 'unknown'

      const orgId = row.organization_id
      const ccCode = row.c_custo?.trim().toUpperCase()

      let matchedCcId = null
      if (ccCode && orgId) {
        const match = costCenters.find(
          (c) => c.organization_id === orgId && c.code?.trim().toUpperCase() === ccCode,
        )
        if (match) matchedCcId = match.id
      }

      if (matchedCcId) {
        addValueToNodeAndAncestors(matchedCcId, monthEmissao, monthCompens, val)
      } else {
        unmappedRoot.total += val
        if (val > 0) unmappedRoot.revenue += val
        else unmappedRoot.expense += Math.abs(val)

        unmappedRoot.monthlyTotals.data_emissao[monthEmissao] =
          (unmappedRoot.monthlyTotals.data_emissao[monthEmissao] || 0) + val
        unmappedRoot.monthlyTotals.dt_compens[monthCompens] =
          (unmappedRoot.monthlyTotals.dt_compens[monthCompens] || 0) + val
        if (val > 0) {
          unmappedRoot.monthlyRevenue.data_emissao[monthEmissao] =
            (unmappedRoot.monthlyRevenue.data_emissao[monthEmissao] || 0) + val
          unmappedRoot.monthlyRevenue.dt_compens[monthCompens] =
            (unmappedRoot.monthlyRevenue.dt_compens[monthCompens] || 0) + val
        } else {
          unmappedRoot.monthlyExpense.data_emissao[monthEmissao] =
            (unmappedRoot.monthlyExpense.data_emissao[monthEmissao] || 0) + Math.abs(val)
          unmappedRoot.monthlyExpense.dt_compens[monthCompens] =
            (unmappedRoot.monthlyExpense.dt_compens[monthCompens] || 0) + Math.abs(val)
        }
      }
    })

    return { roots, nodesMap, unmappedRoot, monthsEmissao, monthsCompens }
  }, [summaryData, costCenters])

  const currentGroupAnalysisNodes = useMemo(() => {
    const currentNode =
      groupAnalysisPath.length > 0 ? groupAnalysisPath[groupAnalysisPath.length - 1] : null
    const childNodes = currentNode
      ? currentNode.children
      : [...groupAnalysisData.roots, groupAnalysisData.unmappedRoot]
    return childNodes.filter((c: any) => c.revenue > 0 || c.expense > 0 || Math.abs(c.total) > 0)
  }, [groupAnalysisPath, groupAnalysisData])

  const participationChartData = useMemo(() => {
    const months =
      effPartDateBase === 'data_emissao'
        ? groupAnalysisData.monthsEmissao
        : groupAnalysisData.monthsCompens
    return currentGroupAnalysisNodes
      .map((child: any) => {
        let val = 0
        months.forEach((month: string) => {
          if (effPartStart && month < effPartStart) return
          if (effPartEnd && month > effPartEnd) return
          if (effPartTipo.includes('receita'))
            val += child.monthlyRevenue[effPartDateBase][month] || 0
          if (effPartTipo.includes('despesa'))
            val += child.monthlyExpense[effPartDateBase][month] || 0
          if (effPartTipo.includes('resultado'))
            val += child.monthlyTotals[effPartDateBase][month] || 0
        })
        return {
          name: child.code ? `${child.code} - ${child.description}` : child.description,
          code: child.code || 'S/C',
          id: child.id,
          value: Math.abs(val),
        }
      })
      .filter((c: any) => c.value > 0)
      .sort((a: any, b: any) => b.value - a.value)
  }, [
    currentGroupAnalysisNodes,
    effPartTipo,
    groupAnalysisData,
    effPartStart,
    effPartEnd,
    effPartDateBase,
  ])

  const evolutionGroupChartData = useMemo(() => {
    const months =
      effEvolDateBase === 'data_emissao'
        ? groupAnalysisData.monthsEmissao
        : groupAnalysisData.monthsCompens
    const activeMonths = months.filter((m) => {
      if (effEvolStart && m < effEvolStart) return false
      if (effEvolEnd && m > effEvolEnd) return false
      return true
    })

    return activeMonths.map((month) => {
      const dataPoint: any = { month }
      currentGroupAnalysisNodes.forEach((child: any) => {
        let val = 0
        if (effEvolTipo.includes('receita'))
          val += child.monthlyRevenue[effEvolDateBase][month] || 0
        if (effEvolTipo.includes('despesa'))
          val += child.monthlyExpense[effEvolDateBase][month] || 0
        if (effEvolTipo.includes('resultado'))
          val += child.monthlyTotals[effEvolDateBase][month] || 0
        dataPoint[child.code || 'S/C'] = val
      })
      return dataPoint
    })
  }, [
    groupAnalysisData,
    currentGroupAnalysisNodes,
    effEvolTipo,
    effEvolStart,
    effEvolEnd,
    effEvolDateBase,
  ])

  const groupChartColors = [
    '#4f46e5',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#0ea5e9',
    '#f97316',
    '#ec4899',
    '#14b8a6',
    '#84cc16',
    '#6366f1',
    '#14b8a6',
    '#f43f5e',
    '#8b5cf6',
    '#06b6d4',
  ]

  const evolutionGroupChartConfig = useMemo(() => {
    const config: any = {}
    currentGroupAnalysisNodes.forEach((child: any, index: number) => {
      config[child.code || 'S/C'] = {
        label: child.code ? `${child.code} - ${child.description}` : child.description,
        color: groupChartColors[index % groupChartColors.length],
      }
    })
    return config
  }, [currentGroupAnalysisNodes])

  const handleGroupAnalysisDrillDown = (nodeId: string) => {
    const node = groupAnalysisData.nodesMap.get(nodeId)
    if (node && node.children.length > 0) {
      setGroupAnalysisPath((prev) => [...prev, node])
    }
  }

  const handleGroupAnalysisBreadcrumb = (index: number) => {
    if (index === -1) {
      setGroupAnalysisPath([])
    } else {
      setGroupAnalysisPath((prev) => prev.slice(0, index + 1))
    }
  }

  const [grupoTableExpanded, setGrupoTableExpanded] = useState<Record<string, boolean>>({})

  const flattenedTableData = useMemo(() => {
    const months =
      effTableDateBase === 'data_emissao'
        ? groupAnalysisData.monthsEmissao
        : groupAnalysisData.monthsCompens

    const processNodes = (nodes: any[], level: number) => {
      return nodes
        .map((child: any) => {
          let revenue = 0
          let expense = 0
          let total = 0
          months.forEach((month: string) => {
            if (effTableStart && month < effTableStart) return
            if (effTableEnd && month > effTableEnd) return
            revenue += child.monthlyRevenue[effTableDateBase][month] || 0
            expense += child.monthlyExpense[effTableDateBase][month] || 0
            total += child.monthlyTotals[effTableDateBase][month] || 0
          })
          return {
            ...child,
            periodRevenue: revenue,
            periodExpense: expense,
            periodTotal: total,
            level,
          }
        })
        .filter(
          (c: any) => c.periodRevenue > 0 || c.periodExpense > 0 || Math.abs(c.periodTotal) > 0,
        )
        .sort((a: any, b: any) => {
          const getVal = (item: any, types: string[]) => {
            let v = 0
            if (types.includes('receita')) v += item.periodRevenue
            if (types.includes('despesa')) v += item.periodExpense
            if (types.includes('resultado')) v += Math.abs(item.periodTotal)
            return v
          }
          return getVal(b, effTableTipo) - getVal(a, effTableTipo)
        })
    }

    const result: any[] = []
    const traverse = (nodes: any[], level: number) => {
      const processed = processNodes(nodes, level)
      processed.forEach((node) => {
        result.push(node)
        if (grupoTableExpanded[node.id] && node.children && node.children.length > 0) {
          traverse(node.children, level + 1)
        }
      })
    }

    traverse(currentGroupAnalysisNodes, 0)
    return result
  }, [
    currentGroupAnalysisNodes,
    groupAnalysisData,
    effTableStart,
    effTableEnd,
    effTableTipo,
    effTableDateBase,
    grupoTableExpanded,
  ])

  const handleExpandAllTable = () => {
    const all: Record<string, boolean> = {}
    const traverse = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          all[n.id] = true
          traverse(n.children)
        }
      })
    }
    traverse(currentGroupAnalysisNodes)
    setGrupoTableExpanded(all)
  }

  const handleCollapseAllTable = () => {
    setGrupoTableExpanded({})
  }

  const compareGroupOptions = useMemo(() => {
    const options = Array.from(groupAnalysisData.nodesMap.values())
      .map((node) => ({
        label: node.code ? `${node.code} - ${node.description}` : node.description,
        value: node.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    options.push({ label: 'S/C - Sem Centro de Custo', value: 'unmapped' })
    return options
  }, [groupAnalysisData])

  const interGroupComparisonData = useMemo(() => {
    if (!compareGroup1 || !compareGroup2) return []

    const node1 =
      compareGroup1 === 'unmapped'
        ? groupAnalysisData.unmappedRoot
        : groupAnalysisData.nodesMap.get(compareGroup1)
    const node2 =
      compareGroup2 === 'unmapped'
        ? groupAnalysisData.unmappedRoot
        : groupAnalysisData.nodesMap.get(compareGroup2)

    if (!node1 || !node2) return []

    const months =
      effCompDateBase === 'data_emissao'
        ? groupAnalysisData.monthsEmissao
        : groupAnalysisData.monthsCompens
    const activeMonths = months.filter((m) => {
      if (effCompStart && m < effCompStart) return false
      if (effCompEnd && m > effCompEnd) return false
      return true
    })

    return activeMonths.map((month) => {
      let val1 = 0
      let val2 = 0

      if (effCompTipo.includes('receita')) {
        val1 += node1.monthlyRevenue[effCompDateBase][month] || 0
        val2 += node2.monthlyRevenue[effCompDateBase][month] || 0
      }
      if (effCompTipo.includes('despesa')) {
        val1 += node1.monthlyExpense[effCompDateBase][month] || 0
        val2 += node2.monthlyExpense[effCompDateBase][month] || 0
      }
      if (effCompTipo.includes('resultado')) {
        val1 += node1.monthlyTotals[effCompDateBase][month] || 0
        val2 += node2.monthlyTotals[effCompDateBase][month] || 0
      }

      return {
        month,
        group1: Math.abs(val1),
        group2: Math.abs(val2),
      }
    })
  }, [
    compareGroup1,
    compareGroup2,
    groupAnalysisData,
    effCompTipo,
    effCompStart,
    effCompEnd,
    effCompDateBase,
  ])

  const interGroupSummary = useMemo(() => {
    if (!compareGroup1 || !compareGroup2) return null

    const node1 =
      compareGroup1 === 'unmapped'
        ? groupAnalysisData.unmappedRoot
        : groupAnalysisData.nodesMap.get(compareGroup1)
    const node2 =
      compareGroup2 === 'unmapped'
        ? groupAnalysisData.unmappedRoot
        : groupAnalysisData.nodesMap.get(compareGroup2)

    if (!node1 || !node2) return null

    let total1 = 0
    let total2 = 0

    const months =
      effCompDateBase === 'data_emissao'
        ? groupAnalysisData.monthsEmissao
        : groupAnalysisData.monthsCompens
    const activeMonths = months.filter((m) => {
      if (effCompStart && m < effCompStart) return false
      if (effCompEnd && m > effCompEnd) return false
      return true
    })

    activeMonths.forEach((month) => {
      if (effCompTipo.includes('receita')) {
        total1 += node1.monthlyRevenue[effCompDateBase][month] || 0
        total2 += node2.monthlyRevenue[effCompDateBase][month] || 0
      }
      if (effCompTipo.includes('despesa')) {
        total1 += node1.monthlyExpense[effCompDateBase][month] || 0
        total2 += node2.monthlyExpense[effCompDateBase][month] || 0
      }
      if (effCompTipo.includes('resultado')) {
        total1 += node1.monthlyTotals[effCompDateBase][month] || 0
        total2 += node2.monthlyTotals[effCompDateBase][month] || 0
      }
    })

    // Comparing absolute values
    const val1 = Math.abs(total1)
    const val2 = Math.abs(total2)
    const diffAbs = val1 - val2
    const diffPct = val2 !== 0 ? (diffAbs / val2) * 100 : val1 !== 0 ? 100 : 0

    return {
      name1: node1.code ? `${node1.code} - ${node1.description}` : node1.description,
      name2: node2.code ? `${node2.code} - ${node2.description}` : node2.description,
      total1: val1,
      total2: val2,
      diffAbs,
      diffPct,
    }
  }, [
    compareGroup1,
    compareGroup2,
    groupAnalysisData,
    effCompTipo,
    effCompStart,
    effCompEnd,
    effCompDateBase,
  ])

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm mr-2">
            <div className="flex items-center gap-1" title="Tamanho da Fonte das Tabelas">
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
            </div>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <TableSettingsControls prefs={prefs} updatePrefs={updatePrefs} />
          </div>
          <Button
            variant="outline"
            onClick={syncMappings}
            disabled={isSyncing || loading}
            className="shadow-sm"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar Mapeamentos
          </Button>
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
          <Button
            variant="default"
            onClick={() => setGenerateModalOpen(true)}
            className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={totalCount === 0 || loading}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Gerar Lançamentos Contábeis
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
              variant="default"
              size="sm"
              onClick={() => setGenerateModalOpen(true)}
              className="flex-1 sm:flex-none shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Efetivar Lançamentos
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
        <TabsList className="bg-slate-100/80 p-1.5 w-full flex flex-wrap gap-1.5 h-auto justify-start border border-slate-200 shadow-sm rounded-lg">
          {tabsOrder.map((tabId) => {
            const tabConfig = defaultTabsOrderConfig.find((t) => t.id === tabId)
            if (!tabConfig) return null
            return (
              <TabsTrigger
                key={tabId}
                value={tabId}
                draggable
                onDragStart={(e) => {
                  setDraggedTab(tabId)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!draggedTab || draggedTab === tabId) return
                  const newOrder = [...tabsOrder]
                  const draggedIdx = newOrder.indexOf(draggedTab)
                  const targetIdx = newOrder.indexOf(tabId)
                  newOrder.splice(draggedIdx, 1)
                  newOrder.splice(targetIdx, 0, draggedTab)
                  setTabsOrder(newOrder)
                  setDraggedTab(null)
                }}
                onDragEnd={() => setDraggedTab(null)}
                className={cn(
                  'whitespace-nowrap px-4 py-2 font-medium transition-all data-[state=active]:font-bold data-[state=active]:shadow-md rounded-md cursor-grab active:cursor-grabbing',
                  tabConfig.activeClass,
                  tabConfig.inactiveClass,
                  draggedTab === tabId ? 'opacity-50' : '',
                )}
              >
                {tabConfig.label}
              </TabsTrigger>
            )
          })}
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
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md shadow-sm h-7 mr-1 transition-all">
                    <div className="scale-75 origin-left flex items-center">
                      <Switch
                        id="simplified-mode"
                        checked={isSimplifiedMode}
                        onCheckedChange={toggleSimplifiedMode}
                      />
                    </div>
                    <Label
                      htmlFor="simplified-mode"
                      className={cn(
                        'text-[10px] font-bold cursor-pointer whitespace-nowrap -ml-1 uppercase tracking-wider',
                        isSimplifiedMode ? 'text-indigo-700' : 'text-slate-600',
                      )}
                    >
                      Simplificado
                    </Label>
                  </div>

                  <Select
                    value={filters['natureza']?.length === 1 ? filters['natureza'][0] : 'todos'}
                    onValueChange={(v) => {
                      if (v === 'todos') {
                        setFilters((p) => ({ ...p, natureza: [] }))
                      } else {
                        setFilters((p) => ({ ...p, natureza: [v] }))
                      }
                      setPage(0)
                    }}
                  >
                    <SelectTrigger className="h-7 w-[160px] text-xs font-semibold bg-white border-slate-200">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-normal">Natureza:</span>
                        <SelectValue placeholder="Todas" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="positivo">Entradas (+)</SelectItem>
                      <SelectItem value="negativo">Saídas (-)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex items-center gap-1.5 px-2 relative"
                    onClick={() => setFiltersOpen(true)}
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

                  <FloatingPanel
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    title="Filtros"
                    widthClass="w-[calc(100vw-2rem)] sm:w-[600px] md:w-[800px] lg:w-[1000px]"
                  >
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
                              const isNaturezaActive =
                                filters['natureza'] && filters['natureza'].length > 0
                              return (
                                <div
                                  key={key}
                                  className={cn(
                                    'space-y-1.5 p-2 border rounded-md cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col',
                                    isNaturezaActive
                                      ? 'bg-[#800000] border-[#800000] shadow-sm'
                                      : 'bg-white border-slate-200 hover:border-slate-300',
                                    draggedFilter === key ? 'opacity-50' : '',
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
                                  <Label
                                    className={cn(
                                      'text-xs flex items-center gap-1.5 font-semibold',
                                      isNaturezaActive ? 'text-white' : 'text-slate-700',
                                    )}
                                  >
                                    <GripHorizontal
                                      className={cn(
                                        'h-3.5 w-3.5 flex-shrink-0',
                                        isNaturezaActive ? 'text-white/70' : 'text-slate-400',
                                      )}
                                    />
                                    Natureza
                                  </Label>
                                  <MultiSelect
                                    title="Ambas"
                                    options={[
                                      { label: 'Entradas (+)', value: 'positivo' },
                                      { label: 'Saídas (-)', value: 'negativo' },
                                    ]}
                                    selected={filters['natureza'] || []}
                                    isActive={isNaturezaActive}
                                    onChange={(v) => {
                                      setFilters((p) => ({ ...p, natureza: v }))
                                      setPage(0)
                                    }}
                                  />
                                  {isNaturezaActive && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(filters['natureza'] || []).map((val) => (
                                        <span
                                          key={val}
                                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white truncate max-w-full"
                                        >
                                          {val === 'positivo' ? 'Entradas (+)' : 'Saídas (-)'}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            }

                            const h = tableHeaders.find((th) => th.key === key)
                            if (!h) return null
                            const isColActive = filters[h.key] && filters[h.key].length > 0

                            return (
                              <div
                                key={h.key}
                                className={cn(
                                  'space-y-1.5 p-2 border rounded-md cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col',
                                  isColActive
                                    ? 'bg-[#800000] border-[#800000] shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-slate-300',
                                  draggedFilter === h.key ? 'opacity-50' : '',
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
                                  className={cn(
                                    'text-xs truncate flex items-center gap-1.5 font-semibold',
                                    isColActive ? 'text-white' : 'text-slate-700',
                                  )}
                                  title={h.label}
                                >
                                  <GripHorizontal
                                    className={cn(
                                      'h-3.5 w-3.5 flex-shrink-0',
                                      isColActive ? 'text-white/70' : 'text-slate-400',
                                    )}
                                  />
                                  {h.label}
                                </Label>
                                <MultiSelect
                                  title="Todos"
                                  options={filterOptions[h.key] || []}
                                  selected={filters[h.key] || []}
                                  isActive={isColActive}
                                  onChange={(v) => {
                                    setFilters((p) => ({ ...p, [h.key]: v }))
                                    setPage(0)
                                  }}
                                />
                                {isColActive && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(filters[h.key] || []).map((val) => {
                                      const opt = (filterOptions[h.key] || []).find(
                                        (o) => o.value === val,
                                      )
                                      const label = opt ? opt.label : val
                                      return (
                                        <span
                                          key={val}
                                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white truncate max-w-full"
                                          title={label}
                                        >
                                          {label}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
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
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </FloatingPanel>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex items-center gap-1.5 px-2 relative"
                    onClick={() => setColumnsOpen(true)}
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

                  <TableSettingsControls prefs={prefs} updatePrefs={updatePrefs} />

                  <div
                    className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-md p-0.5 border border-slate-200"
                    title="Tamanho da Fonte da Tabela"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-transparent"
                      onClick={() => setTableFontSize((p) => Math.max(8, p - 1))}
                    >
                      A-
                    </Button>
                    <span className="text-[10px] font-medium text-slate-500 w-4 text-center select-none">
                      {tableFontSize}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-transparent"
                      onClick={() => setTableFontSize((p) => Math.min(24, p + 1))}
                    >
                      A+
                    </Button>
                  </div>

                  <FloatingPanel
                    open={columnsOpen}
                    onClose={() => setColumnsOpen(false)}
                    title="Configuração de Colunas"
                    widthClass="w-[calc(100vw-2rem)] sm:w-[500px] md:w-[700px] lg:w-[800px]"
                  >
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
                  </FloatingPanel>

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
              <div className="p-4 border-b bg-slate-50/50 flex flex-col xl:flex-row items-center justify-between shadow-sm gap-4 overflow-hidden">
                <div className="flex flex-1 overflow-x-auto custom-scrollbar pb-2 xl:pb-0 items-center justify-start gap-4 w-full">
                  <div className="card-plano-contas bg-bruto">
                    <span className="titulo">Total (Bruto)</span>
                    <span
                      className="valor"
                      title={new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.valor)}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.valor)}
                    </span>
                    <CircleDollarSign className="icone" />
                  </div>
                  <div className="card-plano-contas bg-liquido">
                    <span className="titulo">Total (Líquido)</span>
                    <span
                      className="valor"
                      title={new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.valor_liquido)}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.valor_liquido)}
                    </span>
                    <Wallet className="icone" />
                  </div>
                  <div
                    className={cn(
                      'card-plano-contas bg-positivos cursor-pointer transition-all hover:scale-[1.02] hover:ring-2 hover:ring-offset-2 hover:ring-blue-400',
                      filters['natureza']?.length === 1 && filters['natureza'][0] === 'positivo'
                        ? 'ring-2 ring-offset-2 ring-blue-600 scale-[1.02] shadow-lg'
                        : '',
                    )}
                    onClick={() => {
                      const isPos =
                        filters['natureza']?.length === 1 && filters['natureza'][0] === 'positivo'
                      setFilters((p) => ({ ...p, natureza: isPos ? [] : ['positivo'] }))
                      setPage(0)
                    }}
                  >
                    <span className="titulo">Entradas / Positivos</span>
                    <span
                      className="valor"
                      title={new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.entradas)}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.entradas)}
                    </span>
                    <TrendingUp className="icone" />
                  </div>
                  <div
                    className={cn(
                      'card-plano-contas bg-negativos cursor-pointer transition-all hover:scale-[1.02] hover:ring-2 hover:ring-offset-2 hover:ring-red-400',
                      filters['natureza']?.length === 1 && filters['natureza'][0] === 'negativo'
                        ? 'ring-2 ring-offset-2 ring-red-800 scale-[1.02] shadow-lg'
                        : '',
                    )}
                    onClick={() => {
                      const isNeg =
                        filters['natureza']?.length === 1 && filters['natureza'][0] === 'negativo'
                      setFilters((p) => ({ ...p, natureza: isNeg ? [] : ['negativo'] }))
                      setPage(0)
                    }}
                  >
                    <span className="titulo">Saídas / Negativos</span>
                    <span
                      className="valor"
                      title={new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.saidas)}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totals.saidas)}
                    </span>
                    <TrendingDown className="icone" />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 xl:ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 shadow-sm bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Exportar Dados
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                          Apenas Filtrados
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleExport('filtered', 'excel')}
                          className="text-xs cursor-pointer py-2"
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel (XLSX)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport('filtered', 'pdf')}
                          className="text-xs cursor-pointer py-2"
                        >
                          <FileText className="mr-2 h-4 w-4 text-red-600" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport('filtered', 'txt')}
                          className="text-xs cursor-pointer py-2"
                        >
                          <FileText className="mr-2 h-4 w-4 text-slate-600" /> Texto (TXT)
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                          Todos os Registros
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleExport('all', 'excel')}
                          className="text-xs cursor-pointer py-2"
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel (XLSX)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport('all', 'pdf')}
                          className="text-xs cursor-pointer py-2"
                        >
                          <FileText className="mr-2 h-4 w-4 text-red-600" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport('all', 'txt')}
                          className="text-xs cursor-pointer py-2"
                        >
                          <FileText className="mr-2 h-4 w-4 text-slate-600" /> Texto (TXT)
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Table
                wrapperClassName="transform scale-y-[-1] overflow-x-auto overflow-y-hidden finance-table-scrollbar pb-3 border-4 border-indigo-950 rounded-lg"
                className="transform scale-y-[-1] w-full min-w-max"
              >
                <TableHeader>
                  <TableRow
                    disableZebra
                    className="bg-indigo-950 text-white font-bold hover:bg-indigo-900 border-none [&>th]:border-none [&>th]:text-white"
                  >
                    <TableHead
                      className="w-[40px] px-2 py-1 text-center align-middle"
                      style={getGridlineStyle()}
                    >
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
                            style={getGridlineStyle()}
                          >
                            <div className="flex items-center justify-between gap-1 w-full">
                              <div
                                className={cn(
                                  'flex items-center cursor-pointer hover:bg-indigo-800/50 rounded px-1 -ml-1 flex-1',
                                  (prefs.alignments?.[h.key] || h.align || 'left') === 'right'
                                    ? 'justify-end'
                                    : (prefs.alignments?.[h.key] || h.align || 'left') === 'center'
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
                                      <div className="flex items-center gap-1 p-1 border-b border-slate-100 bg-slate-50">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="h-6 flex-1 text-[10px]"
                                          onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setFilters((prev) => ({
                                              ...prev,
                                              [h.key]: options.map((o) => o.value),
                                            }))
                                            setPage(0)
                                          }}
                                        >
                                          Todos
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="h-6 flex-1 text-[10px]"
                                          onMouseDown={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setFilters((prev) => ({
                                              ...prev,
                                              [h.key]: [],
                                            }))
                                            setPage(0)
                                          }}
                                        >
                                          Nenhum
                                        </Button>
                                      </div>
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
                                                onMouseDown={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                }}
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
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                        Alinhamento
                                      </DropdownMenuLabel>
                                      <div className="flex items-center gap-1 px-2 py-1.5">
                                        <Button
                                          variant={
                                            (prefs.alignments?.[h.key] || h.align || 'left') ===
                                            'left'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updatePrefs({
                                              alignments: {
                                                ...(prefs.alignments || {}),
                                                [h.key]: 'left',
                                              },
                                            })
                                          }
                                          title="Alinhar à Esquerda"
                                        >
                                          <AlignLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant={
                                            (prefs.alignments?.[h.key] || h.align || 'left') ===
                                            'center'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updatePrefs({
                                              alignments: {
                                                ...(prefs.alignments || {}),
                                                [h.key]: 'center',
                                              },
                                            })
                                          }
                                          title="Centralizar"
                                        >
                                          <AlignCenter className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant={
                                            (prefs.alignments?.[h.key] || h.align || 'left') ===
                                            'right'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updatePrefs({
                                              alignments: {
                                                ...(prefs.alignments || {}),
                                                [h.key]: 'right',
                                              },
                                            })
                                          }
                                          title="Alinhar à Direita"
                                        >
                                          <AlignRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
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
                    <TableHead
                      className="h-8 px-2 py-1 text-sm font-bold whitespace-nowrap text-center"
                      style={getGridlineStyle()}
                    >
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

                        return (
                          <TableRow
                            key={row.id}
                            className="transition-colors border-0"
                            style={{ fontSize: `${tableFontSize}px` }}
                          >
                            <TableCell
                              className="px-2 py-0.5 text-center align-middle border-0"
                              style={getGridlineStyle()}
                            >
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={selectedIds.includes(row.id)}
                                  onCheckedChange={() => toggleRow(row.id)}
                                  aria-label="Selecionar registro"
                                  className="data-[state=checked]:bg-indigo-950 data-[state=checked]:text-white border-slate-400"
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
                                      <TableCell key={key} {...getCellProps(key, 'center')}>
                                        <Button
                                          variant="ghost"
                                          className={cn(
                                            'h-6 px-2.5 py-0 text-[0.85em] font-bold rounded-full border cursor-pointer transition-all',
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
                                        {...getCellProps(
                                          key,
                                          'left',
                                          'whitespace-nowrap max-w-[150px] truncate',
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
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.compensado || '-'}
                                      </TableCell>
                                    )
                                  case 'tipo_operacao':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.tipo_operacao || '-'}
                                      </TableCell>
                                    )
                                  case 'data_emissao':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            type="date"
                                            className="h-auto py-1 text-[inherit] px-1.5 w-32 !text-slate-900 min-h-6"
                                            value={editForm.data_emissao || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                data_emissao: e.target.value,
                                              })
                                            }
                                          />
                                        ) : (
                                          <span>
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
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {formatDate(row.dt_compens)}
                                      </TableCell>
                                    )
                                  case 'conta_caixa':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'max-w-[200px] truncate')}
                                        title={row.conta_caixa || ''}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 w-28 !text-slate-900 min-h-6"
                                            value={editForm.conta_caixa || ''}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                conta_caixa: e.target.value,
                                              })
                                            }
                                          />
                                        ) : (
                                          <div
                                            className={cn(
                                              'flex items-center gap-1.5 w-full',
                                              (prefs.alignments?.['conta_caixa'] || 'center') ===
                                                'center'
                                                ? 'justify-center'
                                                : (prefs.alignments?.['conta_caixa'] ||
                                                      'center') === 'right'
                                                  ? 'justify-end'
                                                  : 'justify-start',
                                            )}
                                          >
                                            <span className="font-medium text-slate-700">
                                              {row.conta_caixa || '-'}
                                            </span>
                                            {isSimplifiedMode &&
                                              row.conta_caixa &&
                                              row.nome_caixa && (
                                                <span className="text-slate-500 truncate">
                                                  - {row.nome_caixa}
                                                </span>
                                              )}
                                          </div>
                                        )}
                                      </TableCell>
                                    )
                                  case 'nome_caixa':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(
                                          key,
                                          'left',
                                          'whitespace-nowrap max-w-[150px] truncate',
                                        )}
                                        title={row.nome_caixa}
                                      >
                                        {row.nome_caixa || '-'}
                                      </TableCell>
                                    )
                                  case 'conta_debito': {
                                    const sim = getAccountingEntriesSimulation(row)
                                    const acc = sim.debitAccount
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {acc ? (
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-blue-200"
                                              title="Código Reduzido"
                                            >
                                              {acc.account_code}
                                            </span>
                                            {acc.classification && (
                                              <span
                                                className="font-mono text-[0.85em] font-semibold text-slate-600"
                                                title="Classificação"
                                              >
                                                {acc.classification}
                                              </span>
                                            )}
                                            <span
                                              className="truncate max-w-[200px]"
                                              title={acc.account_name}
                                            >
                                              {acc.account_name}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-red-500 italic text-[0.85em] font-medium bg-red-50 px-1.5 py-0.5 rounded">
                                            Pendente
                                          </span>
                                        )}
                                      </TableCell>
                                    )
                                  }
                                  case 'conta_credito': {
                                    const sim = getAccountingEntriesSimulation(row)
                                    const acc = sim.creditAccount
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {acc ? (
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className="font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-rose-200"
                                              title="Código Reduzido"
                                            >
                                              {acc.account_code}
                                            </span>
                                            {acc.classification && (
                                              <span
                                                className="font-mono text-[0.85em] font-semibold text-slate-600"
                                                title="Classificação"
                                              >
                                                {acc.classification}
                                              </span>
                                            )}
                                            <span
                                              className="truncate max-w-[200px]"
                                              title={acc.account_name}
                                            >
                                              {acc.account_name}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-red-500 italic text-[0.85em] font-medium bg-red-50 px-1.5 py-0.5 rounded">
                                            Pendente
                                          </span>
                                        )}
                                      </TableCell>
                                    )
                                  }
                                  case 'conta_caixa_destino':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.conta_caixa_destino || '-'}
                                      </TableCell>
                                    )
                                  case 'forma_pagto':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 w-24 !text-slate-900 min-h-6"
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
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 w-24 !text-slate-900 min-h-6"
                                            value={editForm.c_custo || ''}
                                            onChange={(e) =>
                                              setEditForm({ ...editForm, c_custo: e.target.value })
                                            }
                                          />
                                        ) : (
                                          <div
                                            className={cn(
                                              'flex items-center gap-1.5',
                                              (prefs.alignments?.['c_custo'] || 'left') === 'center'
                                                ? 'justify-center'
                                                : (prefs.alignments?.['c_custo'] || 'left') ===
                                                    'right'
                                                  ? 'justify-end'
                                                  : 'justify-start',
                                            )}
                                          >
                                            <span className="font-medium text-slate-700">
                                              {row.c_custo || 'Sem C. Custo'}
                                            </span>
                                            {isSimplifiedMode &&
                                              row.c_custo &&
                                              row.descricao_c_custo && (
                                                <span className="text-slate-500 truncate max-w-[200px]">
                                                  - {row.descricao_c_custo}
                                                </span>
                                              )}
                                          </div>
                                        )}
                                      </TableCell>
                                    )
                                  case 'descricao_c_custo':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(
                                          key,
                                          'left',
                                          'whitespace-nowrap max-w-[150px] truncate',
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
                                        {...getCellProps(
                                          key,
                                          'left',
                                          'whitespace-nowrap font-medium',
                                        )}
                                      >
                                        {row.valor !== null ? (
                                          <span
                                            className={cn(
                                              row.valor > 0
                                                ? 'text-blue-700 dark:text-blue-400'
                                                : row.valor < 0
                                                  ? 'text-rose-700 dark:text-rose-400'
                                                  : '',
                                            )}
                                          >
                                            {new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                            }).format(row.valor)}
                                          </span>
                                        ) : (
                                          <span>-</span>
                                        )}
                                      </TableCell>
                                    )
                                  case 'valor_liquido':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(
                                          key,
                                          'left',
                                          'whitespace-nowrap font-medium',
                                        )}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            type="number"
                                            step="0.01"
                                            className="h-auto py-1 text-[inherit] px-1.5 w-28 text-left !text-slate-900 min-h-6"
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
                                              row.valor_liquido > 0
                                                ? 'text-blue-700 dark:text-blue-400'
                                                : row.valor_liquido < 0
                                                  ? 'text-rose-700 dark:text-rose-400'
                                                  : '',
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
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 w-28 !text-slate-900 min-h-6"
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
                                        {...getCellProps(key, 'left', 'max-w-[200px] truncate')}
                                        title={row.nome_cli_fornec}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 !text-slate-900 min-h-6"
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
                                        {...getCellProps(key, 'left', 'max-w-[250px] truncate')}
                                        title={row.historico}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 !text-slate-900 min-h-6"
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
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.fp || '-'}
                                      </TableCell>
                                    )
                                  case 'n_cheque':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {row.n_cheque || '-'}
                                      </TableCell>
                                    )
                                  case 'data_vencto':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            type="date"
                                            className="h-auto py-1 text-[inherit] px-1.5 w-32 !text-slate-900 min-h-6"
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
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {row.nominal_a || '-'}
                                      </TableCell>
                                    )
                                  case 'emitente_cheque':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'max-w-[150px] truncate')}
                                        title={row.emitente_cheque}
                                      >
                                        {row.emitente_cheque || '-'}
                                      </TableCell>
                                    )
                                  case 'cnpj_cpf':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {row.cnpj_cpf || '-'}
                                      </TableCell>
                                    )
                                  case 'n_extrato':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.n_extrato || '-'}
                                      </TableCell>
                                    )
                                  case 'filial':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.filial || '-'}
                                      </TableCell>
                                    )
                                  case 'data_canc':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {formatDate(row.data_canc)}
                                      </TableCell>
                                    )
                                  case 'data_estorno':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {formatDate(row.data_estorno)}
                                      </TableCell>
                                    )
                                  case 'banco':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {editingId === row.id ? (
                                          <Input
                                            className="h-auto py-1 text-[inherit] px-1.5 w-24 !text-slate-900 min-h-6"
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
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {row.c_corrente || '-'}
                                      </TableCell>
                                    )
                                  case 'cod_cli_for':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'left', 'whitespace-nowrap')}
                                      >
                                        {row.cod_cli_for || '-'}
                                      </TableCell>
                                    )
                                  case 'departamento':
                                    return (
                                      <TableCell
                                        key={key}
                                        {...getCellProps(key, 'center', 'whitespace-nowrap')}
                                      >
                                        {row.departamento || '-'}
                                      </TableCell>
                                    )
                                  case 'status':
                                    return (
                                      <TableCell key={key} {...getCellProps(key, 'center')}>
                                        {missingFields.length > 0 ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.85em] font-semibold bg-red-100 text-red-800 border border-red-200">
                                            Dados Incompletos
                                          </span>
                                        ) : row.status === 'Concluído' ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.85em] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Concluído
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.85em] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                            {row.status || 'Pendente'}
                                          </span>
                                        )}
                                      </TableCell>
                                    )
                                  default:
                                    return null
                                }
                              })}
                            <TableCell
                              className="px-2 py-0.5 text-center border-0"
                              style={getGridlineStyle()}
                            >
                              {editingId === row.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[0.85em] text-green-600 font-semibold hover:text-green-700 bg-white/90 hover:bg-white"
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
                                    className="h-6 px-2 text-[0.85em] text-red-600 hover:text-red-700 bg-white/90 hover:bg-white"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-[0.85em]"
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
          <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 hidden sm:block">Painel Gerencial</h2>
              {resumoLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar no resumo..."
                  className="pl-8 h-8 text-xs bg-slate-50 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={resumoSearch}
                  onChange={(e) => setResumoSearch(e.target.value)}
                />
              </div>

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5 px-2.5 relative border-slate-200 hover:bg-slate-50"
                onClick={() => setResumoFiltersOpen(true)}
              >
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span>Filtros do Resumo</span>
                {Object.values(resumoFilters).some((arr) => arr && arr.length > 0) && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-sm border-2 border-white">
                    {Object.values(resumoFilters).reduce(
                      (acc: number, val: any) => acc + (val?.length > 0 ? 1 : 0),
                      0,
                    )}
                  </span>
                )}
              </Button>

              {(Object.values(resumoFilters).some((arr) => arr && arr.length > 0) ||
                resumoSearch) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setResumoFilters({})
                    setResumoSearch('')
                  }}
                  title="Limpar Filtros do Resumo"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium ml-1"
                onClick={() => {
                  setResumoFilters(filters)
                  setResumoSearch(search)
                  toast.success('Filtros importados da grade com sucesso!')
                }}
                title="Importar filtros atualmente aplicados na grade de movimentos"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Importar da Grade
              </Button>

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center gap-1.5 px-2.5 relative border-slate-200 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>Exibir Cards</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-700">
                        Ocultar/Exibir Cards
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 flex-1 text-[10px]"
                        onClick={() => {
                          setVisibleCards({
                            consolidado_contabil: true,
                            cruzamento_contabil: true,
                            consolidado_conta: true,
                            consolidado_custo: true,
                            mes_conta: true,
                            conta_mes: true,
                            mes_custo: true,
                            custo_mes: true,
                          })
                        }}
                      >
                        Todos
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 flex-1 text-[10px]"
                        onClick={() => {
                          setVisibleCards({
                            consolidado_contabil: false,
                            cruzamento_contabil: false,
                            consolidado_conta: false,
                            consolidado_custo: false,
                            mes_conta: false,
                            conta_mes: false,
                            mes_custo: false,
                            custo_mes: false,
                          })
                        }}
                      >
                        Nenhum
                      </Button>
                    </div>
                    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {[
                        { id: 'consolidado_contabil', label: 'Consolidado por Conta Contábil' },
                        { id: 'cruzamento_contabil', label: 'Matriz Débito x Crédito' },
                        { id: 'consolidado_conta', label: 'Consolidado por Conta/Caixa' },
                        { id: 'consolidado_custo', label: 'Consolidado por Centro de Custo' },
                        { id: 'mes_conta', label: 'Financeiro (Mês ➔ Conta/Caixa)' },
                        { id: 'conta_mes', label: 'Financeiro (Conta/Caixa ➔ Mês)' },
                        { id: 'mes_custo', label: 'Custos (Mês ➔ C. Custo)' },
                        { id: 'custo_mes', label: 'Custos (C. Custo ➔ Mês)' },
                      ].map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center space-x-2 py-1.5 px-2 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                          onClick={() =>
                            setVisibleCards((p) => ({
                              ...p,
                              [card.id]: p[card.id] === false ? true : false,
                            }))
                          }
                        >
                          <Checkbox
                            checked={visibleCards[card.id] !== false}
                            className="pointer-events-none"
                          />
                          <span className="text-xs flex-1 select-none text-slate-700">
                            {card.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <FloatingPanel
              open={resumoFiltersOpen}
              onClose={() => setResumoFiltersOpen(false)}
              title="Filtros Específicos do Resumo"
              widthClass="w-[calc(100vw-2rem)] sm:w-[600px] md:w-[800px] lg:w-[1000px]"
            >
              <div className="p-4 max-h-[70vh] overflow-y-auto flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filtros do Resumo Consolidado</h4>
                  {Object.values(resumoFilters).some((arr) => arr && arr.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumoFilters({})}
                      className="h-6 text-xs px-2 text-slate-500 hover:text-slate-800"
                    >
                      Limpar todos
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filterOrder.map((key) => {
                    if (key === 'natureza') {
                      const isNaturezaActive =
                        resumoFilters['natureza'] && resumoFilters['natureza'].length > 0
                      return (
                        <div
                          key={key}
                          className={cn(
                            'space-y-1.5 p-2 border rounded-md transition-all duration-200 flex flex-col',
                            isNaturezaActive
                              ? 'bg-[#800000] border-[#800000] shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300',
                          )}
                        >
                          <Label
                            className={cn(
                              'text-xs flex items-center gap-1.5 font-semibold',
                              isNaturezaActive ? 'text-white' : 'text-slate-700',
                            )}
                          >
                            Natureza
                          </Label>
                          <MultiSelect
                            title="Ambas"
                            options={[
                              { label: 'Entradas (+)', value: 'positivo' },
                              { label: 'Saídas (-)', value: 'negativo' },
                            ]}
                            selected={resumoFilters['natureza'] || []}
                            isActive={isNaturezaActive}
                            onChange={(v) => {
                              setResumoFilters((p) => ({ ...p, natureza: v }))
                            }}
                          />
                          {isNaturezaActive && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(resumoFilters['natureza'] || []).map((val) => (
                                <span
                                  key={val}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white truncate max-w-full"
                                >
                                  {val === 'positivo' ? 'Entradas (+)' : 'Saídas (-)'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }

                    const h = tableHeaders.find((th) => th.key === key)
                    if (!h) return null
                    const isColActive = resumoFilters[h.key] && resumoFilters[h.key].length > 0

                    return (
                      <div
                        key={h.key}
                        className={cn(
                          'space-y-1.5 p-2 border rounded-md transition-all duration-200 flex flex-col',
                          isColActive
                            ? 'bg-[#800000] border-[#800000] shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <Label
                          className={cn(
                            'text-xs truncate flex items-center gap-1.5 font-semibold',
                            isColActive ? 'text-white' : 'text-slate-700',
                          )}
                          title={h.label}
                        >
                          {h.label}
                        </Label>
                        <MultiSelect
                          title="Todos"
                          options={filterOptions[h.key] || []}
                          selected={resumoFilters[h.key] || []}
                          isActive={isColActive}
                          onChange={(v) => {
                            setResumoFilters((p) => ({ ...p, [h.key]: v }))
                          }}
                        />
                        {isColActive && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(resumoFilters[h.key] || []).map((val) => {
                              const opt = (filterOptions[h.key] || []).find((o) => o.value === val)
                              const label = opt ? opt.label : val
                              return (
                                <span
                                  key={val}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white truncate max-w-full"
                                  title={label}
                                >
                                  {label}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs whitespace-nowrap"
                    onClick={() => setResumoFiltersOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#800000] hover:bg-[#800000]/90 text-white"
                    onClick={() => setResumoFiltersOpen(false)}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </FloatingPanel>

            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm ml-auto">
              <span className="text-sm font-medium text-slate-600 px-2">Data Base:</span>
              <Tabs
                value={summaryDateBase}
                onValueChange={setSummaryDateBase}
                className="w-[200px] sm:w-[300px]"
              >
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger
                    value="data_emissao"
                    className="text-xs data-[state=active]:bg-indigo-950 data-[state=active]:text-white transition-all"
                  >
                    Emissão
                  </TabsTrigger>
                  <TabsTrigger
                    value="dt_compens"
                    className="text-xs data-[state=active]:bg-indigo-950 data-[state=active]:text-white transition-all"
                  >
                    Compensação
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {visibleCards.consolidado_contabil !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden lg:col-span-2 xl:col-span-2">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full uppercase tracking-wider flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Totais Consolidados por Conta Contábil (Lançamentos Prontos e Pendentes)
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <AccountingConsolidatedTable
                    data={resumoData}
                    tableFontSize={tableFontSize}
                    getAccountingEntriesSimulation={getAccountingEntriesSimulation}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.cruzamento_contabil !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden lg:col-span-2 xl:col-span-2">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full uppercase tracking-wider flex items-center justify-center gap-2">
                    <Columns className="h-5 w-5" />
                    Matriz de Cruzamento: Débito x Crédito
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <AccountingCrossReferenceTable
                    data={resumoData}
                    tableFontSize={tableFontSize}
                    getAccountingEntriesSimulation={getAccountingEntriesSimulation}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.consolidado_conta !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full uppercase tracking-wider">
                    Totais Consolidados por Conta/Caixa
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <PeriodConsolidatedTable
                    data={resumoData}
                    type="account"
                    tableFontSize={tableFontSize}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.consolidado_custo !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full uppercase tracking-wider">
                    Totais Consolidados por Centro de Custo
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <PeriodConsolidatedTable
                    data={resumoData}
                    type="cost"
                    tableFontSize={tableFontSize}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.mes_conta !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full">
                    Financeiro (Mês ➔ Conta/Caixa)
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <SummaryTable
                    data={resumoData}
                    type="month_account"
                    dateField={summaryDateBase}
                    tableFontSize={tableFontSize}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.conta_mes !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full">
                    Financeiro (Conta/Caixa ➔ Mês)
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <SummaryTable
                    data={resumoData}
                    type="account_month"
                    dateField={summaryDateBase}
                    tableFontSize={tableFontSize}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.mes_custo !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full">
                    Custos (Mês ➔ C. Custo)
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <SummaryTable
                    data={resumoData}
                    type="month_cost"
                    dateField={summaryDateBase}
                    tableFontSize={tableFontSize}
                  />
                </CardContent>
              </Card>
            )}

            {visibleCards.custo_mes !== false && (
              <Card className="shadow-sm border-4 border-indigo-950 overflow-hidden">
                <CardHeader className="bg-indigo-950 text-white hover:bg-indigo-900 border-none pb-3 pt-4 transition-colors relative">
                  <h2 className="text-base font-bold text-center w-full">
                    Custos (C. Custo ➔ Mês)
                  </h2>
                </CardHeader>
                <CardContent className="p-0">
                  <SummaryTable
                    data={resumoData}
                    type="cost_month"
                    dateField={summaryDateBase}
                    tableFontSize={tableFontSize}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="balancete" className="m-0 animate-in fade-in-up duration-500">
          <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[800px]">
            <CardHeader className="bg-slate-50/50 border-b pb-4 shrink-0">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Balancete Comparativo</h2>
                  <p className="text-sm text-slate-500">
                    Evolução matricial dos saldos ao longo do tempo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                  <div className="flex items-center gap-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm">
                    <TableSettingsControls
                      prefs={balancetePrefs}
                      updatePrefs={updateBalancetePrefs}
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-slate-600 px-2">Data Base:</span>
                    <Tabs
                      value={summaryDateBase}
                      onValueChange={setSummaryDateBase}
                      className="w-[180px]"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-7">
                        <TabsTrigger
                          value="data_emissao"
                          className="text-[10px] data-[state=active]:bg-indigo-950 data-[state=active]:text-white transition-all"
                        >
                          Emissão
                        </TabsTrigger>
                        <TabsTrigger
                          value="dt_compens"
                          className="text-[10px] data-[state=active]:bg-indigo-950 data-[state=active]:text-white transition-all"
                        >
                          Compens.
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex items-center bg-white border border-slate-200 rounded-md p-1 shadow-sm">
                    <Button
                      variant={balanceteView === 'c_custo' ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'h-7 px-3 text-xs',
                        balanceteView === 'c_custo'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : '',
                      )}
                      onClick={() => setBalanceteView('c_custo')}
                    >
                      Por Centro de Custo
                    </Button>
                    <Button
                      variant={balanceteView === 'conta_caixa' ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'h-7 px-3 text-xs',
                        balanceteView === 'conta_caixa'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : '',
                      )}
                      onClick={() => setBalanceteView('conta_caixa')}
                    >
                      Por Conta/Caixa
                    </Button>
                  </div>

                  <div className="w-[180px]">
                    <MultiSelect
                      title={`Períodos (${activePeriods.length})`}
                      options={availableMonths.map((m) => {
                        const [y, mo] = m.split('-')
                        return { label: `${mo}/${y}`, value: m }
                      })}
                      selected={selectedPeriods}
                      onChange={setSelectedPeriods}
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm h-9">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="av-toggle"
                        checked={avEnabled}
                        onCheckedChange={(c) => setAvEnabled(!!c)}
                      />
                      <Label htmlFor="av-toggle" className="text-xs font-semibold cursor-pointer">
                        AV%
                      </Label>
                    </div>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ah-toggle"
                        checked={ahEnabled}
                        onCheckedChange={(c) => setAhEnabled(!!c)}
                      />
                      <Label htmlFor="ah-toggle" className="text-xs font-semibold cursor-pointer">
                        AH%
                      </Label>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-[250px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Pesquisar conta/código..."
                      className="pl-8 h-9 text-sm bg-white"
                      value={balanceteSearch}
                      onChange={(e) => setBalanceteSearch(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleExportBalancete}
                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white h-9 shadow-sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden bg-white relative">
              <Table
                wrapperClassName="absolute inset-0 overflow-auto custom-scrollbar border-4 border-indigo-950 rounded-lg"
                className="w-full min-w-max border-collapse"
                style={{ fontSize: `${tableFontSize}px` }}
              >
                <TableHeader className="sticky top-0 z-30 shadow-sm border-none bg-indigo-950">
                  <TableRow
                    disableZebra
                    className="bg-indigo-950 text-white font-bold hover:bg-indigo-900 border-none [&>th]:border-none [&>th]:text-white"
                  >
                    <TableHead
                      className="w-[150px] font-bold sticky left-0 top-0 bg-indigo-950 hover:bg-indigo-900 z-40 uppercase text-[0.9em] px-2 py-1"
                      style={getBalanceteGridlineStyle()}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-1 w-full',
                          (balancetePrefs.alignments?.['conta'] || 'center') === 'right'
                            ? 'justify-end'
                            : (balancetePrefs.alignments?.['conta'] || 'center') === 'center'
                              ? 'justify-center'
                              : 'justify-start',
                        )}
                      >
                        <span>Conta</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-sm opacity-50 hover:opacity-100 hover:bg-white/20 relative shrink-0 ml-1 transition-all"
                              title="Alinhamento"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                Alinhamento
                              </DropdownMenuLabel>
                              <div className="flex items-center gap-1 px-2 py-1.5">
                                <Button
                                  variant={
                                    (balancetePrefs.alignments?.['conta'] || 'center') === 'left'
                                      ? 'secondary'
                                      : 'ghost'
                                  }
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateBalancetePrefs({
                                      alignments: {
                                        ...(balancetePrefs.alignments || {}),
                                        conta: 'left',
                                      },
                                    })
                                  }
                                >
                                  <AlignLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant={
                                    (balancetePrefs.alignments?.['conta'] || 'center') === 'center'
                                      ? 'secondary'
                                      : 'ghost'
                                  }
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateBalancetePrefs({
                                      alignments: {
                                        ...(balancetePrefs.alignments || {}),
                                        conta: 'center',
                                      },
                                    })
                                  }
                                >
                                  <AlignCenter className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant={
                                    (balancetePrefs.alignments?.['conta'] || 'center') === 'right'
                                      ? 'secondary'
                                      : 'ghost'
                                  }
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateBalancetePrefs({
                                      alignments: {
                                        ...(balancetePrefs.alignments || {}),
                                        conta: 'right',
                                      },
                                    })
                                  }
                                >
                                  <AlignRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                    <TableHead
                      className="min-w-[250px] font-bold sticky left-[150px] top-0 bg-indigo-950 hover:bg-indigo-900 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] uppercase text-[0.9em] px-2 py-1"
                      style={getBalanceteGridlineStyle()}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-1 w-full',
                          (balancetePrefs.alignments?.['descricao'] || 'center') === 'right'
                            ? 'justify-end'
                            : (balancetePrefs.alignments?.['descricao'] || 'center') === 'center'
                              ? 'justify-center'
                              : 'justify-start',
                        )}
                      >
                        <span>Descrição</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-sm opacity-50 hover:opacity-100 hover:bg-white/20 relative shrink-0 ml-1 transition-all"
                              title="Alinhamento"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                Alinhamento
                              </DropdownMenuLabel>
                              <div className="flex items-center gap-1 px-2 py-1.5">
                                <Button
                                  variant={
                                    (balancetePrefs.alignments?.['descricao'] || 'center') ===
                                    'left'
                                      ? 'secondary'
                                      : 'ghost'
                                  }
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateBalancetePrefs({
                                      alignments: {
                                        ...(balancetePrefs.alignments || {}),
                                        descricao: 'left',
                                      },
                                    })
                                  }
                                >
                                  <AlignLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant={
                                    (balancetePrefs.alignments?.['descricao'] || 'center') ===
                                    'center'
                                      ? 'secondary'
                                      : 'ghost'
                                  }
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateBalancetePrefs({
                                      alignments: {
                                        ...(balancetePrefs.alignments || {}),
                                        descricao: 'center',
                                      },
                                    })
                                  }
                                >
                                  <AlignCenter className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant={
                                    (balancetePrefs.alignments?.['descricao'] || 'center') ===
                                    'right'
                                      ? 'secondary'
                                      : 'ghost'
                                  }
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateBalancetePrefs({
                                      alignments: {
                                        ...(balancetePrefs.alignments || {}),
                                        descricao: 'right',
                                      },
                                    })
                                  }
                                >
                                  <AlignRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                    {sortedActivePeriods.map((month) => {
                      const [y, m] = month.split('-')
                      const align = balancetePrefs.alignments?.[month] || 'left'
                      return (
                        <TableHead
                          key={month}
                          className="font-bold min-w-[140px] px-4 bg-indigo-950 hover:bg-indigo-900 top-0 sticky z-30 border-none"
                          style={getBalanceteGridlineStyle()}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-1 w-full',
                              align === 'right'
                                ? 'justify-end'
                                : align === 'center'
                                  ? 'justify-center'
                                  : 'justify-start',
                            )}
                          >
                            <div
                              className={cn(
                                'flex flex-col',
                                align === 'right'
                                  ? 'items-end'
                                  : align === 'center'
                                    ? 'items-center'
                                    : 'items-start',
                              )}
                            >
                              <span className="text-[1em] leading-tight">
                                {m}/{y}
                              </span>
                              <span className="text-[0.85em]">Saldo</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-sm opacity-50 hover:opacity-100 hover:bg-white/20 relative shrink-0 ml-1 transition-all"
                                  title="Alinhamento"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                    Alinhamento
                                  </DropdownMenuLabel>
                                  <div className="flex items-center gap-1 px-2 py-1.5">
                                    <Button
                                      variant={align === 'left' ? 'secondary' : 'ghost'}
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        updateBalancetePrefs({
                                          alignments: {
                                            ...(balancetePrefs.alignments || {}),
                                            [month]: 'left',
                                          },
                                        })
                                      }
                                    >
                                      <AlignLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant={align === 'center' ? 'secondary' : 'ghost'}
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        updateBalancetePrefs({
                                          alignments: {
                                            ...(balancetePrefs.alignments || {}),
                                            [month]: 'center',
                                          },
                                        })
                                      }
                                    >
                                      <AlignCenter className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant={align === 'right' ? 'secondary' : 'ghost'}
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        updateBalancetePrefs({
                                          alignments: {
                                            ...(balancetePrefs.alignments || {}),
                                            [month]: 'right',
                                          },
                                        })
                                      }
                                    >
                                      <AlignRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData.rows.length === 0 ? (
                    <TableRow disableZebra>
                      <TableCell
                        colSpan={sortedActivePeriods.length + 2}
                        className="h-48 text-center text-black font-bold border-0"
                      >
                        Nenhum dado encontrado para os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    matrixData.rows.map((row, idx) => {
                      return (
                        <TableRow
                          key={idx}
                          className="transition-colors group border-0 [&>td.sticky]:bg-inherit"
                        >
                          <TableCell
                            {...getBalanceteCellProps(
                              'conta',
                              'center',
                              'sticky left-0 z-10 px-2 py-0.5 bg-inherit',
                            )}
                          >
                            {row.code}
                          </TableCell>
                          <TableCell
                            {...getBalanceteCellProps(
                              'descricao',
                              'center',
                              'sticky left-[150px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[300px] px-2 py-0.5 bg-inherit',
                            )}
                            title={row.name}
                          >
                            {row.name}
                          </TableCell>
                          {sortedActivePeriods.map((month, mIdx) => {
                            const val = row.values[month] || 0
                            const prevMonth = mIdx > 0 ? sortedActivePeriods[mIdx - 1] : null
                            const prevVal = prevMonth ? row.values[prevMonth] || 0 : 0

                            const totalAbs = matrixData.monthTotalsAbs[month] || 1
                            const av = (Math.abs(val) / totalAbs) * 100

                            let ah = 0
                            if (prevMonth && prevVal !== 0) {
                              ah = ((val - prevVal) / Math.abs(prevVal)) * 100
                            } else if (prevMonth && prevVal === 0 && val !== 0) {
                              ah = 100
                            }

                            const align = balancetePrefs.alignments?.[month] || 'left'
                            const justifyClass =
                              align === 'right'
                                ? 'justify-end'
                                : align === 'center'
                                  ? 'justify-center'
                                  : 'justify-start'

                            return (
                              <TableCell
                                key={month}
                                {...getBalanceteCellProps(month, 'left', 'px-4 align-top py-1')}
                              >
                                <div
                                  className={cn('flex items-center gap-1.5 w-full', justifyClass)}
                                >
                                  <span
                                    className={cn(
                                      'whitespace-nowrap',
                                      align === 'left' ? 'flex-1 text-left' : '',
                                    )}
                                  >
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(Math.abs(val))}
                                  </span>
                                  <span className="text-[0.85em]">
                                    {val > 0 ? 'D' : val < 0 ? 'C' : ''}
                                  </span>
                                </div>
                                {(avEnabled || ahEnabled) && (
                                  <div
                                    className={cn(
                                      'flex gap-2 mt-1.5 text-[0.85em] font-medium',
                                      justifyClass,
                                    )}
                                  >
                                    {avEnabled && (
                                      <span
                                        className="px-1.5 py-0.5 rounded border border-slate-300 bg-black/5 dark:bg-white/10"
                                        title="Análise Vertical"
                                      >
                                        {val === 0 ? '-' : `${av.toFixed(1)}%`}
                                      </span>
                                    )}
                                    {ahEnabled && mIdx > 0 && (
                                      <span
                                        className="px-1.5 py-0.5 rounded border border-slate-300 bg-black/5 dark:bg-white/10"
                                        title="Análise Horizontal"
                                      >
                                        {prevVal === 0 && val !== 0
                                          ? '100%'
                                          : prevVal === 0
                                            ? '-'
                                            : `${ah > 0 ? '+' : ''}${ah.toFixed(1)}%`}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="m-0 animate-in fade-in-up duration-500">
          <div className="flex flex-col xl:flex-row justify-between mb-6 items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard Gerencial Estratégico</h2>
              <p className="text-sm text-slate-500 mt-1">
                Visão consolidada de indicadores e evolução financeira
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-xs font-semibold text-slate-600 px-2 uppercase tracking-wider">
                  Período:
                </span>
                <Select
                  value={dashboardData.startM}
                  onValueChange={(v) => setDashSelectedPeriodStart(v)}
                >
                  <SelectTrigger className="h-8 w-[130px] text-xs bg-white">
                    <SelectValue placeholder="Início" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardData.allMonths.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.split('-').reverse().join('/')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-slate-400">-</span>
                <Select
                  value={dashboardData.endM}
                  onValueChange={(v) => setDashSelectedPeriodEnd(v)}
                >
                  <SelectTrigger className="h-8 w-[130px] text-xs bg-white">
                    <SelectValue placeholder="Fim" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardData.allMonths.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.split('-').reverse().join('/')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-xs font-semibold text-slate-600 px-2 uppercase tracking-wider">
                  Data Base:
                </span>
                <Tabs
                  value={summaryDateBase}
                  onValueChange={setSummaryDateBase}
                  className="w-[180px]"
                >
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger
                      value="data_emissao"
                      className="text-xs data-[state=active]:bg-indigo-900 data-[state=active]:text-white"
                    >
                      Emissão
                    </TabsTrigger>
                    <TabsTrigger
                      value="dt_compens"
                      className="text-xs data-[state=active]:bg-indigo-900 data-[state=active]:text-white"
                    >
                      Compensação
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-sm border-0 border-l-4 border-l-emerald-500 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Receitas / Entradas (+)
                    </p>
                    <h3 className="text-3xl font-black text-slate-800">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(dashboardData.revenue)}
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 border-l-4 border-l-rose-500 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Despesas / Saídas (-)
                    </p>
                    <h3 className="text-3xl font-black text-slate-800">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(dashboardData.expense)}
                    </h3>
                  </div>
                  <div className="p-3 bg-rose-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 border-l-4 border-l-blue-500 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Resultado Líquido
                    </p>
                    <h3
                      className={cn(
                        'text-3xl font-black',
                        dashboardData.balance >= 0 ? 'text-blue-600' : 'text-rose-600',
                      )}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(dashboardData.balance)}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200 rounded-xl mb-6 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Composição de Despesas (Top 10)
                </h3>
                <p className="text-sm text-slate-500">
                  Análise de representatividade no período filtrado
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
                <div className="w-full max-w-[400px]">
                  {dashboardData.topExpenses.length > 0 ? (
                    <ChartContainer config={dashboardData.pieConfig} className="h-[350px] w-full">
                      <PieChart>
                        <Pie
                          data={dashboardData.topExpenses}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          cursor="pointer"
                          onClick={(data) => {
                            if (data && data.name) handleDrillDown(data.name)
                          }}
                        >
                          <RechartsLabel
                            content={({ viewBox }) => {
                              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-slate-500 text-xs font-bold uppercase tracking-widest"
                                    >
                                      Total
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-slate-900 text-xl font-black"
                                    >
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0,
                                      }).format(dashboardData.expense)}
                                    </tspan>
                                  </text>
                                )
                              }
                            }}
                          />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-slate-400">
                      Nenhum dado para analisar
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dashboardData.topExpenses.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
                      onClick={() => handleDrillDown(item.name)}
                    >
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-bold text-slate-700 truncate pr-2">
                            {item.name}
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {((item.value / dashboardData.expense) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Gráfico Comparativo de Evolução
                </h3>
                <p className="text-sm text-slate-500">
                  Comparativo de centros de custo e resultado (Até 5 seleções simultâneas).
                </p>
              </div>
              <div className="w-full lg:w-[400px]">
                <MultiSelect
                  title="Selecionar Centros de Custo (Max 5)"
                  options={dashboardData.availableCCs.map((cc) => ({ label: cc, value: cc }))}
                  selected={dashSelectedCCs}
                  onChange={(vals) => setDashSelectedCCs(vals.slice(0, 5))}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:w-[280px] p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50 flex flex-col gap-4 overflow-y-auto max-h-[500px] custom-scrollbar">
                  {dashboardData.ccMetrics.map((metric) => (
                    <div
                      key={metric.name}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: metric.color }}
                      />
                      <h4 className="text-sm font-bold text-slate-800 mb-4 pr-2">{metric.name}</h4>

                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Crescimento Período
                          </p>
                          <div className="flex items-center gap-1.5">
                            {metric.growth > 0 ? (
                              <TrendingUp className="h-4 w-4 text-rose-500" />
                            ) : metric.growth < 0 ? (
                              <TrendingDown className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                            )}
                            <span
                              className={cn(
                                'text-sm font-black',
                                metric.growth > 0
                                  ? 'text-rose-600'
                                  : metric.growth < 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-600',
                              )}
                            >
                              {metric.growth > 0 ? '+' : ''}
                              {metric.growth.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Pico Registrado
                          </p>
                          <p className="text-base font-black text-slate-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(metric.peakValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-1 p-6">
                  {dashboardData.monthlyTrends.length > 0 && dashboardData.compareCCs.length > 0 ? (
                    <ChartContainer
                      config={dashboardData.compareConfig}
                      className="h-[450px] w-full"
                    >
                      <LineChart
                        data={dashboardData.monthlyTrends}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="monthLabel"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                          dy={10}
                        />
                        <YAxis
                          tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          dx={-10}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />

                        {dashboardData.compareCCs.map((ccName, idx) => {
                          const color = dashboardData.ccMetrics[idx]?.color || '#000'
                          return (
                            <Line
                              key={ccName}
                              type="monotone"
                              dataKey={ccName}
                              stroke={color}
                              strokeWidth={3}
                              dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          )
                        })}
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[450px] text-slate-400">
                      Selecione ao menos um centro de custo para comparar.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo-mapeamento" className="m-0 animate-in fade-in-up duration-500">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Columns className="h-5 w-5 text-primary" />
                  Resumo DE/PARA (Movimento Atual)
                </h2>
                <p className="text-sm text-slate-500">
                  Visão consolidada de como os centros de custo dos lançamentos atuais estão
                  mapeados.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm mr-2">
                  <TableSettingsControls prefs={deparaPrefs} updatePrefs={updateDeparaPrefs} />
                </div>
                <div className="flex items-center gap-2 mr-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                  <Switch
                    id="show-synthetic"
                    checked={showSyntheticLevels}
                    onCheckedChange={setShowSyntheticLevels}
                  />
                  <Label
                    htmlFor="show-synthetic"
                    className="text-xs text-slate-600 font-bold cursor-pointer whitespace-nowrap"
                  >
                    Níveis Sintéticos
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="h-8 text-xs font-semibold shadow-sm bg-white"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5 mr-1 text-slate-500" /> Expandir Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAnalytic}
                  className="h-8 text-xs font-semibold shadow-sm bg-white"
                >
                  <ChevronDown className="h-3.5 w-3.5 mr-1 text-slate-500" /> Expandir Analítico
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="h-8 text-xs font-semibold shadow-sm bg-white text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-1" /> Recolher Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              <div className="border-4 border-[#221c5a] rounded-lg overflow-hidden relative">
                <Table
                  wrapperClassName="max-h-[650px] overflow-y-auto custom-scrollbar"
                  className="w-full relative"
                  style={{ fontSize: `${tableFontSize}px` }}
                >
                  <TableHeader className="bg-[#221c5a] sticky top-0 z-20 shadow-md border-none">
                    <TableRow className="hover:bg-[#221c5a] border-none">
                      {resumoColOrder.map((key) => {
                        const h = resumoHeaders.find((x) => x.key === key)!
                        const isFilterable = [
                          'c_custo',
                          'conta_contabil',
                          'status',
                          'acao',
                        ].includes(key)
                        const activeFilterCount = resumoFilters[key]?.length || 0
                        const options = resumoFilterOptions[key] || []

                        return (
                          <TableHead
                            key={key}
                            draggable
                            onDragStart={(e) => {
                              setDraggedResumoCol(key)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = 'move'
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              if (!draggedResumoCol || draggedResumoCol === key) return
                              const newOrder = [...resumoColOrder]
                              const draggedIdx = newOrder.indexOf(draggedResumoCol)
                              const targetIdx = newOrder.indexOf(key)
                              newOrder.splice(draggedIdx, 1)
                              newOrder.splice(targetIdx, 0, draggedResumoCol)
                              setResumoColOrder(newOrder)
                              setDraggedResumoCol(null)
                            }}
                            onDragEnd={() => setDraggedResumoCol(null)}
                            className={cn(
                              "bg-[#221c5a] text-white font-['Inter'] text-[0.9em] font-semibold px-2 py-1 h-8 border-none cursor-grab active:cursor-grabbing",
                              draggedResumoCol === key ? 'opacity-50 bg-[#1a1545]' : '',
                            )}
                            style={getDeparaGridlineStyle()}
                          >
                            <div
                              className={cn(
                                'flex items-center justify-between gap-1 w-full',
                                (deparaPrefs.alignments?.[key] || h.align || 'left') === 'right'
                                  ? 'flex-row-reverse'
                                  : '',
                              )}
                            >
                              {key === 'c_custo' || key === 'conta_contabil' ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    className={cn(
                                      'flex items-center cursor-pointer hover:bg-white/10 rounded px-1 -ml-1 flex-1 outline-none',
                                      (deparaPrefs.alignments?.[key] || h.align || 'left') ===
                                        'right'
                                        ? 'justify-end'
                                        : (deparaPrefs.alignments?.[key] || h.align || 'left') ===
                                            'center'
                                          ? 'justify-center'
                                          : 'justify-start',
                                    )}
                                  >
                                    {h.label}
                                    {renderResumoSortIcon(key)}
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    {key === 'c_custo' && (
                                      <>
                                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                          Ordenar por
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleSortResumo('c_custo_codigo')}
                                          className="text-xs cursor-pointer flex items-center justify-between"
                                        >
                                          Código{' '}
                                          {resumoSortColumn === 'c_custo_codigo' &&
                                            (resumoSortDirection === 'asc' ? (
                                              <ArrowUp className="ml-2 h-3 w-3" />
                                            ) : (
                                              <ArrowDown className="ml-2 h-3 w-3" />
                                            ))}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleSortResumo('c_custo_nome')}
                                          className="text-xs cursor-pointer flex items-center justify-between"
                                        >
                                          Nome{' '}
                                          {resumoSortColumn === 'c_custo_nome' &&
                                            (resumoSortDirection === 'asc' ? (
                                              <ArrowUp className="ml-2 h-3 w-3" />
                                            ) : (
                                              <ArrowDown className="ml-2 h-3 w-3" />
                                            ))}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {key === 'conta_contabil' && (
                                      <>
                                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                          Ordenar por
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleSortResumo('conta_contabil_classificacao')
                                          }
                                          className="text-xs cursor-pointer flex items-center justify-between"
                                        >
                                          Classificação{' '}
                                          {resumoSortColumn === 'conta_contabil_classificacao' &&
                                            (resumoSortDirection === 'asc' ? (
                                              <ArrowUp className="ml-2 h-3 w-3" />
                                            ) : (
                                              <ArrowDown className="ml-2 h-3 w-3" />
                                            ))}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleSortResumo('conta_contabil_reduzido')
                                          }
                                          className="text-xs cursor-pointer flex items-center justify-between"
                                        >
                                          Cód. Reduzido{' '}
                                          {resumoSortColumn === 'conta_contabil_reduzido' &&
                                            (resumoSortDirection === 'asc' ? (
                                              <ArrowUp className="ml-2 h-3 w-3" />
                                            ) : (
                                              <ArrowDown className="ml-2 h-3 w-3" />
                                            ))}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleSortResumo('conta_contabil_nome')}
                                          className="text-xs cursor-pointer flex items-center justify-between"
                                        >
                                          Nome{' '}
                                          {resumoSortColumn === 'conta_contabil_nome' &&
                                            (resumoSortDirection === 'asc' ? (
                                              <ArrowUp className="ml-2 h-3 w-3" />
                                            ) : (
                                              <ArrowDown className="ml-2 h-3 w-3" />
                                            ))}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <div
                                  className={cn(
                                    'flex items-center cursor-pointer hover:bg-white/10 rounded px-1 -ml-1 flex-1 outline-none',
                                    (deparaPrefs.alignments?.[key] || h.align || 'left') === 'right'
                                      ? 'justify-end'
                                      : (deparaPrefs.alignments?.[key] || h.align || 'left') ===
                                          'center'
                                        ? 'justify-center'
                                        : 'justify-start',
                                  )}
                                  onClick={() => handleSortResumo(key)}
                                >
                                  {h.label}
                                  {renderResumoSortIcon(key)}
                                </div>
                              )}

                              <div className="flex items-center flex-shrink-0 relative">
                                {isFilterable && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                          'h-5 w-5 rounded-sm relative',
                                          activeFilterCount > 0
                                            ? 'text-white bg-primary/40'
                                            : 'text-indigo-200 hover:text-white hover:bg-white/20',
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
                                        <div className="flex items-center gap-1 p-1 border-b border-slate-100 bg-slate-50">
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 flex-1 text-[10px]"
                                            onMouseDown={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setResumoFilters((prev) => ({
                                                ...prev,
                                                [key]: options.map((o) => o.value),
                                              }))
                                            }}
                                          >
                                            Todos
                                          </Button>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 flex-1 text-[10px]"
                                            onMouseDown={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setResumoFilters((prev) => ({
                                                ...prev,
                                                [key]: [],
                                              }))
                                            }}
                                          >
                                            Nenhum
                                          </Button>
                                        </div>
                                        <CommandList className="max-h-[200px] overflow-y-auto">
                                          <CommandEmpty className="py-2 text-xs text-center text-slate-500">
                                            Nenhum encontrado.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {options.map((opt) => {
                                              const isSelected = resumoFilters[key]?.includes(
                                                opt.value,
                                              )
                                              return (
                                                <CommandItem
                                                  key={opt.value}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                  }}
                                                  onSelect={() => {
                                                    const current = resumoFilters[key] || []
                                                    const updated = isSelected
                                                      ? current.filter((v) => v !== opt.value)
                                                      : [...current, opt.value]
                                                    setResumoFilters((prev) => ({
                                                      ...prev,
                                                      [key]: updated,
                                                    }))
                                                  }}
                                                  className="text-xs cursor-pointer"
                                                >
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
                                                  <span
                                                    className="truncate max-w-[140px]"
                                                    title={opt.label}
                                                  >
                                                    {opt.label}
                                                  </span>
                                                </CommandItem>
                                              )
                                            })}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-sm text-indigo-200 hover:text-white hover:bg-white/20 relative ml-0.5"
                                      title="Alinhamento"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                        Alinhamento
                                      </DropdownMenuLabel>
                                      <div className="flex items-center gap-1 px-2 py-1.5">
                                        <Button
                                          variant={
                                            (deparaPrefs.alignments?.[key] || h.align || 'left') ===
                                            'left'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updateDeparaPrefs({
                                              alignments: {
                                                ...(deparaPrefs.alignments || {}),
                                                [key]: 'left',
                                              },
                                            })
                                          }
                                          title="Alinhar à Esquerda"
                                        >
                                          <AlignLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant={
                                            (deparaPrefs.alignments?.[key] || h.align || 'left') ===
                                            'center'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updateDeparaPrefs({
                                              alignments: {
                                                ...(deparaPrefs.alignments || {}),
                                                [key]: 'center',
                                              },
                                            })
                                          }
                                          title="Centralizar"
                                        >
                                          <AlignCenter className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant={
                                            (deparaPrefs.alignments?.[key] || h.align || 'left') ===
                                            'right'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updateDeparaPrefs({
                                              alignments: {
                                                ...(deparaPrefs.alignments || {}),
                                                [key]: 'right',
                                              },
                                            })
                                          }
                                          title="Alinhar à Direita"
                                        >
                                          <AlignRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </DropdownMenuGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flattenedTreeRows.map((rowItem, index) => {
                      if (rowItem.type === 'inline-header') {
                        return (
                          <TableRow
                            key={`${rowItem.data.id}-inline-hdr`}
                            className="bg-slate-100/80 hover:bg-slate-100/80 border-0"
                          >
                            {resumoColOrder.map((key) => {
                              if (key === 'conta_contabil') {
                                return (
                                  <TableCell
                                    key={key}
                                    className="p-0 border-0 border-y border-slate-200"
                                    style={getDeparaGridlineStyle()}
                                  >
                                    <div className="px-4 py-1.5 text-[0.85em] font-bold text-slate-500 uppercase tracking-wider text-left">
                                      ↳ Raiz Hierárquica da Conta Vinculada
                                    </div>
                                  </TableCell>
                                )
                              }
                              return (
                                <TableCell
                                  key={key}
                                  className="p-0 border-0 border-y border-slate-200"
                                  style={getDeparaGridlineStyle()}
                                ></TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      }

                      if (rowItem.type === 'inline-node') {
                        const { data: node, hNode } = rowItem
                        const code = hNode.classification || hNode.account_code || ''
                        const nodeLevel = (code.match(/\./g) || []).length + 1
                        const isSyn = hNode.account_level === 'Sintética'

                        let bg = '#ffffff',
                          color = '#334155',
                          fw = '500',
                          badgeBg = '#f1f5f9',
                          badgeColor = '#475569',
                          badgeBorder = '#e2e8f0'
                        if (isSyn) {
                          if (nodeLevel === 1) {
                            bg = '#1e1b4b'
                            color = '#ffffff'
                            fw = '700'
                            badgeBg = '#312e81'
                            badgeColor = '#ffffff'
                            badgeBorder = '#3730a3'
                          } else if (nodeLevel === 2) {
                            bg = '#312e81'
                            color = '#ffffff'
                            fw = '600'
                            badgeBg = '#3730a3'
                            badgeColor = '#ffffff'
                            badgeBorder = '#4338ca'
                          } else if (nodeLevel === 3) {
                            bg = '#3730a3'
                            color = '#ffffff'
                            fw = '500'
                            badgeBg = '#4338ca'
                            badgeColor = '#ffffff'
                            badgeBorder = '#4f46e5'
                          } else if (nodeLevel === 4) {
                            bg = '#e0e7ff'
                            color = '#1e1b4b'
                            fw = '500'
                            badgeBg = '#c7d2fe'
                            badgeColor = '#1e1b4b'
                            badgeBorder = '#a5b4fc'
                          }
                        }

                        return (
                          <TableRow
                            key={`${node.id}-inline-${hNode.id}`}
                            className="border-0 hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: bg }}
                          >
                            {resumoColOrder.map((key) => {
                              if (key === 'conta_contabil') {
                                return (
                                  <TableCell
                                    key={key}
                                    className="p-0 border-0 border-b border-white/10"
                                    style={getDeparaGridlineStyle()}
                                  >
                                    <div
                                      style={{ color, fontWeight: fw as any }}
                                      className="px-6 py-1.5 flex items-center gap-3 text-[1em] justify-start"
                                    >
                                      <span
                                        style={{
                                          backgroundColor: badgeBg,
                                          color: badgeColor,
                                          borderColor: badgeBorder,
                                        }}
                                        className="font-mono text-[0.85em] px-1.5 py-0.5 rounded border shadow-sm"
                                      >
                                        {code}
                                      </span>
                                      <span>{hNode.account_name}</span>
                                    </div>
                                  </TableCell>
                                )
                              }
                              return (
                                <TableCell
                                  key={key}
                                  className="p-0 border-0 border-b border-white/10"
                                  style={getDeparaGridlineStyle()}
                                ></TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      }

                      const item = rowItem.data
                      const isExpanded = expandedNodes[item.id]
                      const hasChildren = item.children && item.children.length > 0
                      const canExpand =
                        hasChildren || (item.hierarchyArray && item.hierarchyArray.length > 0)

                      let rowClass =
                        index % 2 === 1
                          ? 'bg-[#bfdbfe] text-black hover:bg-[#93c5fd]'
                          : 'bg-transparent text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'

                      if (item.isSynthetic) {
                        if (item.level <= 2) {
                          rowClass = '!bg-[#1e1b4b] !text-white hover:!bg-[#312e81] font-bold'
                        } else {
                          rowClass = '!bg-[#e0e7ff] !text-[#1e1b4b] hover:!bg-[#c7d2fe] font-bold'
                        }
                      } else if (!item.mappedAccount) {
                        rowClass =
                          index % 2 === 0
                            ? 'bg-amber-50/40 text-slate-700 hover:bg-amber-50/70'
                            : 'bg-amber-50/70 text-slate-700 hover:bg-amber-100/50'
                      }

                      return (
                        <TableRow
                          key={item.id}
                          className={cn('transition-colors border-0', rowClass)}
                        >
                          {resumoColOrder.map((key) => {
                            if (key === 'c_custo') {
                              const align = deparaPrefs.alignments?.[key] || 'left'
                              const justifyClass =
                                align === 'center'
                                  ? 'justify-center'
                                  : align === 'right'
                                    ? 'justify-end'
                                    : ''
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(key, 'left', 'align-middle')}
                                >
                                  <div
                                    className={cn('flex items-center gap-1.5', justifyClass)}
                                    style={{
                                      paddingLeft:
                                        align === 'left' ? `${item.level * 16}px` : undefined,
                                    }}
                                  >
                                    {canExpand ? (
                                      <button
                                        onClick={() =>
                                          setExpandedNodes((p) => ({
                                            ...p,
                                            [item.id]: !p[item.id],
                                          }))
                                        }
                                        className={cn(
                                          'p-0.5 rounded transition-colors',
                                          item.isSynthetic && item.level <= 2
                                            ? 'hover:bg-white/10'
                                            : 'hover:bg-black/10',
                                        )}
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </button>
                                    ) : (
                                      <span className="w-4" />
                                    )}

                                    <span
                                      className={cn(
                                        'px-1.5 py-0.5 rounded text-[0.8em] font-bold shadow-sm',
                                        item.isSynthetic
                                          ? item.level <= 2
                                            ? 'bg-white/20 text-white'
                                            : 'bg-black/10 text-black'
                                          : 'bg-blue-50 text-blue-600 border border-blue-200',
                                      )}
                                    >
                                      {item.isSynthetic ? 'S' : 'A'}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          'font-mono min-w-[50px] text-center px-1.5 py-0.5 rounded text-[0.85em] shadow-sm inline-block',
                                          item.isSynthetic
                                            ? 'font-bold !text-white'
                                            : 'font-semibold bg-transparent',
                                        )}
                                      >
                                        {item.c_custo || 'SEM_CC'}
                                      </span>
                                      <span
                                        className={cn(
                                          'truncate max-w-[250px]',
                                          item.isSynthetic ? 'font-bold !text-white' : '',
                                        )}
                                        title={item.descricao_c_custo}
                                      >
                                        {item.descricao_c_custo}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              )
                            }

                            if (key === 'conta_contabil') {
                              const align = deparaPrefs.alignments?.[key] || 'left'
                              const justifyClass =
                                align === 'center'
                                  ? 'justify-center'
                                  : align === 'right'
                                    ? 'justify-end'
                                    : ''
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(key, 'left', 'align-middle')}
                                >
                                  {!item.isSynthetic && item.mappedAccount ? (
                                    <div className={cn('flex items-center gap-1.5', justifyClass)}>
                                      <span className="bg-[#1e1b4b] text-white px-1.5 py-0.5 rounded text-[0.85em] font-bold font-mono min-w-[50px] text-center inline-block shadow-sm">
                                        {item.mappedAccount.account_code}
                                      </span>
                                      {item.mappedAccount.classification && (
                                        <span className="font-mono text-[0.85em] font-semibold whitespace-nowrap text-black">
                                          {item.mappedAccount.classification}
                                        </span>
                                      )}
                                      <span
                                        className="truncate font-semibold max-w-[250px] text-slate-800"
                                        title={item.mappedAccount.account_name}
                                      >
                                        {item.mappedAccount.account_name}
                                      </span>
                                    </div>
                                  ) : !item.isSynthetic && !item.mappedAccount ? (
                                    <span className="text-slate-400 italic font-medium">
                                      Não vinculado
                                    </span>
                                  ) : null}
                                </TableCell>
                              )
                            }

                            if (key === 'status') {
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(key, 'center', 'align-middle')}
                                >
                                  {!item.isSynthetic && (
                                    <span
                                      className={cn(
                                        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.85em] font-bold border uppercase tracking-wider shadow-sm',
                                        item.mappedAccount
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200',
                                      )}
                                    >
                                      {item.status}
                                    </span>
                                  )}
                                </TableCell>
                              )
                            }

                            if (key === 'count') {
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(key, 'center', 'align-middle')}
                                >
                                  {item.count > 0 ? (
                                    <button
                                      onClick={() =>
                                        !item.isSynthetic && handleDrillDownResumo(item)
                                      }
                                      className={cn(
                                        'font-bold hover:underline cursor-pointer',
                                        item.isSynthetic
                                          ? item.level <= 2
                                            ? '!text-white cursor-default hover:no-underline'
                                            : '!text-[#1e1b4b] cursor-default hover:no-underline'
                                          : 'text-blue-600 hover:text-blue-800',
                                      )}
                                      title={
                                        item.isSynthetic
                                          ? 'Lançamentos agrupados'
                                          : 'Visualizar Lançamentos'
                                      }
                                    >
                                      {item.count}
                                    </button>
                                  ) : (
                                    <span
                                      className={cn(
                                        item.isSynthetic && item.level <= 2
                                          ? 'text-white/50'
                                          : 'text-slate-400',
                                      )}
                                    >
                                      0
                                    </span>
                                  )}
                                </TableCell>
                              )
                            }

                            if (key === 'total_bruto') {
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(
                                    key,
                                    'left',
                                    cn(
                                      'align-middle',
                                      item.isSynthetic ? 'font-bold !text-white' : 'font-medium',
                                    ),
                                  )}
                                >
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(item.total_bruto)}
                                </TableCell>
                              )
                            }
                            if (key === 'total_liquido') {
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(
                                    key,
                                    'left',
                                    cn(
                                      'align-middle',
                                      item.isSynthetic ? 'font-bold !text-white' : 'font-medium',
                                    ),
                                  )}
                                >
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(item.total)}
                                </TableCell>
                              )
                            }
                            if (key === 'acao') {
                              return (
                                <TableCell
                                  key={key}
                                  {...getDeparaCellProps(key, 'center', 'align-middle')}
                                >
                                  {!item.isSynthetic && (
                                    <Button
                                      size="sm"
                                      variant={item.mappedAccount ? 'outline' : 'default'}
                                      className={cn(
                                        'h-6 text-[10px] px-2',
                                        !item.mappedAccount &&
                                          'bg-[#800000] hover:bg-[#800000]/90 text-white shadow-sm',
                                      )}
                                      onClick={() => setMappingRow(item.rows[0] || item)}
                                    >
                                      {item.mappedAccount ? 'Editar' : 'Mapear'}
                                    </Button>
                                  )}
                                </TableCell>
                              )
                            }
                            return null
                          })}
                        </TableRow>
                      )
                    })}
                    {flattenedTreeRows.length === 0 && (
                      <TableRow disableZebra>
                        <TableCell colSpan={7} className="h-32 text-center text-slate-500 border-0">
                          Nenhum registro para exibir com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
          <Card className="border-slate-200 shadow-sm bg-white border">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Pré-Conferência Contábil (Dry Run)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Visão consolidada dos lançamentos (Conta Débito, Conta Crédito, Valor e
                    Histórico). Lançamentos com pendência de mapeamento estão destacados.
                  </p>
                </div>
                <Button
                  onClick={() => setGenerateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Efetivar Lançamentos Exibidos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                wrapperClassName="max-h-[600px] overflow-auto custom-scrollbar"
                className="w-full"
                style={{ fontSize: `${tableFontSize}px` }}
              >
                <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm border-none">
                  <TableRow className="border-b-slate-200 hover:bg-slate-100 border-none">
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200">
                      Data
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200">
                      Conta Débito
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200">
                      Conta Crédito
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200">
                      Valor
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 border-r border-slate-200">
                      Centro de Custo
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">Histórico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => {
                    const sim = getAccountingEntriesSimulation(row)
                    const dt = row.data_emissao ? formatDate(row.data_emissao) : '-'
                    const cc = row.c_custo || 'Sem C.Custo'
                    const hist = row.historico || '-'
                    const val = Number(row.valor_liquido || row.valor || 0)
                    const formatCurrency = (v: number) =>
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        v,
                      )

                    const isError =
                      !sim.debitAccount || !sim.creditAccount || !row.data_emissao || !val

                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          'transition-colors border-0 border-b border-slate-100',
                          isError ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50',
                        )}
                      >
                        <TableCell
                          className={cn(
                            'whitespace-nowrap border-r border-slate-200',
                            isError ? 'text-red-700' : 'text-slate-600',
                          )}
                        >
                          {dt}
                        </TableCell>
                        <TableCell className="border-r border-slate-200">
                          {sim.debitAccount ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-blue-200"
                                title="Código Reduzido"
                              >
                                {sim.debitAccount.account_code}
                              </span>
                              {sim.debitAccount.classification && (
                                <span
                                  className="font-mono text-[0.85em] font-semibold text-slate-600"
                                  title="Classificação"
                                >
                                  {sim.debitAccount.classification}
                                </span>
                              )}
                              <span
                                className="truncate max-w-[200px] text-slate-700"
                                title={sim.debitAccount.account_name}
                              >
                                {sim.debitAccount.account_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-red-500 italic text-[0.9em] font-semibold">
                              Pendente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="border-r border-slate-200">
                          {sim.creditAccount ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[0.85em] font-semibold border border-rose-200"
                                title="Código Reduzido"
                              >
                                {sim.creditAccount.account_code}
                              </span>
                              {sim.creditAccount.classification && (
                                <span
                                  className="font-mono text-[0.85em] font-semibold text-slate-600"
                                  title="Classificação"
                                >
                                  {sim.creditAccount.classification}
                                </span>
                              )}
                              <span
                                className="truncate max-w-[200px] text-slate-700"
                                title={sim.creditAccount.account_name}
                              >
                                {sim.creditAccount.account_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-red-500 italic text-[0.9em] font-semibold">
                              Pendente
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'whitespace-nowrap font-bold border-r border-slate-200',
                            isError ? 'text-red-700' : 'text-slate-900',
                          )}
                        >
                          {formatCurrency(Math.abs(val))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'whitespace-nowrap border-r border-slate-200',
                            isError ? 'text-red-700' : 'text-slate-600',
                          )}
                        >
                          {cc}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'max-w-[300px] truncate',
                            isError ? 'text-red-700' : 'text-slate-600',
                          )}
                          title={hist}
                        >
                          {hist}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-slate-500 border-0">
                        Nenhum registro para exibir.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise-grupos" className="m-0 animate-in fade-in-up duration-500">
          <div className="flex flex-col xl:flex-row justify-between mb-6 items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Análise por Grupos e Subníveis</h2>
              <p className="text-sm text-slate-500 mt-1">
                Navegue na hierarquia dos centros de custo para análises verticais e evolutivas
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-xs font-semibold text-slate-600 px-2 uppercase tracking-wider hidden sm:inline">
                  Período Global:
                </span>
                <Select
                  value={grupoGlobalPeriodStart || 'all'}
                  onValueChange={(v) => setGrupoGlobalPeriodStart(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-8 w-[110px] text-xs bg-white">
                    <SelectValue placeholder="Início" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Período</SelectItem>
                    {(summaryDateBase === 'data_emissao'
                      ? groupAnalysisData.monthsEmissao
                      : groupAnalysisData.monthsCompens
                    ).map((m) => (
                      <SelectItem key={`start-${m}`} value={m}>
                        {m.split('-').reverse().join('/')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-slate-400">-</span>
                <Select
                  value={grupoGlobalPeriodEnd || 'all'}
                  onValueChange={(v) => setGrupoGlobalPeriodEnd(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-8 w-[110px] text-xs bg-white">
                    <SelectValue placeholder="Fim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Período</SelectItem>
                    {(summaryDateBase === 'data_emissao'
                      ? groupAnalysisData.monthsEmissao
                      : groupAnalysisData.monthsCompens
                    ).map((m) => (
                      <SelectItem key={`end-${m}`} value={m}>
                        {m.split('-').reverse().join('/')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <span className="text-xs font-semibold text-slate-600 px-2 uppercase tracking-wider hidden sm:inline">
                  Data Base:
                </span>
                <Tabs
                  value={summaryDateBase}
                  onValueChange={setSummaryDateBase}
                  className="w-[180px]"
                >
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger
                      value="data_emissao"
                      className="text-xs data-[state=active]:bg-indigo-900 data-[state=active]:text-white"
                    >
                      Emissão
                    </TabsTrigger>
                    <TabsTrigger
                      value="dt_compens"
                      className="text-xs data-[state=active]:bg-indigo-900 data-[state=active]:text-white"
                    >
                      Compens.
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <Button
                  variant={analiseGrupoTipo.includes('receita') ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    analiseGrupoTipo.includes('receita') && 'bg-emerald-600 hover:bg-emerald-700',
                  )}
                  onClick={() =>
                    setAnaliseGrupoTipo((prev) =>
                      prev.includes('receita') && prev.length > 1
                        ? prev.filter((x) => x !== 'receita')
                        : prev.includes('receita')
                          ? prev
                          : [...prev, 'receita'],
                    )
                  }
                >
                  Receitas
                </Button>
                <Button
                  variant={analiseGrupoTipo.includes('despesa') ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    analiseGrupoTipo.includes('despesa') && 'bg-rose-600 hover:bg-rose-700',
                  )}
                  onClick={() =>
                    setAnaliseGrupoTipo((prev) =>
                      prev.includes('despesa') && prev.length > 1
                        ? prev.filter((x) => x !== 'despesa')
                        : prev.includes('despesa')
                          ? prev
                          : [...prev, 'despesa'],
                    )
                  }
                >
                  Despesas
                </Button>
                <Button
                  variant={analiseGrupoTipo.includes('resultado') ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    analiseGrupoTipo.includes('resultado') && 'bg-blue-600 hover:bg-blue-700',
                  )}
                  onClick={() =>
                    setAnaliseGrupoTipo((prev) =>
                      prev.includes('resultado') && prev.length > 1
                        ? prev.filter((x) => x !== 'resultado')
                        : prev.includes('resultado')
                          ? prev
                          : [...prev, 'resultado'],
                    )
                  }
                >
                  Resultado Líquido
                </Button>
              </div>
            </div>
          </div>

          <Card className="shadow-sm border-slate-200 rounded-xl mb-6 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 overflow-x-auto w-full sm:w-auto">
                <button
                  className="hover:text-indigo-600 transition-colors whitespace-nowrap flex items-center gap-1"
                  onClick={() => handleGroupAnalysisBreadcrumb(-1)}
                >
                  Todos os Grupos
                </button>
                {groupAnalysisPath.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    <button
                      className={cn(
                        'hover:text-indigo-600 transition-colors whitespace-nowrap',
                        idx === groupAnalysisPath.length - 1 ? 'text-indigo-700 font-bold' : '',
                      )}
                      onClick={() => handleGroupAnalysisBreadcrumb(idx)}
                    >
                      {node.code} - {node.description}
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs whitespace-nowrap shrink-0 shadow-sm bg-white"
                onClick={() => {
                  setGroupAnalysisPath([])
                  setAnaliseGrupoTipo(['receita', 'despesa', 'resultado'])
                  setGrupoGlobalPeriodStart('')
                  setGrupoGlobalPeriodEnd('')
                  setIsPartSynced(true)
                  setIsEvolSynced(true)
                  setIsCompSynced(true)
                  setIsTableSynced(true)
                  setCompareGroup1('')
                  setCompareGroup2('')
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Restaurar Tudo
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 text-center xl:text-left flex flex-wrap items-center justify-center gap-2">
                      Participação Vertical
                      <div className="flex gap-1.5 items-center bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] text-slate-500 font-normal shadow-sm">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effPartDateBase === 'data_emissao'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          Emissão
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effPartDateBase === 'dt_compens'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          Compens.
                        </span>
                        <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effPartTipo.includes('receita') && effPartTipo.length === 1
                              ? 'bg-emerald-100 text-emerald-700'
                              : effPartTipo.includes('despesa') && effPartTipo.length === 1
                                ? 'bg-rose-100 text-rose-700'
                                : effPartTipo.includes('resultado') && effPartTipo.length === 1
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700',
                          )}
                        >
                          {effPartTipo
                            .map((t: string) =>
                              t === 'receita'
                                ? 'Receitas'
                                : t === 'despesa'
                                  ? 'Despesas'
                                  : 'Resultado',
                            )
                            .join(' + ')}
                        </span>
                      </div>
                    </h3>
                    <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2">
                      {groupAnalysisPath.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2.5 shadow-sm bg-white hover:bg-slate-50 text-slate-700"
                          onClick={() => setGroupAnalysisPath([])}
                        >
                          <RefreshCw className="h-3 w-3 mr-1.5 text-slate-400" />
                          Todos os Grupos
                        </Button>
                      )}
                      <Button
                        variant={isPartSynced ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-7 text-[10px] px-2.5 shadow-sm transition-all',
                          isPartSynced
                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                            : 'bg-white text-slate-600 hover:text-slate-900 border-dashed',
                        )}
                        onClick={() => {
                          if (!isPartSynced) {
                            setIsPartSynced(true)
                          } else {
                            setIsPartSynced(false)
                            setGrupoPartPeriodStart(grupoGlobalPeriodStart)
                            setGrupoPartPeriodEnd(grupoGlobalPeriodEnd)
                            setGrupoPartDateBase(summaryDateBase)
                            setGrupoPartTipo(analiseGrupoTipo)
                          }
                        }}
                      >
                        {isPartSynced ? (
                          <Link className="h-3 w-3 mr-1.5" />
                        ) : (
                          <Unlink className="h-3 w-3 mr-1.5" />
                        )}
                        {isPartSynced ? 'Sincronizado ao Global' : 'Filtro Customizado'}
                      </Button>

                      {!isPartSynced && (
                        <>
                          <div className="w-[120px]">
                            <MultiSelect
                              title="Tipos"
                              options={[
                                { label: 'Receitas', value: 'receita' },
                                { label: 'Despesas', value: 'despesa' },
                                { label: 'Resultado', value: 'resultado' },
                              ]}
                              selected={grupoPartTipo}
                              onChange={setGrupoPartTipo}
                            />
                          </div>
                          <Select
                            value={grupoPartDateBase || summaryDateBase}
                            onValueChange={(v) => setGrupoPartDateBase(v)}
                          >
                            <SelectTrigger className="h-7 w-[90px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Data Base" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data_emissao">Emissão</SelectItem>
                              <SelectItem value="dt_compens">Compensação</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={grupoPartPeriodStart || 'all'}
                            onValueChange={(v) => setGrupoPartPeriodStart(v === 'all' ? '' : v)}
                          >
                            <SelectTrigger className="h-7 w-[85px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Início" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todo Período</SelectItem>
                              {(effPartDateBase === 'data_emissao'
                                ? groupAnalysisData.monthsEmissao
                                : groupAnalysisData.monthsCompens
                              ).map((m) => (
                                <SelectItem key={`p-start-${m}`} value={m}>
                                  {m.split('-').reverse().join('/')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={grupoPartPeriodEnd || 'all'}
                            onValueChange={(v) => setGrupoPartPeriodEnd(v === 'all' ? '' : v)}
                          >
                            <SelectTrigger className="h-7 w-[85px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Fim" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todo Período</SelectItem>
                              {(effPartDateBase === 'data_emissao'
                                ? groupAnalysisData.monthsEmissao
                                : groupAnalysisData.monthsCompens
                              ).map((m) => (
                                <SelectItem key={`p-end-${m}`} value={m}>
                                  {m.split('-').reverse().join('/')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </div>
                  {participationChartData.length > 0 ? (
                    <ChartContainer config={evolutionGroupChartConfig} className="h-[350px] w-full">
                      <PieChart>
                        <Pie
                          data={participationChartData}
                          dataKey="value"
                          nameKey="code"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          cursor="pointer"
                          onClick={(data) => {
                            if (
                              data &&
                              data.payload &&
                              data.payload.id &&
                              data.payload.id !== 'unmapped'
                            ) {
                              handleGroupAnalysisDrillDown(data.payload.id)
                            }
                          }}
                        >
                          {participationChartData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={groupChartColors[index % groupChartColors.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white p-2 border border-slate-200 shadow-sm rounded-md text-xs">
                                  <div className="font-bold text-slate-800 mb-1">{data.name}</div>
                                  <div className="text-slate-600">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(data.value)}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-slate-400 border border-dashed rounded-xl bg-slate-50">
                      Sem dados no período
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 text-center sm:text-left flex flex-wrap items-center gap-2">
                      Evolução por Subnível
                      <div className="flex gap-1.5 items-center bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] text-slate-500 font-normal shadow-sm">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effEvolDateBase === 'data_emissao'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          Emissão
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effEvolDateBase === 'dt_compens'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          Compens.
                        </span>
                        <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effEvolTipo.includes('receita') && effEvolTipo.length === 1
                              ? 'bg-emerald-100 text-emerald-700'
                              : effEvolTipo.includes('despesa') && effEvolTipo.length === 1
                                ? 'bg-rose-100 text-rose-700'
                                : effEvolTipo.includes('resultado') && effEvolTipo.length === 1
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700',
                          )}
                        >
                          {effEvolTipo
                            .map((t: string) =>
                              t === 'receita'
                                ? 'Receitas'
                                : t === 'despesa'
                                  ? 'Despesas'
                                  : 'Resultado',
                            )
                            .join(' + ')}
                        </span>
                      </div>
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                      {groupAnalysisPath.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2.5 shadow-sm bg-white hover:bg-slate-50 text-slate-700"
                          onClick={() => setGroupAnalysisPath([])}
                        >
                          <RefreshCw className="h-3 w-3 mr-1.5 text-slate-400" />
                          Todos os Grupos
                        </Button>
                      )}
                      <Button
                        variant={isEvolSynced ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-7 text-[10px] px-2.5 shadow-sm transition-all',
                          isEvolSynced
                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                            : 'bg-white text-slate-600 hover:text-slate-900 border-dashed',
                        )}
                        onClick={() => {
                          if (!isEvolSynced) setIsEvolSynced(true)
                          else {
                            setIsEvolSynced(false)
                            setGrupoEvolPeriodStart(grupoGlobalPeriodStart)
                            setGrupoEvolPeriodEnd(grupoGlobalPeriodEnd)
                            setGrupoEvolDateBase(summaryDateBase)
                            setGrupoEvolTipo(analiseGrupoTipo)
                          }
                        }}
                      >
                        {isEvolSynced ? (
                          <Link className="h-3 w-3 mr-1.5" />
                        ) : (
                          <Unlink className="h-3 w-3 mr-1.5" />
                        )}
                        {isEvolSynced ? 'Sincronizado' : 'Customizado'}
                      </Button>

                      {!isEvolSynced && (
                        <>
                          <div className="w-[120px]">
                            <MultiSelect
                              title="Tipos"
                              options={[
                                { label: 'Receitas', value: 'receita' },
                                { label: 'Despesas', value: 'despesa' },
                                { label: 'Resultado', value: 'resultado' },
                              ]}
                              selected={grupoEvolTipo}
                              onChange={setGrupoEvolTipo}
                            />
                          </div>
                          <Select
                            value={grupoEvolDateBase || summaryDateBase}
                            onValueChange={setGrupoEvolDateBase}
                          >
                            <SelectTrigger className="h-7 w-[90px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Data Base" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data_emissao">Emissão</SelectItem>
                              <SelectItem value="dt_compens">Compensação</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}

                      <Select
                        value={grupoEvolPeriodStart || 'global'}
                        onValueChange={(v) => setGrupoEvolPeriodStart(v === 'global' ? '' : v)}
                      >
                        <SelectTrigger className="h-7 w-[90px] text-[10px] bg-white border-slate-200">
                          <SelectValue placeholder="Início" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">C/ Global</SelectItem>
                          {(effEvolDateBase === 'data_emissao'
                            ? groupAnalysisData.monthsEmissao
                            : groupAnalysisData.monthsCompens
                          ).map((m) => (
                            <SelectItem key={`evol-start-${m}`} value={m}>
                              {m.split('-').reverse().join('/')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={grupoEvolPeriodEnd || 'global'}
                        onValueChange={(v) => setGrupoEvolPeriodEnd(v === 'global' ? '' : v)}
                      >
                        <SelectTrigger className="h-7 w-[90px] text-[10px] bg-white border-slate-200">
                          <SelectValue placeholder="Fim" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">C/ Global</SelectItem>
                          {(effEvolDateBase === 'data_emissao'
                            ? groupAnalysisData.monthsEmissao
                            : groupAnalysisData.monthsCompens
                          ).map((m) => (
                            <SelectItem key={`evol-end-${m}`} value={m}>
                              {m.split('-').reverse().join('/')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {evolutionGroupChartData.length > 0 && currentGroupAnalysisNodes.length > 0 ? (
                    <ChartContainer config={evolutionGroupChartConfig} className="h-[350px] w-full">
                      <LineChart
                        data={evolutionGroupChartData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={(val) => val.split('-').reverse().join('/')}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          dy={10}
                        />
                        <YAxis
                          tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          dx={-10}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />

                        {currentGroupAnalysisNodes.map((child: any, idx: number) => (
                          <Line
                            key={child.code || 'S/C'}
                            type="monotone"
                            dataKey={child.code || 'S/C'}
                            stroke={groupChartColors[idx % groupChartColors.length]}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        ))}
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-slate-400 border border-dashed rounded-xl bg-slate-50">
                      Sem dados no período
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex flex-wrap items-center gap-2">
                        Comparativo Inter-Grupos
                        <div className="flex gap-1.5 items-center bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] text-slate-500 font-normal shadow-sm">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded font-semibold',
                              effCompDateBase === 'data_emissao'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-700',
                            )}
                          >
                            Emissão
                          </span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded font-semibold',
                              effCompDateBase === 'dt_compens'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-700',
                            )}
                          >
                            Compens.
                          </span>
                          <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded font-semibold',
                              effCompTipo.includes('receita') && effCompTipo.length === 1
                                ? 'bg-emerald-100 text-emerald-700'
                                : effCompTipo.includes('despesa') && effCompTipo.length === 1
                                  ? 'bg-rose-100 text-rose-700'
                                  : effCompTipo.includes('resultado') && effCompTipo.length === 1
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700',
                            )}
                          >
                            {effCompTipo
                              .map((t: string) =>
                                t === 'receita'
                                  ? 'Receitas'
                                  : t === 'despesa'
                                    ? 'Despesas'
                                    : 'Resultado',
                              )
                              .join(' + ')}
                          </span>
                        </div>
                      </h3>
                      <p className="text-sm text-slate-500">
                        Confronte a performance entre dois grupos ou centros de custo específicos.
                      </p>
                    </div>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full xl:w-auto">
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <Button
                          variant={isCompSynced ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-8 text-[11px] px-3 shadow-sm transition-all',
                            isCompSynced
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                              : 'bg-white text-slate-600 hover:text-slate-900 border-dashed',
                          )}
                          onClick={() => {
                            if (!isCompSynced) {
                              setIsCompSynced(true)
                            } else {
                              setIsCompSynced(false)
                              setGrupoCompPeriodStart(grupoGlobalPeriodStart)
                              setGrupoCompPeriodEnd(grupoGlobalPeriodEnd)
                              setGrupoCompDateBase(summaryDateBase)
                              setGrupoCompTipo(analiseGrupoTipo)
                            }
                          }}
                        >
                          {isCompSynced ? (
                            <Link className="h-3.5 w-3.5 mr-1.5" />
                          ) : (
                            <Unlink className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {isCompSynced ? 'Sincronizado ao Global' : 'Filtro Customizado'}
                        </Button>

                        {!isCompSynced && (
                          <div className="flex flex-wrap items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-200 w-full lg:w-auto">
                            <div className="w-[120px]">
                              <MultiSelect
                                title="Tipos"
                                options={[
                                  { label: 'Receitas', value: 'receita' },
                                  { label: 'Despesas', value: 'despesa' },
                                  { label: 'Resultado', value: 'resultado' },
                                ]}
                                selected={grupoCompTipo}
                                onChange={setGrupoCompTipo}
                              />
                            </div>
                            <Select
                              value={grupoCompDateBase || summaryDateBase}
                              onValueChange={(v) => setGrupoCompDateBase(v)}
                            >
                              <SelectTrigger className="h-7 w-[95px] text-[10px] bg-slate-50 border-slate-200 font-medium">
                                <SelectValue placeholder="Data Base" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="data_emissao">Emissão</SelectItem>
                                <SelectItem value="dt_compens">Compensação</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={grupoCompPeriodStart || 'all'}
                              onValueChange={(v) => setGrupoCompPeriodStart(v === 'all' ? '' : v)}
                            >
                              <SelectTrigger className="h-7 w-[85px] text-[10px] bg-slate-50 border-slate-200 font-medium">
                                <SelectValue placeholder="Início" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todo Período</SelectItem>
                                {(effCompDateBase === 'data_emissao'
                                  ? groupAnalysisData.monthsEmissao
                                  : groupAnalysisData.monthsCompens
                                ).map((m) => (
                                  <SelectItem key={`c-start-${m}`} value={m}>
                                    {m.split('-').reverse().join('/')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-slate-300">-</span>
                            <Select
                              value={grupoCompPeriodEnd || 'all'}
                              onValueChange={(v) => setGrupoCompPeriodEnd(v === 'all' ? '' : v)}
                            >
                              <SelectTrigger className="h-7 w-[85px] text-[10px] bg-slate-50 border-slate-200 font-medium">
                                <SelectValue placeholder="Fim" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todo Período</SelectItem>
                                {(effCompDateBase === 'data_emissao'
                                  ? groupAnalysisData.monthsEmissao
                                  : groupAnalysisData.monthsCompens
                                ).map((m) => (
                                  <SelectItem key={`c-end-${m}`} value={m}>
                                    {m.split('-').reverse().join('/')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <Select value={compareGroup1} onValueChange={setCompareGroup1}>
                          <SelectTrigger className="w-full sm:w-[220px] bg-white text-xs">
                            <SelectValue placeholder="Selecione o Grupo A" />
                          </SelectTrigger>
                          <SelectContent>
                            {compareGroupOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-slate-400 font-medium hidden sm:inline">vs</span>
                        <Select value={compareGroup2} onValueChange={setCompareGroup2}>
                          <SelectTrigger className="w-full sm:w-[220px] bg-white text-xs">
                            <SelectValue placeholder="Selecione o Grupo B" />
                          </SelectTrigger>
                          <SelectContent>
                            {compareGroupOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {compareGroup1 && compareGroup2 ? (
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-1/3 flex flex-col gap-4">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Indicadores de Variação (Delta)
                          </h4>
                          {interGroupSummary && (
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col gap-4">
                              <div>
                                <p
                                  className="text-xs font-semibold text-slate-500 mb-1 truncate"
                                  title={interGroupSummary.name1}
                                >
                                  Grupo A: {interGroupSummary.name1}
                                </p>
                                <p className="text-xl font-bold text-indigo-700">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(interGroupSummary.total1)}
                                </p>
                              </div>
                              <div>
                                <p
                                  className="text-xs font-semibold text-slate-500 mb-1 truncate"
                                  title={interGroupSummary.name2}
                                >
                                  Grupo B: {interGroupSummary.name2}
                                </p>
                                <p className="text-xl font-bold text-rose-700">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(interGroupSummary.total2)}
                                </p>
                              </div>
                              <div className="pt-4 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-800 uppercase mb-2">
                                  Diferença Absoluta
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-lg font-black text-slate-900">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(Math.abs(interGroupSummary.diffAbs))}
                                  </p>
                                  <span
                                    className={cn(
                                      'px-2.5 py-1 rounded-md text-xs font-bold',
                                      interGroupSummary.diffAbs > 0
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : interGroupSummary.diffAbs < 0
                                          ? 'bg-rose-100 text-rose-700'
                                          : 'bg-slate-200 text-slate-700',
                                    )}
                                  >
                                    {interGroupSummary.diffPct.toFixed(1)}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">
                                  {interGroupSummary.diffAbs > 0
                                    ? 'Grupo A superior ao Grupo B'
                                    : interGroupSummary.diffAbs < 0
                                      ? 'Grupo B superior ao Grupo A'
                                      : 'Grupos equivalentes'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 text-center">
                            Evolução Comparativa
                          </h4>
                          <ChartContainer
                            config={{
                              group1: {
                                label: interGroupSummary?.name1 || 'Grupo A',
                                color: '#4338ca',
                              },
                              group2: {
                                label: interGroupSummary?.name2 || 'Grupo B',
                                color: '#be123c',
                              },
                            }}
                            className="h-[300px] w-full"
                          >
                            <LineChart
                              data={interGroupComparisonData}
                              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                              />
                              <XAxis
                                dataKey="month"
                                tickFormatter={(val) => val.split('-').reverse().join('/')}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                dy={10}
                              />
                              <YAxis
                                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                dx={-10}
                              />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Line
                                type="monotone"
                                dataKey="group1"
                                stroke="#4338ca"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="group2"
                                stroke="#be123c"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ChartContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-slate-400 border border-dashed rounded-xl bg-slate-50 flex-col gap-2">
                        <Columns className="h-8 w-8 opacity-50" />
                        <p>Selecione dois grupos acima para visualizar a comparação.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 flex flex-wrap items-center gap-2">
                      Detalhamento dos Subníveis
                      {groupAnalysisPath.length > 0 && (
                        <span className="text-sm font-medium text-slate-500 ml-1">
                          ({groupAnalysisPath[groupAnalysisPath.length - 1].code})
                        </span>
                      )}
                      <div className="flex gap-1.5 items-center bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] text-slate-500 font-normal shadow-sm">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effTableDateBase === 'data_emissao'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          Emissão
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effTableDateBase === 'dt_compens'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700',
                          )}
                        >
                          Compens.
                        </span>
                        <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-semibold',
                            effTableTipo.includes('receita') && effTableTipo.length === 1
                              ? 'bg-emerald-100 text-emerald-700'
                              : effTableTipo.includes('despesa') && effTableTipo.length === 1
                                ? 'bg-rose-100 text-rose-700'
                                : effTableTipo.includes('resultado') && effTableTipo.length === 1
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700',
                          )}
                        >
                          {effTableTipo
                            .map((t: string) =>
                              t === 'receita'
                                ? 'Receitas'
                                : t === 'despesa'
                                  ? 'Despesas'
                                  : 'Resultado',
                            )
                            .join(' + ')}
                        </span>
                      </div>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                      <div className="flex items-center gap-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm mr-2">
                        <TableSettingsControls
                          prefs={analiseGruposPrefs}
                          updatePrefs={updateAnaliseGruposPrefs}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] px-3 shadow-sm bg-white hover:bg-slate-50 text-slate-700"
                        onClick={handleExpandAllTable}
                      >
                        <ChevronsUpDown className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        Expandir Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] px-3 shadow-sm bg-white text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        onClick={handleCollapseAllTable}
                      >
                        <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
                        Recolher Todos
                      </Button>
                      {groupAnalysisPath.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px] px-3 shadow-sm bg-white hover:bg-slate-50 text-slate-700"
                          onClick={() => setGroupAnalysisPath([])}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          Todos os Grupos
                        </Button>
                      )}
                      <Button
                        variant={isTableSynced ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-8 text-[11px] px-3 shadow-sm transition-all',
                          isTableSynced
                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                            : 'bg-white text-slate-600 hover:text-slate-900 border-dashed',
                        )}
                        onClick={() => {
                          if (!isTableSynced) {
                            setIsTableSynced(true)
                          } else {
                            setIsTableSynced(false)
                            setGrupoTablePeriodStart(grupoGlobalPeriodStart)
                            setGrupoTablePeriodEnd(grupoGlobalPeriodEnd)
                            setGrupoTableDateBase(summaryDateBase)
                            setGrupoTableTipo(analiseGrupoTipo)
                          }
                        }}
                      >
                        {isTableSynced ? (
                          <Link className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                          <Unlink className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isTableSynced ? 'Sincronizado ao Global' : 'Filtro Customizado'}
                      </Button>

                      {!isTableSynced && (
                        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg w-full sm:w-auto">
                          <div className="w-[120px]">
                            <MultiSelect
                              title="Tipos"
                              options={[
                                { label: 'Receitas', value: 'receita' },
                                { label: 'Despesas', value: 'despesa' },
                                { label: 'Resultado', value: 'resultado' },
                              ]}
                              selected={grupoTableTipo}
                              onChange={setGrupoTableTipo}
                            />
                          </div>
                          <Select
                            value={grupoTableDateBase || summaryDateBase}
                            onValueChange={(v) => setGrupoTableDateBase(v)}
                          >
                            <SelectTrigger className="h-7 w-[95px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Data Base" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data_emissao">Emissão</SelectItem>
                              <SelectItem value="dt_compens">Compensação</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={grupoTablePeriodStart || 'all'}
                            onValueChange={(v) => setGrupoTablePeriodStart(v === 'all' ? '' : v)}
                          >
                            <SelectTrigger className="h-7 w-[85px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Início" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todo Período</SelectItem>
                              {(effTableDateBase === 'data_emissao'
                                ? groupAnalysisData.monthsEmissao
                                : groupAnalysisData.monthsCompens
                              ).map((m) => (
                                <SelectItem key={`t-start-${m}`} value={m}>
                                  {m.split('-').reverse().join('/')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-slate-300">-</span>
                          <Select
                            value={grupoTablePeriodEnd || 'all'}
                            onValueChange={(v) => setGrupoTablePeriodEnd(v === 'all' ? '' : v)}
                          >
                            <SelectTrigger className="h-7 w-[85px] text-[10px] bg-white border-slate-200 font-medium">
                              <SelectValue placeholder="Fim" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todo Período</SelectItem>
                              {(effTableDateBase === 'data_emissao'
                                ? groupAnalysisData.monthsEmissao
                                : groupAnalysisData.monthsCompens
                              ).map((m) => (
                                <SelectItem key={`t-end-${m}`} value={m}>
                                  {m.split('-').reverse().join('/')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-none">
                          {analiseGruposHeaders.map((col) => (
                            <TableHead
                              key={col.key}
                              style={getAnaliseGruposGridlineStyle()}
                              className={cn(
                                'border-none',
                                getAnaliseGruposCellProps(col.key, col.defaultAlign, 'p-2')
                                  .className,
                              )}
                            >
                              <div
                                className={cn(
                                  'flex items-center gap-1 w-full',
                                  (analiseGruposPrefs.alignments?.[col.key] || col.defaultAlign) ===
                                    'right'
                                    ? 'justify-end'
                                    : (analiseGruposPrefs.alignments?.[col.key] ||
                                          col.defaultAlign) === 'center'
                                      ? 'justify-center'
                                      : 'justify-start',
                                )}
                              >
                                <span>{col.label}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200 relative shrink-0"
                                      title="Alinhamento"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                                        Alinhamento
                                      </DropdownMenuLabel>
                                      <div className="flex items-center gap-1 px-2 py-1.5">
                                        <Button
                                          variant={
                                            (analiseGruposPrefs.alignments?.[col.key] ||
                                              col.defaultAlign) === 'left'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updateAnaliseGruposPrefs({
                                              alignments: {
                                                ...(analiseGruposPrefs.alignments || {}),
                                                [col.key]: 'left',
                                              },
                                            })
                                          }
                                        >
                                          <AlignLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant={
                                            (analiseGruposPrefs.alignments?.[col.key] ||
                                              col.defaultAlign) === 'center'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updateAnaliseGruposPrefs({
                                              alignments: {
                                                ...(analiseGruposPrefs.alignments || {}),
                                                [col.key]: 'center',
                                              },
                                            })
                                          }
                                        >
                                          <AlignCenter className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant={
                                            (analiseGruposPrefs.alignments?.[col.key] ||
                                              col.defaultAlign) === 'right'
                                              ? 'secondary'
                                              : 'ghost'
                                          }
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() =>
                                            updateAnaliseGruposPrefs({
                                              alignments: {
                                                ...(analiseGruposPrefs.alignments || {}),
                                                [col.key]: 'right',
                                              },
                                            })
                                          }
                                        >
                                          <AlignRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </DropdownMenuGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flattenedTableData.map((child: any, idx: number) => {
                          const hasChildren = child.children && child.children.length > 0
                          const isExpanded = grupoTableExpanded[child.id]
                          return (
                            <TableRow
                              key={child.id || idx}
                              className={cn(child.level > 0 ? 'bg-slate-50/50' : '', 'border-0')}
                            >
                              <TableCell
                                {...getAnaliseGruposCellProps(
                                  'codigo',
                                  'left',
                                  'font-mono font-medium text-slate-700',
                                )}
                              >
                                <div
                                  className={cn(
                                    'flex items-center gap-1.5',
                                    (analiseGruposPrefs.alignments?.['codigo'] || 'left') ===
                                      'right'
                                      ? 'justify-end'
                                      : (analiseGruposPrefs.alignments?.['codigo'] || 'left') ===
                                          'center'
                                        ? 'justify-center'
                                        : 'justify-start',
                                  )}
                                  style={{
                                    paddingLeft:
                                      (analiseGruposPrefs.alignments?.['codigo'] || 'left') ===
                                      'left'
                                        ? `${(child.level || 0) * 16}px`
                                        : undefined,
                                  }}
                                >
                                  {hasChildren ? (
                                    <button
                                      onClick={() =>
                                        setGrupoTableExpanded((p) => ({
                                          ...p,
                                          [child.id]: !p[child.id],
                                        }))
                                      }
                                      className="p-0.5 rounded hover:bg-black/10 transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="w-4 inline-block shrink-0" />
                                  )}
                                  <span className="truncate">{child.code || 'S/C'}</span>
                                </div>
                              </TableCell>
                              <TableCell
                                {...getAnaliseGruposCellProps(
                                  'descricao',
                                  'left',
                                  'font-medium text-slate-900',
                                )}
                              >
                                {child.description}
                              </TableCell>
                              <TableCell
                                {...getAnaliseGruposCellProps(
                                  'receitas',
                                  'right',
                                  'text-emerald-600 font-medium',
                                )}
                              >
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(child.periodRevenue || 0)}
                              </TableCell>
                              <TableCell
                                {...getAnaliseGruposCellProps(
                                  'despesas',
                                  'right',
                                  'text-rose-600 font-medium',
                                )}
                              >
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(child.periodExpense || 0)}
                              </TableCell>
                              <TableCell
                                {...getAnaliseGruposCellProps(
                                  'resultado',
                                  'right',
                                  'font-bold text-slate-800',
                                )}
                              >
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(child.periodTotal || 0)}
                              </TableCell>
                              <TableCell {...getAnaliseGruposCellProps('acoes', 'center')}>
                                {hasChildren && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleGroupAnalysisDrillDown(child.id)}
                                  >
                                    Explorar Nível <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {flattenedTableData.length === 0 && (
                          <TableRow disableZebra>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-slate-500 border-0"
                            >
                              Nenhum subnível com movimento neste grupo para o período.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
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

      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Efetivar Lançamentos Contábeis</DialogTitle>
            <DialogDescription className="mt-2">
              {selectedIds.length > 0
                ? `Você está prestes a gerar os lançamentos contábeis para os ${selectedIds.length} registros selecionados.`
                : `Você está prestes a gerar os lançamentos contábeis para todos os registros pendentes atualmente filtrados.`}
              <br />
              <br />
              Apenas registros que possuem ambas as contas (Débito e Crédito) e Data de Emissão
              preenchida serão efetivados. O status dos registros processados será alterado para
              "Concluído".
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setGenerateModalOpen(false)}
              disabled={isGeneratingEntries}
            >
              Cancelar
            </Button>
            <Button
              onClick={startGenerateEntries}
              disabled={isGeneratingEntries}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isGeneratingEntries ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-xl">
          <DialogHeader className="px-6 py-5 border-b bg-white">
            <DialogTitle className="text-xl flex items-center gap-2 text-slate-900 font-bold">
              Detalhamento de Despesas
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Lançamentos que compõem o total de{' '}
              <strong className="text-slate-900 font-semibold">{drillDownTitle}</strong> no período.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
            <Table
              className="bg-white border border-slate-200 rounded-lg shadow-sm"
              style={{ fontSize: `${tableFontSize}px` }}
            >
              <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                <TableRow className="border-b-slate-200 hover:bg-slate-100">
                  <TableHead className="font-semibold text-slate-700 w-[120px]">
                    Data Emissão
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[140px]">
                    Documento
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Fornecedor/Cliente</TableHead>
                  <TableHead className="font-semibold text-slate-700">Histórico</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-left w-[150px]">
                    Valor
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drillDownData.map((row, i) => (
                  <TableRow key={row.id || i} className="border-b-slate-100 transition-colors">
                    <TableCell className="whitespace-nowrap font-medium text-slate-600">
                      {formatDate(row.data_emissao)}
                    </TableCell>
                    <TableCell className="font-mono text-[0.9em] text-slate-500">
                      {row.n_documento || '-'}
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">
                      {row.nome_cli_fornec || '-'}
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-slate-600"
                      title={row.historico}
                    >
                      {row.historico || '-'}
                    </TableCell>
                    <TableCell className="text-left text-rose-600 font-bold whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(row.valor_liquido || row.valor || 0)}
                    </TableCell>
                  </TableRow>
                ))}
                {drillDownData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-slate-300" />
                        <p>Nenhum lançamento detalhado encontrado.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
              Total de {drillDownData.length} registro{drillDownData.length !== 1 && 's'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                Total:
              </span>
              <div className="text-2xl font-bold text-rose-600 bg-rose-50 px-4 py-1.5 rounded-lg border border-rose-100">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  drillDownData.reduce(
                    (acc, row) => acc + Number(row.valor_liquido || row.valor || 0),
                    0,
                  ),
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                              value={`${account.account_code} ${account.classification || ''} ${account.account_name}`}
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
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-800">
                                  {account.account_name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-[#1e1b4b] text-white px-1.5 py-0.5 rounded text-[10px] font-bold font-mono min-w-[50px] text-center inline-block">
                                    {account.account_code}
                                  </span>
                                  {account.classification && (
                                    <span className="font-mono text-[10px] text-black font-semibold">
                                      {account.classification}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="text-xs text-slate-700 mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-md leading-relaxed shadow-sm">
                  <strong className="text-blue-900 block mb-1">O que acontece ao salvar?</strong>
                  Uma regra fixa de <strong>DE/PARA</strong> será criada no sistema, vinculando o
                  Centro de Custo ERP atual (
                  <span className="font-mono bg-white px-1 rounded border border-slate-200">
                    {mappingRow.c_custo || 'Sem C.Custo'}
                  </span>
                  ) à Conta Contábil selecionada acima.
                  <br />
                  <br />
                  Além de mapear este lançamento específico,{' '}
                  <strong>todos os outros lançamentos</strong> (atuais e futuros) com este mesmo
                  centro de custo serão atualizados e mapeados automaticamente.
                </div>
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
