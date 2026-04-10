import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Eye,
  Loader2,
  ShieldCheck,
  Activity,
  PlusCircle,
  Edit3,
  Trash2,
  Search,
  X,
} from 'lucide-react'

const ENTITIES = [
  { value: 'usuario', label: 'Usuários' },
  { value: 'chart_of_accounts', label: 'Plano de Contas' },
  { value: 'departments', label: 'Departamentos' },
  { value: 'organizations', label: 'Empresas' },
  { value: 'cost_centers', label: 'Centros de Custo' },
  { value: 'bank_accounts', label: 'Contas Bancárias' },
]

const getActionBadge = (action: string) => {
  const normalized = action.toUpperCase()
  if (['CREATE', 'INCLUSÃO'].includes(normalized))
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
        Criação
      </Badge>
    )
  if (['UPDATE', 'EDIÇÃO'].includes(normalized))
    return (
      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">
        Edição
      </Badge>
    )
  if (['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(normalized))
    return (
      <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20">
        Exclusão
      </Badge>
    )
  return <Badge variant="outline">{action}</Badge>
}

export default function HubTeste() {
  const [activeEntity, setActiveEntity] = useState('usuario')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('ALL')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, audit_details (*)')
          .eq('entity_type', activeEntity)
          .order('created_at', { ascending: false })
          .limit(200)

        if (error) throw error

        const userIds = [...new Set(data?.map((l) => l.performed_by).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('cadastro_usuarios')
            .select('user_id, name')
            .in('user_id', userIds)

          const userMap = new Map(users?.map((u) => [u.user_id, u.name]))
          data?.forEach((l) => {
            l.performed_by_name = userMap.get(l.performed_by) || 'Sistema'
          })
        }
        setLogs(data || [])
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [activeEntity])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.performed_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesAction = true
      const action = log.action.toUpperCase()
      if (actionFilter === 'CREATE') matchesAction = ['CREATE', 'INCLUSÃO'].includes(action)
      if (actionFilter === 'UPDATE') matchesAction = ['UPDATE', 'EDIÇÃO'].includes(action)
      if (actionFilter === 'DELETE')
        matchesAction = ['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(action)

      return matchesSearch && matchesAction
    })
  }, [logs, searchTerm, actionFilter])

  const stats = useMemo(() => {
    const total = filteredLogs.length
    const creates = filteredLogs.filter((l) =>
      ['CREATE', 'INCLUSÃO'].includes(l.action.toUpperCase()),
    ).length
    const updates = filteredLogs.filter((l) =>
      ['UPDATE', 'EDIÇÃO'].includes(l.action.toUpperCase()),
    ).length
    const deletes = filteredLogs.filter((l) =>
      ['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(l.action.toUpperCase()),
    ).length
    return { total, creates, updates, deletes }
  }, [filteredLogs])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Hub de Auditoria{' '}
            <Badge variant="secondary" className="ml-2 text-xs">
              Beta
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Central unificada para monitoramento e rastreabilidade de todas as entidades do sistema.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Select value={activeEntity} onValueChange={setActiveEntity}>
            <SelectTrigger className="w-full bg-background h-10 rounded-[24px]">
              <SelectValue placeholder="Selecione o módulo" />
            </SelectTrigger>
            <SelectContent className="rounded-[24px]">
              {ENTITIES.map((ent) => (
                <SelectItem key={ent.value} value={ent.value}>
                  {ent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card rounded-[24px] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-[24px] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Inclusões
            </CardTitle>
            <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.creates}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20 rounded-[24px] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Edições
            </CardTitle>
            <Edit3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.updates}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5 border-rose-500/20 rounded-[24px] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">
              Exclusões
            </CardTitle>
            <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.deletes}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[24px] shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Registros de Auditoria</CardTitle>
              <CardDescription>
                Histórico detalhado das ações realizadas no módulo selecionado.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário, IP ou ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-background rounded-full h-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px] bg-background rounded-full h-9">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL">Todas as Ações</SelectItem>
                  <SelectItem value="CREATE">Criações</SelectItem>
                  <SelectItem value="UPDATE">Edições</SelectItem>
                  <SelectItem value="DELETE">Exclusões</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || actionFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm('')
                    setActionFilter('ALL')
                  }}
                  title="Limpar filtros"
                  className="rounded-full h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhum registro encontrado para este filtro ou módulo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] pl-6">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right pr-6">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell className="font-medium text-muted-foreground whitespace-nowrap pl-6">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border border-primary/20">
                            {(log.performed_by_name || 'S')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">
                            {log.performed_by_name || 'Sistema'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {log.audit_details && log.audit_details.length > 0 ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] rounded-[24px]">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Alteração</DialogTitle>
                                <DialogDescription>
                                  Campos modificados nesta ação de {log.action.toLowerCase()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                {log.audit_details.map((detail: any) => (
                                  <div
                                    key={detail.id}
                                    className="border p-4 rounded-2xl bg-muted/30 space-y-3"
                                  >
                                    <div className="flex items-center gap-2 border-b pb-2">
                                      <Badge
                                        variant="outline"
                                        className="font-mono text-xs bg-background"
                                      >
                                        {detail.field_name}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1 flex items-center gap-1">
                                          <Trash2 className="w-3 h-3" /> Valor Anterior
                                        </span>
                                        <span className="text-rose-700 dark:text-rose-300 break-words line-through opacity-80">
                                          {detail.old_value || '-'}
                                        </span>
                                      </div>
                                      <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1">
                                          <PlusCircle className="w-3 h-3" /> Novo Valor
                                        </span>
                                        <span className="text-emerald-700 dark:text-emerald-300 break-words">
                                          {detail.new_value || '-'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-xs italic opacity-0 group-hover:opacity-100 transition-opacity">
                            Sem detalhes salvos
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
