import { useState, useEffect, useRef } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Upload,
  Plus,
  Download,
  AlertCircle,
  FileUp,
  Edit,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

type SortField = 'name' | 'email' | 'cpf' | 'role' | 'department' | 'status'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDesc, setSortDesc] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { toast } = useToast()

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cadastro_usuarios')
      .select('*, departments(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.cpf?.includes(search),
  )

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = ''
    let valB = ''

    switch (sortField) {
      case 'name':
        valA = a.name || ''
        valB = b.name || ''
        break
      case 'email':
        valA = a.email || ''
        valB = b.email || ''
        break
      case 'cpf':
        valA = a.cpf || ''
        valB = b.cpf || ''
        break
      case 'role':
        valA = a.role || ''
        valB = b.role || ''
        break
      case 'department':
        valA = a.departments?.name || ''
        valB = b.departments?.name || ''
        break
      case 'status':
        valA = a.approval_status === 'pending' ? '2' : a.status ? '1' : '0'
        valB = b.approval_status === 'pending' ? '2' : b.status ? '1' : '0'
        break
    }

    if (valA < valB) return sortDesc ? 1 : -1
    if (valA > valB) return sortDesc ? -1 : 1
    return 0
  })

  const handleExport = async (formatType: 'excel' | 'pdf' | 'csv' | 'txt') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-users', {
        body: { format: formatType, data: sortedUsers },
      })
      if (error) throw error

      let linkUrl = ''
      let downloadName = `Usuarios_${format(new Date(), 'ddMMyyyy')}`

      if (formatType === 'excel') {
        linkUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excel}`
        downloadName += '.xlsx'
      } else if (formatType === 'pdf') {
        linkUrl = data.pdf
        downloadName += '.pdf'
      } else if (formatType === 'csv') {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        linkUrl = URL.createObjectURL(blob)
        downloadName += '.csv'
      } else if (formatType === 'txt') {
        const blob = new Blob([data.txt], { type: 'text/plain;charset=utf-8;' })
        linkUrl = URL.createObjectURL(blob)
        downloadName += '.txt'
      }

      const link = document.createElement('a')
      link.href = linkUrl
      link.download = downloadName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao exportar', description: err.message })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return
    try {
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Usuário excluído.' })
      setSelectedUsers((prev) => prev.filter((uid) => uid !== id))
      loadUsers()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja realmente excluir ${selectedUsers.length} usuários?`)) return
    try {
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedUsers)
      if (error) throw error
      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários excluídos.` })
      setSelectedUsers([])
      loadUsers()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortField(field)
      setSortDesc(false)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />
    return sortDesc ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os acessos e perfis do sistema.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                XLSX (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>TXT</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar em Lote
          </Button>
          <Button onClick={() => setIsNewUserModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsBulkEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Alterar em Lote
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="w-4 h-4 mr-2" /> Excluir Selecionados ({selectedUsers.length})
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-md bg-card/20">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40px] text-center">
                <Checkbox
                  checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedUsers(sortedUsers.map((u) => u.id))
                    else setSelectedUsers([])
                  }}
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <div className="flex items-center">
                  Nome <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('email')}>
                <div className="flex items-center">
                  E-mail <SortIcon field="email" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('cpf')}>
                <div className="flex items-center">
                  CPF <SortIcon field="cpf" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('role')}>
                <div className="flex items-center">
                  Perfil <SortIcon field="role" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('department')}
              >
                <div className="flex items-center">
                  Departamento <SortIcon field="department" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center">
                  Status <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={selectedUsers.includes(user.id) ? 'bg-muted/50' : ''}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedUsers([...selectedUsers, user.id])
                        else setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.cpf || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {user.role === 'admin'
                        ? 'Administrador'
                        : user.role === 'supervisor'
                          ? 'Supervisor'
                          : user.role === 'client_user'
                            ? 'Usuário Cliente'
                            : 'Colaborador'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.departments?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {user.approval_status === 'pending' ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        Pendente de Aprovação
                      </Badge>
                    ) : user.status ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      >
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(user.id)}
                        title="Excluir"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={loadUsers}
      />

      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onSaved={loadUsers}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedUsers={selectedUsers}
        onSaved={() => {
          setSelectedUsers([])
          loadUsers()
        }}
      />
    </div>
  )
}

function ImportUsersModal({
  isOpen,
  onClose,
  onImported,
}: {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const reset = () => {
    setFile(null)
    setPreviewData([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    onClose()
  }

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    try {
      const data = await selectedFile.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      const { data: existingUsers } = await supabase
        .from('cadastro_usuarios')
        .select('id, email, cpf, pending_deletion, approval_status, deleted_at')

      const processedRows = rows.map((row: any, index) => {
        const email = String(row['EMAIL'] || '')
          .trim()
          .toLowerCase()
        const cpfRaw = String(row['CPF'] || '').trim()
        const cpf = cpfRaw.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

        const existing = existingUsers?.find(
          (u) => (u.email && u.email.toLowerCase() === email) || (u.cpf && u.cpf === cpf),
        )

        let isPending = false
        let existingId = null
        if (existing) {
          existingId = existing.id
          if (
            existing.pending_deletion ||
            existing.approval_status === 'pending' ||
            existing.deleted_at
          ) {
            isPending = true
          }
        }

        return {
          _index: index + 1,
          _raw: row,
          nome: row['NOME'],
          email: row['EMAIL'],
          cpf: row['CPF'] || cpf,
          departamento: row['DEPARTAMENTO_CODIGO'] || '-',
          isPending,
          existingId,
          action: isPending ? 'restore' : 'insert',
        }
      })

      setPreviewData(processedRows)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao processar arquivo',
        description: err.message,
      })
      reset()
    }
  }

  const handleActionChange = (index: number, newAction: string) => {
    setPreviewData((prev) =>
      prev.map((r) => (r._index === index ? { ...r, action: newAction } : r)),
    )
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const recordsToImport = previewData
        .filter((r) => r.action !== 'ignore')
        .map((r) => ({
          ...r._raw,
          _action: r.action,
          _existingId: r.existingId,
        }))

      if (recordsToImport.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum registro para importar.' })
        setLoading(false)
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()

      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          records: recordsToImport,
          type: 'EMPLOYEES',
          fileName: file?.name || 'Importacao_Usuarios.xlsx',
          allowIncomplete: false,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      toast({
        title: 'Importação Concluída',
        description: `${data.inserted} registros processados com sucesso.`,
      })
      onImported()
      handleOpenChange(false)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro na importação', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const hasPending = previewData.some((r) => r.isPending)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileUp className="w-5 h-5 text-red-600" /> Importar Usuários em Lote
            </DialogTitle>
          </div>
          <DialogDescription>
            Faça o upload do arquivo XLSX preenchido com base no modelo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 pb-6 space-y-6">
          {!file ? (
            <div
              className="border-2 border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors mt-4 bg-muted/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Clique para selecionar o arquivo XLSX</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Apenas arquivos Excel (.xlsx) preenchidos com o modelo são suportados.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  if (e.target.files?.[0]) processFile(e.target.files[0])
                }}
              />
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">
                  Pré-visualização dos dados ({previewData.length} registros)
                </h3>
                <Button variant="outline" size="sm" onClick={reset}>
                  Trocar Arquivo
                </Button>
              </div>

              {hasPending && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="ml-2">
                    <span className="font-bold text-base block mb-1">Atenção</span>
                    Revise a coluna de "Ação". Existem registros com pendências de exclusão ou de
                    aprovação. Você pode escolher importar/recuperar ou descartar esses usuários
                    específicos antes da importação.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border rounded-md overflow-hidden bg-card shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[60px] text-center">Linha</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead className="w-[380px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row) => (
                      <TableRow key={row._index}>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {row._index}
                        </TableCell>
                        <TableCell className="font-medium">{row.nome || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{row.email || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{row.cpf || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.departamento || '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.action}
                            onValueChange={(val) => handleActionChange(row._index, val)}
                          >
                            <SelectTrigger className="w-full bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {row.isPending && (
                                <SelectItem value="restore">
                                  Importar e Reativar da Central de Aprovações
                                </SelectItem>
                              )}
                              <SelectItem value="insert">Importar e Ativar da Planilha</SelectItem>
                              <SelectItem value="ignore">Descartar</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/30 p-6 border-t sm:justify-between items-center">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !file || loading || previewData.filter((r) => r.action !== 'ignore').length === 0
            }
            className="bg-[#e11d48] hover:bg-[#b91c3c] text-white"
          >
            {loading ? 'Processando...' : 'Confirmar Importação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewUserModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!name || !email) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'invite', name, email, role: 'collaborator' },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast({ title: 'Sucesso', description: 'Usuário convidado com sucesso.' })
      onSaved()
      onClose()
      setName('')
      setEmail('')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos para convidar um novo usuário.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !name || !email}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BulkEditModal({
  isOpen,
  onClose,
  selectedUsers,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  selectedUsers: string[]
  onSaved: () => void
}) {
  const [role, setRole] = useState<string>('no_change')
  const [status, setStatus] = useState<string>('no_change')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (role === 'no_change' && status === 'no_change') {
      onClose()
      return
    }

    setLoading(true)
    try {
      const updates: any = {}
      if (role !== 'no_change') updates.role = role
      if (status !== 'no_change') updates.status = status === 'true'

      const { error } = await supabase
        .from('cadastro_usuarios')
        .update(updates)
        .in('id', selectedUsers)

      if (error) throw error

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários atualizados.` })
      onSaved()
      onClose()
      setRole('no_change')
      setStatus('no_change')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alteração em Lote</DialogTitle>
          <DialogDescription>
            Aplicar alterações para {selectedUsers.length} usuários selecionados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Perfil</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">Manter atual</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="collaborator">Colaborador</SelectItem>
                <SelectItem value="client_user">Usuário Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Manter atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">Manter atual</SelectItem>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || (role === 'no_change' && status === 'no_change')}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
