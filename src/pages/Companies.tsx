import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Organization } from '@/types'
import { Badge } from '@/components/ui/badge'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  status: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export default function Companies() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: true },
  })

  const statusValue = watch('status')

  const fetchOrganizations = async () => {
    try {
      if (!user) return
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrganizations(data || [])
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [user])

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      // Validar CNPJ único
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('cnpj', data.cnpj)
        .maybeSingle()

      if (existing) {
        toast({
          title: 'Atenção',
          description: 'Este CNPJ já está cadastrado.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      const { error } = await supabase.from('organizations').insert([
        {
          name: data.name,
          cnpj: data.cnpj,
          status: data.status,
          user_id: user.id,
        },
      ])

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Empresa cadastrada com sucesso!' })
      reset()
      fetchOrganizations()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta empresa?')) return
    try {
      const { error } = await supabase.from('organizations').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Empresa removida.' })
      fetchOrganizations()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empresas</h1>
          <p className="text-slate-500 mt-1">Gerencie os CNPJs e organizações do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Nova Empresa
            </CardTitle>
            <CardDescription>Cadastre um novo CNPJ na sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Razão Social / Nome</Label>
                <Input {...register('name')} placeholder="Ex: NOMA PARTS LTDA" />
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input {...register('cnpj')} placeholder="00.000.000/0000-00" />
                {errors.cnpj && <span className="text-xs text-red-500">{errors.cnpj.message}</span>}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label className="cursor-pointer">Status (Ativo)</Label>
                <Switch checked={statusValue} onCheckedChange={(val) => setValue('status', val)} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Cadastrar Empresa'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-slate-500">Carregando...</div>
            ) : organizations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border-2 border-dashed rounded-lg">
                Nenhuma empresa cadastrada ainda.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.cnpj}</TableCell>
                        <TableCell>
                          <Badge
                            variant={org.status ? 'default' : 'secondary'}
                            className={
                              org.status ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                            }
                          >
                            {org.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(org.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
