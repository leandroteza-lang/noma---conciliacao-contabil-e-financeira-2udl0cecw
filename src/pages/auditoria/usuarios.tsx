import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AuditFilter, FilterState } from '@/components/AuditLog/AuditFilter'
import { AuditDiff } from '@/components/AuditLog/AuditDiff'
import { AuditMetadata } from '@/components/AuditLog/AuditMetadata'
import { AuditExport } from '@/components/AuditLog/AuditExport'
import { AuditDashboard } from '@/components/AuditLog/AuditDashboard'
import { Shield, ChevronDown, ChevronRight, Loader2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export default function AuditoriaUsuarios() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<FilterState>({})

  const entityType = 'usuario'

  const fetchLogs = useCallback(
    async (filters: FilterState) => {
      setLoading(true)

      let query = supabase
        .from('audit_logs')
        .select(`
        *,
        audit_details(*)
      `)
        .eq('entity_type', entityType)
        .order('performed_at', { ascending: false })
        .limit(1000)

      if (filters.action) query = query.eq('action', filters.action)
      if (filters.dateFrom) query = query.gte('performed_at', filters.dateFrom)
      if (filters.dateTo) query = query.lte('performed_at', filters.dateTo + 'T23:59:59')
      if (filters.ipAddress) query = query.ilike('ip_address', `%${filters.ipAddress}%`)
      if (filters.deviceType) query = query.eq('device_type', filters.deviceType)
      if (filters.entityId) query = query.eq('entity_id', filters.entityId)

      if (filters.performedByEmail) {
        const { data: users } = await supabase
          .from('cadastro_usuarios')
          .select('user_id')
          .ilike('email', `%${filters.performedByEmail}%`)

        if (users && users.length > 0) {
          const userIds = users.map((u) => u.user_id)
          query = query.in('performed_by', userIds)
        } else {
          setLogs([])
          setLoading(false)
          return
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs:', error)
      } else {
        let filteredData = data || []

        const userIds = [...new Set(filteredData.map((log) => log.performed_by).filter(Boolean))]

        let userMap: Record<string, string> = {}
        if (userIds.length > 0) {
          const { data: userData } = await supabase
            .from('cadastro_usuarios')
            .select('user_id, email')
            .in('user_id', userIds)

          if (userData) {
            userMap = userData.reduce((acc: any, curr) => {
              acc[curr.user_id] = curr.email
              return acc
            }, {})
          }
        }

        filteredData = filteredData.map((log) => ({
          ...log,
          performed_by_user: { email: userMap[log.performed_by] || 'Sistema' },
        }))

        if (filters.fieldName) {
          filteredData = filteredData.filter((log) =>
            log.audit_details?.some((detail: any) =>
              detail.field_name.toLowerCase().includes(filters.fieldName!.toLowerCase()),
            ),
          )
        }
        setLogs(filteredData)
      }
      setLoading(false)
    },
    [entityType],
  )

  useEffect(() => {
    fetchLogs(currentFilters)
  }, [fetchLogs, currentFilters])

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            CREATE
          </Badge>
        )
      case 'UPDATE':
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
            UPDATE
          </Badge>
        )
      case 'DELETE':
        return <Badge variant="destructive">DELETE</Badge>
      default:
        return <Badge variant="secondary">{action}</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2.5 rounded-lg text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Central de Auditoria
            </h1>
            <p className="text-muted-foreground text-sm">
              Visualização de logs para:{' '}
              <span className="font-semibold capitalize text-foreground">{entityType}</span>
            </p>
          </div>
        </div>

        <AuditExport logs={logs} entityType={entityType} />
      </div>

      <AuditDashboard logs={logs} entityType={entityType} />
      <AuditFilter onFilter={setCurrentFilters} />

      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Ação</th>
                <th className="px-6 py-4 font-medium">Responsável</th>
                <th className="px-6 py-4 font-medium">Data/Hora</th>
                <th className="px-6 py-4 font-medium">IP Origem</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    Buscando registros de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-base font-medium text-foreground">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm mt-1">Tente ajustar os filtros de busca acima.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className={cn(
                        'hover:bg-muted/30 transition-colors cursor-pointer group',
                        expandedLog === log.id && 'bg-muted/50',
                      )}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="px-6 py-4 font-medium">{log.performed_by_user?.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(log.performed_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end text-primary font-medium text-xs gap-1 group-hover:underline">
                          {expandedLog === log.id ? 'Ocultar' : 'Detalhes'}
                          {expandedLog === log.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedLog === log.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={5} className="px-6 py-6 border-t-0 shadow-inner">
                          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-down">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                <FileText className="w-4 h-4 text-primary" />
                                Alterações Detectadas
                              </h4>
                              {log.audit_details && log.audit_details.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                                  {log.audit_details.map((detail: any, idx: number) => (
                                    <AuditDiff
                                      key={idx}
                                      fieldName={detail.field_name}
                                      oldValue={detail.old_value}
                                      newValue={detail.new_value}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-background border rounded-lg p-5 text-muted-foreground text-sm flex items-center gap-3">
                                  <Shield className="w-5 h-5 opacity-50" />
                                  Não há detalhamento de campos alterados registrados neste log.
                                </div>
                              )}
                            </div>

                            <AuditMetadata log={log} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
