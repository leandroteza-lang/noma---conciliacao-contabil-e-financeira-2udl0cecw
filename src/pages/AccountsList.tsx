import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AccountList } from '@/components/AccountList'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AccountCombobox } from '@/components/AccountCombobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterOrg, setFilterOrg] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string[]>([])
  const [filterClass, setFilterClass] = useState<string[]>([])
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newAccount, setNewAccount] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [chartAccounts, setChartAccounts] = useState<any[]>([])

  useEffect(() => {
    if (newAccount.organization_id) {
      const fetchChartAccounts = async () => {
        let allAccounts: any[] = []
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data } = await supabase
            .from('chart_of_accounts')
            .select('*')
            .eq('organization_id', newAccount.organization_id)
            .is('deleted_at', null)
            .order('classification')
            .range(page * 1000, (page + 1) * 1000 - 1)

          if (data && data.length > 0) {
            allAccounts = [...allAccounts, ...data]
            page++
            if (data.length < 1000) hasMore = false
          } else {
            hasMore = false
          }
        }
        setChartAccounts(allAccounts)
      }
      fetchChartAccounts()
    } else {
      setChartAccounts([])
    }
  }, [newAccount.organization_id])

  const selectedChartAccountId = newAccount.contaContabil
    ? chartAccounts.find((a) => a.account_code === newAccount.contaContabil)?.id
    : undefined

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('*').is('deleted_at', null)
    if (data) setOrganizations(data)
  }

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      let queryBank = supabase
        .from('bank_accounts')
        .select('*, organizations (name)')
        .is('deleted_at', null)

      let queryChart = supabase.from('chart_of_accounts').select('*').is('deleted_at', null)

      if (searchTerm) {
        queryBank = queryBank.or(
          `description.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,account_number.ilike.%${searchTerm}%`,
        )
      }

      if (filterOrg.length > 0) {
        queryBank = queryBank.in('organization_id', filterOrg)
        queryChart = queryChart.in('organization_id', filterOrg)
      }
      if (filterType.length > 0) {
        queryBank = queryBank.in('account_type', filterType)
      }

      const bankRes = await queryBank
      if (bankRes.error) throw bankRes.error
      const bankData = bankRes.data || []

      let chartData: any[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .is('deleted_at', null)
          .range(page * 1000, (page + 1) * 1000 - 1)
        if (error) throw error
        if (data && data.length > 0) {
          chartData = [...chartData, ...data]
          page++
          if (data.length < 1000) hasMore = false
        } else {
          hasMore = false
        }
      }

      // Group chart accounts by organization_id to avoid collisions between orgs
      const chartMapByOrg = new Map()
      const chartByClassByOrg = new Map()
      chartData.forEach((c) => {
        if (!c.organization_id) return

        if (!chartMapByOrg.has(c.organization_id)) {
          chartMapByOrg.set(c.organization_id, new Map())
          chartByClassByOrg.set(c.organization_id, new Map())
        }

        if (c.account_code) chartMapByOrg.get(c.organization_id).set(c.account_code.trim(), c)
        if (c.classification)
          chartByClassByOrg.get(c.organization_id).set(c.classification.trim(), c)
      })

      const finalAccounts: any[] = []

      bankData.forEach((a) => {
        const orgId = a.organization_id
        let chart = null

        if (orgId) {
          const orgChartMap = chartMapByOrg.get(orgId)
          if (a.account_code && orgChartMap) {
            chart = orgChartMap.get(a.account_code.trim())
          }
        }

        const bankClass = chart ? chart.classification : null

        const hierarchyArray = []
        if (bankClass) {
          const parts = bankClass.split('.')
          let currentClass = ''
          for (let i = 0; i < parts.length; i++) {
            currentClass = currentClass ? `${currentClass}.${parts[i]}` : parts[i]
            const parentChart = chartByClassByOrg.get(orgId)?.get(currentClass)
            if (parentChart) {
              hierarchyArray.push({
                classification: currentClass,
                account_code: parentChart.account_code,
                account_name: parentChart.account_name,
              })
            } else {
              hierarchyArray.push({
                classification: currentClass,
                account_code: '',
                account_name: `Nível ${currentClass}`,
              })
            }
          }
        }

        finalAccounts.push({
          ...a,
          company_name: a.organizations?.name || a.company_name,
          contaContabil: a.account_code,
          descricao: a.description,
          banco: a.bank_code,
          agencia: a.agency,
          numeroConta: a.account_number,
          digitoConta: a.check_digit,
          tipoConta: a.account_type,
          classificacao: bankClass || a.classification,
          hierarchyArray: hierarchyArray,
        })
      })

      if (filterType.length > 0) {
        finalAccounts = finalAccounts.filter((a) => filterType.includes(a.tipoConta || ''))
      }
      if (filterClass.length > 0) {
        finalAccounts = finalAccounts.filter((a) => filterClass.includes(a.classificacao || ''))
      }

      setAccounts(finalAccounts)
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
  }, [searchTerm, filterOrg, filterType, filterClass])

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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { error } = await supabase.from('bank_accounts').insert({
        organization_id: newAccount.organization_id,
        code: newAccount.code,
        account_code: newAccount.contaContabil,
        description: newAccount.descricao,
        bank_code: newAccount.banco,
        agency: newAccount.agencia,
        account_number: newAccount.numeroConta,
        check_digit: newAccount.digitoConta,
        account_type: newAccount.tipoConta,
        classification: newAccount.classificacao,
      })
      if (error) throw error
      toast({ title: 'Conta criada com sucesso!' })
      setIsNewModalOpen(false)
      setNewAccount({})
      fetchAccounts()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar conta', description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Listagem de Contas
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
          <Button
            variant="outline"
            asChild
            className="gap-2 hidden md:flex text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
          >
            <Link to="/mapeamento">
              <Sparkles className="w-4 h-4" /> Mapeamento Inteligente
            </Link>
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsNewModalOpen(true)}
          >
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
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterOrg={filterOrg}
            onFilterOrgChange={setFilterOrg}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterClass={filterClass}
            onFilterClassChange={setFilterClass}
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

      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Conta Bancária</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4 mt-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="space-y-2 col-span-12">
                <Label>Empresa</Label>
                <select
                  value={newAccount.organization_id || ''}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, organization_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecione...</option>
                  {organizations.map((org: any) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-4">
                <Label>Código</Label>
                <Input
                  value={newAccount.code || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-8">
                <Label>Conta Contábil</Label>
                <AccountCombobox
                  accounts={chartAccounts}
                  value={selectedChartAccountId}
                  onChange={(val) => {
                    const acc = chartAccounts.find((a) => a.id === val)
                    if (acc) setNewAccount({ ...newAccount, contaContabil: acc.account_code || '' })
                  }}
                  onClear={() => setNewAccount({ ...newAccount, contaContabil: '' })}
                  placeholder="Selecione a conta contábil..."
                  disabled={!newAccount.organization_id}
                />
              </div>
              <div className="space-y-2 col-span-12">
                <Label>Descrição</Label>
                <Input
                  value={newAccount.descricao || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, descricao: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-6">
                <Label>Banco</Label>
                <Input
                  value={newAccount.banco || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, banco: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-6">
                <Label>Agência</Label>
                <Input
                  value={newAccount.agencia || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, agencia: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-8">
                <Label>Número da Conta</Label>
                <Input
                  value={newAccount.numeroConta || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, numeroConta: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-4">
                <Label>Dígito</Label>
                <Input
                  value={newAccount.digitoConta || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, digitoConta: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-6">
                <Label>Tipo Conta</Label>
                <Select
                  value={newAccount.tipoConta || 'NONE'}
                  onValueChange={(val) =>
                    setNewAccount({ ...newAccount, tipoConta: val === 'NONE' ? '' : val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Selecione...</SelectItem>
                    <SelectItem value="CAIXA">CAIXA</SelectItem>
                    <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                    <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                    <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                    <SelectItem value="OUTRAS">OUTRAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-12 sm:col-span-6">
                <Label>Classificação</Label>
                <Select
                  value={newAccount.classificacao || 'NONE'}
                  onValueChange={(val) =>
                    setNewAccount({ ...newAccount, classificacao: val === 'NONE' ? '' : val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Selecione...</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setIsNewModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
