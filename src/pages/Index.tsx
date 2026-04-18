import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Building2,
  Pencil,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  Upload,
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
import { cn } from '@/lib/utils'
import { BankAccountFormModal } from '@/components/BankAccountFormModal'
import { BankAccountBulkEditModal } from '@/components/BankAccountBulkEditModal'
import { ImportBankAccountsModal } from '@/components/ImportBankAccountsModal'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BankAccount {
  id: string
  organization_id: string | null
  account_code: string | null
  description: string | null
  bank_code: string | null
  agency: string | null
  account_number: string | null
  check_digit: string | null
  account_type: string | null
  classification: string | null
  company_name: string | null
  organization: { name: string } | null
}

export default function Index() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<BankAccount[]>([])

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [organizationsList, setOrganizationsList] = useState<{ id: string; name: string }[]>([])

  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'description',
    direction: 'asc',
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [accountsToDelete, setAccountsToDelete] = useState<BankAccount[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
    if (data) setOrganizationsList(data)
  }

  const fetchAccounts = async () => {
    setLoading(true)

    let query = supabase
      .from('bank_accounts')
      .select('*, organization:organizations(name)', { count: 'exact' })
      .is('deleted_at', null)

    if (debouncedSearch) {
      query = query.or(
        `description.ilike.%${debouncedSearch}%,account_number.ilike.%${debouncedSearch}%,bank_code.ilike.%${debouncedSearch}%`,
      )
    }

    if (orgFilter !== 'all') {
      query = query.eq('organization_id', orgFilter)
    }

    if (typeFilter !== 'all') {
      query = query.eq('account_type', typeFilter)
    }

    const sortCol = sortConfig?.key || 'description'
    const sortDir = sortConfig?.direction === 'asc'
    query = query.order(sortCol, { ascending: sortDir })

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (!error && data) {
      setAccounts(data)
      setTotalCount(count || 0)
      setSelectedIds((prev) => prev.filter((id) => data.some((d) => d.id === id)))
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchOrganizations()
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchAccounts()
  }, [user, debouncedSearch, orgFilter, typeFilter, sortConfig, currentPage, itemsPerPage])

  const handleSaveAccount = async (data: any) => {
    if (editingAccount) {
      const { error } = await supabase
        .from('bank_accounts')
        .update(data)
        .eq('id', editingAccount.id)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso.' })
        setIsFormOpen(false)
        fetchAccounts()
      }
    } else {
      const { error } = await supabase.from('bank_accounts').insert(data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        toast({ title: 'Sucesso', description: 'Conta criada com sucesso.' })
        setIsFormOpen(false)
        fetchAccounts()
      }
    }
  }

  const handleBulkEditSave = async (data: any) => {
    if (selectedIds.length === 0) return
    toast({ title: 'Aguarde', description: 'Atualizando contas...' })

    const { error } = await supabase.from('bank_accounts').update(data).in('id', selectedIds)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: `${selectedIds.length} contas atualizadas.` })
      setIsBulkEditOpen(false)
      setSelectedIds([])
      fetchAccounts()
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const handleDelete = (acc: BankAccount) => {
    setAccountsToDelete([acc])
    setIsDeleteConfirmOpen(true)
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    const selectedAccs = accounts.filter((a) => selectedIds.includes(a.id))
    setAccountsToDelete(selectedAccs)
    setIsDeleteConfirmOpen(true)
  }

  const executeDeletion = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .in(
          'id',
          accountsToDelete.map((a) => a.id),
        )

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Contas excluídas com sucesso.' })
      setSelectedIds([])
      fetchAccounts()
      setIsDeleteConfirmOpen(false)
    } catch (error: any) {
      toast({ title: 'Ação Bloqueada', description: error.message, variant: 'destructive' })
      setIsDeleteConfirmOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando modelo XLSX...' })
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: 'excel',
        data: [
          {
            Empresa: 'Exemplo Empresa LTDA',
            'Conta Contábil': '111',
            Descrição: 'Conta Corrente Principal',
            Banco: '341',
            Agência: '1234',
            Número: '12345',
            Dígito: '6',
            Tipo: 'Corrente',
            Classificação: '1.1.01.02.001',
          },
        ],
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-bank-accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) throw new Error('Falha ao gerar modelo')
      const result = await res.json()

      const binaryString = atob(result.excel)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'modelo_importacao_contas.xlsx'
      link.click()
      toast({ title: 'Sucesso', description: 'Modelo baixado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser' | 'csv' | 'txt') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })

      let win: Window | null = null
      if (formatType === 'browser') {
        win = window.open('', '_blank')
        if (win) win.document.write('Gerando relatório, aguarde...')
      }

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      let query = supabase
        .from('bank_accounts')
        .select('*, organization:organizations(name)')
        .is('deleted_at', null)
      if (debouncedSearch)
        query = query.or(
          `description.ilike.%${debouncedSearch}%,account_number.ilike.%${debouncedSearch}%,bank_code.ilike.%${debouncedSearch}%`,
        )
      if (orgFilter !== 'all') query = query.eq('organization_id', orgFilter)
      if (typeFilter !== 'all') query = query.eq('account_type', typeFilter)
      const sortCol = sortConfig?.key || 'description'
      const sortDir = sortConfig?.direction === 'asc'
      query = query.order(sortCol, { ascending: sortDir })

      const { data: allExportData, error: expError } = await query
      if (expError) throw expError

      const payload = {
        format: formatType === 'browser' ? 'pdf' : formatType,
        data: (allExportData || []).map((acc) => ({
          Empresa: acc.organization?.name || acc.company_name || '-',
          'Conta Contábil': acc.account_code || '-',
          Descrição: acc.description || '-',
          Banco: acc.bank_code || '-',
          Agência: acc.agency || '-',
          Número: acc.account_number || '-',
        })),
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-bank-accounts`,
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
        link.download = 'contas_bancarias.xlsx'
        link.click()
      } else if (formatType === 'csv') {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'contas_bancarias.csv'
        link.click()
      } else if (formatType === 'txt') {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'contas_bancarias.txt'
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
        link.download = 'contas_bancarias.pdf'
        link.click()
      }
      toast({ title: 'Sucesso', description: 'Relatório gerado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

  return (
    <div className="container mx-auto max-w-[1400px] py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listagem de Contas</h1>
          <p className="text-muted-foreground">Gerencie as contas bancárias da sua organização.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Upload className="h-4 w-4" /> Importar em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={downloadTemplate}
                className="cursor-pointer gap-2 text-emerald-700"
              >
                <FileSpreadsheet className="h-4 w-4" /> Baixar Modelo XLSX
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsImportOpen(true)}
                className="cursor-pointer gap-2 text-emerald-700"
              >
                <Upload className="h-4 w-4" /> Importar em Lote
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => {
              setEditingAccount(null)
              setIsFormOpen(true)
            }}
            className="gap-2 bg-rose-700 hover:bg-rose-800 text-white"
          >
            <Plus className="h-4 w-4" /> Nova Conta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Busque por Descrição ou Filtre as contas.</CardDescription>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative w-full sm:w-[400px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar..."
                  className="pl-8 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Select
                  value={orgFilter}
                  onValueChange={(v) => {
                    setOrgFilter(v)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[200px] bg-white">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Empresas</SelectItem>
                    {organizationsList.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => {
                    setTypeFilter(v)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-white">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    {Array.from(new Set(accounts.map((a) => a.account_type).filter(Boolean))).map(
                      (t) => (
                        <SelectItem key={t} value={t!}>
                          {t}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium text-slate-700">
                {selectedIds.length} item(ns) selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBulkEditOpen(true)}
                  className="gap-2"
                >
                  Editar em Lote
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Excluir Selecionados
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table className="text-sm">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={accounts.length > 0 && selectedIds.length === accounts.length}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(accounts.map((d) => d.id))
                        else setSelectedIds([])
                      }}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('organization')}
                  >
                    <div className="flex items-center gap-2">
                      Empresa <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('account_code')}
                  >
                    <div className="flex items-center gap-2">
                      Conta Contábil <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-2">
                      Descrição <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('bank_code')}
                  >
                    <div className="flex items-center gap-2">
                      Banco <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Agência / Conta</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('account_type')}
                  >
                    <div className="flex items-center gap-2">
                      Tipo <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('classification')}
                  >
                    <div className="flex items-center gap-2">
                      Classificação <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px] text-right whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Carregando contas bancárias...
                    </TableCell>
                  </TableRow>
                ) : accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-slate-50">
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(acc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds((prev) => [...prev, acc.id])
                            else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-slate-700">
                        {acc.organization?.name || acc.company_name || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {acc.account_code || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-800">
                        {acc.description || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {acc.bank_code || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {acc.agency || '-'} / {acc.account_number || '-'}
                        {acc.check_digit ? `-${acc.check_digit}` : ''}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{acc.account_type || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {acc.classification || '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingAccount(acc)
                              setIsFormOpen(true)
                            }}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(acc)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Nenhuma conta bancária encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
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
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 whitespace-nowrap">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BankAccountFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAccount}
        initialData={editingAccount}
      />
      <BankAccountBulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEditSave}
        count={selectedIds.length}
      />
      <ImportBankAccountsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={fetchAccounts}
      />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{accountsToDelete.length}</strong> conta(s)
              selecionada(s). Esta ação não poderá ser desfeita. Contas com vínculos não poderão ser
              excluídas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={executeDeletion} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
