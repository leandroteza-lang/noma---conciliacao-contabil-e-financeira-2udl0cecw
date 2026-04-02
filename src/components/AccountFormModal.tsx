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
import { Account, Empresa } from '@/types'
import { EMPRESAS } from '@/lib/constants'

const schema = z.object({
  empresa: z.enum(['NOMA PARTS', 'LS ALMEIDA', 'NOMA SERVICE', 'PF'], {
    required_error: 'Selecione uma empresa',
  }),
  contaContabil: z.string().min(1, 'Campo obrigatório'),
  descricao: z.string().min(1, 'Campo obrigatório'),
  banco: z.string().min(1, 'Campo obrigatório'),
  agencia: z.string().min(1, 'Campo obrigatório'),
  numeroConta: z.string().min(1, 'Campo obrigatório'),
  classificacao: z.string().min(1, 'Campo obrigatório'),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Account, 'id'>) => void
  initialData?: Account | null
}

export function AccountFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { banco: '-', agencia: '-', numeroConta: '-', classificacao: 'Banco' },
  })

  const empresaValue = watch('empresa')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData)
      } else {
        reset({
          banco: '-',
          agencia: '-',
          numeroConta: '-',
          classificacao: 'Banco',
          contaContabil: '',
          descricao: '',
        })
      }
    }
  }, [isOpen, initialData, reset])

  const onSubmit = (data: FormData) => {
    onSave(data as Omit<Account, 'id'>)
    onClose()
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
              <Select
                value={empresaValue}
                onValueChange={(val) => setValue('empresa', val as Empresa)}
              >
                <SelectTrigger className={errors.empresa ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {EMPRESAS.map((emp) => (
                    <SelectItem key={emp} value={emp}>
                      {emp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.empresa && (
                <span className="text-xs text-red-500 font-medium">{errors.empresa.message}</span>
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
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Número Conta *</Label>
              <Input
                {...register('numeroConta')}
                className={errors.numeroConta ? 'border-red-500' : ''}
                placeholder="Número da Conta"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Classificação *</Label>
              <Input
                {...register('classificacao')}
                className={errors.classificacao ? 'border-red-500' : ''}
                placeholder="Ex: Caixa, Banco"
              />
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
