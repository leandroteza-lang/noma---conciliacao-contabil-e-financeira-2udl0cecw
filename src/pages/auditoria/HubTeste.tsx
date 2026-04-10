import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  CalendarIcon,
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
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-full px-3 py-1 font-bold text-[10px] tracking-wider border-none">
        INCLUSÃO
      </Badge>
    )
  if (['UPDATE', 'EDIÇÃO'].includes(normalized))
    return (
      <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-3 py-1 font-bold text-[10px] tracking-wider border-none">
        EDIÇÃO
      </Badge>
    )
  if (['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(normalized))
    return (
      <Badge className="bg-destructive text-white hover:bg-destructive/90 rounded-full px-3 py-1 font-bold text-[10px] tracking-wider border-none">
        EXCLUSÃO
      </Badge>
    )
  return (
    <Badge
      variant="outline"
      className="rounded-full px-3 py-1 font-bold text-[10px] tracking-wider"
    >
      {action}
    </Badge>
  )
}

const getAffectedRecord = (log: any) => {
  const details = log.audit_details || []
  let name = ''
  let sub = ''

  if (log.entity_type === 'usuario') {
    const n = details.find((d: any) => d.field_name === 'name' || d.field_name === 'nome')
    const e = details.find((d: any) => d.field_name === 'email')
    name = n?.new_value || n?.old_value || log.entity_id
    sub = e?.new_value || e?.old_value || ''
  } else if (log.entity_type === 'chart_of_accounts') {
    const n = details.find((d: any) => d.field_name === 'account_name' || d.field_name === 'nome')
    const c = details.find((d: any) => d.field_name === 'account_code' || d.field_name === 'codigo')
    name = n?.new_value || n?.old_value || log.entity_id
    sub = c?.new_value || c?.old_value || ''
  } else if (log.entity_type === 'departments') {
    const n = details.find((d: any) => d.field_name === 'name')
    const c = details.find((d: any) => d.field_name === 'code')
    name = n?.new_value || n?.old_value || log.entity_id
    sub = c?.new_value || c?.old_value || ''
  } else {
    const n = details.find((d: any) =>
      ['name', 'nome', 'description', 'account_name'].includes(d.field_name),
    )
    const c = details.find((d: any) =>
      ['code', 'email', 'cnpj', 'cpf', 'account_code'].includes(d.field_name),
    )
    name = n?.new_value || n?.old_value || log.entity_id
    sub = c?.new_value || c?.old_value || ''
  }

  return { name, sub }
}

export default function HubTeste() {
  const [activeEntity, setActiveEntity] = useState('usuario')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionFilter, setActionFilter] = useState<string>('ALL')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, audit_details (*)')
        .eq('entity_type', activeEntity)
        .order('created_at', { ascending: false })
        .limit(100)

      if (actionFilter !== 'ALL') {
        if (actionFilter === 'CREATE') query = query.in('action', ['CREATE', 'INCLUSÃO'])
        if (actionFilter === 'UPDATE') query = query.in('action', ['UPDATE', 'EDIÇÃO'])
        if (actionFilter === 'DELETE')
          query = query.in('action', ['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'])
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      const userIds = [...new Set(data?.map((l) => l.performed_by).filter(Boolean))]
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('cadastro_usuarios')
          .select('user_id, name, email')
          .in('user_id', userIds)

        const userMap = new Map(users?.map((u) => [u.user_id, u]))
        data?.forEach((l) => {
          const u = userMap.get(l.performed_by)
          l.performed_by_name = u?.name || 'Sistema'
          l.performed_by_email = u?.email || l.performed_by
        })
      }
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [activeEntity])

  const handleSearch = () => {
    fetchLogs()
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hub de Teste - Auditoria</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão centralizada e detalhada de alterações no sistema.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filtros de Auditoria</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-48">
            <Select value={activeEntity} onValueChange={setActiveEntity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                {ENTITIES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas as Ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Ações</SelectItem>
                <SelectItem value="CREATE">Inclusão</SelectItem>
                <SelectItem value="UPDATE">Edição</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal px-3',
                    !startDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : <span>dd/mm/aaaa</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full md:w-40">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal px-3',
                    !endDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : <span>dd/mm/aaaa</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full md:w-auto flex gap-2 flex-1 md:flex-none">
            <Button
              onClick={handleSearch}
              className="bg-destructive hover:bg-destructive/90 text-white w-full md:w-32"
            >
              <Search className="w-4 h-4 mr-2" /> Buscar
            </Button>
            <Button variant="outline" size="icon" className="px-3">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4">
                  <Checkbox />
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground py-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                    Ação <ChevronUp className="w-3 h-3 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                    Registro Afetado <ChevronUp className="w-3 h-3 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                    Responsável <ChevronUp className="w-3 h-3 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                    Data/Hora <ChevronUp className="w-3 h-3 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                    IP Origem <ChevronUp className="w-3 h-3 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right pr-6">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedRows.includes(log.id)
                  const affected = getAffectedRecord(log)
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow
                        className={cn(
                          'group transition-colors',
                          isExpanded ? 'bg-muted/10 border-b-0' : 'hover:bg-muted/5',
                        )}
                      >
                        <TableCell className="text-center pl-4 py-4">
                          <Checkbox />
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase">{affected.name}</span>
                            {affected.sub && (
                              <span className="text-xs text-muted-foreground">{affected.sub}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {log.performed_by_email || log.performed_by_name || 'Sistema'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(log.created_at), 'dd/MM/yyyy, HH:mm:ss', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm uppercase">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <button
                            onClick={() => toggleRow(log.id)}
                            className="text-destructive hover:text-destructive/80 font-semibold text-sm flex items-center gap-1 justify-end w-full transition-colors"
                          >
                            {isExpanded ? 'Ocultar' : 'Detalhes'}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/5 border-t-0">
                          <TableCell colSpan={7} className="p-0 border-b">
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-4 text-sm font-bold">
                                <FileText className="w-4 h-4 text-destructive" />
                                Alterações Detectadas
                              </div>
                              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent">
                                      <TableHead className="font-semibold">
                                        <div className="flex items-center gap-1">
                                          Campo <ChevronUp className="w-3 h-3 opacity-50" />
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-semibold">
                                        <div className="flex items-center gap-1">
                                          Antes <ChevronUp className="w-3 h-3 opacity-50" />
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-semibold">
                                        <div className="flex items-center gap-1">
                                          Depois <ChevronUp className="w-3 h-3 opacity-50" />
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-semibold w-32">Mudança</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {!log.audit_details || log.audit_details.length === 0 ? (
                                      <TableRow>
                                        <TableCell
                                          colSpan={4}
                                          className="text-center text-muted-foreground py-6"
                                        >
                                          Nenhum detalhe de alteração salvo.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      log.audit_details.map((detail: any) => (
                                        <TableRow key={detail.id} className="hover:bg-transparent">
                                          <TableCell className="font-bold text-sm">
                                            {detail.field_name}
                                          </TableCell>
                                          <TableCell className="text-muted-foreground text-sm break-all max-w-[200px]">
                                            {detail.old_value || 'null'}
                                          </TableCell>
                                          <TableCell className="font-bold text-sm break-all max-w-[200px]">
                                            {detail.new_value || 'null'}
                                          </TableCell>
                                          <TableCell>
                                            <Badge className="bg-blue-600/10 text-blue-700 dark:text-blue-400 hover:bg-blue-600/20 border-none rounded-full font-bold px-3">
                                              Alterado
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
