import React, { useState, useEffect, Fragment } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  GripVertical,
  Edit,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS_DEF = [
  { id: 'company_name', label: 'Empresa', width: 'w-[180px]' },
  { id: 'code', label: 'Código', width: 'w-[100px]' },
  { id: 'account_code', label: 'Conta Contábil', width: 'w-[140px]' },
  { id: 'description', label: 'Descrição', width: 'min-w-[200px]' },
  { id: 'bank_code', label: 'Banco', width: 'w-[100px]' },
  { id: 'agency', label: 'Agência', width: 'w-[100px]' },
  { id: 'account_number', label: 'Conta', width: 'w-[120px]' },
  { id: 'check_digit', label: 'Dígito', width: 'w-[80px]' },
  { id: 'account_type', label: 'Tipo', width: 'w-[120px]' },
  { id: 'classification', label: 'Classificação', width: 'w-[140px]' },
]

export function BankAccountsTable({
  accounts,
  chartAccounts,
  selectedAccounts,
  onToggleSelect,
  onToggleSelectAll,
  loading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  sortConfig,
  onSort,
  itemsPerPage,
  onItemsPerPageChange,
  tableFontSize,
}: any) {
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('bank_accounts_col_order_v2')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const missing = COLUMNS_DEF.map((c) => c.id).filter((id) => !parsed.includes(id))
        return [...parsed, ...missing]
      } catch {
        return COLUMNS_DEF.map((c) => c.id)
      }
    }
    return COLUMNS_DEF.map((c) => c.id)
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_col_order_v2', JSON.stringify(columnOrder))
  }, [columnOrder])

  const [draggedCol, setDraggedCol] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, col: string) => {
    setDraggedCol(col)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, col: string) => {
    e.preventDefault()
    if (!draggedCol || draggedCol === col) return
    const newOrder = [...columnOrder]
    const fromIndex = newOrder.indexOf(draggedCol)
    const toIndex = newOrder.indexOf(col)
    newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, draggedCol)
    setColumnOrder(newOrder)
    setDraggedCol(null)
  }

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (acc: any) => {
    const newSet = new Set(expandedRows)
    if (newSet.has(acc.id)) {
      newSet.delete(acc.id)
    } else {
      newSet.add(acc.id)
    }
    setExpandedRows(newSet)
  }

  const expandAll = () => {
    const newSet = new Set<string>()
    accounts.forEach((acc: any) => {
      newSet.add(acc.id)
    })
    setExpandedRows(newSet)
  }

  const collapseAll = () => {
    setExpandedRows(new Set())
  }

  const getHierarchy = (acc: any) => {
    const orgId = acc.organization_id
    const accountCode = acc.account_code
    if (!accountCode) return []

    const targetAcc = chartAccounts.find(
      (ca: any) =>
        ca.organization_id === orgId &&
        (ca.account_code === accountCode || ca.classification === accountCode),
    )

    if (!targetAcc || !targetAcc.classification) return []

    const parts = targetAcc.classification.split('.')
    const prefixes = parts.map((_: any, i: number) => parts.slice(0, i + 1).join('.'))

    const hierarchy = chartAccounts
      .filter((ca: any) => ca.organization_id === orgId && prefixes.includes(ca.classification))
      .sort((a: any, b: any) => a.classification.localeCompare(b.classification))

    return hierarchy
  }

  const getHierarchyNodeStyle = (nodeLevel: number, isSyntheticNode: boolean) => {
    if (!isSyntheticNode)
      return { backgroundColor: '#ffffff', color: '#334155', borderBottom: '1px solid #f1f5f9' }
    switch (nodeLevel) {
      case 1:
        return {
          backgroundColor: '#1e1b4b',
          color: '#ffffff',
          fontWeight: 700,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }
      case 2:
        return {
          backgroundColor: '#312e81',
          color: '#ffffff',
          fontWeight: 600,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }
      case 3:
        return {
          backgroundColor: '#3730a3',
          color: '#ffffff',
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }
      case 4:
        return {
          backgroundColor: '#e0e7ff',
          color: '#1e1b4b',
          fontWeight: 500,
          borderBottom: '1px solid #c7d2fe',
        }
      default:
        return {
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontWeight: 500,
          borderBottom: '1px solid #e2e8f0',
        }
    }
  }

  const getHierarchyBadgeStyle = (nodeLevel: number, isSyntheticNode: boolean) => {
    if (!isSyntheticNode)
      return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
    switch (nodeLevel) {
      case 1:
        return { backgroundColor: '#312e81', color: '#ffffff', border: '1px solid #3730a3' }
      case 2:
        return { backgroundColor: '#3730a3', color: '#ffffff', border: '1px solid #4338ca' }
      case 3:
        return { backgroundColor: '#4338ca', color: '#ffffff', border: '1px solid #4f46e5' }
      case 4:
        return { backgroundColor: '#c7d2fe', color: '#1e1b4b', border: '1px solid #a5b4fc' }
      default:
        return { backgroundColor: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1' }
    }
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="flex items-center justify-between p-2 border-b border-indigo-950 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="h-8 text-xs bg-white text-slate-700 shadow-sm border-slate-200"
          >
            <ChevronDown className="h-3.5 w-3.5 mr-1" /> Expandir Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="h-8 text-xs bg-white text-slate-700 shadow-sm border-slate-200"
          >
            <ChevronRight className="h-3.5 w-3.5 mr-1" /> Recolher Todos
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto w-full custom-scrollbar pb-2">
        <Table style={{ fontSize: `${tableFontSize}px` }} className="min-w-max border-collapse">
          <TableHeader className="bg-indigo-950">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-12 text-center py-2 px-2 text-white font-normal text-[1.1em] border-0">
                <Checkbox
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950 h-5 w-5 rounded-md"
                  checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-10 py-2 px-2 text-white border-0 text-center">
                <div className="w-5" />
              </TableHead>
              {columnOrder.map((colId) => {
                const colDef = COLUMNS_DEF.find((c) => c.id === colId)
                if (!colDef) return null
                return (
                  <TableHead
                    key={colDef.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, colDef.id)}
                    onDragOver={(e) => handleDragOver(e, colDef.id)}
                    onDrop={(e) => handleDrop(e, colDef.id)}
                    onClick={() => onSort && onSort(colDef.id)}
                    className={cn(
                      'cursor-pointer hover:bg-indigo-900 py-3 px-3 text-white font-semibold text-[1.1em] border-0 transition-colors select-none',
                      colDef.width,
                      draggedCol === colDef.id &&
                        'opacity-30 border-dashed border-2 border-white/50',
                    )}
                  >
                    <div className="flex items-center gap-2 group whitespace-nowrap">
                      <GripVertical className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing shrink-0" />
                      {colDef.label}
                      {sortConfig?.key === colDef.id ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUpDown className="h-3.5 w-3.5 text-white shrink-0" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-white shrink-0 transform rotate-180" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30 shrink-0" />
                      )}
                    </div>
                  </TableHead>
                )
              })}
              <TableHead className="text-right py-3 px-3 text-white font-semibold text-[1.1em] border-0">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnOrder.length + 3} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                  <span className="text-slate-500 mt-2 block">Carregando contas...</span>
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnOrder.length + 3}
                  className="text-center py-10 text-slate-500"
                >
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc: any, index: number) => {
                const isEven = index % 2 === 1
                const isExpanded = expandedRows.has(acc.id)
                const hierarchy = getHierarchy(acc)

                return (
                  <Fragment key={acc.id}>
                    <TableRow
                      className={cn(
                        'border-0 group/row text-[1em] transition-colors',
                        isEven
                          ? 'bg-[#bfdbfe] text-black hover:bg-[#93c5fd]'
                          : 'bg-white text-black hover:bg-slate-50',
                      )}
                    >
                      <TableCell className="text-center py-2 px-2 border-0">
                        <Checkbox
                          className={cn(
                            'h-5 w-5 rounded-md data-[state=checked]:bg-indigo-950 data-[state=checked]:border-indigo-950 data-[state=checked]:text-white',
                            isEven ? 'border-black/50 bg-white/50' : 'border-slate-300',
                          )}
                          checked={selectedAccounts.includes(acc.id)}
                          onCheckedChange={() => onToggleSelect(acc.id)}
                        />
                      </TableCell>
                      <TableCell className="py-2 px-2 border-0 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-7 w-7 rounded-full',
                            isEven
                              ? 'hover:bg-black/10 text-black'
                              : 'hover:bg-slate-200 text-slate-600',
                            isExpanded && (isEven ? 'bg-black/5' : 'bg-slate-100'),
                          )}
                          onClick={() => toggleRow(acc)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      {columnOrder.map((field) => {
                        let value = acc[field]
                        if (field === 'company_name') {
                          value = acc.organizations?.name || acc.company_name || '-'
                        }
                        return (
                          <TableCell
                            key={field}
                            className={cn(
                              'py-2 px-3 border-0',
                              field === 'account_code' ? 'font-mono' : '',
                              field === 'company_name' || field === 'description'
                                ? 'font-bold'
                                : 'font-normal',
                            )}
                          >
                            {field === 'classification' ? (
                              value ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-black/5 text-inherit border-transparent font-normal"
                                >
                                  {value}
                                </Badge>
                              ) : (
                                '-'
                              )
                            ) : (
                              value || <span className="opacity-50 italic text-[0.85em]">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-right py-2 px-2 border-0">
                        <div className="flex justify-end gap-1 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-8 w-8 transition-colors',
                              isEven
                                ? 'text-black/70 hover:text-indigo-950 hover:bg-black/10'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50',
                            )}
                            onClick={() => onEdit(acc)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-8 w-8 transition-colors',
                              isEven
                                ? 'text-black/70 hover:text-red-700 hover:bg-red-500/20'
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50',
                            )}
                            onClick={() => onDelete(acc)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="border-0 bg-slate-50">
                        <TableCell colSpan={columnOrder.length + 3} className="p-0 border-0">
                          <div className="bg-slate-50 p-4 shadow-inner border-y border-slate-200">
                            <div className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                              <CornerDownRight className="h-4 w-4" /> Raiz Hierárquica da Conta
                              Vinculada
                            </div>

                            {hierarchy.length > 0 ? (
                              <div className="flex flex-col rounded-md overflow-hidden border border-slate-200 shadow-sm ml-6">
                                {hierarchy.map((node: any) => {
                                  const code = node.classification || node.account_code || ''
                                  const level = (code.match(/\./g) || []).length + 1
                                  const isSyn = node.account_level === 'Sintética'

                                  return (
                                    <div
                                      key={node.id}
                                      className="flex items-center gap-3 p-2"
                                      style={getHierarchyNodeStyle(level, isSyn)}
                                    >
                                      <span
                                        className="font-mono text-[11px] px-2 py-0.5 rounded shadow-sm"
                                        style={getHierarchyBadgeStyle(level, isSyn)}
                                      >
                                        {code}
                                      </span>
                                      <span className="text-[13px] font-medium tracking-wide">
                                        {node.account_name}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 p-2 italic ml-6 border-l-2 border-slate-300 pl-4">
                                Nenhuma hierarquia encontrada. Verifique se a Conta Contábil "
                                {acc.account_code || ''}" está mapeada corretamente no Plano de
                                Contas.
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && accounts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t bg-slate-50/50 gap-4">
          <div className="text-sm font-medium text-slate-500">
            Mostrando Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Itens por página:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => onItemsPerPageChange(Number(v))}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-slate-200"
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1 || loading}
              >
                <ChevronsLeft className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-slate-200"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1 || loading}
              >
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-slate-200"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages || loading}
              >
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-slate-200"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages || loading}
              >
                <ChevronsRight className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
