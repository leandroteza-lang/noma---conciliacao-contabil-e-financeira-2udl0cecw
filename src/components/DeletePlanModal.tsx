import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organizations: { id: string; name: string }[]
}

export function DeletePlanModal({ isOpen, onClose, onSuccess, organizations }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [progress, setProgress] = useState<{
    current: number
    total: number
    status: string
  } | null>(null)

  const handleDeletePlan = async () => {
    if (!selectedOrg) {
      toast({ title: 'Selecione uma empresa', variant: 'destructive' })
      return
    }

    if (
      !confirm(
        'Esta ação é irreversível. Deseja realmente excluir todas as contas contábeis desta empresa? Contas com movimentações ou vínculos não serão excluídas.',
      )
    )
      return

    setLoading(true)
    setProgress({ current: 0, total: 0, status: 'Buscando contas...' })
    try {
      let allAccounts: { id: string }[] = []
      let from = 0
      let step = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', selectedOrg)
          .range(from, from + step - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allAccounts = [...allAccounts, ...data]
          from += step
          if (data.length < step) hasMore = false
        } else {
          hasMore = false
        }
      }

      if (allAccounts.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhuma conta encontrada para esta empresa.' })
        setLoading(false)
        setProgress(null)
        onClose()
        return
      }

      const accountIds = allAccounts.map((a) => a.id)
      setProgress({ current: 0, total: accountIds.length, status: 'Verificando vínculos...' })

      const blockedIds = new Set<string>()
      const chunkSize = 500

      for (let i = 0; i < accountIds.length; i += chunkSize) {
        const chunk = accountIds.slice(i, i + chunkSize)
        const [{ data: mappings }, { data: debits }, { data: credits }] = await Promise.all([
          supabase.from('account_mapping').select('chart_account_id').in('chart_account_id', chunk),
          supabase
            .from('accounting_entries')
            .select('debit_account_id')
            .in('debit_account_id', chunk),
          supabase
            .from('accounting_entries')
            .select('credit_account_id')
            .in('credit_account_id', chunk),
        ])

        mappings?.forEach((m: any) => {
          if (m.chart_account_id) blockedIds.add(m.chart_account_id)
        })
        debits?.forEach((d: any) => {
          if (d.debit_account_id) blockedIds.add(d.debit_account_id)
        })
        credits?.forEach((c: any) => {
          if (c.credit_account_id) blockedIds.add(c.credit_account_id)
        })

        setProgress((prev) =>
          prev ? { ...prev, current: Math.min(i + chunkSize, accountIds.length) } : null,
        )
      }

      const toDelete = accountIds.filter((id: string) => !blockedIds.has(id))

      if (toDelete.length > 0) {
        setProgress({ current: 0, total: toDelete.length, status: 'Excluindo contas...' })
        for (let i = 0; i < toDelete.length; i += chunkSize) {
          const chunk = toDelete.slice(i, i + chunkSize)
          const { error } = await supabase.from('chart_of_accounts').delete().in('id', chunk)
          if (error) throw error
          setProgress((prev) =>
            prev ? { ...prev, current: Math.min(i + chunkSize, toDelete.length) } : null,
          )
        }
      }

      toast({
        title: 'Operação concluída',
        description: `${toDelete.length} contas excluídas. ${
          blockedIds.size > 0 ? `${blockedIds.size} contas mantidas pois possuem vínculos.` : ''
        }`,
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Plano Completo
          </DialogTitle>
          <DialogDescription>
            Selecione a empresa para excluir todo o seu plano de contas. Contas que já possuem
            vínculos (lançamentos ou mapeamentos) não serão excluídas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa..." />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{progress.status}</span>
                {progress.total > 0 && (
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                )}
              </div>
              {progress.total > 0 && (
                <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePlan}
            disabled={loading || !selectedOrg}
          >
            {loading ? 'Excluindo...' : 'Excluir Plano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
