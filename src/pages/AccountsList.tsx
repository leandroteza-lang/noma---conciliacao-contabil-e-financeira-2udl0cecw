import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BankAccountsTable } from '@/components/BankAccountsTable'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Plus, Download, Search } from 'lucide-react'

export default function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [sortConfig, setSortConfig] = useState({ key: 'classification', direction: 'asc' })
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bank_accounts')
        .select('*, organizations (name)')
        .is('deleted_at', null)
        .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })

      if (searchTerm) {
        query = query.or(
          `description.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,account_number.ilike.%${searchTerm}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error

      const formatted = (data || []).map((a) => ({
        ...a,
        company_name: a.organizations?.name || a.company_name,
      }))

      setAccounts(formatted)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar contas',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAccounts()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [sortConfig, searchTerm])

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const toggleSelect = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(accounts.map((a) => a.id))
    }
  }

  const handleEdit = (acc: any) => {
    toast({
      title: 'Editar conta',
      description: `Editando conta ${acc.account_number || acc.description}`,
    })
  }

  const handleDelete = async (acc: any) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', acc.id)

      if (error) throw error

      toast({
        title: 'Conta excluída com sucesso',
      })
      fetchAccounts()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conta',
        description: error.message,
      })
    }
  }

  const handleExport = () => {
    toast({ title: 'Exportação', description: 'Funcionalidade em desenvolvimento.' })
  }

  const totalPages = Math.max(1, Math.ceil(accounts.length / itemsPerPage))

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Listagem de Contas
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar contas..."
              className="w-full h-10 pl-9 pr-4 rounded-md border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-md border shadow-sm flex flex-col overflow-hidden">
        <BankAccountsTable
          accounts={accounts}
          allAccounts={accounts}
          selectedAccounts={selectedAccounts}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          sortConfig={sortConfig}
          onSort={handleSort}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          tableFontSize={13}
        />
      </div>
    </div>
  )
}
