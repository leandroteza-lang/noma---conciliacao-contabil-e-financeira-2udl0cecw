import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Building2,
  Download,
  Filter,
  FileText,
  Table as TableIcon,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
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
import { BankAccountsTable } from '@/components/BankAccountsTable'
import { BankAccountModal } from '@/components/BankAccountModal'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'

export default function Index() {
  const { toast } = useToast()

  const [accounts, setAccounts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'add' | 'edit'
    account?: any
  }>({ isOpen: false, type: 'add' })
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; account?: any }>({
    isOpen: false,
  })

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('bank_accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_accounts' }, fetchData)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: orgs }, { data: accs }] = await Promise.all([
      supabase.from('organizations').select('*').is('deleted_at', null),
      supabase.from('bank_accounts').select('*, organizations(name)').is('deleted_at', null),
    ])
    if (orgs) setOrganizations(orgs)
    if (accs) setAccounts(accs)
    setLoading(false)
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = search.toLowerCase()
      const matchesSearch =
        (acc.description || '').toLowerCase().includes(q) ||
        (acc.account_number || '').toLowerCase().includes(q) ||
        (acc.bank_code || '').toLowerCase().includes(q)
      const matchesOrg = orgFilter === 'all' || acc.organization_id === orgFilter
      const matchesType = typeFilter === 'all' || acc.account_type === typeFilter
      return matchesSearch && matchesOrg && matchesType
    })
  }, [accounts, search, orgFilter, typeFilter])

  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredAccounts, currentPage])

  useEffect(() => setCurrentPage(1), [search, orgFilter, typeFilter])

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-bank-accounts', {
        body: {
          format,
          data: filteredAccounts.map((a) => ({
            Empresa: a.organizations?.name || a.company_name || '-',
            'Conta Contábil': a.account_code || '-',
            Descrição: a.description || '-',
            Banco: a.bank_code || '-',
            Agência: a.agency || '-',
            Número: a.account_number || '-',
            Dígito: a.check_digit || '-',
            Tipo: a.account_type || '-',
            Classificação: a.classification || '-',
          })),
        },
      })
      if (error) throw error
      const link = document.createElement('a')
      if (format === 'excel' && data.excel) {
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excel}`
        link.download = `Contas_${new Date().toISOString().split('T')[0]}.xlsx`
      } else if (format === 'pdf' && data.pdf) {
        link.href = data.pdf
        link.download = `Contas_${new Date().toISOString().split('T')[0]}.pdf`
      }
      link.click()
    } catch (err: any) {
      toast({ title: 'Erro na exportação', description: err.message, variant: 'destructive' })
    }
  }

  const handleExportTemplate = async () => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando modelo...' })

      const { data, error } = await supabase.functions.invoke('export-bank-accounts', {
        body: {
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
        },
      })

      if (error) throw error

      if (data.excel) {
        const binaryString = atob(data.excel)
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
        toast({ title: 'Sucesso', description: 'Modelo gerado com sucesso!' })
      }
    } catch (err: any) {
      toast({ title: 'Erro na exportação', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Listagem de Contas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as contas bancárias e de caixa da sua organização.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                <Download className="w-4 h-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2">
                <TableIcon className="w-4 h-4 text-green-600" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                <FileText className="w-4 h-4 text-red-600" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-cyan-400 hover:bg-cyan-500 text-white border-none flex-1 sm:flex-none">
                <Upload className="h-4 w-4" /> Importar em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportTemplate} className="cursor-pointer gap-2">
                <Download className="h-4 w-4 text-blue-600" /> Exportar Modelo Padrão
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link to="/import">
                  <Upload className="h-4 w-4 text-green-600" /> Importar Planilha
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setModalState({ isOpen: true, type: 'add' })}
            className="flex-1 sm:flex-none gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Conta
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, número ou banco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Empresas</SelectItem>
            {organizations.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Tipo de Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
            <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
            <SelectItem value="Caixa">Caixa</SelectItem>
            <SelectItem value="Aplicação">Aplicação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BankAccountsTable
        accounts={paginatedAccounts}
        loading={loading}
        onEdit={(account: any) => setModalState({ isOpen: true, type: 'edit', account })}
        onDelete={(account: any) => setDeleteModalState({ isOpen: true, account })}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredAccounts.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />

      <BankAccountModal
        {...modalState}
        onClose={() => setModalState({ isOpen: false, type: 'add' })}
        organizations={organizations}
      />

      <DeleteAccountModal
        {...deleteModalState}
        onClose={() => setDeleteModalState({ isOpen: false })}
      />
    </div>
  )
}
