import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BankAccountsTable } from '@/components/BankAccountsTable'
import { BankAccountFormModal } from '@/components/BankAccountFormModal'
import { BankAccountBulkEditModal } from '@/components/BankAccountBulkEditModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  Upload,
  Download,
  Building2,
  Filter,
  Trash2,
  Sparkles,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ImportBankAccountsModal } from '@/components/ImportBankAccountsModal'
import { SmartMappingModal } from '@/components/SmartMappingModal'

export default function Index() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const [companies, setCompanies] = useState<any[]>([])
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)

  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isSmartMappingOpen, setIsSmartMappingOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      if (orgs) setCompanies(orgs)

      let allAccs: any[] = []
      let fetchHasMore = true
      let fetchPage = 0

      while (fetchHasMore) {
        const { data: accs } = await supabase
          .from('bank_accounts')
          .select('*, organizations(name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

        if (accs && accs.length > 0) {
          allAccs.push(...accs)
          fetchPage++
          if (accs.length < 1000) fetchHasMore = false
        } else {
          fetchHasMore = false
        }
      }

      setAccounts(allAccs)

      let allChartAccs: any[] = []
      let fetchCHasMore = true
      let fetchCPage = 0
      while (fetchCHasMore) {
        const { data: ca } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .is('deleted_at', null)
          .range(fetchCPage * 1000, (fetchCPage + 1) * 1000 - 1)

        if (ca && ca.length > 0) {
          allChartAccs.push(...ca)
          fetchCPage++
          if (ca.length < 1000) fetchCHasMore = false
        } else {
          fetchCHasMore = false
        }
      }
      setChartAccounts(allChartAccs)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAccount = async (data: any) => {
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(data)
          .eq('id', editingAccount.id)
        if (error) throw error
        toast({ title: 'Conta atualizada com sucesso' })
      } else {
        const { error } = await supabase.from('bank_accounts').insert([data])
        if (error) throw error
        toast({ title: 'Conta criada com sucesso' })
      }
      setIsFormOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar conta', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteAccount = async (acc: any) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', acc.id)
      if (error) throw error
      toast({ title: 'Conta excluída com sucesso' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir conta', description: error.message, variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja realmente excluir as ${selectedAccounts.length} contas selecionadas?`))
      return
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedAccounts)
      if (error) throw error
      toast({ title: `${selectedAccounts.length} contas excluídas com sucesso` })
      setSelectedAccounts([])
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir contas', description: error.message, variant: 'destructive' })
    }
  }

  const handleBulkEdit = async (data: any) => {
    try {
      const { error } = await supabase.from('bank_accounts').update(data).in('id', selectedAccounts)
      if (error) throw error
      toast({ title: `${selectedAccounts.length} contas atualizadas` })
      setIsBulkEditOpen(false)
      setSelectedAccounts([])
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro na edição em lote', description: error.message, variant: 'destructive' })
    }
  }

  const handleSmartMappingApply = async (payload: any[]) => {
    if (payload.length === 0) return
    try {
      toast({ title: 'Aplicando mapeamento inteligente...' })
      const promises = payload.map((p) =>
        supabase
          .from('bank_accounts')
          .update({ organization_id: p.organization_id })
          .eq('id', p.id),
      )
      await Promise.all(promises)
      toast({ title: 'Mapeamento aplicado com sucesso' })
      setIsSmartMappingOpen(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao aplicar mapeamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser' | 'csv' | 'txt') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando exportação...' })

      let win: Window | null = null
      if (formatType === 'browser') {
        win = window.open('', '_blank')
        if (win) {
          win.document.write('Gerando relatório, aguarde...')
        }
      }

      const exportData = sortedAccounts.map((acc) => ({
        Empresa: acc.organizations?.name || acc.company_name || '',
        'Conta Contábil': acc.account_code || '',
        Descrição: acc.description || '',
        Banco: acc.bank_code || '',
        Agência: acc.agency || '',
        Número: `${acc.account_number || ''}${acc.check_digit ? '-' + acc.check_digit : ''}`,
        Tipo: acc.account_type || '',
        Classificação: acc.classification || '',
      }))

      const { data, error } = await supabase.functions.invoke('export-bank-accounts', {
        body: { format: formatType === 'browser' ? 'pdf' : formatType, data: exportData },
      })

      if (error) {
        if (win) win.close()
        throw error
      }

      if (formatType === 'excel' && data?.excel) {
        const byteCharacters = atob(data.excel)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas_bancarias.xlsx'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (formatType === 'csv' && data?.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas_bancarias.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (formatType === 'txt' && data?.txt) {
        const blob = new Blob([data.txt], { type: 'text/plain;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas_bancarias.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (formatType === 'pdf' && data?.pdf) {
        const a = document.createElement('a')
        a.href = data.pdf
        a.download = 'contas_bancarias.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else if (formatType === 'browser' && data?.pdf) {
        if (win) {
          win.document.open()
          win.document.write(
            `<iframe src="${data.pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:absolute;" allowfullscreen></iframe>`,
          )
          win.document.close()
        }
      } else {
        if (win) win.close()
      }

      toast({ title: 'Sucesso', description: 'Exportação concluída' })
    } catch (error: any) {
      toast({ title: 'Erro ao exportar', description: error.message, variant: 'destructive' })
    }
  }

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.description?.toLowerCase().includes(search.toLowerCase()) ||
      acc.account_number?.includes(search) ||
      acc.agency?.includes(search)
    const matchesCompany = companyFilter === 'ALL' || acc.organization_id === companyFilter
    const matchesType = typeFilter === 'ALL' || acc.account_type === typeFilter

    return matchesSearch && matchesCompany && matchesType
  })

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig

    let valA = a[key]
    let valB = b[key]

    if (key === 'company_name') {
      valA = a.organizations?.name || a.company_name || ''
      valB = b.organizations?.name || b.company_name || ''
    }

    valA = valA || ''
    valB = valB || ''

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })

  const paginatedAccounts = sortedAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const totalPages = Math.max(1, Math.ceil(sortedAccounts.length / itemsPerPage))

  const toggleSelect = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    if (selectedAccounts.length === paginatedAccounts.length && paginatedAccounts.length > 0) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(paginatedAccounts.map((a) => a.id))
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Listagem de Contas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as contas bancárias da sua organização.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedAccounts.length > 0 && (
            <>
              <Button variant="secondary" onClick={() => setIsBulkEditOpen(true)}>
                Editar Selecionados ({selectedAccounts.length})
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Selecionados ({selectedAccounts.length})
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport('txt')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> TXT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('csv')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('browser')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> Abrir no Browser
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar em Lote
          </Button>
          <Button variant="outline" onClick={() => setIsSmartMappingOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2 text-primary" /> Mapeamento Inteligente
          </Button>
          <Button
            onClick={() => {
              setEditingAccount(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="font-semibold text-lg">Filtros</h2>
          <p className="text-sm text-muted-foreground">Busque por Descrição ou Filtre as contas.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-[220px] bg-background">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todas Empresas" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas Empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[220px] bg-background">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todos Tipos" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos Tipos</SelectItem>
                <SelectItem value="CAIXA">CAIXA</SelectItem>
                <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                <SelectItem value="OUTROS">OUTROS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <BankAccountsTable
        accounts={paginatedAccounts}
        chartAccounts={chartAccounts}
        selectedAccounts={selectedAccounts}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        loading={loading}
        onEdit={(acc: any) => {
          setEditingAccount(acc)
          setIsFormOpen(true)
        }}
        onDelete={handleDeleteAccount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortConfig={sortConfig}
        onSort={handleSort}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(v: number) => {
          setItemsPerPage(v)
          setCurrentPage(1)
        }}
      />

      <BankAccountFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAccount}
        initialData={editingAccount}
      />

      <BankAccountBulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEdit}
        count={selectedAccounts.length}
      />

      <ImportBankAccountsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false)
          fetchData()
        }}
      />

      <SmartMappingModal
        isOpen={isSmartMappingOpen}
        onClose={() => setIsSmartMappingOpen(false)}
        onApply={handleSmartMappingApply}
        accounts={accounts}
        companies={companies}
      />
    </div>
  )
}
