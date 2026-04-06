import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Building2,
  AlignLeft,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface ChartAccount {
  id: string
  account_code: string
  account_name: string
  account_type: string
  organization: { name: string } | null
}

export default function ChartAccounts() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<ChartAccount[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const fetchAccounts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*, organization:organizations(name)')
      .neq('pending_deletion', true)
      .is('deleted_at', null)
      .order('account_code', { ascending: true })

    if (!error && data) {
      setAccounts(data as any)
      setSelectedIds((prev) => prev.filter((id) => data.some((d) => d.id === id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchAccounts()

    const channel = supabase
      .channel('schema-db-changes-chart-accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_of_accounts' }, () => {
        fetchAccounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const filteredData = accounts.filter((acc) => {
    const term = search.toLowerCase()
    const matchesSearch =
      (acc.account_code && acc.account_code.toLowerCase().includes(term)) ||
      (acc.account_name && acc.account_name.toLowerCase().includes(term)) ||
      (acc.organization?.name && acc.organization.name.toLowerCase().includes(term))

    const matchesType =
      typeFilter === 'all' ||
      (acc.account_type && acc.account_type.toLowerCase() === typeFilter.toLowerCase())

    return matchesSearch && matchesType
  })

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedData = useMemo(() => {
    let sortable = [...filteredData]
    if (sortConfig !== null) {
      sortable.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]
        if (sortConfig.key === 'organization') {
          aVal = a.organization?.name || ''
          bVal = b.organization?.name || ''
        }
        if (!aVal) aVal = ''
        if (!bVal) bVal = ''
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [filteredData, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage))
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const getIndent = (code: string) => {
    if (!code) return 0
    const level = (code.match(/\./g) || []).length
    return level * 1.5
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} conta(s) contábil(eis)?`))
      return

    const checkPromises = selectedIds.map(async (id) => {
      const { data: linkedMappings } = await supabase
        .from('account_mapping')
        .select('id')
        .eq('chart_account_id', id)
        .limit(1)
      const { data: linkedDebits } = await supabase
        .from('accounting_entries')
        .select('id')
        .eq('debit_account_id', id)
        .limit(1)
      const { data: linkedCredits } = await supabase
        .from('accounting_entries')
        .select('id')
        .eq('credit_account_id', id)
        .limit(1)

      const hasRelations =
        (linkedMappings && linkedMappings.length > 0) ||
        (linkedDebits && linkedDebits.length > 0) ||
        (linkedCredits && linkedCredits.length > 0)

      return { id, hasRelations }
    })

    const results = await Promise.all(checkPromises)
    const toDelete = results.filter((r) => !r.hasRelations).map((r) => r.id)
    const blocked = results.filter((r) => r.hasRelations).map((r) => r.id)

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .in('id', toDelete)

      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else
        toast({
          title: 'Sucesso',
          description: `${toDelete.length} conta(s) enviada(s) para aprovação.`,
        })
    }

    if (blocked.length > 0) {
      toast({
        title: 'Ação Parcialmente Bloqueada',
        description: `${blocked.length} conta(s) possuem vínculos (lançamentos ou mapeamentos) e não puderam ser excluídas.`,
        variant: 'destructive',
      })
    }

    setSelectedIds([])
    fetchAccounts()
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser' | 'csv' | 'txt') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })

      let win: Window | null = null
      if (formatType === 'browser') {
        win = window.open('', '_blank')
        if (win) {
          win.document.write('Gerando relatório, aguarde...')
        }
      }

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: formatType === 'browser' ? 'pdf' : formatType,
        data: sortedData.map((acc) => ({
          Código: acc.account_code,
          Nome: acc.account_name,
          Tipo: acc.account_type,
          Empresa: acc.organization?.name || '-',
        })),
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-chart-accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        if (win) win.close()
        throw new Error('Falha ao exportar')
      }

      const result = await res.json()

      if (formatType === 'excel') {
        const binaryString = atob(result.excel)
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'plano_de_contas.xlsx'
        link.click()
      } else if (formatType === 'csv') {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'plano_de_contas.csv'
        link.click()
      } else if (formatType === 'txt') {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'plano_de_contas.txt'
        link.click()
      } else if (formatType === 'browser') {
        if (win) {
          win.document.open()
          win.document.write(
            `<iframe src="${result.pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
          )
          win.document.close()
        }
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'plano_de_contas.pdf'
        link.click()
      }
      toast({ title: 'Sucesso', description: 'Relatório gerado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    const { data: linkedMappings } = await supabase
      .from('account_mapping')
      .select('id')
      .eq('chart_account_id', id)
      .limit(1)
    const { data: linkedDebits } = await supabase
      .from('accounting_entries')
      .select('id')
      .eq('debit_account_id', id)
      .limit(1)
    const { data: linkedCredits } = await supabase
      .from('accounting_entries')
      .select('id')
      .eq('credit_account_id', id)
      .limit(1)

    if (
      (linkedMappings && linkedMappings.length > 0) ||
      (linkedDebits && linkedDebits.length > 0) ||
      (linkedCredits && linkedCredits.length > 0)
    ) {
      toast({
        title: 'Ação Bloqueada',
        description: 'Esta conta possui vínculos e não pode ser excluída.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('Deseja solicitar a exclusão desta conta?')) return

    const { error } = await supabase
      .from('chart_of_accounts')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .eq('id', id)

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Enviado para Aprovação', description: 'A exclusão foi solicitada.' })
      fetchAccounts()
    }
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground">Gerencie a hierarquia contábil das suas empresas.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport('browser')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> Abrir no Browser
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('csv')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4 text-blue-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('txt')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4 text-gray-600" /> TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} item(ns) selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir Selecionados
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Listagem de Contas</CardTitle>
              <CardDescription>Visualize e filtre sua estrutura contábil.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por código ou nome..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Passivo">Passivo</SelectItem>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 && selectedIds.length === paginatedData.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(paginatedData.map((d) => d.id))
                        else setSelectedIds([])
                      }}
                    />
                  </TableHead>
                  <TableHead
                    className="w-[200px] cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('account_code')}
                  >
                    <div className="flex items-center gap-2">
                      Código <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('account_name')}
                  >
                    <div className="flex items-center gap-2">
                      Nome da Conta <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('account_type')}
                  >
                    <div className="flex items-center gap-2">
                      Tipo <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('organization')}
                  >
                    <div className="flex items-center gap-2">
                      Empresa <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Carregando plano de contas...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(acc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds((prev) => [...prev, acc.id])
                            else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div
                          className="flex items-center"
                          style={{ paddingLeft: `${getIndent(acc.account_code)}rem` }}
                        >
                          <AlignLeft className="h-3 w-3 text-muted-foreground mr-2 opacity-50" />
                          {acc.account_code}
                        </div>
                      </TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell>
                        {acc.account_type && (
                          <Badge
                            variant="outline"
                            className={
                              acc.account_type.toLowerCase() === 'ativo'
                                ? 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400'
                                : acc.account_type.toLowerCase() === 'passivo'
                                  ? 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400'
                                  : acc.account_type.toLowerCase() === 'receita'
                                    ? 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400'
                                    : acc.account_type.toLowerCase() === 'despesa'
                                      ? 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400'
                                      : ''
                            }
                          >
                            {acc.account_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {acc.organization?.name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(acc.id)}
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma conta contábil encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && sortedData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 hidden sm:block">Itens por página:</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v))
                      setCurrentPage(1)
                    }}
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
