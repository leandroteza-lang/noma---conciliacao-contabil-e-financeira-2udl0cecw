import { useState, useEffect } from 'react'
import { Plus, Building2, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AccountList } from '@/components/AccountList'
import { AccountFormModal } from '@/components/AccountFormModal'
import { Account, Organization } from '@/types'

export default function Index() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (orgsError) throw orgsError
      setOrganizations(orgs || [])

      // Fetch accounts with optional filter
      let query = supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false })
      if (selectedOrgId && selectedOrgId !== 'all') {
        query = query.eq('organization_id', selectedOrgId)
      }

      const { data: accs, error: accsError } = await query
      if (accsError) throw accsError

      setAccounts(
        (accs || []).map((a) => ({
          id: a.id,
          organization_id: a.organization_id || '',
          contaContabil: a.account_code || '',
          descricao: a.description || '',
          banco: a.bank_code || '',
          agencia: a.agency || '',
          numeroConta: a.account_number || '',
          classificacao: a.classification || '',
        })),
      )
    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, selectedOrgId])

  const handleSaveAccount = async (data: Omit<Account, 'id'>) => {
    try {
      const { error } = await supabase.from('bank_accounts').insert([
        {
          organization_id: data.organization_id,
          account_code: data.contaContabil,
          description: data.descricao,
          bank_code: data.banco,
          agency: data.agencia,
          account_number: data.numeroConta,
          classification: data.classificacao,
        },
      ])

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Conta cadastrada com sucesso!' })
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return
    try {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Conta excluída.' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleUpdateInline = async (id: string, field: keyof Account, value: string) => {
    try {
      const dbFieldMap: Record<string, string> = {
        organization_id: 'organization_id',
        contaContabil: 'account_code',
        descricao: 'description',
        banco: 'bank_code',
        agencia: 'agency',
        numeroConta: 'account_number',
        classificacao: 'classification',
      }

      const column = dbFieldMap[field as string]
      if (!column) return false

      const { error } = await supabase
        .from('bank_accounts')
        .update({ [column]: value })
        .eq('id', id)
      if (error) throw error

      toast({ title: 'Atualizado', description: 'Campo atualizado com sucesso.' })
      fetchData()
      return true
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      return false
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-[1400px] space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Contas Bancárias e Caixa
          </h1>
          <p className="text-slate-500 mt-1">Gerencie as contas, caixas e mapeamentos contábeis.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="bg-white">
            <Link to="/empresas">
              <Building2 className="mr-2 h-4 w-4" />
              Gerenciar Empresas
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white">
            <Link to="/import">
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Link>
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Conta Diretamente
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          Filtrar por Empresa:
        </span>
        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-500 animate-pulse">Carregando contas...</div>
      ) : (
        <AccountList
          accounts={accounts}
          organizations={organizations}
          onDelete={handleDeleteAccount}
          onUpdateInline={handleUpdateInline}
        />
      )}

      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAccount}
        organizations={organizations}
        defaultOrganizationId={selectedOrgId !== 'all' ? selectedOrgId : undefined}
      />
    </div>
  )
}
