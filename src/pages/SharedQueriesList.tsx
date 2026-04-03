import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Copy, Ban, Eye, Trash2, CheckCircle2, XCircle } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type SharedQuery = {
  id: string
  prompt: string
  created_at: string
  access_count: number
  is_protected: boolean
  is_revoked: boolean
  single_view: boolean
  user_id: string | null
  user_name?: string
}

export default function SharedQueriesList() {
  const [queries, setQueries] = useState<SharedQuery[]>([])
  const [loading, setLoading] = useState(true)
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

      // Buscar os nomes dos usuários vinculados aos compartilhamentos (resolve o problema do Chatbot)
      const userIds = Array.from(new Set(data?.map((q) => q.user_id).filter(Boolean) as string[]))

      let usersMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('cadastro_usuarios')
          .select('user_id, name')
          .in('user_id', userIds)

        if (!usersError && usersData) {
          usersMap = usersData.reduce((acc, u) => ({ ...acc, [u.user_id]: u.name }), {})
        }
      }

      const formattedData = data?.map((q) => ({
        ...q,
        user_name: q.user_id ? usersMap[q.user_id] || 'Usuário Desconhecido' : 'Sistema',
      })) as SharedQuery[]

      setQueries(formattedData)
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os compartilhamentos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shared_queries')
        .update({ is_revoked: true })
        .eq('id', id)

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Link revogado com sucesso.' })
      setQueries(queries.map((q) => (q.id === id ? { ...q, is_revoked: true } : q)))
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao revogar o link.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('shared_queries').delete().eq('id', id)

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Compartilhamento excluído.' })
      setQueries(queries.filter((q) => q.id !== id))
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}/consulta/${id}`
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link Copiado',
        description: 'O link foi copiado para a área de transferência.',
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao copiar link.', variant: 'destructive' })
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

      <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
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
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Carregando compartilhamentos...
                  </div>
                </TableCell>
              </TableRow>
            ) : queries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum compartilhamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              queries.map((q) => (
                <TableRow key={q.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell className="whitespace-nowrap text-sm font-medium">
                    {format(new Date(q.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell
                    className="max-w-[250px] truncate text-muted-foreground"
                    title={q.prompt}
                  >
                    {q.prompt}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{q.user_name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {q.access_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {q.is_revoked ? (
                      <Badge
                        variant="destructive"
                        className="flex w-[90px] mx-auto items-center justify-center gap-1.5 shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Revogado
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 flex w-[90px] mx-auto items-center justify-center gap-1.5 shadow-sm border-emerald-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={q.is_revoked}
                            onClick={() => handleRevoke(q.id)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Revogar Acesso</TooltipContent>
                      </Tooltip>

                      {!q.is_revoked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => handleCopyLink(q.id)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar Link</TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="w-8 h-8" />
                      )}

                      {q.is_protected ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-8 w-8 flex items-center justify-center text-muted-foreground bg-secondary/50 rounded-md">
                              <Eye className="w-4 h-4" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Protegido por Senha</TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir compartilhamento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O link deixará de funcionar
                            imediatamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(q.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
