import { useState, useMemo } from 'react'
import { Search, Plus, Filter } from 'lucide-react'
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
import { EMPRESAS, MOCK_ACCOUNTS } from '@/lib/constants'

export default function Index() {
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [empresaFilter, setEmpresaFilter] = useState<string>('all')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { toast } = useToast()

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.contaContabil.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesEmpresa = empresaFilter === 'all' || acc.empresa === empresaFilter
      return matchesSearch && matchesEmpresa
    })
  }, [accounts, searchQuery, empresaFilter])

  const handleSave = (data: Omit<Account, 'id'>) => {
    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingAccount.id ? { ...data, id: a.id } : a)),
      )
      toast({ title: 'Alterações salvas', description: 'O registro foi atualizado com sucesso.' })
    } else {
      const newAccount = { ...data, id: Math.random().toString(36).substring(2, 9) }
      setAccounts((prev) => [newAccount, ...prev])
      toast({
        title: 'Conta criada com sucesso',
        description: 'O novo registro foi adicionado à lista.',
      })
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

  const handleConfirmDelete = () => {
    if (deletingId) {
      setAccounts((prev) => prev.filter((a) => a.id !== deletingId))
      toast({
        title: 'Registro removido',
        description: 'A conta foi deletada com sucesso.',
        variant: 'destructive',
      })
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
      <AccountList accounts={filteredAccounts} onEdit={handleEdit} onDelete={handleDeleteClick} />

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
