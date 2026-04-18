import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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
  const [accountType, setAccountType] = useState('none')
  const [classification, setClassification] = useState('none')
  const [organizationId, setOrganizationId] = useState('none')
  const [organizations, setOrganizations] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
        .then(({ data }) => {
          if (data) setOrganizations(data)
        })
    } else {
      setAccountType('none')
      setClassification('none')
      setOrganizationId('none')
    }
  }, [isOpen])

  const handleSave = () => {
    const payload: any = {}
    if (accountType && accountType !== 'none') payload.account_type = accountType
    if (classification && classification !== 'none') payload.classification = classification
    if (organizationId && organizationId !== 'none') payload.organization_id = organizationId

    onSave(payload)
  }

  const hasChanges =
    (accountType && accountType !== 'none') ||
    (classification && classification !== 'none') ||
    (organizationId && organizationId !== 'none')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edição em Lote ({count} itens)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder="Não alterar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não alterar</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Não alterar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não alterar</SelectItem>
                <SelectItem value="Corrente">Corrente</SelectItem>
                <SelectItem value="Poupança">Poupança</SelectItem>
                <SelectItem value="Caixa">Caixa</SelectItem>
                <SelectItem value="Aplicação">Aplicação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Classificação</Label>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger>
                <SelectValue placeholder="Não alterar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não alterar</SelectItem>
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
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-red-400 hover:bg-red-500 text-white"
          >
            Aplicar a Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
