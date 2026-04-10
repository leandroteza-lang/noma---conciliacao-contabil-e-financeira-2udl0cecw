import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronRight, Search, Filter, ShieldAlert, History } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

function ExpandableRow({ log, userName }: { log: any; userName: string }) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const toggleExpand = async () => {
    if (!expanded && details.length === 0) {
      setLoadingDetails(true)
      const { data } = await supabase.from('audit_details').select('*').eq('audit_log_id', log.id)
      setDetails(data || [])
      setLoadingDetails(false)
    }
    setExpanded(!expanded)
  }

  const getActionBadge = (action: string) => {
    const act = action?.toUpperCase() || ''
    if (act.includes('DELETE') || act.includes('EXCLUSÃO') || act.includes('REMOVE')) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 shadow-none"
        >
          EXCLUSÃO
        </Badge>
      )
    }
    if (
      act.includes('CREATE') ||
      act.includes('INSERT') ||
      act.includes('CRIAÇÃO') ||
      act.includes('ADD')
    ) {
      return (
        <Badge
          variant="default"
          className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none"
        >
          CRIAÇÃO
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 shadow-none"
      >
        ATUALIZAÇÃO
      </Badge>
    )
  }

  const formatEntity = (entity: string) => {
    const map: Record<string, string> = {
      usuario: 'Usuário',
      empresa: 'Empresa',
      departamento: 'Departamento',
      conta_contabil: 'Conta Contábil',
      centro_custo: 'Centro de Custo',
      conta_bancaria: 'Conta Bancária',
      mapeamento: 'Mapeamento',
    }
    return map[entity?.toLowerCase()] || entity
  }

  return (
    <>
      <TableRow
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors group',
          expanded && 'bg-muted/30',
        )}
        onClick={toggleExpand}
      >
        <TableCell className="w-12">
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 group-hover:bg-muted/80">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium whitespace-nowrap text-sm">
          {log.created_at
            ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
            : '-'}
        </TableCell>
        <TableCell>{getActionBadge(log.action)}</TableCell>
        <TableCell className="capitalize font-medium text-muted-foreground text-sm">
          {formatEntity(log.entity_type)}
        </TableCell>
        <TableCell className="max-w-[200px] truncate text-sm" title={log.entity_id}>
          {log.entity_id}
        </TableCell>
        <TableCell className="text-sm">{userName}</TableCell>
        <TableCell className="text-muted-foreground text-sm">{log.ip_address || '-'}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/5 hover:bg-muted/5">
          <TableCell colSpan={7} className="p-0 border-b-0">
            <div className="px-14 py-4 border-b border-border/50 animate-fade-in-down">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Alterações Detectadas</h4>
              </div>
              {loadingDetails ? (
                <div className="space-y-2 w-full max-w-2xl">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-3/4 rounded-md" />
                </div>
              ) : details.length > 0 ? (
                <div className="rounded-md border border-border bg-background shadow-sm overflow-hidden w-full max-w-4xl">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-1/3 font-semibold text-xs uppercase tracking-wider">
                          Campo Alterado
                        </TableHead>
                        <TableHead className="w-1/3 font-semibold text-xs uppercase tracking-wider">
                          Valor Anterior
                        </TableHead>
                        <TableHead className="w-1/3 font-semibold text-xs uppercase tracking-wider">
                          Novo Valor
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail) => (
                        <TableRow key={detail.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground text-sm">
                            {detail.field_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {detail.old_value !== null &&
                            detail.old_value !== undefined &&
                            detail.old_value !== '' ? (
                              <span className="line-through decoration-destructive/40">
                                {detail.old_value}
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground/50 text-xs uppercase tracking-wider">
                                Vazio
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                            {detail.new_value !== null &&
                            detail.new_value !== undefined &&
                            detail.new_value !== '' ? (
                              detail.new_value
                            ) : (
                              <span className="italic text-muted-foreground/50 text-xs uppercase tracking-wider font-normal">
                                Vazio
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 rounded-md border border-dashed w-full max-w-4xl">
                  <p className="text-sm text-muted-foreground">
                    Nenhum detalhe de alteração registrado para esta ação.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Pode ter sido uma ação sem mudanças diretas de campos mapeados.
                  </p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function CentralAuditoria() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchUsersMap()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [entityFilter])

  const fetchUsersMap = async () => {
    const { data } = await supabase.from('cadastro_usuarios').select('user_id, name, email')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((u) => {
        if (u.user_id) {
          map[u.user_id] = u.name || u.email || 'Usuário Desconhecido'
        }
      })
      setUsersMap(map)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (entityFilter !== 'todos') {
      query = query.eq('entity_type', entityFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error(error)
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  const filteredLogs = logs.filter((log) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    const userName = log.performed_by ? usersMap[log.performed_by] || '' : 'sistema'

    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in mx-auto w-full max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Auditoria</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe e rastreie todas as ações, modificações e exclusões no sistema de forma
          unificada.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Registros de Auditoria</CardTitle>
              <CardDescription>
                Visualize as últimas atividades registradas no sistema.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar registros..."
                  className="pl-8 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Entidades</SelectItem>
                  <SelectItem value="usuario">Usuários</SelectItem>
                  <SelectItem value="empresa">Empresas</SelectItem>
                  <SelectItem value="departamento">Departamentos</SelectItem>
                  <SelectItem value="conta_contabil">Plano de Contas</SelectItem>
                  <SelectItem value="centro_custo">Centros de Custo</SelectItem>
                  <SelectItem value="conta_bancaria">Contas Bancárias</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchLogs}
                title="Atualizar dados"
                disabled={loading}
              >
                <History className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold">Data / Hora</TableHead>
                  <TableHead className="font-semibold">Ação</TableHead>
                  <TableHead className="font-semibold">Entidade</TableHead>
                  <TableHead className="font-semibold">ID do Registro</TableHead>
                  <TableHead className="font-semibold">Responsável</TableHead>
                  <TableHead className="font-semibold">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <ExpandableRow
                      key={log.id}
                      log={log}
                      userName={
                        log.performed_by ? usersMap[log.performed_by] || 'Carregando...' : 'Sistema'
                      }
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-50" />
                        <p>Nenhum registro de auditoria encontrado.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
