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

      setProgress({ current: 0, total: count })

      let deleted = 0
      const chunkSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: chunk, error: fetchError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', selectedOrg)
          .limit(chunkSize)

        if (fetchError) throw fetchError
        if (!chunk || chunk.length === 0) {
          hasMore = false
          break
        }

        const ids = chunk.map((c) => c.id)

        const { error: deleteError } = await supabase
          .from('chart_of_accounts')
          .delete()
          .in('id', ids)

        if (deleteError) {
          throw new Error(`Erro ao excluir bloco (talvez existam vínculos): ${deleteError.message}`)
        }

        deleted += ids.length
        setProgress({ current: deleted, total: count })
      }

      toast({ title: 'Sucesso', description: 'Plano de contas excluído com sucesso.' })
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
