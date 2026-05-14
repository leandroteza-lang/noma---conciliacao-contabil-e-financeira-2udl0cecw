import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AccountList } from '@/components/AccountList'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchData = async () => {
    if (!user) return
    const [orgsRes, accsRes] = await Promise.all([
      supabase.from('organizations').select('*').is('deleted_at', null).order('name'),
      supabase
        .from('bank_accounts')
        .select('*')
        .neq('pending_deletion', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ])

    if (orgsRes.data) setOrganizations(orgsRes.data)
    if (accsRes.data) {
      const formatted = accsRes.data.map((acc: any) => ({
        id: acc.id,
        organization_id: acc.organization_id,
        code: acc.code,
        contaContabil: acc.account_code,
        descricao: acc.description,
        banco: acc.bank_code,
        agencia: acc.agency,
        numeroConta: acc.account_number,
        digitoConta: acc.check_digit,
        tipoConta: acc.account_type,
        classificacao: acc.classification,
      }))
      setAccounts(formatted)
    }
  }

  useEffect(() => {
    fetchData()

    const handleRefresh = () => fetchData()
    window.addEventListener('refresh-bank-accounts', handleRefresh)
    return () => window.removeEventListener('refresh-bank-accounts', handleRefresh)
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja solicitar a exclusão desta conta?')) return
    const { error } = await supabase
      .from('bank_accounts')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Exclusão solicitada com sucesso.' })
      fetchData()
    }
  }

  const handleUpdateInline = async (id: string, field: string, value: string) => {
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
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return false
    }
    fetchData()
    return true
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground">Gerencie as contas bancárias da empresa.</p>
        </div>
        <Button
          onClick={() =>
            toast({
              title: 'Aviso',
              description: 'Para criar uma nova conta, utilize a importação em lote.',
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

      <AccountList
        accounts={accounts}
        organizations={organizations}
        onDelete={handleDelete}
        onUpdateInline={handleUpdateInline}
      />
    </div>
  )
}
