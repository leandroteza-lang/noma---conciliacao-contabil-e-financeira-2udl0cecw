import { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Building2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ImportAccountModal } from '@/components/ImportAccountModal'
import { AccountFormModal } from '@/components/AccountFormModal'
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

interface BankAccount {
  id: string
  organization_id: string
  account_code: string
  account_type: string
  description: string
  bank_code: string
  agency: string
  account_number: string
  check_digit: string
  company_name: string
  organizations?: { name: string }
}

export default function Index() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await supabase.from('organizations').select('*').is('deleted_at', null)
      if (data) setOrganizations(data)
    }
    fetchOrgs()
  }, [])

  const fetchAccounts = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*, organizations(name)')
      .neq('pending_deletion', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAccounts(data as any)
      setSelectedIds((prev) => prev.filter((id) => data.some((d) => d.id === id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts()

    const channel = supabase
      .channel('schema-db-changes-bank-accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_accounts' }, () => {
        fetchAccounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const filteredData = accounts.filter((acc) => {
    const term = search.toLowerCase()
    return (
      (acc.description && acc.description.toLowerCase().includes(term)) ||
      (acc.bank_code && acc.bank_code.toLowerCase().includes(term)) ||
      (acc.agency && acc.agency.toLowerCase().includes(term)) ||
      (acc.account_number && acc.account_number.toLowerCase().includes(term)) ||
      (acc.company_name && acc.company_name.toLowerCase().includes(term)) ||
      (acc.organizations?.name && acc.organizations.name.toLowerCase().includes(term))
    )
  })

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedData = useMemo(() => {
    const sortable = [...filteredData]
    if (sortConfig !== null) {
      sortable.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]
        if (sortConfig.key === 'company_name') {
          aVal = a.organizations?.name || a.company_name || ''
          bVal = b.organizations?.name || b.company_name || ''
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
          Empresa: acc.organizations?.name || acc.company_name || '-',
          'Conta Contábil': acc.account_code || '-',
          Descrição: acc.description || '-',
          Banco: acc.bank_code || '-',
          Agência: acc.agency || '-',
          Número: acc.account_number
            ? `${acc.account_number}${acc.check_digit ? '-' + acc.check_digit : ''}`
            : '-',
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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja solicitar a exclusão desta conta?')) return

    const { error } = await supabase
      .from('bank_accounts')
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} conta(s)?`)) return

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .in('id', selectedIds)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} conta(s) enviada(s) para aprovação.`,
      })
      setSelectedIds([])
      fetchAccounts()
    }
  }

  const handleExportTemplate = async () => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando modelo...' })

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: 'excel',
        data: [
          {
            Empresa: 'Exemplo Ltda',
            'Conta Contábil': '1.01.01.01',
            Descrição: 'Conta Principal',
            Banco: '001',
            Agência: '1234',
            'Número da Conta': '12345',
            Dígito: '6',
            'Tipo de Conta': 'Conta Corrente',
            Classificação: 'Ativo',
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

      if (!res.ok) {
        throw new Error('Falha ao exportar modelo')
      }

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
      link.download = 'modelo_importacao_contas_bancarias.xlsx'
      link.click()
      toast({ title: 'Sucesso', description: 'Modelo gerado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Listagem de Contas</h1>
          <p className="text-slate-500 mt-1">
            Gerencie as contas bancárias cadastradas no sistema.
          </p>
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
                <FileText className="h-4 w-4 text-red-600" /> PDF
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
              <Button className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-white border-none">
                <Upload className="h-4 w-4" /> Importar em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportTemplate} className="cursor-pointer gap-2">
                <Download className="h-4 w-4 text-blue-600" /> Exportar Modelo Padrão
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsImportModalOpen(true)}
                className="cursor-pointer gap-2"
              >
                <Upload className="h-4 w-4 text-green-600" /> Importar Planilha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsFormModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Nova Conta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listagem de Contas Bancárias</CardTitle>
          <CardDescription>Visualize e filtre suas contas bancárias.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por descrição, banco, agência ou conta..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium text-slate-700">
                {selectedIds.length} item(ns) selecionado(s)
              </span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Excluir Selecionados
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
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
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center gap-2">
                      Empresa <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-2">
                      Descrição <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('bank_code')}
                  >
                    <div className="flex items-center gap-2">
                      Banco <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('agency')}
                  >
                    <div className="flex items-center gap-2">
                      Agência / Conta <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('account_code')}
                  >
                    <div className="flex items-center gap-2">
                      Conta Contábil <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(acc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds((prev) => [...prev, acc.id])
                            else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {acc.organizations?.name || acc.company_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{acc.description || '-'}</TableCell>
                      <TableCell className="text-sm">{acc.bank_code || '-'}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>Ag: {acc.agency || '-'}</span>
                          <span className="text-muted-foreground">
                            Cc: {acc.account_number}
                            {acc.check_digit ? `-${acc.check_digit}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{acc.account_code || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(acc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                      Nenhuma conta encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && sortedData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4 border-t mt-4">
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

      <ImportAccountModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchAccounts()
          setIsImportModalOpen(false)
        }}
      />
      <AccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        organizations={organizations}
        onSave={async (data: any) => {
          try {
            const { error } = await supabase.from('bank_accounts').insert({
              organization_id: data.organization_id,
              account_code: data.contaContabil,
              description: data.descricao,
              bank_code: data.banco,
              agency: data.agencia,
              account_number: data.numeroConta,
              check_digit: data.digitoConta,
              account_type: data.tipoConta,
              classification: data.classificacao,
              company_name: organizations.find((o) => o.id === data.organization_id)?.name || '',
            })
            if (error) throw error
            toast({ title: 'Sucesso', description: 'Conta criada com sucesso!' })
            setIsFormModalOpen(false)
            fetchAccounts()
          } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' })
          }
        }}
      />
    </div>
  )
}
