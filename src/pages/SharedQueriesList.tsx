import { useEffect, useState } from 'react'
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
import { Trash2, Key, Copy, Check, Lock, Unlock, Eye } from 'lucide-react'
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

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isProtected, setIsProtected] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchQueries = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('shared_queries')
      .select('id, prompt, created_at, is_protected, access_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setQueries(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQueries()
  }, [user])

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/consulta/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Tem certeza que deseja excluir este link? Quem tiver o link perderá o acesso imediatamente.',
      )
    )
      return

    const { error } = await supabase.from('shared_queries').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Link excluído', description: 'O compartilhamento foi removido com sucesso.' })
      setQueries(queries.filter((q) => q.id !== id))
    }
  }

  const openPasswordDialog = (query: any) => {
    setSelectedQuery(query)
    setIsProtected(query.is_protected || false)
    setNewPassword('')
    setPasswordDialogOpen(true)
  }

  const handleUpdatePassword = async () => {
    if (!selectedQuery) return
    setUpdating(true)

    const updates: any = { is_protected: isProtected }
    if (isProtected) {
      if (!newPassword && selectedQuery.is_protected) {
        // Keep existing password
      } else if (!newPassword) {
        toast({
          title: 'Atenção',
          description: 'Digite uma senha para proteger o link.',
          variant: 'destructive',
        })
        setUpdating(false)
        return
      } else {
        updates.password = newPassword
      }
    } else {
      updates.password = null
    }

    const { error } = await supabase
      .from('shared_queries')
      .update(updates)
      .eq('id', selectedQuery.id)

    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'As configurações de segurança foram atualizadas.' })
      setPasswordDialogOpen(false)
      fetchQueries()
    }
    setUpdating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Meus Compartilhamentos
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os links de consultas gerados, acompanhe os acessos e controle as senhas.
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
          {loading ? (
            <div className="flex justify-center p-8 text-muted-foreground">Carregando...</div>
          ) : queries.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
              Nenhum compartilhamento ativo no momento.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Consulta</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Acessos</TableHead>
                    <TableHead>Segurança</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((query) => (
                    <TableRow key={query.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="max-w-[300px]">
                        <p className="truncate font-medium" title={query.prompt}>
                          {query.prompt}
                        </p>
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
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <Unlock className="w-3 h-3 mr-1" />
                            Aberto
                          </Badge>
                        )}
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
                            onClick={() => openPasswordDialog(query)}
                            title="Configurar Senha"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(query.id)}
                            title="Excluir Link"
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
            <DialogTitle>Configurar Segurança do Link</DialogTitle>
            <DialogDescription>
              Altere as configurações de senha para o link compartilhado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isProtected"
                checked={isProtected}
                onChange={(e) => setIsProtected(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-offset-background"
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
                      ? 'Deixe em branco para manter a atual'
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
              {updating ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
