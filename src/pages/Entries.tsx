import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import EntryForm from '@/components/entries/EntryForm'
import EntryList from '@/components/entries/EntryList'
import GenerateEntriesModal from '@/components/entries/GenerateEntriesModal'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Entries() {
  const { user } = useAuth()
  const [orgId, setOrgId] = useState('')
  const [data, setData] = useState({
    accounts: [] as any[],
    costCenters: [] as any[],
    mappings: [] as any[],
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReferences = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      const { data: orgs, error: orgErr } = await supabase
        .from('organizations')
        .select('id')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)

      if (orgErr) throw orgErr

      const currentOrgId = orgs?.[0]?.id

      if (currentOrgId) {
        setOrgId(currentOrgId)

        const [accsRes, ccsRes, mapsRes] = await Promise.all([
          supabase
            .from('chart_of_accounts')
            .select('id, account_code, account_name, account_type, classification, account_level')
            .eq('organization_id', currentOrgId)
            .is('deleted_at', null)
            .order('account_code')
            .limit(5000),
          supabase
            .from('cost_centers')
            .select('id, code, description')
            .eq('organization_id', currentOrgId)
            .is('deleted_at', null)
            .order('code')
            .limit(5000),
          supabase
            .from('account_mapping')
            .select('id, chart_account_id, cost_center_id, mapping_type')
            .eq('organization_id', currentOrgId)
            .is('deleted_at', null)
            .limit(5000),
        ])

        if (accsRes.error) console.error('Erro ao buscar contas:', accsRes.error)
        if (ccsRes.error) console.error('Erro ao buscar centros de custo:', ccsRes.error)
        if (mapsRes.error) console.error('Erro ao buscar mapeamentos:', mapsRes.error)

        setData({
          accounts: accsRes.data || [],
          costCenters: ccsRes.data || [],
          mappings: mapsRes.data || [],
        })
      } else {
        setError(
          'Nenhuma empresa encontrada para o seu usuário. Cadastre uma empresa para começar.',
        )
      }
    } catch (err: any) {
      console.error('Erro geral ao carregar referências:', err)
      setError('Ocorreu um erro ao carregar os dados. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadReferences()
  }, [loadReferences, refreshKey])

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Lançamentos Contábeis
          </h1>
          <p className="text-slate-500 mt-1">Gerencie suas movimentações financeiras e contábeis</p>
        </div>
        <GenerateEntriesModal
          costCenters={data.costCenters}
          accounts={data.accounts}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <EntryForm
        orgId={orgId}
        accounts={data.accounts}
        costCenters={data.costCenters}
        mappings={data.mappings}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <EntryList
        orgId={orgId}
        accounts={data.accounts}
        costCenters={data.costCenters}
        refreshKey={refreshKey}
      />
    </div>
  )
}
