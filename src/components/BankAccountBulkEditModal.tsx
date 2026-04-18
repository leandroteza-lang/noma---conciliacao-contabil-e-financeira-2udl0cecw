import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function BankAccountBulkEditModal({ isOpen, onClose, onSave, count }: any) {
  const [accountType, setAccountType] = useState('')
  const [classification, setClassification] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setAccountType('')
      setClassification('')
    }
  }, [isOpen])

  const handleSave = () => {
    const payload: any = {}
    if (accountType) payload.account_type = accountType
    if (classification) payload.classification = classification
    onSave(payload)
  }

  const hasChanges = accountType || classification

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edição em Lote ({count} itens)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Input
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              placeholder="Ex: Corrente, Poupança..."
            />
          </div>
          <div className="space-y-2">
            <Label>Classificação</Label>
            <Input
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              placeholder="Ex: 1.1.01.02.001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Aplicar a Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
