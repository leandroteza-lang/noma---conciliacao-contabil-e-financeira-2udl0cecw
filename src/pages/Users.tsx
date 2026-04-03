import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Plus, Trash2, Edit2, Shield, Building, MoreVertical } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false)

  const [formData, setFormData] = useState<any>({})
  const [batchEditField, setBatchEditField] = useState('')
  const [batchEditValue, setBatchEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()
  const { user } = useAuth()

  const fetchData = async () => {
    setLoading(true)
    const { data: deps } = await supabase
      .from('departments')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    if (deps) setDepartments(deps)

    const { data: usrs } = await supabase
      .from('cadastro_usuarios')
      .select('*, departments(name)')
      .is('deleted_at', null)
      .order('name')
    if (usrs) setUsers(usrs)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cpf?.includes(searchTerm),
  )

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) setSelectedUsers([])
    else setSelectedUsers(filteredUsers.map((u) => u.id))
  }

  const toggleSelect = (id: string) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter((uId) => uId !== id))
    else setSelectedUsers([...selectedUsers, id])
  }

  const handleAddSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Erro',
        description: 'Nome e E-mail são obrigatórios',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'invite',
          email: formData.email,
          name: formData.name,
          role: formData.role || 'collaborator',
          cpf: formData.cpf,
          phone: formData.phone,
          department_id: formData.department_id,
          admin_id: user?.id,
        },
      })
      if (error || !data?.success)
        throw new Error(error?.message || data?.error || 'Erro ao convidar usuário')

      toast({ title: 'Sucesso', description: 'Usuário convidado com sucesso!' })
      setIsAddModalOpen(false)
      setFormData({})
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubmit = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({
          name: formData.name,
          cpf: formData.cpf,
          phone: formData.phone,
          department_id: formData.department_id,
          role: formData.role,
          status: formData.status,
        })
        .eq('id', formData.id)

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' })
      setIsEditModalOpen(false)
      setFormData({})
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string, authUserId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      await supabase
        .from('cadastro_usuarios')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId)
      if (authUserId) {
        await supabase.functions.invoke('manage-user', {
          body: { action: 'delete', user_id: authUserId },
        })
      }
      toast({ title: 'Sucesso', description: 'Usuário excluído.' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedUsers.length} usuários?`)) return
    try {
      const usersToDelete = users.filter((u) => selectedUsers.includes(u.id))
      for (const u of usersToDelete) {
        await supabase
          .from('cadastro_usuarios')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', u.id)
        if (u.user_id) {
          await supabase.functions.invoke('manage-user', {
            body: { action: 'delete', user_id: u.user_id },
          })
        }
      }
      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários excluídos.` })
      setSelectedUsers([])
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleBatchEditSubmit = async () => {
    if (!batchEditField || !batchEditValue) return
    setSaving(true)
    try {
      let updateData: any = {}
      if (batchEditField === 'role') updateData.role = batchEditValue
      else if (batchEditField === 'department_id')
        updateData.department_id = batchEditValue === 'null' ? null : batchEditValue
      else if (batchEditField === 'status') updateData.status = batchEditValue === 'true'

      const { error } = await supabase
        .from('cadastro_usuarios')
        .update(updateData)
        .in('id', selectedUsers)
      if (error) throw error

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários atualizados.` })
      setIsBatchEditModalOpen(false)
      setSelectedUsers([])
      setBatchEditField('')
      setBatchEditValue('')
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      collaborator: 'Colaborador',
      client_user: 'Cliente',
    }
    return roles[role] || role
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os acessos, permissões e departamentos da equipe.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ status: true })
            setIsAddModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto animate-in zoom-in-95 duration-200">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium shrink-0">
              {selectedUsers.length} selecionados
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsBatchEditModalOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar em Lote
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className={selectedUsers.includes(u.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={() => toggleSelect(u.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.cpf || 'Sem CPF'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.phone || 'Sem telefone'}</div>
                  </TableCell>
                  <TableCell>
                    {u.departments?.name ? (
                      <Badge variant="outline" className="font-normal">
                        <Building className="w-3 h-3 mr-1" />
                        {u.departments.name}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleLabel(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status ? 'default' : 'destructive'}
                      className={u.status ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {u.status ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setFormData(u)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => handleDelete(u.id, u.user_id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isBatchEditModalOpen} onOpenChange={setIsBatchEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {selectedUsers.length} Usuários em Lote</DialogTitle>
            <DialogDescription>
              Selecione um campo para aplicar o mesmo valor a todos os usuários selecionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campo a alterar</Label>
              <Select
                value={batchEditField}
                onValueChange={(v) => {
                  setBatchEditField(v)
                  setBatchEditValue('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Perfil de Acesso</SelectItem>
                  <SelectItem value="department_id">Departamento</SelectItem>
                  <SelectItem value="status">Status (Ativo/Inativo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {batchEditField === 'role' && (
              <div className="space-y-2">
                <Label>Novo Perfil</Label>
                <Select value={batchEditValue} onValueChange={setBatchEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
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

            {batchEditField === 'department_id' && (
              <div className="space-y-2">
                <Label>Novo Departamento</Label>
                <Select value={batchEditValue} onValueChange={setBatchEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Nenhum Departamento</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {batchEditField === 'status' && (
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={batchEditValue} onValueChange={setBatchEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBatchEditSubmit}
              disabled={saving || !batchEditField || !batchEditValue}
            >
              {saving ? 'Aplicando...' : 'Aplicar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddModalOpen || isEditModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsAddModalOpen(false)
            setIsEditModalOpen(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isAddModalOpen ? 'Adicionar Novo Usuário' : 'Editar Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Email</Label>
              <Input
                disabled={isEditModalOpen}
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>CPF</Label>
              <Input
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Telefone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Departamento</Label>
              <Select
                value={formData.department_id || 'null'}
                onValueChange={(v) =>
                  setFormData({ ...formData, department_id: v === 'null' ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Perfil de Acesso</Label>
              <Select
                value={formData.role || 'collaborator'}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
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
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Status</Label>
              <Select
                value={formData.status !== false ? 'true' : 'false'}
                onValueChange={(v) => setFormData({ ...formData, status: v === 'true' })}
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={isAddModalOpen ? handleAddSubmit : handleEditSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
