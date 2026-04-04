import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
                : 'Autoria não identificada')
            : 'Sistema',
        })) as SharedQuery[],
      )
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível carregar.', variant: 'destructive' })
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
      toast({ title: 'Sucesso', description: 'Link revogado.' })
      setQueries(queries.map((q) => (q.id === id ? { ...q, is_revoked: true } : q)))
    } catch (err: any) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('shared_queries').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Excluído.' })
      setQueries(queries.filter((q) => q.id !== id))
    } catch (err: any) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return
    try {
      const { error } = await supabase.from('shared_queries').delete().in('id', selectedIds)
      if (error) throw error
      toast({ title: 'Sucesso', description: `${selectedIds.length} excluídos.` })
      setQueries(queries.filter((q) => !selectedIds.includes(q.id)))
      setSelectedIds([])
    } catch (err: any) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleCopyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/consulta/${id}`)
      toast({ title: 'Link Copiado' })
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Compartilhamentos</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os links de consultas e painéis que você compartilhou.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por tópico ou usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full sm:max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="revoked">Revogados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedIds.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-9">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Selecionados ({selectedIds.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir selecionados?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleBatchDelete}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px] text-center">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredQueries.length}
                  onCheckedChange={(c) => setSelectedIds(c ? filteredQueries.map((q) => q.id) : [])}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Consulta / Tópico</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead className="text-center">Acessos</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Controle de Acesso</TableHead>
              <TableHead className="text-center w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Carregando...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredQueries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Nenhum encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredQueries.map((q) => (
                <SharedQueriesRow
                  key={q.id}
                  q={q}
                  selected={selectedIds.includes(q.id)}
                  onSelect={(c, id) =>
                    setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter((s) => s !== id))
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
    </div>
  )
}
