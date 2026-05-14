import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AccountList } from '@/components/AccountList'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'

export default function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('*').is('deleted_at', null)
    if (data) setOrganizations(data)
  }

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bank_accounts')
        .select('*, organizations (name)')
        .is('deleted_at', null)

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
        contaContabil: a.account_code,
        descricao: a.description,
        banco: a.bank_code,
        agencia: a.agency,
        numeroConta: a.account_number,
        digitoConta: a.check_digit,
        tipoConta: a.account_type,
        classificacao: a.classification,
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
    fetchOrganizations()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAccounts()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente solicitar a exclusão desta conta?')) return
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      toast({ title: 'Exclusão solicitada com sucesso' })
      fetchAccounts()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir conta', description: error.message })
    }
  }

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
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-md border-0 shadow-sm flex flex-col overflow-visible relative z-10">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <AccountList
            accounts={accounts}
            organizations={organizations}
            onDelete={handleDelete}
            onUpdateInline={async (id, field, value) => {
              try {
                const dbFieldMap: Record<string, string> = {
                  organization_id: 'organization_id',
                  code: 'code',
                  contaContabil: 'account_code',
                  descricao: 'description',
                  banco: 'bank_code',
                  agencia: 'agency',
                  numeroConta: 'account_number',
                  digitoConta: 'check_digit',
                  tipoConta: 'account_type',
                  classificacao: 'classification',
                }
                const dbField = dbFieldMap[field] || field
                const { error } = await supabase
                  .from('bank_accounts')
                  .update({ [dbField]: value })
                  .eq('id', id)
                if (error) throw error
                fetchAccounts()
                return true
              } catch (e: any) {
                toast({
                  variant: 'destructive',
                  title: 'Erro ao atualizar',
                  description: e.message,
                })
                return false
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
