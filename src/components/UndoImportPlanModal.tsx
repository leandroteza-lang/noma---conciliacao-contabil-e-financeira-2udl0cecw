import { useState, useEffect } from 'react'
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
import { RotateCcw } from 'lucide-react'

export function UndoImportPlanModal({ isOpen, onClose, onSuccess, organizations }: any) {
  const [selectedOrg, setSelectedOrg] = useState('')
  const [backups, setBackups] = useState<any[]>([])
  const [selectedBackup, setSelectedBackup] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const { toast } = useToast()

  useEffect(() => {
    if (selectedOrg && isOpen) {
      fetchBackups()
    } else {
      setBackups([])
      setSelectedBackup('')
    }
  }, [selectedOrg, isOpen])

  const fetchBackups = async () => {
    const { data } = await supabase
      .from('chart_of_accounts_backup')
      .select('id, backup_date')
      .eq('organization_id', selectedOrg)
      .order('backup_date', { ascending: false })
      .limit(10)

    if (data) setBackups(data)
  }

  const handleRestore = async () => {
    if (!selectedOrg || !selectedBackup) return

    if (
      !confirm(
        'ATENÇÃO: Restaurar o plano de contas apagará o plano atual desta empresa e retornará aos dados do backup selecionado. Continuar?',
      )
    )
      return

    setIsRestoring(true)

    try {
      const { data: backup, error: backupError } = await supabase
        .from('chart_of_accounts_backup')
        .select('data')
        .eq('id', selectedBackup)
        .single()

      if (backupError) throw backupError

      const backupData = backup.data as any[]
      if (!backupData || backupData.length === 0) {
        throw new Error('Backup vazio ou corrompido.')
      }

      // Delete current accounts first
      const { count: currentCount } = await supabase
        .from('chart_of_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', selectedOrg)

      setProgress({ current: 0, total: (currentCount || 0) + backupData.length })

      let processed = 0

      // Delete loop
      let hasMore = true
      while (hasMore) {
        const { data: chunk } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', selectedOrg)
          .limit(500)
        if (!chunk || chunk.length === 0) {
          hasMore = false
          break
        }
        const ids = chunk.map((c) => c.id)
        await supabase.from('chart_of_accounts').delete().in('id', ids)
        processed += ids.length
        setProgress((p) => ({ ...p, current: processed }))
      }

      // Insert loop
      for (let i = 0; i < backupData.length; i += 500) {
        const chunk = backupData.slice(i, i + 500).map((acc) => {
          const {
            id,
            created_at,
            deleted_at,
            pending_deletion,
            deletion_requested_at,
            deletion_requested_by,
            deleted_by,
            organization,
            ...rest
          } = acc
          return {
            ...rest,
            organization_id: selectedOrg,
          }
        })

        const { error: insErr } = await supabase.from('chart_of_accounts').insert(chunk)
        if (insErr) throw insErr

        processed += chunk.length
        setProgress((p) => ({ ...p, current: processed }))
      }

      toast({ title: 'Sucesso', description: 'Plano de contas restaurado com sucesso.' })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsRestoring(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isRestoring && !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Desfazer Importação (Restaurar)
          </DialogTitle>
          <DialogDescription>
            Restaura o plano de contas a partir de um backup automático criado antes de uma
            importação massiva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={isRestoring}>
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

          {selectedOrg && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium">Ponto de Restauração</label>
              <Select
                value={selectedBackup}
                onValueChange={setSelectedBackup}
                disabled={isRestoring || backups.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      backups.length > 0 ? 'Selecione um backup' : 'Nenhum backup encontrado'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {backups.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {new Date(b.backup_date).toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isRestoring && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Restaurando dados...</span>
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
          <Button variant="outline" onClick={onClose} disabled={isRestoring}>
            Cancelar
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isRestoring || !selectedOrg || !selectedBackup}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isRestoring ? 'Restaurando...' : 'Restaurar Backup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
