import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import EntryForm from '@/components/entries/EntryForm'
import EntryList from '@/components/entries/EntryList'
import GenerateEntriesModal from '@/components/entries/GenerateEntriesModal'

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

  useEffect(() => {
    if (user) {
      supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data: org }) => {
          if (org) {
            setOrgId(org.id)
            Promise.all([
              supabase
                .from('chart_of_accounts')
                .select('*')
                .eq('organization_id', org.id)
                .order('account_code'),
              supabase.from('cost_centers').select('*').eq('organization_id', org.id).order('code'),
              supabase.from('account_mapping').select('*').eq('organization_id', org.id),
            ]).then(([accs, ccs, maps]) => {
              setData({
                accounts: accs.data || [],
                costCenters: ccs.data || [],
                mappings: maps.data || [],
              })
              setLoading(false)
            })
          }
        })
    }
  }, [user])

  if (loading)
    return (
      <div className="p-8 flex justify-center text-slate-500 animate-pulse">
        Carregando dados contábeis...
      </div>
    )

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
