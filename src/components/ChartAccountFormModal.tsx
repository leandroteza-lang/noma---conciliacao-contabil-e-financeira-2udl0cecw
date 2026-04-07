import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'

const schema = z.object({
  organization_id: z.string().min(1, 'Selecione uma empresa'),
  account_code: z.string().min(1, 'Campo obrigatório'),
  classification: z.string().min(1, 'Campo obrigatório'),
  account_name: z.string().min(1, 'Campo obrigatório'),
  account_type: z.string().min(1, 'Campo obrigatório'),
  account_level: z.string().optional(),
  account_behavior: z.string().optional(),
  nature: z.string().optional(),
  purpose: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ChartAccountFormModal({ isOpen, onClose, onSave, initialData }: any) {
  const [organizations, setOrganizations] = useState<any[]>([])

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
      account_code: '',
      classification: '',
      account_name: '',
      account_type: '',
      organization_id: '',
      account_level: '',
      account_behavior: '',
      nature: '',
      purpose: '',
    },
  })

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        organization_id: initialData.organization_id || '',
        account_code: initialData.account_code || '',
        classification: initialData.classification || '',
        account_name: initialData.account_name || '',
        account_type: initialData.account_type || '',
        account_level: initialData.account_level || '',
        account_behavior: initialData.account_behavior || '',
        nature: initialData.nature || '',
        purpose: initialData.purpose || '',
      })
    } else if (isOpen) {
      reset({
        organization_id: '',
        account_code: '',
        classification: '',
        account_name: '',
        account_type: '',
        account_level: '',
        account_behavior: '',
        nature: '',
        purpose: '',
      })
    }
  }, [isOpen, initialData, reset])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Conta Contábil' : 'Nova Conta Contábil'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
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
            <div className="space-y-2">
              <Label>Código Reduzido</Label>
              <Input
                {...register('account_code')}
                placeholder="Ex: 101"
                className={errors.account_code ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Classificação</Label>
              <Input
                {...register('classification')}
                placeholder="Ex: 1.1.01.01"
                className={errors.classification ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Nome da Conta</Label>
              <Input
                {...register('account_name')}
                placeholder="Ex: Caixa Geral"
                className={errors.account_name ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select
                value={watch('account_level')}
                onValueChange={(val) => setValue('account_level', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sintética ou Analítica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sintética">Sintética</SelectItem>
                  <SelectItem value="Analítica">Analítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo (Comportamento)</Label>
              <Select
                value={watch('account_behavior')}
                onValueChange={(val) => setValue('account_behavior', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Devedora ou Credora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Devedora">Devedora</SelectItem>
                  <SelectItem value="Credora">Credora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Natureza</Label>
              <Select value={watch('nature')} onValueChange={(val) => setValue('nature', val)}>
                <SelectTrigger className={errors.nature ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">ATIVO</SelectItem>
                  <SelectItem value="PASSIVO">PASSIVO</SelectItem>
                  <SelectItem value="RECEITAS">RECEITAS</SelectItem>
                  <SelectItem value="DESPESAS">DESPESAS</SelectItem>
                  <SelectItem value="OUTRAS">OUTRAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupo Contábil</Label>
              <Select
                value={watch('account_type')}
                onValueChange={(val) => setValue('account_type', val)}
              >
                <SelectTrigger className={errors.account_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Passivo">Passivo</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Patrimônio Líquido">Patrimônio Líquido</SelectItem>
                  <SelectItem value="Custos">Custos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Finalidade / Diretrizes de Uso</Label>
              <Textarea
                {...register('purpose')}
                placeholder="Descreva a finalidade desta conta e diretrizes de lançamento..."
                className="resize-none min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Conta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
