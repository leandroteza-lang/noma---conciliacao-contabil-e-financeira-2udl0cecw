import { useEffect } from 'react'
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
import { Account, Organization } from '@/types'

const schema = z.object({
  organization_id: z.string().min(1, 'Selecione uma empresa'),
  contaContabil: z.string().min(1, 'Campo obrigatório'),
  descricao: z.string().min(1, 'Campo obrigatório'),
  banco: z.string().min(1, 'Campo obrigatório'),
  agencia: z.string().min(1, 'Campo obrigatório'),
  numeroConta: z.string().min(1, 'Campo obrigatório'),
  digitoConta: z.string().optional(),
  tipoConta: z.string().optional(),
  classificacao: z.string().min(1, 'Campo obrigatório'),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: Account | null
  organizations: Organization[]
  defaultOrganizationId?: string
}

export function AccountFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  organizations,
  defaultOrganizationId,
}: Props) {
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
      banco: '-',
      agencia: '-',
      numeroConta: '-',
      digitoConta: '',
      tipoConta: '',
      classificacao: 'B',
      organization_id: defaultOrganizationId || '',
    },
  })

  const orgValue = watch('organization_id')
  const tipoContaValue = watch('tipoConta')
  const classificacaoValue = watch('classificacao')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData)
      } else {
        reset({
          banco: '-',
          agencia: '-',
          numeroConta: '-',
          digitoConta: '',
          tipoConta: '',
          classificacao: 'B',
          contaContabil: '',
          descricao: '',
          organization_id:
            defaultOrganizationId || (organizations.length > 0 ? organizations[0].id : ''),
        })
      }
    }
  }, [isOpen, initialData, reset, defaultOrganizationId, organizations])

  const onSubmit = (data: FormData) => {
    onSave(data as any)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData ? 'Editar Conta' : 'Novo Registro'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Empresa *</Label>
              <Select value={orgValue} onValueChange={(val) => setValue('organization_id', val)}>
                <SelectTrigger className={errors.organization_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organization_id && (
                <span className="text-xs text-red-500 font-medium">
                  {errors.organization_id.message}
                </span>
              )}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Conta Contábil *</Label>
              <Input
                {...register('contaContabil')}
                className={errors.contaContabil ? 'border-red-500' : ''}
                placeholder="Ex: 1.1.1.01"
              />
              {errors.contaContabil && (
                <span className="text-xs text-red-500 font-medium">
                  {errors.contaContabil.message}
                </span>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Descrição *</Label>
              <Input
                {...register('descricao')}
                className={errors.descricao ? 'border-red-500' : ''}
                placeholder="Ex: Caixa Geral"
              />
              {errors.descricao && (
                <span className="text-xs text-red-500 font-medium">{errors.descricao.message}</span>
              )}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Banco *</Label>
              <Input
                {...register('banco')}
                className={errors.banco ? 'border-red-500' : ''}
                placeholder="Nome do Banco"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Agência *</Label>
              <Input
                {...register('agencia')}
                className={errors.agencia ? 'border-red-500' : ''}
                placeholder="Número da Agência"
              />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-4 col-span-2 sm:col-span-1">
              <div className="space-y-2">
                <Label>Número Conta *</Label>
                <Input
                  {...register('numeroConta')}
                  className={errors.numeroConta ? 'border-red-500' : ''}
                  placeholder="Número da Conta"
                />
              </div>
              <div className="space-y-2">
                <Label>Dígito</Label>
                <Input {...register('digitoConta')} placeholder="Ex: X" />
              </div>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Tipo Conta</Label>
              <Select
                value={tipoContaValue || undefined}
                onValueChange={(val) => setValue('tipoConta', val)}
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
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Classificação *</Label>
              <Select
                value={classificacaoValue || undefined}
                onValueChange={(val) => setValue('classificacao', val)}
              >
                <SelectTrigger className={errors.classificacao ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
              {errors.classificacao && (
                <span className="text-xs text-red-500 font-medium">
                  {errors.classificacao.message}
                </span>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
