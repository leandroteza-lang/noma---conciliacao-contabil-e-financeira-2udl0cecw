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
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) throw new Error('Usuário não autenticado.')

      setProgress({ current: 10, total: 100 }) // Indicador de progresso inicial

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-chart-accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ organizationId: selectedOrg }),
        },
      )

      setProgress({ current: 80, total: 100 })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || 'Erro desconhecido ao processar a exclusão via Edge Function.',
        )
      }

      const { success, result, error } = await response.json()

      if (!success) {
        throw new Error(error || 'Falha ao processar a exclusão.')
      }

      setProgress({ current: 100, total: 100 })

      if (result.total === 0) {
        toast({ title: 'Aviso', description: 'Nenhuma conta encontrada para esta empresa.' })
      } else if (result.blocked > 0) {
        toast({
          title: 'Ação Parcialmente Concluída',
          description: `${result.deleted} conta(s) excluída(s) com sucesso. ${result.blocked} conta(s) possuem vínculos (lançamentos/mapeamentos) e não puderam ser excluídas.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: `${result.deleted} conta(s) excluída(s) com sucesso.`,
        })
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
                <span>Processando exclusão remotamente...</span>
                <span>{progress.current}%</span>
              </div>
              <Progress value={progress.current} className="h-2" />
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
