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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Upload,
  Plus,
  Download,
  AlertCircle,
  FileUp,
  MoreHorizontal,
  Edit,
  Trash,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
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

  const handleExport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-users', {
        body: { format: 'excel', data: filteredUsers },
      })
      if (error) throw error

      const link = document.createElement('a')
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excel}`
      link.download = `Usuarios_${format(new Date(), 'ddMMyyyy')}.xlsx`
      link.click()
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
      loadUsers()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os acessos e perfis do sistema.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar em Lote
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card/20">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                        Pendente
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" /> Excluir
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

      <ImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={loadUsers}
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
                              <SelectItem value="ignore">Descartar (Ignorar)</SelectItem>
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
