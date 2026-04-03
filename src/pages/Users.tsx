import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Trash2,
  Edit3,
  UserPlus,
  Shield,
  Building2,
  Activity,
  Users as UsersIcon,
} from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const [batchEditOpen, setBatchEditOpen] = useState(false)
  const [batchField, setBatchField] = useState<string>('')
  const [batchValue, setBatchValue] = useState<string>('')
  const [batchLoading, setBatchLoading] = useState(false)

  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    const [usersRes, deptsRes] = await Promise.all([
      supabase
        .from('cadastro_usuarios')
        .select('*, departments(name)')
        .is('deleted_at', null)
        .order('name'),
      supabase.from('departments').select('*').is('deleted_at', null).order('name'),
    ])
    if (usersRes.data) setUsers(usersRes.data)
    if (deptsRes.data) setDepartments(deptsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(users.map((u) => u.id))
    else setSelected([])
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelected((prev) => [...prev, id])
    else setSelected((prev) => prev.filter((x) => x !== id))
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Deseja realmente excluir ${selected.length} usuários?`)) return

    const { error } = await supabase
      .from('cadastro_usuarios')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', selected)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: `${selected.length} usuários excluídos em lote.` })
      setSelected([])
      fetchData()
    }
  }

  const handleBatchEdit = async () => {
    if (!batchField || !batchValue) return
    setBatchLoading(true)

    let updateData: any = {}
    if (batchField === 'role') updateData.role = batchValue
    if (batchField === 'department_id')
      updateData.department_id = batchValue === 'none' ? null : batchValue
    if (batchField === 'status') updateData.status = batchValue === 'true'

    const { error } = await supabase.from('cadastro_usuarios').update(updateData).in('id', selected)

    setBatchLoading(false)
    if (error) {
      toast({ title: 'Erro na atualização', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Sucesso',
        description: `${selected.length} usuários atualizados com sucesso.`,
      })
      setBatchEditOpen(false)
      setSelected([])
      fetchData()
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary" />
            Usuários
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gerencie os acessos, permissões e departamentos da sua equipe.
          </p>
        </div>
        <Button className="w-full md:w-auto shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-primary/10 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto h-10">
          {selected.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg">
                {selected.length} selecionado(s)
              </span>
              <Button
                variant="secondary"
                className="shadow-sm"
                onClick={() => {
                  setBatchField('')
                  setBatchValue('')
                  setBatchEditOpen(true)
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" /> Editar em Lote
              </Button>
              <Button variant="destructive" className="shadow-sm" onClick={handleBatchDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir em Lote
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selected.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-bold">Nome Completo</TableHead>
              <TableHead className="font-bold">E-mail</TableHead>
              <TableHead className="font-bold">Perfil de Acesso</TableHead>
              <TableHead className="font-bold">Departamento</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground font-medium"
                >
                  Carregando dados da equipe...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground font-medium"
                >
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={`group transition-colors ${selected.includes(user.id) ? 'bg-primary/5' : ''}`}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onCheckedChange={(c) => handleSelect(user.id, c as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        user.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-600'
                          : user.role === 'supervisor'
                            ? 'bg-blue-500/10 text-blue-600'
                            : user.role === 'client_user'
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'bg-slate-500/10 text-slate-600'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {user.role === 'admin'
                        ? 'Administrador'
                        : user.role === 'supervisor'
                          ? 'Supervisor'
                          : user.role === 'client_user'
                            ? 'Cliente'
                            : 'Colaborador'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {user.departments?.name || 'Não atribuído'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${user.status ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      {user.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Batch Edit Modal */}
      <Dialog open={batchEditOpen} onOpenChange={setBatchEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edição em Lote</DialogTitle>
            <DialogDescription className="text-sm">
              Você está prestes a editar <strong>{selected.length}</strong> usuário(s)
              simultaneamente. Essa alteração será aplicada a todos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Campo a ser alterado</Label>
              <Select
                value={batchField}
                onValueChange={(val) => {
                  setBatchField(val)
                  setBatchValue('')
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Escolha um campo para atualizar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Perfil de Acesso</SelectItem>
                  <SelectItem value="department_id">Departamento</SelectItem>
                  <SelectItem value="status">Status da Conta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {batchField === 'role' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="w-4 h-4 text-blue-500" /> Novo Perfil
                </Label>
                <Select value={batchValue} onValueChange={setBatchValue}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o novo perfil..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="collaborator">Colaborador</SelectItem>
                    <SelectItem value="client_user">Usuário Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {batchField === 'department_id' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-purple-500" /> Novo Departamento
                </Label>
                <Select value={batchValue} onValueChange={setBatchValue}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Remover Departamento (Nenhum)</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {batchField === 'status' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="w-4 h-4 text-green-500" /> Novo Status
                </Label>
                <Select value={batchValue} onValueChange={setBatchValue}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo (Permitir acesso)</SelectItem>
                    <SelectItem value="false">Inativo (Bloquear acesso)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="ghost" onClick={() => setBatchEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBatchEdit}
              disabled={!batchField || !batchValue || batchLoading}
              className="shadow-sm"
            >
              {batchLoading ? 'Salvando...' : 'Aplicar Alteração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
