import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { AccountCombobox } from '@/components/AccountCombobox'

const schema = z.object({
  organization_id: z.string().min(1, 'Selecione uma empresa'),
  account_code: z.string().optional(),
  description: z.string().min(1, 'Campo obrigatório'),
  bank_code: z.string().optional(),
  agency: z.string().optional(),
  account_number: z.string().optional(),
  check_digit: z.string().optional(),
  account_type: z.string().optional(),
  classification: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function BankAccountFormModal({ isOpen, onClose, onSave, initialData }: any) {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [chartAccounts, setChartAccounts] = useState<any[]>([])

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      if (data) setOrganizations(data)
    }
    if (isOpen) fetchOrgs()
  }, [isOpen])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_id: '',
      account_code: '',
      description: '',
      bank_code: '',
      agency: '',
      account_number: '',
      check_digit: '',
      account_type: '',
      classification: '',
    },
  })

  const organizationId = watch('organization_id')
  const accountCode = watch('account_code')

  useEffect(() => {
    if (organizationId) {
      const fetchAccounts = async () => {
        const { data } = await supabase
          .from('chart_of_accounts')
          .select('id, account_code, account_name, classification')
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .order('classification')
        if (data) setChartAccounts(data)
      }
      fetchAccounts()
    } else {
      setChartAccounts([])
    }
  }, [organizationId])

  const selectedChartAccountId = useMemo(() => {
    if (!accountCode) return undefined
    const acc = chartAccounts.find((a) => a.account_code === accountCode)
    return acc ? acc.id : undefined
  }, [chartAccounts, accountCode])

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        organization_id: initialData.organization_id || '',
        account_code: initialData.account_code || '',
        description: initialData.description || '',
        bank_code: initialData.bank_code || '',
        agency: initialData.agency || '',
        account_number: initialData.account_number || '',
        check_digit: initialData.check_digit || '',
        account_type: initialData.account_type || '',
        classification: initialData.classification || '',
      })
    } else if (isOpen) {
      reset({
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
  }, [isOpen, initialData, reset])

  const handleFormSubmit = (data: FormData) => {
    const org = organizations.find((o) => o.id === data.organization_id)
    onSave({ ...data, company_name: org?.name })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Empresa</Label>
              <Select
                value={watch('organization_id')}
                onValueChange={(val) => setValue('organization_id', val)}
              >
                <SelectTrigger className={errors.organization_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione a empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Descrição da Conta</Label>
              <Input
                {...register('description')}
                placeholder="Ex: Conta Corrente Itaú"
                className={errors.description ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Conta Contábil</Label>
              <div className={cn(errors.account_code ? 'border border-red-500 rounded-md' : '')}>
                <AccountCombobox
                  accounts={chartAccounts}
                  value={selectedChartAccountId}
                  onChange={(val) => {
                    const acc = chartAccounts.find((a) => a.id === val)
                    if (acc) setValue('account_code', acc.account_code)
                  }}
                  onClear={() => setValue('account_code', '')}
                  placeholder="Selecione a conta contábil..."
                  disabled={!organizationId}
                />
              </div>
              {errors.account_code && (
                <span className="text-xs text-red-500">{errors.account_code.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Classificação</Label>
              <Select
                value={watch('classification') || 'NONE'}
                onValueChange={(val) => setValue('classification', val === 'NONE' ? '' : val)}
              >
                <SelectTrigger className={errors.classification ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Selecione...</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Código do Banco</Label>
              <Input {...register('bank_code')} placeholder="Ex: 341" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={watch('account_type') || 'NONE'}
                onValueChange={(val) => setValue('account_type', val === 'NONE' ? '' : val)}
              >
                <SelectTrigger className={errors.account_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Selecione...</SelectItem>
                  <SelectItem value="CAIXA">CAIXA</SelectItem>
                  <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                  <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                  <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                  <SelectItem value="OUTROS">OUTROS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input {...register('agency')} placeholder="Ex: 1234" />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div className="space-y-2">
                <Label>Número da Conta</Label>
                <Input {...register('account_number')} placeholder="Ex: 12345" />
              </div>
              <div className="space-y-2">
                <Label>Dígito</Label>
                <Input {...register('check_digit')} placeholder="Ex: 6" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
