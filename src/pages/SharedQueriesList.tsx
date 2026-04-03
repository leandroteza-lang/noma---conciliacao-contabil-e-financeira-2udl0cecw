import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Trash2,
  Key,
  Copy,
  Check,
  Lock,
  Unlock,
  Eye,
  Search,
  ArrowUpDown,
  Bell,
  BellOff,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function SharedQueriesList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [queries, setQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isProtected, setIsProtected] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [userName, setUserName] = useState('')

  const fetchQueries = async () => {
    if (!user) return
    const { data } = await supabase.from('shared_queries').select('*').eq('user_id', user.id)
    if (data) setQueries(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchQueries()

    const fetchUser = async () => {
      if (!user) return
      const { data } = await supabase
        .from('cadastro_usuarios')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.name) {
        setUserName(data.name)
      }
    }
    fetchUser()
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('shared_queries_changes_list')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_queries',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any
          setQueries((prev) =>
            prev.map((q) => (q.id === newRecord.id ? { ...q, ...newRecord } : q)),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/consulta/${id}`
    const senderName = userName ? userName.toUpperCase() : 'UM CONSULTOR'
    const message = `Olá! **${senderName}** compartilhou um acesso seguro com você. Acesse pelo link: ${url}`

    navigator.clipboard.writeText(message)
    setCopiedId(id)
    toast({
      title: 'Link copiado!',
      description: 'A mensagem com o link foi copiada para a área de transferência.',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return
    const { error } = await supabase.from('shared_queries').delete().eq('id', id)
    if (error)
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Link excluído', description: 'O compartilhamento foi removido.' })
      setQueries((prev) => prev.filter((q) => q.id !== id))
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} links selecionados?`)) return
    const { error } = await supabase.from('shared_queries').delete().in('id', selectedIds)
    if (error)
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    else {
      toast({
        title: 'Links excluídos',
        description: `${selectedIds.length} compartilhamentos removidos.`,
      })
      setQueries((prev) => prev.filter((q) => !selectedIds.includes(q.id)))
      setSelectedIds([])
    }
  }

  const handleUpdatePassword = async () => {
    if (!selectedQuery) return
    setUpdating(true)
    const updates: any = {
      is_protected: isProtected,
      password: isProtected ? newPassword || selectedQuery.password : null,
    }
    if (isProtected && !newPassword && !selectedQuery.is_protected) {
      toast({
        title: 'Atenção',
        description: 'Digite uma senha para proteger o link.',
        variant: 'destructive',
      })
      setUpdating(false)
      return
    }
    const { error } = await supabase
      .from('shared_queries')
      .update(updates)
      .eq('id', selectedQuery.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Sucesso', description: 'Segurança atualizada.' })
      setPasswordDialogOpen(false)
      fetchQueries()
    }
    setUpdating(false)
  }

  const toggleNotification = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const updates = {
      notify_first_access: newStatus,
      ...(newStatus ? { first_access_notified: false } : {}),
    }

    const { error } = await supabase.from('shared_queries').update(updates).eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))
      toast({
        title: newStatus ? 'Alerta Ativado' : 'Alerta Desativado',
        description: newStatus
          ? 'Você será notificado no próximo acesso a este link.'
          : 'As notificações para este link foram suspensas.',
      })
    }
  }

  const sortedQueries = useMemo(() => {
    return [...queries]
      .filter((q) => q.prompt.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let valA = a[sortConfig.key]
        let valB = b[sortConfig.key]

        if (typeof valA === 'boolean') valA = valA ? 1 : 0
        if (typeof valB === 'boolean') valB = valB ? 1 : 0

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
  }, [queries, searchTerm, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedQueries.length) setSelectedIds([])
    else setSelectedIds(sortedQueries.map((q) => q.id))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Compartilhamentos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os links gerados, acompanhe acessos e controle senhas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Links Ativos</CardTitle>
          <CardDescription>
            Lista de todos os resultados que você compartilhou externamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por consulta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                size="sm"
                className="animate-in fade-in"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Selecionados ({selectedIds.length})
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center p-8 text-muted-foreground">Carregando...</div>
          ) : sortedQueries.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
              Nenhum compartilhamento encontrado.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedIds.length === sortedQueries.length && sortedQueries.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('prompt')}
                        className="h-8 flex items-center gap-1 -ml-4 font-medium"
                      >
                        Consulta <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('created_at')}
                        className="h-8 flex items-center gap-1 -ml-4 font-medium"
                      >
                        Data <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('access_count')}
                        className="h-8 flex items-center gap-1 -ml-4 font-medium"
                      >
                        Acessos <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('is_protected')}
                        className="h-8 flex items-center gap-1 -ml-4 font-medium"
                      >
                        Segurança <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('notify_first_access')}
                        className="h-8 flex items-center gap-1 -ml-4 font-medium"
                      >
                        Alerta <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQueries.map((query) => (
                    <TableRow key={query.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(query.id)}
                          onCheckedChange={() => toggleSelect(query.id)}
                        />
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate font-medium"
                        title={query.prompt}
                      >
                        {query.prompt}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(query.created_at).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">{query.access_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {query.is_protected ? (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Com senha
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted">
                            <Unlock className="w-3 h-3 mr-1" />
                            Aberto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNotification(query.id, query.notify_first_access)}
                          title={query.notify_first_access ? 'Desativar Alerta' : 'Ativar Alerta'}
                          className={
                            query.notify_first_access
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10'
                              : 'text-muted-foreground'
                          }
                        >
                          {query.notify_first_access ? (
                            <Bell className="w-4 h-4 mr-1" />
                          ) : (
                            <BellOff className="w-4 h-4 mr-1" />
                          )}
                          {query.notify_first_access ? 'Ativo' : 'Inativo'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(query.id)}
                            title="Copiar Link"
                          >
                            {copiedId === query.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedQuery(query)
                              setIsProtected(query.is_protected || false)
                              setNewPassword('')
                              setPasswordDialogOpen(true)
                            }}
                            title="Configurar Senha"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(query.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Segurança do Link</DialogTitle>
            <DialogDescription>
              Altere as configurações de senha para o link compartilhado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isProtected"
                checked={isProtected}
                onCheckedChange={(c) => setIsProtected(!!c)}
              />
              <Label htmlFor="isProtected" className="font-medium cursor-pointer">
                Proteger link com senha
              </Label>
            </div>
            {isProtected && (
              <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="text"
                  placeholder={
                    selectedQuery?.is_protected
                      ? 'Deixe em branco para manter'
                      : 'Digite a senha...'
                  }
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePassword} disabled={updating}>
              {updating ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
