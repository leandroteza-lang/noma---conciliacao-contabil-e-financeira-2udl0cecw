import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/use-audit-log'

interface BankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  organizations: any[]
  accountToEdit?: any | null
  onSuccess: () => void
}

export function BankAccountModal({
  isOpen,
  onClose,
  organizations,
  accountToEdit,
  onSuccess,
}: BankAccountModalProps) {
  const { toast } = useToast()
  const { logAction } = useAuditLog()
  const [isSaving, setIsSaving] = useState(false)
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [openChartAccount, setOpenChartAccount] = useState(false)

  const [formData, setFormData] = useState({
    organization_id: '',
    account_code: '',
    description: '',
    bank_code: '',
    agency: '',
    account_number: '',
    check_digit: '',
    account_type: '',
    classification: '',
  })

  useEffect(() => {
    if (formData.organization_id) {
      const fetchAccounts = async () => {
        const { data } = await supabase
          .from('chart_of_accounts')
          .select('id, account_code, account_name, classification')
          .eq('organization_id', formData.organization_id)
          .is('deleted_at', null)
          .order('account_code')
        if (data) setChartAccounts(data)
      }
      fetchAccounts()
    } else {
      setChartAccounts([])
    }
  }, [formData.organization_id])

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setFormData({
          organization_id: accountToEdit.organization_id || '',
          account_code: accountToEdit.account_code || '',
          description: accountToEdit.description || '',
          bank_code: accountToEdit.bank_code || '',
          agency: accountToEdit.agency || '',
          account_number: accountToEdit.account_number || '',
          check_digit: accountToEdit.check_digit || '',
          account_type: accountToEdit.account_type || '',
          classification: accountToEdit.classification || '',
        })
      } else {
        setFormData({
          organization_id: '',
          account_code: '',
          description: '',
          bank_code: '',
          agency: '',
          account_number: '',
          check_digit: '',
          account_type: '',
          classification: '',
        })
      }
    }
  }, [isOpen, accountToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const company_name = organizations.find((o) => o.id === formData.organization_id)?.name || ''

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (accountToEdit) {
        // Edit - Send to pending_changes
        const changes: Record<string, any> = {}
        let hasChanges = false

        const currentData = { ...formData, company_name }
        Object.keys(currentData).forEach((key) => {
          const oldVal = accountToEdit[key]
          const newVal = (currentData as any)[key]
          if (oldVal !== newVal && (oldVal || newVal)) {
            changes[key] = { old: oldVal, new: newVal }
            hasChanges = true
          }
        })

        if (!hasChanges) {
          toast({ title: 'Aviso', description: 'Nenhuma alteração foi feita.' })
          onClose()
          return
        }

        const { error } = await supabase.from('pending_changes').insert({
          entity_type: 'bank_accounts',
          entity_id: accountToEdit.id,
          proposed_changes: changes,
          status: 'pending',
          requested_by: user?.id,
        } as any)

        if (error) throw error

        await logAction('bank_accounts', accountToEdit.id, 'PROPOSE_UPDATE', changes)

        toast({
          title: 'Enviado para Aprovação',
          description:
            'As alterações foram enviadas para a Central de Aprovações e serão aplicadas após a revisão.',
          duration: 8000,
        })
      } else {
        // Create - Send to pending_changes
        const newId = crypto.randomUUID()
        const changes: Record<string, any> = {
          __action: { new: 'CREATE' },
        }
        const currentData = { ...formData, company_name }
        Object.keys(currentData).forEach((key) => {
          changes[key] = { new: (currentData as any)[key] }
        })

        const { error } = await supabase.from('pending_changes').insert({
          entity_type: 'bank_accounts',
          entity_id: newId,
          proposed_changes: changes,
          status: 'pending',
          requested_by: user?.id,
        } as any)

        if (error) throw error

        await logAction('bank_accounts', newId, 'PROPOSE_CREATE', changes)

        toast({
          title: 'Enviado para Aprovação',
          description:
            'A nova conta bancária foi enviada para a Central de Aprovações e ficará visível nas listagens após ser aprovada por um administrador.',
          duration: 8000,
        })
      }

      window.dispatchEvent(new CustomEvent('refresh-approvals-badge'))
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {accountToEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
          </DialogTitle>
          <DialogDescription>
            {accountToEdit
              ? 'Faça as alterações necessárias na conta.'
              : 'Preencha os dados para criar uma nova conta.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Empresa</Label>
              <Select
                value={formData.organization_id || ''}
                onValueChange={(val) => setFormData({ ...formData, organization_id: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
            <div className="space-y-2">
              <Label>Conta Contábil</Label>
              <Popover open={openChartAccount} onOpenChange={setOpenChartAccount}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openChartAccount}
                    className="w-full justify-between font-normal"
                    disabled={!formData.organization_id}
                  >
                    <span className="truncate">
                      {formData.account_code
                        ? chartAccounts.find(
                            (account) => account.account_code === formData.account_code,
                          )
                          ? `${chartAccounts.find((account) => account.account_code === formData.account_code)?.account_code} - ${chartAccounts.find((account) => account.account_code === formData.account_code)?.account_name}`
                          : formData.account_code
                        : 'Selecione uma conta...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar conta contábil..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                      <CommandGroup>
                        {chartAccounts.map((account) => (
                          <CommandItem
                            key={account.id}
                            value={`${account.account_code} ${account.account_name} ${account.classification}`}
                            onSelect={() => {
                              setFormData({ ...formData, account_code: account.account_code })
                              setOpenChartAccount(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 shrink-0',
                                formData.account_code === account.account_code
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            <span className="truncate">
                              {account.account_code} - {account.account_name}
                              {account.classification && ` (${account.classification})`}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input
                value={formData.bank_code || ''}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input
                value={formData.agency || ''}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-4 md:col-span-2">
              <div className="space-y-2">
                <Label>Número da Conta</Label>
                <Input
                  value={formData.account_number || ''}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dígito</Label>
                <Input
                  value={formData.check_digit || ''}
                  onChange={(e) => setFormData({ ...formData, check_digit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <Label>Tipo Conta</Label>
                <Select
                  value={formData.account_type || undefined}
                  onValueChange={(val) => setFormData({ ...formData, account_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrente">Corrente</SelectItem>
                    <SelectItem value="Poupança">Poupança</SelectItem>
                    <SelectItem value="Caixa">Caixa</SelectItem>
                    <SelectItem value="Aplicações">Aplicações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classificação</Label>
                <Select
                  value={formData.classification || undefined}
                  onValueChange={(val) => setFormData({ ...formData, classification: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
