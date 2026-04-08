import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AuditDashboard } from '@/components/AuditLog/AuditDashboard'
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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, Loader2, ShieldCheck } from 'lucide-react'

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
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">Criação</Badge>
  if (['UPDATE', 'EDIÇÃO'].includes(normalized))
    return <Badge className="bg-amber-500 hover:bg-amber-600">Edição</Badge>
  if (['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(normalized))
    return <Badge className="bg-rose-500 hover:bg-rose-600">Exclusão</Badge>
  return <Badge variant="outline">{action}</Badge>
}

export default function HubTeste() {
  const [activeEntity, setActiveEntity] = useState('usuario')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, audit_details (*)')
          .eq('entity_type', activeEntity)
          .order('created_at', { ascending: false })
          .limit(100)

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
        setActiveFilter(null)
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [activeEntity])

  const filteredLogs = activeFilter
    ? logs.filter((log) => {
        const action = log.action.toUpperCase()
        if (activeFilter === 'CREATE') return ['CREATE', 'INCLUSÃO'].includes(action)
        if (activeFilter === 'UPDATE') return ['UPDATE', 'EDIÇÃO'].includes(action)
        if (activeFilter === 'DELETE') return ['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(action)
        return true
      })
    : logs

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Hub de Auditoria (Beta)
          </h1>
          <p className="text-muted-foreground mt-1">
            Central unificada para monitoramento e rastreabilidade de todas as entidades do sistema.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Select value={activeEntity} onValueChange={setActiveEntity}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Selecione o módulo" />
            </SelectTrigger>
            <SelectContent>
              {ENTITIES.map((ent) => (
                <SelectItem key={ent.value} value={ent.value}>
                  {ent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AuditDashboard
        logs={logs}
        entityType={activeEntity}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
          <CardDescription>
            Exibindo os últimos 100 registros do módulo selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum registro encontrado para este filtro ou módulo.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{log.performed_by_name || 'Sistema'}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                      <TableCell className="text-right">
                        {log.audit_details && log.audit_details.length > 0 ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalhes da Alteração</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                {log.audit_details.map((detail: any) => (
                                  <div
                                    key={detail.id}
                                    className="border p-3 rounded-lg bg-muted/30"
                                  >
                                    <p className="font-semibold text-sm border-b pb-2 mb-2">
                                      {detail.field_name}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div className="bg-rose-500/10 p-2 rounded">
                                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                                          Anterior:
                                        </span>
                                        <span className="text-rose-700 dark:text-rose-300 break-words line-through opacity-80">
                                          {detail.old_value || '-'}
                                        </span>
                                      </div>
                                      <div className="bg-emerald-500/10 p-2 rounded">
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                                          Novo:
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
                          <span className="text-muted-foreground text-sm italic mr-4">
                            Sem detalhes
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
