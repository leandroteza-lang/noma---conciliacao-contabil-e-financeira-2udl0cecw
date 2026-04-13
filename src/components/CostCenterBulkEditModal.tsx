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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CostCenterBulkEditModal({ isOpen, onClose, onSave, count, tgaOptions = [] }: any) {
  const [tipoLcto, setTipoLcto] = useState('')
  const [operational, setOperational] = useState('')
  const [tipoTgaId, setTipoTgaId] = useState('')
  const [typeTga, setTypeTga] = useState('')
  const [fixedVariable, setFixedVariable] = useState('')
  const [contabiliza, setContabiliza] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setTipoLcto('')
      setOperational('')
      setTipoTgaId('')
      setTypeTga('')
      setFixedVariable('')
      setContabiliza('')
      setObservacoes('')
    }
  }, [isOpen])

  const handleSave = () => {
    const payload: any = {}
    if (tipoLcto) payload.tipo_lcto = tipoLcto === 'none' ? null : tipoLcto
    if (operational) payload.operational = operational === 'none' ? null : operational
    if (tipoTgaId) payload.tipo_tga_id = tipoTgaId === 'none' ? null : tipoTgaId
    if (typeTga) payload.type_tga = typeTga === 'none' ? null : typeTga
    if (fixedVariable) payload.fixed_variable = fixedVariable === 'none' ? null : fixedVariable
    if (contabiliza) payload.contabiliza = contabiliza === 'none' ? null : contabiliza
    if (observacoes) payload.observacoes = observacoes === 'none' ? null : observacoes

    onSave(payload)
  }

  const hasChanges =
    tipoLcto || operational || tipoTgaId || typeTga || fixedVariable || contabiliza || observacoes

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edição em Lote ({count} itens)</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>Tipo Lcto</Label>
            <Select value={tipoLcto} onValueChange={setTipoLcto}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Limpar</SelectItem>
                <SelectItem value="A">Analítico (A)</SelectItem>
                <SelectItem value="S">Sintético (S)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Operacional</Label>
            <Select value={operational} onValueChange={setOperational}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Limpar</SelectItem>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="T">T</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Tipo TGA</Label>
            <Select value={tipoTgaId} onValueChange={setTipoTgaId}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Limpar</SelectItem>
                {tgaOptions.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={typeTga} onValueChange={setTypeTga}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Limpar</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fixo/Variável</Label>
            <Input
              value={fixedVariable}
              onChange={(e) => setFixedVariable(e.target.value)}
              placeholder="Manter atual"
            />
          </div>
          <div className="space-y-2">
            <Label>Contabiliza</Label>
            <Select value={contabiliza} onValueChange={setContabiliza}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Limpar</SelectItem>
                <SelectItem value="SIM">SIM</SelectItem>
                <SelectItem value="NAO">NÃO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Observações</Label>
            <Input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Manter atual"
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
