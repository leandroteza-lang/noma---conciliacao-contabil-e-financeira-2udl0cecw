import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useAuditLog } from '@/hooks/use-audit-log'

export function BankAccountModal({ isOpen, type, account, onClose, organizations }: any) {
  const { toast } = useToast()
  const { logAction } = useAuditLog()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    organization_id: '',
    account_code: '',
    account_type: '',
    description: '',
    bank_code: '',
    agency: '',
    account_number: '',
    check_digit: '',
    classification: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (type === 'edit' && account) {
        setFormData({
          organization_id: account.organization_id || '',
          account_code: account.account_code || '',
          account_type: account.account_type || '',
          description: account.description || '',
          bank_code: account.bank_code || '',
          agency: account.agency || '',
          account_number: account.account_number || '',
          check_digit: account.check_digit || '',
          classification: account.classification || '',
        })
      } else {
        setFormData({
          organization_id: '',
          account_code: '',
          account_type: '',
          description: '',
          bank_code: '',
          agency: '',
          account_number: '',
          check_digit: '',
          classification: '',
        })
      }
    }
  }, [isOpen, type, account])

  const handleSave = async () => {
    if (!formData.organization_id || !formData.description || !formData.account_type) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Empresa, Descrição e Tipo.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const org = organizations.find((o: any) => o.id === formData.organization_id)
      const payload = {
        ...formData,
        company_name: org?.name || '',
      }

      if (type === 'edit') {
        const { error } = await supabase.from('bank_accounts').update(payload).eq('id', account.id)
        if (error) throw error

        const changes: any = {}

        const normalizeVal = (val: any) => {
          if (val === null || val === undefined) return ''
          return String(val).trim()
        }

        Object.keys(formData).forEach((key) => {
          const k = key as keyof typeof formData
          const oldVal = normalizeVal(account[k])
          const newVal = normalizeVal(formData[k])

          if (oldVal !== newVal) {
            changes[k] = { old: oldVal, new: newVal }
          }
        })

        console.log('[BankAccountModal] Detected changes for audit:', changes)

        if (Object.keys(changes).length > 0) {
          console.log('[BankAccountModal] Triggering logAction for EDICAO')
          await logAction('bank_accounts', account.id, 'EDICAO', changes)
        } else {
          console.log('[BankAccountModal] No valid changes detected, skipping audit log')
        }

        toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso' })
      } else {
        const { data, error } = await supabase
          .from('bank_accounts')
          .insert(payload)
          .select()
          .single()
        if (error) throw error

        if (data) {
          const changes: any = {}
          const normalizeVal = (val: any) => {
            if (val === null || val === undefined) return ''
            return String(val).trim()
          }

          Object.keys(formData).forEach((key) => {
            const k = key as keyof typeof formData
            const newVal = normalizeVal(formData[k])
            if (newVal) {
              changes[k] = { new: newVal }
            }
          })

          console.log('[BankAccountModal] Triggering logAction for CRIACAO', changes)
          await logAction('bank_accounts', data.id, 'CRIACAO', changes)
        }

        toast({ title: 'Sucesso', description: 'Conta criada com sucesso' })
      }
      onClose()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'add' ? 'Nova Conta Bancária' : 'Editar Conta Bancária'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da conta abaixo. Os campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Empresa *</Label>
            <Select
              value={formData.organization_id}
              onValueChange={(v) => setFormData({ ...formData, organization_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Descrição da Conta *</Label>
            <Input
              placeholder="Ex: Conta Corrente Itaú"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Conta *</Label>
            <Select
              value={formData.account_type}
              onValueChange={(v) => setFormData({ ...formData, account_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                <SelectItem value="Caixa">Caixa</SelectItem>
                <SelectItem value="Aplicação">Aplicação</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta Contábil</Label>
            <Input
              placeholder="Ex: 1.1.01.02.001"
              value={formData.account_code}
              onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Código do Banco</Label>
            <Input
              placeholder="Ex: 341 (Itaú)"
              value={formData.bank_code}
              onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Agência</Label>
            <Input
              placeholder="Ex: 1234"
              value={formData.agency}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Número da Conta</Label>
            <Input
              placeholder="Ex: 12345"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Dígito</Label>
            <Input
              placeholder="Ex: X"
              value={formData.check_digit}
              onChange={(e) => setFormData({ ...formData, check_digit: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
