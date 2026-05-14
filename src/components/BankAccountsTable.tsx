import { useState, useEffect } from 'react'
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
import { ArrowUpDown, Edit, Trash2, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface BankAccountsTableProps {
  accounts: any[]
  chartAccounts?: any[]
  selectedAccounts: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  loading: boolean
  onEdit: (acc: any) => void
  onDelete: (acc: any) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
  onSort: (key: string) => void
  itemsPerPage: number
  onItemsPerPageChange: (v: number) => void
  tableFontSize: number
}

const defaultColumns = [
  { id: 'company_name', label: 'Empresa', sortKey: 'company_name' },
  { id: 'code', label: 'Código', sortKey: 'code' },
  { id: 'account_code', label: 'Conta Contábil', sortKey: 'account_code' },
  { id: 'description', label: 'Descrição', sortKey: 'description' },
  { id: 'bank_code', label: 'Banco', sortKey: 'bank_code' },
  { id: 'agency', label: 'Agência', sortKey: 'agency' },
  { id: 'account_number', label: 'Conta', sortKey: 'account_number' },
  { id: 'account_type', label: 'Tipo', sortKey: 'account_type' },
  { id: 'classification', label: 'Classificação', sortKey: 'classification' },
]

export function BankAccountsTable({
  accounts,
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
}: BankAccountsTableProps) {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('bank_accounts_columns_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === defaultColumns.length) {
          return parsed
        }
      } catch {
        /* intentionally ignored */
      }
    }
    return defaultColumns
  })

  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null)
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null)

  useEffect(() => {
    localStorage.setItem('bank_accounts_columns_order', JSON.stringify(columns))
  }, [columns])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    setDraggedColIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverColIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverColIndex(null)
    if (draggedColIndex === null || draggedColIndex === dropIndex) return

    const newCols = [...columns]
    const [draggedCol] = newCols.splice(draggedColIndex, 1)
    newCols.splice(dropIndex, 0, draggedCol)
    setColumns(newCols)
    setDraggedColIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedColIndex(null)
    setDragOverColIndex(null)
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto min-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center px-2">
                <Checkbox
                  checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              {columns.map((col, index) => (
                <TableHead
                  key={col.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSort(col.sortKey)}
                  className={cn(
                    'cursor-move select-none group transition-colors px-4 py-3 hover:bg-white/5 relative',
                  )}
                  title="Clique e arraste para reordenar a coluna"
                >
                  <div className="flex items-center gap-2 w-full whitespace-nowrap">
                    <GripHorizontal className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <span
                      className={cn(
                        'flex-1 tracking-wide',
                        col.id === 'company_name' || col.id === 'description'
                          ? 'font-bold'
                          : 'font-normal',
                      )}
                    >
                      {col.label}
                    </span>
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3 flex-shrink-0 transition-opacity',
                        sortConfig?.key === col.sortKey
                          ? 'opacity-100'
                          : 'opacity-40 group-hover:opacity-70',
                      )}
                    />
                  </div>
                  {dragOverColIndex === index && draggedColIndex !== null && (
                    <div
                      className={cn(
                        'absolute inset-y-0 w-1 bg-cyan-400 pointer-events-none',
                        draggedColIndex > index ? 'left-0' : 'right-0',
                      )}
                    />
                  )}
                </TableHead>
              ))}
              <TableHead className="text-right px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="text-center py-12 text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc) => {
                return (
                  <TableRow key={acc.id}>
                    <TableCell className="text-center px-2">
                      <Checkbox
                        checked={selectedAccounts.includes(acc.id)}
                        onCheckedChange={() => onToggleSelect(acc.id)}
                      />
                    </TableCell>
                    {columns.map((col) => {
                      let val = acc[col.id]
                      if (col.id === 'company_name') {
                        val = acc.organizations?.name || acc.company_name || ''
                      }
                      if (col.id === 'account_number' && acc.check_digit) {
                        val = `${acc.account_number}-${acc.check_digit}`
                      }
                      return (
                        <TableCell
                          key={col.id}
                          className={cn(
                            'px-4 py-3 whitespace-nowrap',
                            col.id === 'account_code' && 'font-mono',
                            (col.id === 'company_name' || col.id === 'description') && 'font-bold',
                            col.id === 'account_type' && '!text-black dark:!text-black',
                          )}
                        >
                          {val || '-'}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right px-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-black/10 dark:hover:bg-white/10"
                          onClick={() => onEdit(acc)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-500/20"
                          onClick={() => onDelete(acc)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <div className="p-4 border-t border-border bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Itens por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="w-[80px] h-8 bg-background border-border shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 shadow-sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shadow-sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
