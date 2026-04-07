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
    try {
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('organization_id', selectedOrg)

      if (!accounts || accounts.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhuma conta encontrada para esta empresa.' })
        setLoading(false)
        onClose()
        return
      }

      const accountIds = accounts.map((a: { id: string }) => a.id)

      const { data: mappings } = await supabase
        .from('account_mapping')
        .select('chart_account_id')
        .in('chart_account_id', accountIds)
      const { data: debits } = await supabase
        .from('accounting_entries')
        .select('debit_account_id')
        .in('debit_account_id', accountIds)
      const { data: credits } = await supabase
        .from('accounting_entries')
        .select('credit_account_id')
        .in('credit_account_id', accountIds)

      const blockedIds = new Set([
        ...(mappings?.map((m: any) => m.chart_account_id) || []),
        ...(debits?.map((d: any) => d.debit_account_id) || []),
        ...(credits?.map((c: any) => c.credit_account_id) || []),
      ])

      const toDelete = accountIds.filter((id: string) => !blockedIds.has(id))

      if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 500) {
          const chunk = toDelete.slice(i, i + 500)
          const { error } = await supabase.from('chart_of_accounts').delete().in('id', chunk)
          if (error) throw error
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
        <div className="py-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
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
