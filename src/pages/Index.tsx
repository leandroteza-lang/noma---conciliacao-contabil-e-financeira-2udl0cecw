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
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Upload, Download, Building2, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Index() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const [companies, setCompanies] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)

  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

      const { data: accs } = await supabase
        .from('bank_accounts')
        .select('*, organizations(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (accs) setAccounts(accs)
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

  const handleExport = async () => {
    try {
      toast({ title: 'Gerando exportação...' })

      const exportData = filteredAccounts.map((acc) => ({
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
        body: { format: 'excel', data: exportData },
      })

      if (error) throw error

      if (data?.excel) {
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
        toast({ title: 'Exportação concluída' })
      }
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

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / itemsPerPage))

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
            <Button variant="secondary" onClick={() => setIsBulkEditOpen(true)}>
              Editar Selecionados ({selectedAccounts.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => navigate('/import')}>
            <Upload className="w-4 h-4 mr-2" /> Importar em Lote
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

      <BankAccountsTable
        accounts={paginatedAccounts}
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
    </div>
  )
}
