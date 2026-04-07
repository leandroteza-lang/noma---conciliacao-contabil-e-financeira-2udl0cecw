import { useState } from 'react'
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
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle } from 'lucide-react'

export function DeletePlanModal({ isOpen, onClose, onSuccess, organizations }: any) {
  const [selectedOrg, setSelectedOrg] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!selectedOrg) return

    if (
      !confirm(
        'ATENÇÃO: Isso irá excluir todo o plano de contas da empresa selecionada. Lançamentos contábeis vinculados impedirão a exclusão. Continuar?',
      )
    )
      return

    setIsDeleting(true)

    try {
      const { count, error: countError } = await supabase
        .from('chart_of_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', selectedOrg)

      if (countError) throw countError
      if (!count || count === 0) {
        toast({ title: 'Aviso', description: 'Nenhuma conta encontrada para esta empresa.' })
        setIsDeleting(false)
        onClose()
        return
      }

      let allIds: string[] = []
      let hasMore = true
      let lastId = '00000000-0000-0000-0000-000000000000'

      while (hasMore) {
        const { data: chunk, error: fetchError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', selectedOrg)
          .gt('id', lastId)
          .order('id')
          .limit(1000)

        if (fetchError) throw fetchError
        if (!chunk || chunk.length === 0) {
          hasMore = false
          break
        }
        allIds.push(...chunk.map((c) => c.id))
        lastId = chunk[chunk.length - 1].id
      }

      setProgress({ current: 0, total: allIds.length })

      let deleted = 0
      let blockedCount = 0
      const chunkSize = 100

      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunk = allIds.slice(i, i + chunkSize)

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

        const blockedIds = new Set<string>()
        mappings?.forEach((m: any) => {
          if (m.chart_account_id) blockedIds.add(m.chart_account_id)
        })
        debits?.forEach((d: any) => {
          if (d.debit_account_id) blockedIds.add(d.debit_account_id)
        })
        credits?.forEach((c: any) => {
          if (c.credit_account_id) blockedIds.add(c.credit_account_id)
        })

        const toDelete = chunk.filter((id) => !blockedIds.has(id))
        blockedCount += blockedIds.size

        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('chart_of_accounts')
            .delete()
            .in('id', toDelete)

          if (deleteError) {
            throw new Error(`Erro ao excluir bloco: ${deleteError.message}`)
          }
          deleted += toDelete.length
        }

        setProgress({ current: Math.min(i + chunkSize, allIds.length), total: allIds.length })
      }

      if (blockedCount > 0) {
        toast({
          title: 'Ação Parcialmente Concluída',
          description: `${deleted} conta(s) excluída(s) com sucesso. ${blockedCount} conta(s) possuem vínculos (lançamentos/mapeamentos) e não puderam ser excluídas.`,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Sucesso', description: 'Plano de contas excluído com sucesso.' })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isDeleting && !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Plano de Contas Completo
          </DialogTitle>
          <DialogDescription>
            Selecione a empresa para excluir todo o seu plano de contas. Esta ação é processada em
            lotes e pode demorar alguns instantes dependendo do volume de dados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={isDeleting}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isDeleting && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Processando exclusão...</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress
                value={progress.total ? (progress.current / progress.total) * 100 : 0}
                className="h-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !selectedOrg}
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
