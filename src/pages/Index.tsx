import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Filter, Loader2 } from 'lucide-react'
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
import { AccountList } from '@/components/AccountList'
import { AccountFormModal } from '@/components/AccountFormModal'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { Account } from '@/types'
import { EMPRESAS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'

export default function Index() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [empresaFilter, setEmpresaFilter] = useState<string>('all')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { toast } = useToast()

  const fetchAccounts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Erro ao carregar contas',
        description: error.message,
        variant: 'destructive',
      })
    } else if (data) {
      const mapped = data.map((row) => ({
        id: row.id,
        empresa: row.company_name || '',
        contaContabil: row.account_code || '',
        descricao: row.description || '',
        banco: row.bank_code || '',
        agencia: row.agency || '',
        numeroConta: row.account_number || '',
        classificacao: row.classification || '',
      }))
      setAccounts(mapped)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.contaContabil.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEmpresa = empresaFilter === 'all' || acc.empresa === empresaFilter
      return matchesSearch && matchesEmpresa
    })
  }, [accounts, searchQuery, empresaFilter])

  const handleSave = async (data: Omit<Account, 'id'>) => {
    try {
      // Fetch user's organization first
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .single()

      if (orgError) throw new Error('Não foi possível encontrar a organização do usuário.')

      const dbRow = {
        organization_id: orgData.id,
        company_name: data.empresa,
        account_code: data.contaContabil,
        description: data.descricao,
        bank_code: data.banco,
        agency: data.agencia,
        account_number: data.numeroConta,
        classification: data.classificacao,
      }

      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(dbRow)
          .eq('id', editingAccount.id)
        if (error) throw error
        toast({ title: 'Alterações salvas', description: 'O registro foi atualizado com sucesso.' })
      } else {
        const { error } = await supabase.from('bank_accounts').insert(dbRow)
        if (error) throw error
        toast({
          title: 'Conta criada com sucesso',
          description: 'O novo registro foi adicionado à lista.',
        })
      }
      setIsFormOpen(false)
      fetchAccounts()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingId) {
      try {
        const { error } = await supabase.from('bank_accounts').delete().eq('id', deletingId)

        if (error) throw error

        toast({
          title: 'Registro removido',
          description: 'A conta foi deletada com sucesso.',
        })
        setIsDeleteOpen(false)
        fetchAccounts()
      } catch (err: any) {
        toast({ title: 'Erro ao deletar', description: err.message, variant: 'destructive' })
      }
    }
  }

  const openNewForm = () => {
    setEditingAccount(null)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1 max-w-2xl">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por descrição ou conta..."
              className="pl-9 w-full bg-slate-50 border-slate-200 focus-visible:bg-white transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors">
                <div className="flex items-center gap-2 text-slate-600">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por empresa" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-medium">
                  Todas as Empresas
                </SelectItem>
                {EMPRESAS.map((emp) => (
                  <SelectItem key={emp} value={emp}>
                    {emp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={openNewForm}
          className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all font-medium"
        >
          <Plus className="h-4 w-4" />
          Novo Registro
        </Button>
      </div>

      {/* Data List Component */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <AccountList accounts={filteredAccounts} onEdit={handleEdit} onDelete={handleDeleteClick} />
      )}

      {/* Modals */}
      <AccountFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingAccount}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
