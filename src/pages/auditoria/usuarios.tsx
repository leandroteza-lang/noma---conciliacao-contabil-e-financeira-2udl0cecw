import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AuditFilter, FilterState } from '@/components/AuditLog/AuditFilter'
import { AuditMetadata } from '@/components/AuditLog/AuditMetadata'
import { AuditExport } from '@/components/AuditLog/AuditExport'
import { AuditDashboard } from '@/components/AuditLog/AuditDashboard'
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
  ArrowUpDown,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

const AuditDetailsTable = ({ details }: { details: any[] }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const getChangeType = (oldVal: string | null | undefined, newVal: string | null | undefined) => {
    if (!oldVal && newVal)
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 font-bold">
          Adicionado
        </Badge>
      )
    if (oldVal && !newVal)
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 font-bold">
          Removido
        </Badge>
      )
    if (oldVal !== newVal)
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
          Alterado
        </Badge>
      )
    return (
      <Badge variant="outline" className="font-bold">
        Sem Mudança
      </Badge>
    )
  }

  const sorted = useMemo(() => {
    let sortable = [...details]
    if (sortConfig) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] || ''
        let bVal = b[sortConfig.key] || ''
        if (sortConfig.key === 'field') {
          aVal = a.display_name || a.field_name || ''
          bVal = b.display_name || b.field_name || ''
        }
        if (sortConfig.key === 'old') {
          aVal = a.display_old !== undefined ? a.display_old : a.old_value || ''
          bVal = b.display_old !== undefined ? b.display_old : b.old_value || ''
        }
        if (sortConfig.key === 'new') {
          aVal = a.display_new !== undefined ? a.display_new : a.new_value || ''
          bVal = b.display_new !== undefined ? b.display_new : b.new_value || ''
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [details, sortConfig])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead
              className="cursor-pointer font-semibold"
              onClick={() => requestSort('field')}
            >
              <div className="flex items-center gap-2">
                Campo <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer font-semibold" onClick={() => requestSort('old')}>
              <div className="flex items-center gap-2">
                Antes <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer font-semibold" onClick={() => requestSort('new')}>
              <div className="flex items-center gap-2">
                Depois <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="font-semibold w-[140px]">Mudança</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length > 0 ? (
            sorted.map((detail, idx) => {
              const oldVal =
                detail.display_old !== undefined ? detail.display_old : detail.old_value
              const newVal =
                detail.display_new !== undefined ? detail.display_new : detail.new_value
              return (
                <TableRow key={idx} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {detail.display_name || detail.field_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-pre-wrap break-words max-w-[250px]">
                    {oldVal || '-'}
                  </TableCell>
                  <TableCell className="text-foreground font-medium whitespace-pre-wrap break-words max-w-[250px]">
                    {newVal || '-'}
                  </TableCell>
                  <TableCell>{getChangeType(oldVal, newVal)}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum detalhe de alteração registrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function AuditoriaUsuarios() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<FilterState>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [activeDashboardFilter, setActiveDashboardFilter] = useState<string | null>(null)
  const { toast } = useToast()

  const entityType = 'usuario'

  const fetchLogs = useCallback(
    async (filters: FilterState) => {
      setLoading(true)

      let query = supabase
        .from('audit_logs')
        .select(`*, audit_details(*)`)
        .eq('entity_type', entityType)
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

        const entityIds = [...new Set(filteredData.map((log) => log.entity_id).filter(Boolean))]
        let entityMap: Record<string, { name: string; email: string }> = {}
        if (entityIds.length > 0) {
          const { data: entityData } = await supabase
            .from('cadastro_usuarios')
            .select('id, name, email')
            .in('id', entityIds)

          if (entityData) {
            entityMap = entityData.reduce((acc: any, curr) => {
              acc[curr.id] = { name: curr.name, email: curr.email }
              return acc
            }, {})
          }
        }

        const deptIds = new Set<string>()
        filteredData.forEach((log) => {
          log.audit_details?.forEach((detail: any) => {
            if (detail.field_name === 'department_id') {
              if (detail.old_value && detail.old_value !== 'null') deptIds.add(detail.old_value)
              if (detail.new_value && detail.new_value !== 'null') deptIds.add(detail.new_value)
            }
          })
        })

        let deptMap: Record<string, string> = {}
        if (deptIds.size > 0) {
          const { data: deptData } = await supabase
            .from('departments')
            .select('id, name')
            .in('id', Array.from(deptIds))

          if (deptData) {
            deptMap = deptData.reduce((acc: any, curr) => {
              acc[curr.id] = curr.name
              return acc
            }, {})
          }
        }

        const fieldNameMap: Record<string, string> = {
          name: 'Nome',
          email: 'E-mail',
          role: 'Perfil',
          status: 'Status',
          phone: 'Telefone',
          cpf: 'CPF',
          department_id: 'Departamento',
          address: 'Endereço',
          observations: 'Observações',
          approval_status: 'Status de Aprovação',
          pending_deletion: 'Exclusão Pendente',
          avatar_url: 'URL do Avatar',
        }

        filteredData = filteredData.map((log) => {
          const translatedDetails = log.audit_details?.map((detail: any) => {
            let oldVal = detail.old_value
            let newVal = detail.new_value

            if (detail.field_name === 'department_id') {
              if (oldVal && deptMap[oldVal]) oldVal = deptMap[oldVal]
              if (newVal && deptMap[newVal]) newVal = deptMap[newVal]
            }

            if (detail.field_name === 'status' || detail.field_name === 'pending_deletion') {
              oldVal = oldVal === 'true' ? 'Sim' : oldVal === 'false' ? 'Não' : oldVal
              newVal = newVal === 'true' ? 'Sim' : newVal === 'false' ? 'Não' : newVal
            }

            if (detail.field_name === 'role') {
              const roleMap: any = {
                admin: 'Administrador',
                supervisor: 'Supervisor',
                collaborator: 'Colaborador',
                client_user: 'Usuário Cliente',
              }
              if (oldVal && roleMap[oldVal]) oldVal = roleMap[oldVal]
              if (newVal && roleMap[newVal]) newVal = roleMap[newVal]
            }

            if (detail.field_name === 'approval_status') {
              const appMap: any = { approved: 'Aprovado', pending: 'Pendente' }
              if (oldVal && appMap[oldVal]) oldVal = appMap[oldVal]
              if (newVal && appMap[newVal]) newVal = appMap[newVal]
            }

            return {
              ...detail,
              display_name: fieldNameMap[detail.field_name] || detail.field_name,
              display_old: oldVal,
              display_new: newVal,
            }
          })

          return {
            ...log,
            performed_by_user: { email: userMap[log.performed_by] || 'Sistema' },
            affected_record:
              entityMap[log.entity_id] ||
              (log.changes?._snapshot
                ? { name: log.changes._snapshot.name, email: log.changes._snapshot.email }
                : { name: 'Desconhecido', email: 'N/A' }),
            audit_details: translatedDetails,
          }
        })

        if (filters.fieldName) {
          filteredData = filteredData.filter((log) =>
            log.audit_details?.some(
              (detail: any) =>
                detail.field_name.toLowerCase().includes(filters.fieldName!.toLowerCase()) ||
                (detail.display_name &&
                  detail.display_name.toLowerCase().includes(filters.fieldName!.toLowerCase())),
            ),
          )
        }

        filteredData.sort(
          (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime(),
        )
        setLogs(filteredData)
      }
      setLoading(false)
    },
    [entityType],
  )

  useEffect(() => {
    fetchLogs(currentFilters)
  }, [fetchLogs, currentFilters])

  const sortedLogs = useMemo(() => {
    let filtered = logs
    if (activeDashboardFilter) {
      filtered = logs.filter((log) => {
        if (activeDashboardFilter === 'CREATE') return ['CREATE', 'INCLUSÃO'].includes(log.action)
        if (activeDashboardFilter === 'UPDATE') return ['UPDATE', 'EDIÇÃO'].includes(log.action)
        if (activeDashboardFilter === 'DELETE')
          return ['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(log.action)
        return true
      })
    }

    let sortable = [...filtered]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'performed_by_user') {
          aVal = a.performed_by_user?.email || ''
          bVal = b.performed_by_user?.email || ''
        }

        if (sortConfig.key === 'affected_record') {
          aVal = a.affected_record?.name || ''
          bVal = b.affected_record?.name || ''
        }

        if (aVal === null || aVal === undefined) aVal = ''
        if (bVal === null || bVal === undefined) bVal = ''

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [logs, sortConfig])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) return
    if (!confirm(`Deseja excluir permanentemente ${selectedLogs.length} log(s) de auditoria?`))
      return

    const { error } = await supabase.from('audit_logs').delete().in('id', selectedLogs)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir logs de auditoria.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sucesso', description: 'Logs de auditoria excluídos com sucesso.' })
      setLogs(logs.filter((log) => !selectedLogs.includes(log.id)))
      setSelectedLogs([])
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'INCLUSÃO':
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider">
            INCLUSÃO
          </Badge>
        )
      case 'UPDATE':
      case 'EDIÇÃO':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider">
            EDIÇÃO
          </Badge>
        )
      case 'DELETE':
      case 'EXCLUSÃO':
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
            EXCLUSÃO
          </Badge>
        )
      case 'IMPORT':
      case 'IMPORTAÇÃO':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider">
            IMPORTAÇÃO
          </Badge>
        )
      case 'APPROVE':
        return (
          <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-wider">
            APROVAÇÃO
          </Badge>
        )
      case 'SOFT_DELETE':
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-wider">
            LIXEIRA
          </Badge>
        )
      case 'RESTORE':
        return (
          <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider">
            RESTAURAÇÃO
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="font-bold uppercase tracking-wider">
            {action}
          </Badge>
        )
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

      <AuditDashboard
        logs={logs}
        entityType={entityType}
        activeFilter={activeDashboardFilter}
        onFilterChange={setActiveDashboardFilter}
      />
      <AuditFilter onFilter={setCurrentFilters} />

      <Card className="overflow-hidden border shadow-sm">
        {selectedLogs.length > 0 && (
          <div className="bg-muted/40 border-b p-3 flex items-center justify-between px-6">
            <span className="text-sm font-medium text-foreground">
              {selectedLogs.length} log(s) selecionado(s)
            </span>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="w-4 h-4" /> Excluir Selecionados
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={sortedLogs.length > 0 && selectedLogs.length === sortedLogs.length}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedLogs(sortedLogs.map((l) => l.id))
                      else setSelectedLogs([])
                    }}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('action')}>
                  <div className="flex items-center gap-2">
                    Ação <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('affected_record')}
                >
                  <div className="flex items-center gap-2">
                    Registro Afetado <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort('performed_by_user')}
                >
                  <div className="flex items-center gap-2">
                    Responsável <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('performed_at')}>
                  <div className="flex items-center gap-2">
                    Data/Hora <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('ip_address')}>
                  <div className="flex items-center gap-2">
                    IP Origem <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    Buscando registros de auditoria...
                  </TableCell>
                </TableRow>
              ) : sortedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-base font-medium text-foreground">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm mt-1">Tente ajustar os filtros de busca acima.</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className={cn(
                        'hover:bg-muted/30 transition-colors cursor-pointer group',
                        expandedLog === log.id && 'bg-muted/50',
                      )}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLogs.includes(log.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedLogs((prev) => [...prev, log.id])
                            else setSelectedLogs((prev) => prev.filter((id) => id !== log.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {log.affected_record?.name || 'Desconhecido'}
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {log.affected_record?.email !== 'N/A'
                              ? log.affected_record?.email
                              : log.entity_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.performed_by_user?.email}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(log.performed_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end text-primary font-medium text-xs gap-1 group-hover:underline">
                          {expandedLog === log.id ? 'Ocultar' : 'Detalhes'}
                          {expandedLog === log.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedLog === log.id && (
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={7} className="p-0 border-b-0">
                          <div className="p-6 border-b shadow-inner animate-fade-in-down">
                            <div className="max-w-6xl mx-auto space-y-6">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                  <FileText className="w-4 h-4 text-primary" />
                                  Alterações Detectadas
                                </h4>
                                {log.audit_details && log.audit_details.length > 0 ? (
                                  <AuditDetailsTable details={log.audit_details} />
                                ) : (
                                  <div className="bg-background border rounded-lg p-5 text-muted-foreground text-sm flex items-center gap-3">
                                    <Shield className="w-5 h-5 opacity-50" />
                                    Não há detalhamento de campos alterados registrados neste log.
                                  </div>
                                )}
                              </div>

                              <AuditMetadata log={log} />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
