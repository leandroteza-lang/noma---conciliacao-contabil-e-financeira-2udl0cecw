import { useState, useEffect, Fragment } from 'react'
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
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ArrowUpDown,
  CornerDownRight,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const COLUMNS_DEF = [
    { id: 'organization_id', label: 'Empresa', width: 'w-[180px]' },
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

  const toggleRow = (accId: string) => {
    const newSet = new Set(expandedRows)
    if (newSet.has(accId)) newSet.delete(accId)
    else newSet.add(accId)
    setExpandedRows(newSet)
  }

  const expandAll = () => setExpandedRows(new Set(accounts.map((a: any) => a.id)))
  const collapseAll = () => setExpandedRows(new Set())

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

    return chartAccounts
      .filter((ca: any) => ca.organization_id === orgId && prefixes.includes(ca.classification))
      .sort((a: any, b: any) => a.classification.localeCompare(b.classification))
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

  const renderCellContent = (acc: any, field: string) => {
    switch (field) {
      case 'organization_id':
        return acc.organizations?.name || acc.company_name || '-'
      case 'code':
        return acc.code || '-'
      case 'account_code':
        return <span className="font-mono">{acc.account_code || '-'}</span>
      case 'description':
        return acc.description || '-'
      case 'bank_code':
        return acc.bank_code || '-'
      case 'agency':
        return acc.agency || '-'
      case 'account_number':
        return acc.account_number || '-'
      case 'check_digit':
        return acc.check_digit || '-'
      case 'account_type':
        return acc.account_type || '-'
      case 'classification':
        return (
          <Badge variant="secondary" className="bg-black/5 font-normal">
            {acc.classification || '-'}
          </Badge>
        )
      default:
        return acc[field] || '-'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="p-2 flex gap-2 border-b bg-slate-50 dark:bg-slate-900/50">
        <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-xs font-medium">
          <ChevronDown className="h-3.5 w-3.5 mr-1" /> Expandir Todos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={collapseAll}
          className="h-8 text-xs font-medium"
        >
          <ChevronRight className="h-3.5 w-3.5 mr-1" /> Recolher Todos
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="border-collapse min-w-full" style={{ fontSize: `${tableFontSize}px` }}>
          <TableHeader className="bg-indigo-950">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-12 text-center py-2 px-2 text-white font-normal text-[1.1em] border-0">
                <Checkbox
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950"
                  checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-10 py-2 px-2 text-white border-0"></TableHead>
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
                    onClick={() => onSort(colDef.id)}
                    className={cn(
                      'cursor-pointer hover:bg-indigo-950/80 py-2 px-2 text-white font-normal text-[1.1em] border-0 transition-opacity',
                      colDef.width,
                      draggedCol === colDef.id &&
                        'opacity-30 border-dashed border-2 border-white/50',
                    )}
                  >
                    <div className="flex items-center gap-2 select-none group whitespace-nowrap">
                      <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing shrink-0" />
                      {colDef.label} <ArrowUpDown className="h-3 w-3 opacity-50 shrink-0" />
                    </div>
                  </TableHead>
                )
              })}
              <TableHead className="text-right py-2 px-2 text-white font-normal text-[1.1em] border-0">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnOrder.length + 3} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-950" />
                  <p className="mt-2 text-slate-500">Carregando contas...</p>
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnOrder.length + 3}
                  className="h-32 text-center text-slate-500"
                >
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc: any, index: number) => {
                const isEven = index % 2 === 1
                const isExpanded = expandedRows.has(acc.id)
                const hierarchy = isExpanded ? getHierarchy(acc) : []

                return (
                  <Fragment key={acc.id}>
                    <TableRow
                      className={cn(
                        'border-0 group/row transition-colors text-[1em]',
                        isEven
                          ? 'bg-[#bfdbfe] text-black hover:bg-[#93c5fd]'
                          : 'bg-transparent text-foreground hover:bg-muted/50',
                      )}
                    >
                      <TableCell className="text-center py-2 px-2 border-0">
                        <Checkbox
                          className={cn(
                            'data-[state=checked]:bg-indigo-950 data-[state=checked]:border-indigo-950 data-[state=checked]:text-white',
                            isEven && 'border-black/50',
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
                            'h-6 w-6 rounded-full hover:bg-black/10',
                            isExpanded && 'bg-black/5',
                          )}
                          onClick={() => toggleRow(acc.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>

                      {columnOrder.map((field) => (
                        <TableCell
                          key={field}
                          className={cn(
                            'py-2 px-2 border-0 whitespace-nowrap',
                            field === 'description' || field === 'organization_id'
                              ? 'font-bold'
                              : '',
                          )}
                        >
                          {renderCellContent(acc, field)}
                        </TableCell>
                      ))}

                      <TableCell className="text-right py-2 px-2 border-0">
                        <div className="flex justify-end gap-1 opacity-50 group-hover/row:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-7 w-7 transition-colors',
                              isEven
                                ? 'hover:bg-black/10 hover:text-indigo-950'
                                : 'hover:bg-primary/10 hover:text-primary',
                            )}
                            onClick={() => onEdit(acc)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-7 w-7 transition-colors',
                              isEven
                                ? 'hover:bg-red-500/20 hover:text-red-700'
                                : 'hover:bg-destructive/10 hover:text-destructive',
                            )}
                            onClick={() => onDelete(acc)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="border-0 bg-slate-50 dark:bg-slate-900/50">
                        <TableCell colSpan={columnOrder.length + 3} className="p-0 border-0">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 shadow-inner border-y border-slate-200 dark:border-slate-800">
                            <div className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                              <CornerDownRight className="h-4 w-4" /> Raiz Hierárquica da Conta
                              Vinculada
                            </div>

                            {hierarchy.length > 0 ? (
                              <div className="flex flex-col rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ml-6">
                                {hierarchy.map((node: any) => {
                                  const level = (node.classification?.match(/\./g) || []).length + 1
                                  const isSyn = node.account_level === 'Sintética'
                                  return (
                                    <div
                                      key={node.id}
                                      className="flex items-center gap-3 p-2"
                                      style={getHierarchyNodeStyle(level, isSyn)}
                                    >
                                      <span
                                        className="font-mono text-xs px-2 py-0.5 rounded shadow-sm"
                                        style={getHierarchyBadgeStyle(level, isSyn)}
                                      >
                                        {node.classification}
                                      </span>
                                      <span className="text-sm font-medium">
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
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-white dark:bg-slate-950 gap-4 mt-auto">
          <p className="text-sm text-slate-500">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500 hidden sm:block">Itens por página:</p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => onItemsPerPageChange(Number(v))}
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
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
