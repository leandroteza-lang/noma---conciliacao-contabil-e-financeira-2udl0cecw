import { useEffect, useState } from 'react'
import { Trash2, Search, Filter, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
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
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SharedQueriesRow, type SharedQuery } from '@/components/SharedQueriesRow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SharedQueriesList() {
  const [queries, setQueries] = useState<SharedQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchQueries()

    const handleRefresh = () => fetchQueries()
    window.addEventListener('share-created', handleRefresh)
    return () => window.removeEventListener('share-created', handleRefresh)
  }, [user])

  const fetchQueries = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shared_queries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error

      const userIds = Array.from(new Set(data?.map((q) => q.user_id).filter(Boolean) as string[]))
      let usersMap: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('cadastro_usuarios')
          .select('user_id, name, email')
          .in('user_id', userIds)
        if (usersData) {
          usersMap = usersData.reduce(
            (acc, u) => ({ ...acc, [u.user_id]: u.name || u.email || 'Usuário' }),
            {},
          )
        }
      }

      setQueries(
        data?.map((q) => ({
          ...q,
          user_name: q.user_id
            ? usersMap[q.user_id] ||
              (q.user_id === user.id
                ? user.user_metadata?.name || user.email || 'Você'
                : 'Usuário Desconhecido')
            : 'Sistema',
        })) as SharedQuery[],
      )
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os compartilhamentos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredQueries = queries.filter((q) => {
    const matchSearch =
      q.prompt.toLowerCase().includes(search.toLowerCase()) ||
      q.user_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? !q.is_revoked : q.is_revoked
    return matchSearch && matchStatus
  })

  const handleRevoke = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shared_queries')
        .update({ is_revoked: true })
        .eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Link revogado. Ninguém mais poderá acessá-lo.' })
      setQueries(queries.map((q) => (q.id === id ? { ...q, is_revoked: true } : q)))
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao revogar link.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('shared_queries').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Compartilhamento excluído permanentemente.' })
      setQueries(queries.filter((q) => q.id !== id))
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return
    try {
      const { error } = await supabase.from('shared_queries').delete().in('id', selectedIds)
      if (error) throw error
      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} compartilhamento(s) excluído(s).`,
      })
      setQueries(queries.filter((q) => !selectedIds.includes(q.id)))
      setSelectedIds([])
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao excluir em lote.', variant: 'destructive' })
    }
  }

  const handleCopyLink = async (id: string) => {
    try {
      const query = queries.find((q) => q.id === id)
      const url = `${window.location.origin}/consulta/${id}`

      let userName = 'UM CONSULTOR'
      if (user) {
        userName = user.user_metadata?.name || user.email || 'UM CONSULTOR'
        const { data } = await supabase
          .from('cadastro_usuarios')
          .select('name')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data?.name) userName = data.name.toUpperCase()
      }

      let message = `*Gestão de Contas - Consulta Compartilhada* 🔒\n\nOlá! *${userName}* compartilhou um documento seguro com você.\n\n🔗 *Acessar agora:* ${url}`
      if (query?.is_protected && query.password) {
        message += `\n🔑 *Senha de acesso:* ${query.password}`
      }
      if (query?.single_view) {
        message += `\n⚠️ *Atenção:* Este link é de visualização única e expirará após o primeiro acesso.`
      }

      await navigator.clipboard.writeText(message)
      toast({
        title: 'Link Copiado',
        description: 'O link e os detalhes de acesso foram copiados.',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      })
    }
  }

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredQueries.map((q) => q.id) : [])
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Meus Compartilhamentos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie todos os links de consultas, painéis e análises que você compartilhou.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4 px-5 pt-5 flex flex-col md:flex-row md:items-center gap-4 space-y-0">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por tópico ou usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-background w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 bg-background">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 opacity-70" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="revoked">Revogados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            {selectedIds.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 font-medium shadow-sm animate-in fade-in zoom-in-95 duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir ({selectedIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Excluir {selectedIds.length} compartilhamentos?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. Os links deixarão de funcionar imediatamente para
                      quem tiver acesso.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      onClick={handleBatchDelete}
                    >
                      Excluir Todos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              size="sm"
              className="h-9 font-medium shadow-sm"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('open-share-modal', { detail: { isManual: true } }),
                )
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                  <TableHead className="w-[40px] text-center px-4">
                    <Checkbox
                      checked={
                        selectedIds.length > 0 && selectedIds.length === filteredQueries.length
                      }
                      onCheckedChange={(c) => toggleAll(!!c)}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Data de Criação
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Consulta / Tópico</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Criado por
                  </TableHead>
                  <TableHead className="text-center font-semibold text-foreground whitespace-nowrap">
                    Acessos
                  </TableHead>
                  <TableHead className="text-center font-semibold text-foreground whitespace-nowrap">
                    Configurações
                  </TableHead>
                  <TableHead className="text-center font-semibold text-foreground whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground pr-6 whitespace-nowrap">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm">Carregando compartilhamentos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQueries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="p-3 bg-muted rounded-full mb-2">
                          <Search className="w-6 h-6 text-muted-foreground/60" />
                        </div>
                        <p className="font-medium text-foreground">Nenhum link encontrado</p>
                        <p className="text-sm">
                          Tente ajustar seus filtros de busca ou crie um novo compartilhamento.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQueries.map((q) => (
                    <SharedQueriesRow
                      key={q.id}
                      q={q}
                      selected={selectedIds.includes(q.id)}
                      onSelect={(c, id) =>
                        setSelectedIds((prev) => (c ? [...prev, id] : prev.filter((s) => s !== id)))
                      }
                      onRevoke={handleRevoke}
                      onCopy={handleCopyLink}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
