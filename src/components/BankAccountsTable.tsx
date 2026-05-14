import React, { useState, useEffect } from 'react'
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
import { Pencil, Trash2, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function BankAccountsTable({
  accounts,
  allAccounts,
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const defaultColumns = [
    { id: 'code', label: 'Código', key: 'code' },
    { id: 'account_code', label: 'Conta Contábil', key: 'account_code' },
    { id: 'description', label: 'Descrição', key: 'description' },
    { id: 'bank_code', label: 'Banco', key: 'bank_code' },
    { id: 'agency', label: 'Agência', key: 'agency' },
    { id: 'account_number', label: 'Conta', key: 'account_number' },
    { id: 'check_digit', label: 'Dígito', key: 'check_digit' },
    { id: 'account_type', label: 'Tipo', key: 'account_type' },
    { id: 'classification', label: 'Classificação', key: 'classification' },
    { id: 'company_name', label: 'Empresa', key: 'company_name' },
  ]

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('bank_accounts_columns_v4')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure "code" is present in loaded columns in case it was missing in an older cache
        if (!parsed.find((c: any) => c.key === 'code')) {
          return defaultColumns
        }
        return parsed
      } catch (e) {
        return defaultColumns
      }
    }
    return defaultColumns
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_columns_v4', JSON.stringify(columns))
  }, [columns])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('colIndex', index.toString())
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData('colIndex'), 10)
    if (isNaN(dragIndex) || dragIndex === dropIndex) return
    const newCols = [...columns]
    const [draggedCol] = newCols.splice(dragIndex, 1)
    newCols.splice(dropIndex, 0, draggedCol)
    setColumns(newCols)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedIds(newSet)
  }

  const expandAll = () => {
    const source = allAccounts || accounts
    setExpandedIds(new Set(source.map((a: any) => a.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const expandAnalytic = () => {
    const source = allAccounts || accounts
    const parentIds = new Set<string>()
    source.forEach((a: any) => {
      if (hasChildren(a, source)) {
        parentIds.add(a.id)
      }
    })
    setExpandedIds(parentIds)
  }

  const getLevel = (acc: any) => {
    const cls = acc.classification || ''
    return (cls.match(/\./g) || []).length + 1
  }

  const hasChildren = (acc: any, all: any[]) => {
    const cls = acc.classification
    if (!cls) return false
    return all.some((a) => a.classification?.startsWith(cls + '.') && a.classification !== cls)
  }

  const isVisible = (acc: any) => {
    const cls = acc.classification
    if (!cls) return true

    const parts = cls.split(/[.-]/)
    if (parts.length <= 1) return true

    parts.pop()
    let currentParentCls = parts.join('.')

    const source = allAccounts || accounts

    while (currentParentCls) {
      const p = source.find((a: any) => a.classification === currentParentCls)
      if (p && !expandedIds.has(p.id)) return false

      const pParts = currentParentCls.split(/[.-]/)
      if (pParts.length <= 1) break
      pParts.pop()
      currentParentCls = pParts.join('.')
    }

    return true
  }

  const visibleAccounts = accounts.filter(isVisible)
  const fullSource = allAccounts || accounts

  const getRowClassName = (acc: any) => {
    const level = getLevel(acc)
    if (hasChildren(acc, fullSource)) {
      if (level === 1) return 'bg-indigo-950 font-bold text-white hover:bg-indigo-900 border-none'
      if (level === 2) return 'bg-blue-800 font-semibold text-white hover:bg-blue-700 border-none'
      if (level === 3) return 'bg-blue-500 font-medium text-white hover:bg-blue-400 border-none'
      if (level === 4) return 'bg-blue-200 font-medium text-blue-950 hover:bg-blue-300 border-none'
      return 'bg-blue-50 font-medium text-blue-900 hover:bg-blue-100 border-none'
    }
    return 'bg-white font-normal text-slate-700 hover:bg-slate-50 border-b-slate-100'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-md w-full">
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-b flex-wrap">
        <Button variant="outline" size="sm" onClick={expandAll} className="bg-white">
          Expandir Todos
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll} className="bg-white">
          Recolher Todos
        </Button>
        <Button variant="outline" size="sm" onClick={expandAnalytic} className="bg-white">
          Expandir Analítico
        </Button>
      </div>
      <div className="overflow-x-auto w-full">
        <Table style={{ fontSize: `${tableFontSize}px` }}>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              {columns.map((col: any, index: number) => (
                <TableHead
                  key={col.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                  onClick={() => onSort(col.key)}
                  className="cursor-move hover:bg-slate-100 whitespace-nowrap group transition-colors"
                  title="Clique e arraste para reordenar a coluna. Clique para ordenar."
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortConfig?.key === col.key ? (
                      <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                  Carregando contas...
                </TableCell>
              </TableRow>
            ) : visibleAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              visibleAccounts.map((acc: any) => {
                const level = getLevel(acc)
                const isParent = hasChildren(acc, fullSource)
                const isExpanded = expandedIds.has(acc.id)

                return (
                  <TableRow key={acc.id} className={getRowClassName(acc)}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedAccounts.includes(acc.id)}
                        onCheckedChange={() => onToggleSelect(acc.id)}
                        className={cn(
                          isParent && level <= 3
                            ? 'border-white/70 data-[state=checked]:!bg-white data-[state=checked]:!text-indigo-950'
                            : isParent && level === 4
                              ? 'border-blue-950/50 data-[state=checked]:!bg-blue-950 data-[state=checked]:!text-white'
                              : '',
                        )}
                      />
                    </TableCell>
                    {columns.map((col: any, colIdx: number) => {
                      let val = acc[col.key]
                      if (col.key === 'company_name') {
                        val = acc.organizations?.name || acc.company_name || '-'
                      }

                      if (colIdx === 0) {
                        return (
                          <TableCell key={col.id} className="whitespace-nowrap">
                            <div
                              className="flex items-center gap-1.5"
                              style={{ paddingLeft: `${(level - 1) * 1.5}rem` }}
                            >
                              {isParent ? (
                                <button
                                  onClick={() => toggleExpand(acc.id)}
                                  className="p-0.5 hover:bg-black/10 rounded transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-4.5 inline-block" />
                              )}
                              <span className={cn(isParent ? 'font-semibold' : '')}>
                                {val || '-'}
                              </span>
                            </div>
                          </TableCell>
                        )
                      }

                      return (
                        <TableCell key={col.id} className="whitespace-nowrap">
                          {val || '-'}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(acc)}
                          className={cn(
                            'h-7 w-7 opacity-70 hover:opacity-100 transition-colors',
                            isParent && level <= 3
                              ? 'hover:bg-white/20 !text-white'
                              : isParent && level === 4
                                ? 'hover:bg-black/10 hover:!text-blue-800 !text-blue-900'
                                : 'hover:bg-black/5 hover:!text-blue-600 !text-slate-500',
                          )}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(acc)}
                          className={cn(
                            'h-7 w-7 opacity-70 hover:opacity-100 transition-colors',
                            isParent && level <= 3
                              ? 'hover:bg-white/20 !text-white'
                              : isParent && level === 4
                                ? 'hover:bg-black/10 hover:!text-red-600 !text-blue-900'
                                : 'hover:bg-black/5 hover:!text-red-600 !text-slate-500',
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-md">
        <p className="text-sm text-slate-500">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
          {Math.min(currentPage * itemsPerPage, fullSource.length)}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 hidden sm:inline-block">Itens por página:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => onItemsPerPageChange(Number(v))}
            >
              <SelectTrigger className="w-[70px] h-8 bg-white">
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white"
            >
              Anterior
            </Button>
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white"
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
