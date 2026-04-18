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
  ChevronsLeft,
  ChevronsRight,
  Columns,
  FilterX,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const tableHeaders = [
  { label: 'Empresa', key: 'company_name' },
  { label: 'Descrição', key: 'description' },
  { label: 'Banco', key: 'bank_code', align: 'center' },
  { label: 'Agência', key: 'agency', align: 'center' },
  { label: 'Nº Conta', key: 'account_number', align: 'center' },
  { label: 'Dígito', key: 'check_digit', align: 'center' },
  { label: 'Tipo', key: 'account_type', align: 'center' },
  { label: 'Conta Contábil', key: 'account_code', align: 'center' },
  { label: 'Classificação', key: 'classification', align: 'center' },
]

export default function Index() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  const [filterOrg, setFilterOrg] = useState('all')
  const [filterBank, setFilterBank] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [banks, setBanks] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])

  const defaultCols = tableHeaders.reduce(
    (acc, h) => ({ ...acc, [h.key]: true }),
    {} as Record<string, boolean>,
  )
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('bank_accounts_cols')
    return saved ? { ...defaultCols, ...JSON.parse(saved) } : defaultCols
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_cols', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const toggleColumn = (key: string) => setVisibleColumns((p) => ({ ...p, [key]: !p[key] }))
  const selectAllColumns = () => setVisibleColumns(defaultCols)
  const selectNoColumns = () =>
    setVisibleColumns(tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: false }), {}))
  const invertColumns = () =>
    setVisibleColumns((p) => tableHeaders.reduce((acc, h) => ({ ...acc, [h.key]: !p[h.key] }), {}))

  const fetchFilterOptions = async () => {
    if (!user) return
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
    if (orgData) setOrgs(orgData)

    const { data: accData } = await supabase
      .from('bank_accounts')
      .select('bank_code, account_type')
      .is('deleted_at', null)
    if (accData) {
      const uniqueBanks = Array.from(
        new Set(accData.map((a) => a.bank_code).filter(Boolean)),
      ) as string[]
      const uniqueTypes = Array.from(
        new Set(accData.map((a) => a.account_type).filter(Boolean)),
      ) as string[]
      setBanks(uniqueBanks.sort())
      setTypes(uniqueTypes.sort())
    }
  }

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('bank_accounts')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(
        `description.ilike.%${search}%,company_name.ilike.%${search}%,account_number.ilike.%${search}%`,
      )
    }

    if (filterOrg !== 'all') {
      query = query.eq('organization_id', filterOrg)
    }

    if (filterBank !== 'all') {
      query = query.eq('bank_code', filterBank)
    }

    if (filterType !== 'all') {
      query = query.eq('account_type', filterType)
    }

    const {
      data: res,
      count,
      error,
    } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (!error && res) {
      setData(res)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [user])

  useEffect(() => {
    fetchData()
  }, [user, page, pageSize, search, filterOrg, filterBank, filterType])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const visibleCount = tableHeaders.filter((h) => visibleColumns[h.key] !== false).length

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Listagem de Contas</h1>
          <p className="text-slate-500 mt-1">
            Gerenciamento e visualização rápida das contas bancárias.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b bg-slate-50/50 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por descrição, empresa ou conta..."
                  className="pl-9 bg-white h-9 text-xs"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(0)
                  }}
                />
              </div>

              <Select
                value={filterOrg}
                onValueChange={(v) => {
                  setFilterOrg(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Empresas</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterBank}
                onValueChange={(v) => {
                  setFilterBank(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[150px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Bancos</SelectItem>
                  {banks.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterType}
                onValueChange={(v) => {
                  setFilterType(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[160px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Tipo de Conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterOrg !== 'all' || filterBank !== 'all' || filterType !== 'all' || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    setFilterOrg('all')
                    setFilterBank('all')
                    setFilterType('all')
                    setSearch('')
                    setPage(0)
                  }}
                >
                  <FilterX className="h-4 w-4 mr-1.5" /> Limpar
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-md border shadow-sm w-full xl:w-auto">
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
                      onSelect={(e) => e.preventDefault()}
                      className="text-xs cursor-pointer"
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
          <Table className="w-full min-w-max">
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b">
                {tableHeaders
                  .filter((h) => visibleColumns[h.key] !== false)
                  .map((h) => (
                    <TableHead
                      key={h.key}
                      className={cn(
                        'h-10 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap',
                        h.align === 'center' ? 'text-center' : 'text-left',
                      )}
                    >
                      {h.label}
                    </TableHead>
                  ))}
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
                    Nenhuma conta encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50/80 transition-colors border-b"
                  >
                    {tableHeaders
                      .filter((h) => visibleColumns[h.key] !== false)
                      .map((h) => (
                        <TableCell
                          key={h.key}
                          className={cn(
                            'px-4 py-3 text-xs text-slate-600 whitespace-nowrap',
                            h.align === 'center' ? 'text-center' : 'text-left',
                          )}
                        >
                          {row[h.key] || '-'}
                        </TableCell>
                      ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
