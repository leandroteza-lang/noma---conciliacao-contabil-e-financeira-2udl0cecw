import { useState } from 'react'
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

export function ChartAccountBulkEditModal({ isOpen, onClose, onSave, count }: any) {
  const [accountType, setAccountType] = useState('')

  const handleSave = () => {
    onSave({ account_type: accountType })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edição em Lote ({count} itens)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Novo Tipo</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione para alterar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Passivo">Passivo</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!accountType}>
            Aplicar a Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
