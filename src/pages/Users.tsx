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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
} from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [batchEditOpen, setBatchEditOpen] = useState(false)
  const [batchField, setBatchField] = useState<string>('')
  const [batchValue, setBatchValue] = useState<string>('')
  const [batchLoading, setBatchLoading] = useState(false)

  // User form modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'collaborator',
    department_id: 'none',
    status: true,
  })

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 w-4 h-4 opacity-50" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 w-4 h-4" />
    ) : (
      <ArrowDown className="ml-2 w-4 h-4" />
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig

    let aValue = a[key]
    let bValue = b[key]

    if (key === 'department') {
      aValue = a.departments?.name || ''
      bValue = b.departments?.name || ''
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(sortedUsers.map((u) => u.id))
    else setSelected([])
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelected((prev) => [...prev, id])
    else setSelected((prev) => prev.filter((x) => x !== id))
  }

  const openNewUserModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'collaborator',
      department_id: 'none',
      status: true,
    })
    setIsUserModalOpen(true)
  }

  const openEditUserModal = (user: any) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      cpf: user.cpf || '',
      phone: user.phone || '',
      role: user.role || 'collaborator',
      department_id: user.department_id || 'none',
      status: user.status ?? true,
    })
    setIsUserModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Atenção',
        description: 'Nome e E-mail são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setBatchLoading(true)

    if (editingUser) {
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({
          name: formData.name,
          cpf: formData.cpf || null,
          phone: formData.phone || null,
          role: formData.role,
          department_id: formData.department_id === 'none' ? null : formData.department_id,
          status: formData.status,
        })
        .eq('id', editingUser.id)

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      } else {
        toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
        setIsUserModalOpen(false)
        fetchData()
      }
    } else {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'invite',
            email: formData.email,
            name: formData.name,
            role: formData.role,
            cpf: formData.cpf,
            phone: formData.phone,
            department_id: formData.department_id === 'none' ? null : formData.department_id,
            admin_id: session?.user?.id,
          }),
        })

        const result = await res.json()

        if (!result.success) {
          toast({
            title: 'Erro ao convidar',
            description: result.error || 'Falha ao convidar usuário',
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Sucesso', description: 'Convite enviado com sucesso.' })
          setIsUserModalOpen(false)
          fetchData()
        }
      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      }
    }

    setBatchLoading(false)
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
        <Button className="w-full md:w-auto shadow-sm" onClick={openNewUserModal}>
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
                  checked={selected.length === sortedUsers.length && sortedUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Nome Completo <SortIcon columnKey="name" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  E-mail <SortIcon columnKey="email" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Perfil de Acesso <SortIcon columnKey="role" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center">
                  Departamento <SortIcon columnKey="department" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold text-center cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  Status <SortIcon columnKey="status" />
                </div>
              </TableHead>
              <TableHead className="w-16 text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground font-medium"
                >
                  Carregando dados da equipe...
                </TableCell>
              </TableRow>
            ) : sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground font-medium"
                >
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditUserModal(user)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Form Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize os dados do usuário abaixo.'
                : 'Preencha os dados para convidar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: joao@empresa.com"
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="Ex: 000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: (00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="collaborator">Colaborador</SelectItem>
                  <SelectItem value="client_user">Usuário Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.department_id}
                onValueChange={(val) => setFormData({ ...formData, department_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="space-y-2 md:col-span-2">
                <Label>Status</Label>
                <Select
                  value={formData.status ? 'true' : 'false'}
                  onValueChange={(val) => setFormData({ ...formData, status: val === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t sm:gap-0">
            <Button variant="ghost" onClick={() => setIsUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={batchLoading}>
              {batchLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
