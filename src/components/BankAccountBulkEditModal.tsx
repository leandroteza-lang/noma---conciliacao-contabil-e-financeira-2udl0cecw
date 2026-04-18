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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
            <Select
              value={accountType || 'NO_CHANGE'}
              onValueChange={(val) => setAccountType(val === 'NO_CHANGE' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Não alterar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_CHANGE">Não alterar</SelectItem>
                <SelectItem value="CAIXA">CAIXA</SelectItem>
                <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                <SelectItem value="OUTROS">OUTROS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Classificação</Label>
            <Select
              value={classification || 'NO_CHANGE'}
              onValueChange={(val) => setClassification(val === 'NO_CHANGE' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Não alterar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_CHANGE">Não alterar</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
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
