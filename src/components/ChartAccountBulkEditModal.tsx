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

export function ChartAccountBulkEditModal({ isOpen, onClose, onSave, count }: any) {
  const [accountLevel, setAccountLevel] = useState('')
  const [accountBehavior, setAccountBehavior] = useState('')
  const [nature, setNature] = useState('')
  const [accountType, setAccountType] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setAccountLevel('')
      setAccountBehavior('')
      setNature('')
      setAccountType('')
    }
  }, [isOpen])

  const handleSave = () => {
    const payload: any = {}
    if (accountLevel) payload.account_level = accountLevel
    if (accountBehavior) payload.account_behavior = accountBehavior
    if (nature) payload.nature = nature
    if (accountType) payload.account_type = accountType

    onSave(payload)
  }

  const hasChanges = accountLevel || accountBehavior || nature || accountType

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edição em Lote ({count} itens)</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Nível</Label>
            <Select value={accountLevel} onValueChange={setAccountLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sintética">Sintética</SelectItem>
                <SelectItem value="Analítica">Analítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo (Comportamento)</Label>
            <Select value={accountBehavior} onValueChange={setAccountBehavior}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Devedora">Devedora</SelectItem>
                <SelectItem value="Credora">Credora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Natureza</Label>
            <Select value={nature} onValueChange={setNature}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">ATIVO</SelectItem>
                <SelectItem value="PASSIVO">PASSIVO</SelectItem>
                <SelectItem value="PATRIMÔNIO LÍQUIDO">PATRIMÔNIO LÍQUIDO</SelectItem>
                <SelectItem value="RECEITA">RECEITA</SelectItem>
                <SelectItem value="DESPESA">DESPESA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Grupo Contábil</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Passivo">Passivo</SelectItem>
                <SelectItem value="Patrimônio Líquido">Patrimônio Líquido</SelectItem>
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
          <Button onClick={handleSave} disabled={!hasChanges}>
            Aplicar a Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
