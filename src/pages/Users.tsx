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
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  FileType,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { useAuditLog } from '@/hooks/use-audit-log'

type SortField = 'name' | 'email' | 'cpf' | 'role' | 'department' | 'status'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<any>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDesc, setSortDesc] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { toast } = useToast()
  const { logAction } = useAuditLog()

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
      const userToDelete = users.find((u) => u.id === id)
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error

      if (userToDelete) {
        await logAction('USUARIOS', id, 'EXCLUSAO', {
          status: { old: 'Ativo', new: 'Excluído' },
        })
      }

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

      for (const id of selectedUsers) {
        await logAction('USUARIOS', id, 'EXCLUSAO_EM_LOTE', {
          status: { old: 'Ativo', new: 'Excluído' },
        })
      }

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários excluídos.` })
      setSelectedUsers([])
      loadUsers()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NOME: 'João da Silva',
        EMAIL: 'joao@email.com',
        CPF: '123.456.789-00',
        DEPARTAMENTO_CODIGO: 'DEP-123',
        PERFIL: 'collaborator',
        TELEFONE: '(11) 99999-9999',
        ENDERECO: 'Rua Exemplo, 123',
        OBSERVACOES: 'Perfis validos: admin, supervisor, collaborator, client_user',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo')
    XLSX.writeFile(wb, 'Modelo_Importacao_Usuarios.xlsx')
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
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> XLSX (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileType className="w-4 h-4 mr-2 text-blue-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileIcon className="w-4 h-4 mr-2 text-red-600" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="w-4 h-4 mr-2 text-gray-600" /> TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" /> Importar em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2 text-blue-600" /> Exportar Modelo Padrão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2 text-green-600" /> Importar Planilha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                        onClick={() => {
                          setUserToEdit(user)
                          setIsEditUserModalOpen(true)
                        }}
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

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setUserToEdit(null)
        }}
        user={userToEdit}
        onSaved={loadUsers}
        logAction={logAction}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedUsers={selectedUsers}
        users={users}
        onSaved={() => {
          setSelectedUsers([])
          loadUsers()
        }}
        logAction={logAction}
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

      const isValidCPF = (cpfValue: string) => {
        const cleanCpf = cpfValue.replace(/\D/g, '')
        if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false
        let sum = 0
        let remainder
        for (let i = 1; i <= 9; i++) sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i)
        remainder = (sum * 10) % 11
        if (remainder === 10 || remainder === 11) remainder = 0
        if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false
        sum = 0
        for (let i = 1; i <= 10; i++) sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i)
        remainder = (sum * 10) % 11
        if (remainder === 10 || remainder === 11) remainder = 0
        if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false
        return true
      }

      const processedRows = rows.map((row: any, index) => {
        const email = String(row['EMAIL'] || '')
          .trim()
          .toLowerCase()
        const cpfRaw = String(row['CPF'] || '').trim()
        const cleanCpf = cpfRaw.replace(/\D/g, '')
        const cpf =
          cleanCpf.length === 11
            ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
            : cpfRaw

        const existing = existingUsers?.find(
          (u) => (u.email && u.email.toLowerCase() === email) || (u.cpf && u.cpf === cpf),
        )

        let isPending = false
        let isActive = false
        let existingId = null
        if (existing) {
          existingId = existing.id
          if (
            existing.pending_deletion ||
            existing.approval_status === 'pending' ||
            existing.deleted_at
          ) {
            isPending = true
          } else {
            isActive = true
          }
        }

        const cpfValid = cpfRaw ? isValidCPF(cpfRaw) : true
        const emailValid = email ? email.includes('@') && email.includes('.') : false

        let action = isPending ? 'restore' : 'insert'
        if (isActive || (!cpfValid && cpfRaw) || !emailValid) {
          action = 'ignore'
        }

        return {
          _index: index + 1,
          _raw: row,
          nome: row['NOME'],
          email: row['EMAIL'],
          cpf: row['CPF'] || cpf,
          departamento: row['DEPARTAMENTO_CODIGO'] || '-',
          isPending,
          isActive,
          cpfValid,
          emailValid,
          existingId,
          action,
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

              {(hasPending ||
                previewData.some((r) => r.isActive || (!r.cpfValid && r.cpf) || !r.emailValid)) && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="ml-2">
                    <span className="font-bold text-base block mb-1">Atenção</span>
                    Revise a coluna de "Ação" e os status. Registros já ativos, com CPF ou e-mail
                    inválidos foram marcados para descarte por padrão para evitar sobrescritas ou
                    erros. Existem registros com pendências que podem ser recuperados.
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
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">{row.email || '-'}</span>
                            {!row.emailValid && row.email && (
                              <span className="text-[10px] text-red-500 font-semibold mt-0.5">
                                E-mail Inválido
                              </span>
                            )}
                            {!row.email && (
                              <span className="text-[10px] text-red-500 font-semibold mt-0.5">
                                E-mail Obrigatório
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">{row.cpf || '-'}</span>
                            {!row.cpfValid && row.cpf && (
                              <span className="text-[10px] text-red-500 font-semibold mt-0.5">
                                CPF Inválido
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.departamento || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 py-1">
                            <Select
                              value={row.action}
                              onValueChange={(val) => handleActionChange(row._index, val)}
                            >
                              <SelectTrigger className="w-full bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {row.isPending && (
                                  <SelectItem value="restore">Importar e Reativar</SelectItem>
                                )}
                                <SelectItem value="insert">Importar / Atualizar</SelectItem>
                                <SelectItem value="ignore">Descartar</SelectItem>
                              </SelectContent>
                            </Select>
                            {row.isActive && (
                              <span className="text-[10px] text-amber-600 font-semibold leading-tight">
                                Registro já ativo.
                                <br />
                                Risco de sobrescrita!
                              </span>
                            )}
                          </div>
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
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('collaborator')
  const [departmentId, setDepartmentId] = useState('none')
  const [permissions, setPermissions] = useState<string[]>(['all'])
  const [companies, setCompanies] = useState<string[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const { toast } = useToast()

  const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analises', label: 'Análises' },
    { id: 'empresas', label: 'Empresas' },
    { id: 'departamentos', label: 'Departamentos' },
    { id: 'usuarios', label: 'Usuários' },
    { id: 'centros-de-custo', label: 'Centros de Custo' },
    { id: 'plano-de-contas', label: 'Plano de Contas' },
    { id: 'tipo-conta-tga', label: 'Tipos de Conta TGA' },
    { id: 'mapeamento', label: 'Mapeamentos' },
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'import', label: 'Importações' },
    { id: 'aprovacoes', label: 'Aprovações' },
    { id: 'compartilhamentos', label: 'Compartilhamentos' },
  ]

  useEffect(() => {
    if (isOpen) {
      supabase
        .from('departments')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setDepartments(data || []))
      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setOrganizations(data || []))
    } else {
      setName('')
      setEmail('')
      setCpf('')
      setPhone('')
      setRole('collaborator')
      setDepartmentId('none')
      setPermissions(['all'])
      setCompanies([])
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!name || !email) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'invite',
          name,
          email,
          role,
          cpf: cpf || null,
          phone: phone || null,
          department_id: departmentId === 'none' ? null : departmentId,
          permissions: permissions.length > 0 ? permissions : ['all'],
          companies,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast({ title: 'Sucesso', description: 'Usuário convidado com sucesso.' })
      onSaved()
      onClose()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados completos para convidar um novo usuário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CPF</label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Perfil</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
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
            <label className="text-sm font-medium">Departamento</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Empresas Permitidas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20">
              {organizations.length > 0 && (
                <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 pb-2 mb-2 border-b bg-red-600 text-white p-2 rounded-md">
                  <Checkbox
                    id="comp-all-new"
                    checked={companies.length === organizations.length}
                    onCheckedChange={(checked) => {
                      if (checked) setCompanies(organizations.map((o) => o.id))
                      else setCompanies([])
                    }}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-red-600"
                  />
                  <label htmlFor="comp-all-new" className="text-sm font-bold cursor-pointer">
                    Acesso Total
                  </label>
                </div>
              )}
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`org-new-${org.id}`}
                    checked={companies.includes(org.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setCompanies([...companies, org.id])
                      else setCompanies(companies.filter((id) => id !== org.id))
                    }}
                  />
                  <label
                    htmlFor={`org-new-${org.id}`}
                    className="text-sm cursor-pointer truncate font-normal"
                  >
                    {org.name}
                  </label>
                </div>
              ))}
              {organizations.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  Nenhuma empresa cadastrada.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Funcionalidades Permitidas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20">
              <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 pb-2 mb-2 border-b bg-red-600 text-white p-2 rounded-md">
                <Checkbox
                  id="perm-all-new"
                  checked={permissions.includes('all')}
                  onCheckedChange={(checked) => {
                    if (checked) setPermissions(['all'])
                    else setPermissions([])
                  }}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-red-600"
                />
                <label htmlFor="perm-all-new" className="text-sm font-bold cursor-pointer">
                  Acesso Total
                </label>
              </div>
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isAllPermissions = permissions.includes('all')
                const isChecked = isAllPermissions || permissions.includes(perm.id)
                return (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-new-${perm.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newPerms = isAllPermissions
                            ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                            : permissions
                          const updated = [...newPerms, perm.id]
                          if (updated.length === AVAILABLE_PERMISSIONS.length) {
                            setPermissions(['all'])
                          } else {
                            setPermissions(updated.filter((p) => p !== 'all'))
                          }
                        } else {
                          const newPerms = isAllPermissions
                            ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                            : permissions
                          setPermissions(newPerms.filter((id) => id !== perm.id && id !== 'all'))
                        }
                      }}
                    />
                    <label
                      htmlFor={`perm-new-${perm.id}`}
                      className="text-sm cursor-pointer truncate font-normal"
                    >
                      {perm.label}
                    </label>
                  </div>
                )
              })}
            </div>
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

function EditUserModal({
  isOpen,
  onClose,
  user,
  onSaved,
  logAction,
}: {
  isOpen: boolean
  onClose: () => void
  user: any
  onSaved: () => void
  logAction: (type: string, id: string, action: string, changes?: any) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('collaborator')
  const [departmentId, setDepartmentId] = useState('none')
  const [status, setStatus] = useState('true')
  const [permissions, setPermissions] = useState<string[]>(['all'])
  const [companies, setCompanies] = useState<string[]>([])
  const [initialCompanies, setInitialCompanies] = useState<string[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const { toast } = useToast()

  const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analises', label: 'Análises' },
    { id: 'empresas', label: 'Empresas' },
    { id: 'departamentos', label: 'Departamentos' },
    { id: 'usuarios', label: 'Usuários' },
    { id: 'centros-de-custo', label: 'Centros de Custo' },
    { id: 'plano-de-contas', label: 'Plano de Contas' },
    { id: 'tipo-conta-tga', label: 'Tipos de Conta TGA' },
    { id: 'mapeamento', label: 'Mapeamentos' },
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'import', label: 'Importações' },
    { id: 'aprovacoes', label: 'Aprovações' },
    { id: 'compartilhamentos', label: 'Compartilhamentos' },
  ]

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setCpf(user.cpf || '')
      setPhone(user.phone || '')
      setRole(user.role || 'collaborator')
      setDepartmentId(user.department_id || 'none')
      setStatus(user.status ? 'true' : 'false')
      setPermissions(user.permissions || ['all'])

      supabase
        .from('departments')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setDepartments(data || []))

      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setOrganizations(data || []))

      supabase
        .from('cadastro_usuarios_companies')
        .select('organization_id')
        .eq('usuario_id', user.id)
        .then(({ data }) => {
          if (data) {
            const comps = data.map((d) => d.organization_id)
            setCompanies(comps)
            setInitialCompanies(comps)
          }
        })
    } else {
      setPermissions(['all'])
      setCompanies([])
      setInitialCompanies([])
    }
  }, [isOpen, user])

  const handleSave = async () => {
    if (!name) return
    setLoading(true)
    try {
      const updates: any = {
        name,
        cpf: cpf || null,
        phone: phone || null,
        role,
        department_id: departmentId === 'none' ? null : departmentId,
        status: status === 'true',
        permissions: permissions.length > 0 ? permissions : ['all'],
      }

      const changes: Record<string, { old: any; new: any }> = {}
      if (user.name !== name) changes.name = { old: user.name, new: name }
      if ((user.cpf || '') !== (cpf || '')) changes.cpf = { old: user.cpf, new: cpf }
      if ((user.phone || '') !== (phone || '')) changes.phone = { old: user.phone, new: phone }
      if (user.role !== role) changes.role = { old: user.role, new: role }
      if ((user.department_id || 'none') !== departmentId)
        changes.department_id = { old: user.department_id, new: departmentId }
      if (user.status !== (status === 'true'))
        changes.status = { old: user.status, new: status === 'true' }

      const oldPerms = [...(user.permissions || ['all'])].sort().join(',')
      const newPerms = [...(permissions.length > 0 ? permissions : ['all'])].sort().join(',')
      if (oldPerms !== newPerms) changes.permissions = { old: user.permissions, new: permissions }

      const oldComps = [...initialCompanies].sort().join(',')
      const newComps = [...companies].sort().join(',')
      if (oldComps !== newComps) changes.companies = { old: initialCompanies, new: companies }

      const { error } = await supabase.from('cadastro_usuarios').update(updates).eq('id', user.id)
      if (error) throw error

      await supabase.from('cadastro_usuarios_companies').delete().eq('usuario_id', user.id)
      if (companies.length > 0) {
        const companyInserts = companies.map((orgId: string) => ({
          usuario_id: user.id,
          organization_id: orgId,
        }))
        await supabase.from('cadastro_usuarios_companies').insert(companyInserts)
      }

      if (Object.keys(changes).length > 0) {
        await logAction('USUARIOS', user.id, 'EDICAO', changes)
      }

      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
      onSaved()
      onClose()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Atualize as informações do usuário.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CPF</label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Perfil</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
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
            <label className="text-sm font-medium">Departamento</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Empresas Permitidas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20">
              {organizations.length > 0 && (
                <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 pb-2 mb-2 border-b bg-red-600 text-white p-2 rounded-md">
                  <Checkbox
                    id="comp-all-edit"
                    checked={companies.length === organizations.length}
                    onCheckedChange={(checked) => {
                      if (checked) setCompanies(organizations.map((o) => o.id))
                      else setCompanies([])
                    }}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-red-600"
                  />
                  <label htmlFor="comp-all-edit" className="text-sm font-bold cursor-pointer">
                    Acesso Total
                  </label>
                </div>
              )}
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`org-edit-${org.id}`}
                    checked={companies.includes(org.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setCompanies([...companies, org.id])
                      else setCompanies(companies.filter((id) => id !== org.id))
                    }}
                  />
                  <label
                    htmlFor={`org-edit-${org.id}`}
                    className="text-sm cursor-pointer truncate font-normal"
                  >
                    {org.name}
                  </label>
                </div>
              ))}
              {organizations.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  Nenhuma empresa cadastrada.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Funcionalidades Permitidas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20">
              <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 pb-2 mb-2 border-b bg-red-600 text-white p-2 rounded-md">
                <Checkbox
                  id="perm-all-edit"
                  checked={permissions.includes('all')}
                  onCheckedChange={(checked) => {
                    if (checked) setPermissions(['all'])
                    else setPermissions([])
                  }}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-red-600"
                />
                <label htmlFor="perm-all-edit" className="text-sm font-bold cursor-pointer">
                  Acesso Total
                </label>
              </div>
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isAllPermissions = permissions.includes('all')
                const isChecked = isAllPermissions || permissions.includes(perm.id)
                return (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-edit-${perm.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newPerms = isAllPermissions
                            ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                            : permissions
                          const updated = [...newPerms, perm.id]
                          if (updated.length === AVAILABLE_PERMISSIONS.length) {
                            setPermissions(['all'])
                          } else {
                            setPermissions(updated.filter((p) => p !== 'all'))
                          }
                        } else {
                          const newPerms = isAllPermissions
                            ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                            : permissions
                          setPermissions(newPerms.filter((id) => id !== perm.id && id !== 'all'))
                        }
                      }}
                    />
                    <label
                      htmlFor={`perm-edit-${perm.id}`}
                      className="text-sm cursor-pointer truncate font-normal"
                    >
                      {perm.label}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !name}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
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
  users,
  onSaved,
  logAction,
}: {
  isOpen: boolean
  onClose: () => void
  selectedUsers: string[]
  users: any[]
  onSaved: () => void
  logAction: (type: string, id: string, action: string, changes?: any) => Promise<void>
}) {
  const [role, setRole] = useState<string>('no_change')
  const [status, setStatus] = useState<string>('no_change')
  const [departmentId, setDepartmentId] = useState<string>('no_change')
  const [updateCompanies, setUpdateCompanies] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const [updatePermissions, setUpdatePermissions] = useState(false)
  const [permissions, setPermissions] = useState<string[]>(['all'])
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const { toast } = useToast()

  const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analises', label: 'Análises' },
    { id: 'empresas', label: 'Empresas' },
    { id: 'departamentos', label: 'Departamentos' },
    { id: 'usuarios', label: 'Usuários' },
    { id: 'centros-de-custo', label: 'Centros de Custo' },
    { id: 'plano-de-contas', label: 'Plano de Contas' },
    { id: 'tipo-conta-tga', label: 'Tipos de Conta TGA' },
    { id: 'mapeamento', label: 'Mapeamentos' },
    { id: 'lancamentos', label: 'Lançamentos' },
    { id: 'import', label: 'Importações' },
    { id: 'aprovacoes', label: 'Aprovações' },
    { id: 'compartilhamentos', label: 'Compartilhamentos' },
  ]

  useEffect(() => {
    if (isOpen) {
      supabase
        .from('departments')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setDepartments(data || []))

      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => setOrganizations(data || []))
    } else {
      setRole('no_change')
      setStatus('no_change')
      setDepartmentId('no_change')
      setUpdateCompanies(false)
      setCompanies([])
      setUpdatePermissions(false)
      setPermissions(['all'])
    }
  }, [isOpen])

  const handleSave = async () => {
    if (
      role === 'no_change' &&
      status === 'no_change' &&
      departmentId === 'no_change' &&
      !updateCompanies &&
      !updatePermissions
    ) {
      onClose()
      return
    }

    setLoading(true)
    try {
      const updates: any = {}
      if (role !== 'no_change') updates.role = role
      if (status !== 'no_change') updates.status = status === 'true'
      if (departmentId !== 'no_change') {
        updates.department_id = departmentId === 'none' ? null : departmentId
      }
      if (updatePermissions) {
        updates.permissions = permissions.length > 0 ? permissions : ['all']
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('cadastro_usuarios')
          .update(updates)
          .in('id', selectedUsers)
        if (error) throw error
      }

      if (updateCompanies) {
        await supabase.from('cadastro_usuarios_companies').delete().in('usuario_id', selectedUsers)

        if (companies.length > 0) {
          const companyInserts = selectedUsers.flatMap((userId) =>
            companies.map((orgId) => ({
              usuario_id: userId,
              organization_id: orgId,
            })),
          )
          await supabase.from('cadastro_usuarios_companies').insert(companyInserts)
        }
      }

      for (const userId of selectedUsers) {
        const u = users.find((user: any) => user.id === userId)
        const changes: Record<string, { old: any; new: any }> = {}
        if (role !== 'no_change' && u?.role !== role) changes.role = { old: u?.role, new: role }
        if (status !== 'no_change' && u?.status !== (status === 'true'))
          changes.status = { old: u?.status, new: status === 'true' }
        if (departmentId !== 'no_change' && (u?.department_id || 'none') !== departmentId)
          changes.department_id = { old: u?.department_id, new: departmentId }
        if (updatePermissions) changes.permissions = { old: u?.permissions, new: permissions }
        if (updateCompanies) changes.companies = { old: 'Múltiplas', new: companies }

        if (Object.keys(changes).length > 0) {
          await logAction('USUARIOS', userId, 'EDICAO_EM_LOTE', changes)
        }
      }

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários atualizados.` })
      onSaved()
      onClose()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alteração em Lote</DialogTitle>
          <DialogDescription>
            Aplicar alterações para {selectedUsers.length} usuários selecionados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Departamento</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Manter atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">Manter atual</SelectItem>
                  <SelectItem value="none">Remover Departamento</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
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

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-companies"
                checked={updateCompanies}
                onCheckedChange={(checked) => setUpdateCompanies(!!checked)}
              />
              <label htmlFor="update-companies" className="text-sm font-medium cursor-pointer">
                Alterar Empresas Permitidas
              </label>
            </div>
            {updateCompanies && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20 mt-2">
                {organizations.length > 0 && (
                  <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 pb-2 mb-2 border-b bg-red-600 text-white p-2 rounded-md">
                    <Checkbox
                      id="comp-all-bulk"
                      checked={companies.length === organizations.length}
                      onCheckedChange={(checked) => {
                        if (checked) setCompanies(organizations.map((o) => o.id))
                        else setCompanies([])
                      }}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-red-600"
                    />
                    <label htmlFor="comp-all-bulk" className="text-sm font-bold cursor-pointer">
                      Acesso Total
                    </label>
                  </div>
                )}
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`org-bulk-${org.id}`}
                      checked={companies.includes(org.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setCompanies([...companies, org.id])
                        else setCompanies(companies.filter((id) => id !== org.id))
                      }}
                    />
                    <label
                      htmlFor={`org-bulk-${org.id}`}
                      className="text-sm cursor-pointer truncate font-normal"
                    >
                      {org.name}
                    </label>
                  </div>
                ))}
                {organizations.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">
                    Nenhuma empresa cadastrada.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-permissions"
                checked={updatePermissions}
                onCheckedChange={(checked) => setUpdatePermissions(!!checked)}
              />
              <label htmlFor="update-permissions" className="text-sm font-medium cursor-pointer">
                Alterar Funcionalidades Permitidas
              </label>
            </div>
            {updatePermissions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20 mt-2">
                <div className="flex items-center space-x-2 col-span-1 sm:col-span-2 pb-2 mb-2 border-b bg-red-600 text-white p-2 rounded-md">
                  <Checkbox
                    id="perm-all-bulk"
                    checked={permissions.includes('all')}
                    onCheckedChange={(checked) => {
                      if (checked) setPermissions(['all'])
                      else setPermissions([])
                    }}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-red-600"
                  />
                  <label htmlFor="perm-all-bulk" className="text-sm font-bold cursor-pointer">
                    Acesso Total
                  </label>
                </div>
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isAllPermissions = permissions.includes('all')
                  const isChecked = isAllPermissions || permissions.includes(perm.id)
                  return (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-bulk-${perm.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newPerms = isAllPermissions
                              ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                              : permissions
                            const updated = [...newPerms, perm.id]
                            if (updated.length === AVAILABLE_PERMISSIONS.length) {
                              setPermissions(['all'])
                            } else {
                              setPermissions(updated.filter((p) => p !== 'all'))
                            }
                          } else {
                            const newPerms = isAllPermissions
                              ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                              : permissions
                            setPermissions(newPerms.filter((id) => id !== perm.id && id !== 'all'))
                          }
                        }}
                      />
                      <label
                        htmlFor={`perm-bulk-${perm.id}`}
                        className="text-sm cursor-pointer truncate font-normal"
                      >
                        {perm.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              loading ||
              (role === 'no_change' &&
                status === 'no_change' &&
                departmentId === 'no_change' &&
                !updateCompanies &&
                !updatePermissions)
            }
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
