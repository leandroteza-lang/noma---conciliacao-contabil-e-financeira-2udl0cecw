import { Fragment, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Edit2,
  Trash2,
  Loader2,
  Building2,
  CreditCard,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Network,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function BankAccountsTable({
  accounts = [],
  chartAccounts = [],
  selectedAccounts = [],
  onToggleSelect = () => {},
  onToggleSelectAll = () => {},
  loading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  sortConfig,
  onSort = () => {},
  itemsPerPage = 100,
  onItemsPerPageChange = () => {},
}: any) {
  const isMobile = useIsMobile()
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }

  const expandAll = () => setExpandedRows(accounts.map((a: any) => a.id))
  const collapseAll = () => setExpandedRows([])
  const expandAnalytical = () => {
    const analiticos = accounts
      .filter((a: any) => {
        const ca = chartAccounts.find(
          (c: any) => c.account_code === a.account_code && c.organization_id === a.organization_id,
        )
        return ca?.account_level === 'Analítica'
      })
      .map((a: any) => a.id)
    setExpandedRows(analiticos)
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    )
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border rounded-xl bg-card text-muted-foreground animate-in fade-in duration-500">
        <CreditCard className="w-12 h-12 mb-4 opacity-20" />
        <p>Nenhuma conta encontrada com os filtros atuais.</p>
      </div>
    )
  }

  const selectableAccounts = accounts.filter((a: any) => !a.pending_deletion)
  const isAllSelected =
    selectableAccounts.length > 0 && selectedAccounts.length === selectableAccounts.length

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-end gap-2 px-1">
        <Button variant="outline" size="sm" onClick={expandAll} className="bg-background">
          <Network className="w-4 h-4 mr-2" /> Expandir Todos
        </Button>
        <Button variant="outline" size="sm" onClick={expandAnalytical} className="bg-background">
          Expandir Analítico
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll} className="bg-background">
          Recolher Todos
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {selectableAccounts.length > 0 && (
            <div className="flex items-center gap-2 px-1 pb-2">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onToggleSelectAll}
                id="select-all-mobile"
              />
              <Label htmlFor="select-all-mobile" className="text-sm font-medium cursor-pointer">
                Selecionar todos
              </Label>
            </div>
          )}
          {accounts.map((acc: any) => {
            const isExpanded = expandedRows.includes(acc.id)
            let hierarchy: any[] = []
            if (isExpanded && acc.account_code) {
              const account = chartAccounts.find(
                (ca: any) =>
                  ca.account_code === acc.account_code &&
                  ca.organization_id === acc.organization_id,
              )
              if (account && account.classification) {
                hierarchy = chartAccounts
                  .filter(
                    (ca: any) =>
                      ca.organization_id === acc.organization_id &&
                      ca.classification &&
                      account.classification.startsWith(ca.classification),
                  )
                  .sort((a: any, b: any) => a.classification.length - b.classification.length)
              }
            }

            return (
              <Card
                key={acc.id}
                className={`overflow-hidden transition-all ${acc.pending_deletion ? 'opacity-50' : ''} ${selectedAccounts.includes(acc.id) ? 'border-primary ring-1 ring-primary/20' : ''}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedAccounts.includes(acc.id)}
                        onCheckedChange={() => onToggleSelect(acc.id)}
                        disabled={acc.pending_deletion}
                        className="mt-1"
                      />
                      <div>
                        <h3 className="font-semibold text-base">
                          {acc.description || 'Sem descrição'}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Building2 className="w-3 h-3 mr-1" />{' '}
                          {acc.organizations?.name || acc.company_name}
                        </div>
                      </div>
                    </div>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                      {acc.account_type || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-secondary/50 p-2 rounded-lg">
                    <div>
                      <span className="text-muted-foreground block text-xs">Banco</span>
                      {acc.bank_code || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Agência</span>
                      {acc.agency || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Conta</span>
                      {acc.account_number || '-'}
                      {acc.check_digit ? `-${acc.check_digit}` : ''}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Conta Contábil</span>
                      {acc.account_code || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Classificação</span>
                      {acc.classification || '-'}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleRow(acc.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      )}
                      {isExpanded ? 'Recolher' : 'Expandir'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit(acc)}
                      disabled={acc.pending_deletion}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(acc)}
                      disabled={acc.pending_deletion}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border">
                      {hierarchy.length > 0 ? (
                        <div className="border rounded-md overflow-hidden shadow-sm">
                          <div className="bg-slate-100 dark:bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                            Raiz Hierárquica
                          </div>
                          <div className="flex flex-col">
                            {hierarchy.map((node: any) => {
                              const level = (node.classification.match(/\./g) || []).length + 1
                              const isSyn = node.account_level === 'Sintética'

                              let bgClass =
                                'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                              let borderClass = 'border-b border-slate-100 dark:border-slate-800'
                              let badgeClass =
                                'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'

                              if (isSyn) {
                                switch (level) {
                                  case 1:
                                    bgClass = 'bg-indigo-950 text-white font-semibold'
                                    borderClass = 'border-b border-indigo-900/50'
                                    badgeClass = 'bg-indigo-900 text-white border-indigo-800'
                                    break
                                  case 2:
                                    bgClass = 'bg-indigo-900 text-white font-semibold'
                                    borderClass = 'border-b border-indigo-800/50'
                                    badgeClass = 'bg-indigo-800 text-white border-indigo-700'
                                    break
                                  case 3:
                                    bgClass = 'bg-indigo-800 text-white font-medium'
                                    borderClass = 'border-b border-indigo-700/50'
                                    badgeClass = 'bg-indigo-700 text-white border-indigo-600'
                                    break
                                  case 4:
                                    bgClass =
                                      'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-950 dark:text-indigo-200 font-medium'
                                    borderClass =
                                      'border-b border-indigo-200 dark:border-indigo-800'
                                    badgeClass =
                                      'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700'
                                    break
                                  default:
                                    bgClass =
                                      'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium'
                                    borderClass = 'border-b border-slate-200 dark:border-slate-800'
                                    badgeClass =
                                      'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                    break
                                }
                              }

                              return (
                                <div
                                  key={node.id}
                                  className={`px-3 py-2 flex flex-col gap-1 ${bgClass} ${borderClass}`}
                                >
                                  <span
                                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border self-start ${badgeClass}`}
                                  >
                                    {node.classification || node.account_code}
                                  </span>
                                  <span className="text-xs">{node.account_name}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground p-3 text-center border border-dashed rounded-lg">
                          {acc.account_code
                            ? 'Conta contábil não encontrada no plano.'
                            : 'Nenhuma conta contábil vinculada.'}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="p-1 px-2 w-[40px] text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onToggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('company_name')}
                >
                  <div className="flex items-center">
                    Empresa <SortIcon columnKey="company_name" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('account_code')}
                >
                  <div className="flex items-center">
                    Conta Contábil <SortIcon columnKey="account_code" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('description')}
                >
                  <div className="flex items-center">
                    Descrição <SortIcon columnKey="description" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('bank_code')}
                >
                  <div className="flex items-center">
                    Banco <SortIcon columnKey="bank_code" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('agency')}
                >
                  <div className="flex items-center">
                    Agência <SortIcon columnKey="agency" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('account_number')}
                >
                  <div className="flex items-center">
                    Conta <SortIcon columnKey="account_number" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('account_type')}
                >
                  <div className="flex items-center">
                    Tipo <SortIcon columnKey="account_type" />
                  </div>
                </TableHead>
                <TableHead
                  className="p-1 px-2 cursor-pointer select-none hover:bg-muted/50 transition-colors group"
                  onClick={() => onSort('classification')}
                >
                  <div className="flex items-center">
                    Classificação <SortIcon columnKey="classification" />
                  </div>
                </TableHead>
                <TableHead className="text-right p-1 px-2 w-[180px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc: any, index: number) => {
                const isExpanded = expandedRows.includes(acc.id)
                const isEven = index % 2 !== 0
                let hierarchy: any[] = []
                if (isExpanded && acc.account_code) {
                  const account = chartAccounts.find(
                    (ca: any) =>
                      ca.account_code === acc.account_code &&
                      ca.organization_id === acc.organization_id,
                  )
                  if (account && account.classification) {
                    hierarchy = chartAccounts
                      .filter(
                        (ca: any) =>
                          ca.organization_id === acc.organization_id &&
                          ca.classification &&
                          account.classification.startsWith(ca.classification),
                      )
                      .sort((a: any, b: any) => a.classification.length - b.classification.length)
                  }
                }

                return (
                  <Fragment key={acc.id}>
                    <TableRow
                      className={`transition-opacity group/row ${isEven ? 'bg-[#800000] text-white font-bold hover:bg-[#600000]' : ''} ${acc.pending_deletion ? 'opacity-50 bg-secondary/20' : 'hover:bg-muted/30'} ${selectedAccounts.includes(acc.id) ? 'bg-muted/50' : ''}`}
                    >
                      <TableCell className="p-1 px-2 text-center">
                        <Checkbox
                          checked={selectedAccounts.includes(acc.id)}
                          onCheckedChange={() => onToggleSelect(acc.id)}
                          disabled={acc.pending_deletion}
                          aria-label={`Selecionar conta ${acc.description}`}
                          className={
                            isEven
                              ? 'border-white data-[state=checked]:bg-white data-[state=checked]:text-[#800000]'
                              : ''
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1 px-2">
                        <div className="flex items-center gap-2">
                          <Building2
                            className={`h-4 w-4 ${isEven ? 'text-white/80' : 'text-muted-foreground'}`}
                          />
                          {acc.organizations?.name || acc.company_name}
                        </div>
                      </TableCell>
                      <TableCell className="p-1 px-2 font-mono text-sm">
                        {acc.account_code || '-'}
                      </TableCell>
                      <TableCell className={`p-1 px-2 ${isEven ? 'font-bold' : 'font-medium'}`}>
                        {acc.description}
                      </TableCell>
                      <TableCell className="p-1 px-2">{acc.bank_code || '-'}</TableCell>
                      <TableCell className="p-1 px-2">{acc.agency || '-'}</TableCell>
                      <TableCell className="p-1 px-2">
                        {acc.account_number || '-'}
                        {acc.check_digit ? `-${acc.check_digit}` : ''}
                      </TableCell>
                      <TableCell className="p-1 px-2">
                        <span
                          className={`${isEven ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'} text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap`}
                        >
                          {acc.account_type || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="p-1 px-2">
                        {acc.classification ? (
                          <span
                            className={`${isEven ? 'bg-white/20 text-white' : 'bg-secondary text-secondary-foreground'} text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap`}
                          >
                            {acc.classification}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right p-1 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-7 text-xs px-2 ${isEven ? 'border-white/40 text-white bg-transparent hover:bg-white/20 hover:text-white' : ''}`}
                            onClick={() => toggleRow(acc.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 mr-1" />
                            ) : (
                              <ChevronDown className="w-3 h-3 mr-1" />
                            )}
                            {isExpanded ? 'Recolher' : 'Expandir'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${isEven ? 'text-white hover:bg-white/20 hover:text-white' : ''}`}
                            onClick={() => onEdit(acc)}
                            disabled={acc.pending_deletion}
                          >
                            <Edit2
                              className={`w-3.5 h-3.5 ${isEven ? 'text-white hover:text-white' : 'text-muted-foreground hover:text-primary'}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${isEven ? 'text-white hover:bg-red-950 hover:text-white' : ''}`}
                            onClick={() => onDelete(acc)}
                            disabled={acc.pending_deletion}
                          >
                            <Trash2
                              className={`w-3.5 h-3.5 ${isEven ? 'text-white hover:text-white' : 'text-muted-foreground hover:text-destructive'}`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="!bg-muted/10 hover:!bg-muted/10 [&>td]:!text-foreground [&>td]:!font-normal [&_.text-muted-foreground]:!text-muted-foreground">
                        <TableCell colSpan={10} className="p-0 border-b">
                          <div className="p-4 pl-12 bg-slate-50/50 dark:bg-slate-900/50">
                            {hierarchy.length > 0 ? (
                              <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm max-w-4xl">
                                <div className="bg-slate-100 dark:bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b">
                                  Raiz Hierárquica
                                </div>
                                <div className="flex flex-col">
                                  {hierarchy.map((node: any) => {
                                    const level =
                                      (node.classification.match(/\./g) || []).length + 1
                                    const isSyn = node.account_level === 'Sintética'

                                    let bgClass =
                                      'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                                    let borderClass =
                                      'border-b border-slate-100 dark:border-slate-800'
                                    let badgeClass =
                                      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'

                                    if (isSyn) {
                                      switch (level) {
                                        case 1:
                                          bgClass = 'bg-indigo-950 text-white font-semibold'
                                          borderClass = 'border-b border-indigo-900/50'
                                          badgeClass = 'bg-indigo-900 text-white border-indigo-800'
                                          break
                                        case 2:
                                          bgClass = 'bg-indigo-900 text-white font-semibold'
                                          borderClass = 'border-b border-indigo-800/50'
                                          badgeClass = 'bg-indigo-800 text-white border-indigo-700'
                                          break
                                        case 3:
                                          bgClass = 'bg-indigo-800 text-white font-medium'
                                          borderClass = 'border-b border-indigo-700/50'
                                          badgeClass = 'bg-indigo-700 text-white border-indigo-600'
                                          break
                                        case 4:
                                          bgClass =
                                            'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-950 dark:text-indigo-200 font-medium'
                                          borderClass =
                                            'border-b border-indigo-200 dark:border-indigo-800'
                                          badgeClass =
                                            'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700'
                                          break
                                        default:
                                          bgClass =
                                            'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium'
                                          borderClass =
                                            'border-b border-slate-200 dark:border-slate-800'
                                          badgeClass =
                                            'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                          break
                                      }
                                    }

                                    return (
                                      <div
                                        key={node.id}
                                        className={`px-4 py-2.5 flex items-center gap-3 ${bgClass} ${borderClass} transition-colors`}
                                      >
                                        <span
                                          className={`font-mono text-[11px] px-2 py-0.5 rounded border ${badgeClass}`}
                                        >
                                          {node.classification || node.account_code}
                                        </span>
                                        <span className="text-sm">{node.account_name}</span>
                                        {node.account_code &&
                                          node.account_code !== node.classification && (
                                            <span className="text-xs opacity-60 ml-auto font-mono">
                                              Cód: {node.account_code}
                                            </span>
                                          )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg max-w-4xl">
                                {acc.account_code
                                  ? 'Conta contábil não encontrada no plano de contas.'
                                  : 'Nenhuma conta contábil vinculada.'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Registros por página</p>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => onItemsPerPageChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">Primeira página</span>
                </Button>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(Math.max(1, currentPage - 1))
                  }}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50 h-8 px-2'
                      : 'cursor-pointer h-8 px-2'
                  }
                />
              </PaginationItem>
              <PaginationItem className="hidden sm:block">
                <span className="text-sm text-muted-foreground px-4">
                  Página {currentPage} de {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }}
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50 h-8 px-2'
                      : 'cursor-pointer h-8 px-2'
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Última página</span>
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
