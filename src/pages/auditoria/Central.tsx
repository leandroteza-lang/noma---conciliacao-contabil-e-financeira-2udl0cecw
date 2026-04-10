import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  ShieldAlert,
  History,
  ArrowUpDown,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileIcon,
} from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { AuditDashboard } from '@/components/AuditLog/AuditDashboard'

export const translateAction = (action: string) => {
  const act = action?.toUpperCase() || ''
  switch (act) {
    case 'CREATE':
    case 'INSERT':
      return 'INCLUSÃO'
    case 'UPDATE':
      return 'ALTERADO'
    case 'DELETE':
      return 'EXCLUSÃO'
    case 'SOFT_DELETE':
      return 'REMOÇÃO'
    case 'EXCLUSAO_EM_LOTE':
      return 'EXCLUSÃO EM LOTE'
    case 'EDICAO':
      return 'ALTERADO'
    case 'EDICAO_EM_LOTE':
      return 'ALTERADO EM LOTE'
    default:
      return act
  }
}

export const getAffectedRecordInfo = (log: any, dict: Record<string, any>) => {
  let primary = 'Desconhecido'
  let secondary = log.entity_id

  const entity = dict[log.entity_id]
  if (entity) {
    primary = entity.name || primary
    secondary = entity.sub || secondary
  } else if (log.changes) {
    const c = log.changes as Record<string, any>
    const getVal = (field: string) => c[field]?.new ?? c[field]?.old

    switch (log.entity_type?.toLowerCase()) {
      case 'usuario':
        primary = getVal('name') || getVal('email') || primary
        secondary = getVal('email') || getVal('cpf') || secondary
        break
      case 'empresa':
        primary = getVal('name') || primary
        secondary = getVal('cnpj') || getVal('email') || secondary
        break
      case 'departamento':
        primary = getVal('name') || primary
        secondary = getVal('code') || secondary
        break
      case 'conta_contabil':
        primary = getVal('account_name') || primary
        secondary = getVal('account_code') || secondary
        break
      case 'centro_custo':
        primary = getVal('description') || primary
        secondary = getVal('code') || secondary
        break
      case 'conta_bancaria':
        primary = getVal('description') || getVal('account_number') || primary
        secondary = getVal('bank_code') || getVal('agency') || secondary
        break
    }
  }
  return { primary, secondary }
}

const fieldTranslations: Record<string, string> = {
  department_id: 'Departamento',
  permissions: 'Permissões',
  companies: 'Empresas Vinculadas',
  name: 'Nome',
  email: 'E-mail',
  role: 'Perfil',
  cpf: 'CPF',
  phone: 'Telefone',
  address: 'Endereço',
  observations: 'Observações',
  status: 'Status',
  approval_status: 'Status de Aprovação',
  avatar_url: 'Foto de Perfil',
  theme_mode: 'Tema',
  color_theme: 'Cor do Tema',
  code: 'Código',
  description: 'Descrição',
  account_code: 'Código da Conta',
  account_name: 'Nome da Conta',
  account_type: 'Tipo de Conta',
  classification: 'Classificação',
  nature: 'Natureza',
  account_behavior: 'Comportamento',
  bank_code: 'Código do Banco',
  agency: 'Agência',
  account_number: 'Número da Conta',
  check_digit: 'Dígito',
  company_name: 'Empresa',
  deleted_at: 'Data de Exclusão',
  deleted_by: 'Excluído Por',
  pending_deletion: 'Exclusão Pendente',
  cnpj: 'CNPJ',
  fixed_variable: 'Fixo/Variável',
  operational: 'Operacional',
  tipo_tga_id: 'Tipo TGA',
  type_tga: 'Tipo TGA (Texto)',
  parent_id: 'Centro de Custo Pai',
  contabiliza: 'Contabiliza',
  tipo_lcto: 'Tipo Lançamento',
  amount: 'Valor',
  entry_date: 'Data do Lançamento',
  movement_date: 'Data da Movimentação',
  debit_account_id: 'Conta Débito',
  credit_account_id: 'Conta Crédito',
  cost_center_id: 'Centro de Custo',
  bank_account_id: 'Conta Bancária',
  chart_account_id: 'Conta Contábil',
  mapping_type: 'Tipo de Mapeamento',
  abreviacao: 'Abreviação',
  codigo: 'Código (TGA)',
}

const translateField = (field: string) => fieldTranslations[field] || field

const formatValue = (val: string | null, field: string, dict: any) => {
  if (val === null || val === undefined) return null

  if (val === 'true') {
    if (field === 'status') return 'Ativo'
    return 'Sim'
  }
  if (val === 'false') {
    if (field === 'status') return 'Inativo'
    return 'Não'
  }

  try {
    const parsed = JSON.parse(val)
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return 'Nenhum'
      const mapped = parsed.map((item) => {
        if (typeof item === 'string') {
          if (item === 'all') return 'Todas as Permissões'
          if (item === 'usuarios') return 'Usuários'
          if (item === 'empresas') return 'Empresas'
          if (item.length === 36 && item.includes('-') && dict[item]) {
            return dict[item].name
          }
        }
        return item
      })
      return mapped.join(', ')
    }
  } catch (e) {
    // not JSON
  }

  if (val === 'all') return 'Todas as Permissões'
  if (val === 'usuarios') return 'Usuários'
  if (val === 'empresas') return 'Empresas'

  if (typeof val === 'string') {
    const parts = val.split(',').map((p) => p.trim())
    let hasUuid = false
    const mapped = parts.map((p) => {
      if (p.length === 36 && p.split('-').length === 5) {
        hasUuid = true
        return dict[p]?.name || p
      }
      return p
    })
    if (hasUuid) {
      return mapped.join(', ')
    }
  }

  if (field === 'role') {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      collaborator: 'Colaborador',
      client_user: 'Usuário Cliente',
    }
    return roles[val] || val
  }

  return val
}

function ExpandableRow({ log, userName, isSelected, onToggleSelect, onDelete, dict }: any) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!expanded && details.length === 0) {
      setLoadingDetails(true)
      const { data } = await supabase.from('audit_details').select('*').eq('audit_log_id', log.id)
      setDetails(data || [])
      setLoadingDetails(false)
    }
    setExpanded(!expanded)
  }

  const getActionBadge = (action: string) => {
    const act = translateAction(action)
    const isDelete =
      act.includes('DELETE') ||
      act.includes('EXCLUSÃO') ||
      act.includes('EXCLUSAO') ||
      act.includes('REMOÇÃO') ||
      act.includes('REMOVE')
    const isCreate =
      act.includes('CREATE') ||
      act.includes('INSERT') ||
      act.includes('CRIAÇÃO') ||
      act.includes('CRIACAO') ||
      act.includes('INCLUSÃO') ||
      act.includes('ADD') ||
      act.includes('APROVAÇÃO')

    if (isDelete) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full tracking-wide whitespace-nowrap"
        >
          {act}
        </Badge>
      )
    }
    if (isCreate) {
      return (
        <Badge
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full tracking-wide whitespace-nowrap"
        >
          {act}
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/30 shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full tracking-wide whitespace-nowrap"
      >
        {act}
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

  const info = getAffectedRecordInfo(log, dict)

  return (
    <>
      <TableRow
        className={cn('hover:bg-muted/50 transition-colors group', expanded && 'bg-muted/30')}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(log.id)}
              aria-label="Selecionar linha"
            />
            <span className="whitespace-nowrap text-[13px] text-muted-foreground font-medium">
              {log.created_at
                ? format(new Date(log.created_at), 'dd/MM/yyyy, HH:mm:ss', { locale: ptBR })
                : '-'}
            </span>
          </div>
        </TableCell>
        <TableCell className="capitalize font-medium text-muted-foreground text-[13px]">
          {formatEntity(log.entity_type)}
        </TableCell>
        <TableCell>
          <div
            onClick={toggleExpand}
            className="cursor-pointer transition-opacity hover:opacity-80 inline-block"
            title="Clique para ver os detalhes"
          >
            {getActionBadge(log.action)}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col max-w-[280px]">
            <span className="font-bold text-[13px] text-foreground truncate" title={info.primary}>
              {info.primary}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span
            className="font-medium text-[13px] text-muted-foreground truncate max-w-[140px] inline-block"
            title={
              info.secondary !== log.entity_id ? info.secondary : 'Identificador não disponível'
            }
          >
            {info.secondary && info.secondary !== log.entity_id ? info.secondary : '-'}
          </span>
        </TableCell>
        <TableCell className="text-[13px] font-bold text-foreground">{userName}</TableCell>
        <TableCell className="text-muted-foreground text-[13px]">
          {log.ip_address || 'N/A'}
        </TableCell>
        <TableCell className="text-right pr-4">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={toggleExpand}
              className="text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 outline-none"
            >
              Detalhes{' '}
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(log.id)
              }}
              title="Excluir Registro"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/5 hover:bg-muted/5">
          <TableCell colSpan={8} className="p-0 border-b-0">
            <div className="px-14 py-4 border-b border-border/50 animate-fade-in-down">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Alterações Detectadas</h4>
              </div>
              {loadingDetails ? (
                <div className="space-y-2 w-full max-w-2xl">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ) : details.length > 0 ? (
                <div className="rounded-md border border-border bg-background shadow-sm overflow-hidden w-full max-w-4xl">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[30%] font-semibold text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Campo <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[30%] font-semibold text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Antes <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[30%] font-semibold text-xs uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Depois <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[10%] font-semibold text-xs uppercase tracking-wider text-center">
                          Mudança
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail) => (
                        <TableRow key={detail.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground text-sm">
                            {translateField(detail.field_name)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {detail.old_value ? (
                              <span className="line-through decoration-destructive/40">
                                {formatValue(detail.old_value, detail.field_name, dict)}
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground/50 text-xs uppercase tracking-wider">
                                Vazio
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                            {detail.new_value ? (
                              formatValue(detail.new_value, detail.field_name, dict)
                            ) : (
                              <span className="italic text-muted-foreground/50 text-xs uppercase tracking-wider font-normal">
                                Vazio
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-indigo-100 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-none px-3 py-0.5 text-[11px] font-bold rounded-full tracking-wide whitespace-nowrap">
                              Alterado
                            </Badge>
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
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

const SortableHead = ({ label, sortKey, currentSort, requestSort }: any) => {
  const isActive = currentSort?.key === sortKey
  return (
    <TableHead
      className="font-semibold cursor-pointer hover:bg-muted/50 transition-colors group select-none whitespace-nowrap"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
        {label}
        <ArrowUpDown
          className={cn(
            'h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity',
            isActive && 'opacity-100 text-foreground',
          )}
        />
      </div>
    </TableHead>
  )
}

export default function CentralAuditoria() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [entityFilter, setEntityFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [globalDict, setGlobalDict] = useState<Record<string, any>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'created_at',
    direction: 'desc',
  })
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchDictionaries()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [entityFilter])

  const fetchDictionaries = async () => {
    const dict: Record<string, { name: string; sub: string; type: string }> = {}

    const [
      { data: users },
      { data: orgs },
      { data: depts },
      { data: costs },
      { data: charts },
      { data: banks },
    ] = await Promise.all([
      supabase.from('cadastro_usuarios').select('id, user_id, name, email'),
      supabase.from('organizations').select('id, name, cnpj'),
      supabase.from('departments').select('id, name, code'),
      supabase.from('cost_centers').select('id, description, code'),
      supabase.from('chart_of_accounts').select('id, account_name, account_code'),
      supabase.from('bank_accounts').select('id, description, account_number'),
    ])

    users?.forEach((u) => {
      dict[u.id] = { name: u.name, sub: u.email || '', type: 'usuario' }
      if (u.user_id) dict[u.user_id] = { name: u.name, sub: u.email || '', type: 'usuario' }
    })
    orgs?.forEach((o) => {
      dict[o.id] = { name: o.name || '', sub: o.cnpj || '', type: 'empresa' }
    })
    depts?.forEach((d) => {
      dict[d.id] = { name: d.name, sub: d.code || '', type: 'departamento' }
    })
    costs?.forEach((c) => {
      dict[c.id] = { name: c.description || '', sub: c.code || '', type: 'centro_custo' }
    })
    charts?.forEach((c) => {
      dict[c.id] = { name: c.account_name || '', sub: c.account_code || '', type: 'conta_contabil' }
    })
    banks?.forEach((b) => {
      dict[b.id] = {
        name: b.description || '',
        sub: b.account_number || '',
        type: 'conta_bancaria',
      }
    })

    setGlobalDict(dict)
  }

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (entityFilter !== 'todos') query = query.eq('entity_type', entityFilter)
    const { data, error } = await query
    if (!error) setLogs(data || [])
    setLoading(false)
    setSelected(new Set())
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de auditoria?')) return
    setDeleting(true)
    const { error } = await supabase.from('audit_logs').delete().eq('id', id)
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Registro de auditoria excluído com sucesso.',
      })
      setLogs((prev) => prev.filter((l) => l.id !== id))
      if (selected.has(id)) {
        const newSet = new Set(selected)
        newSet.delete(id)
        setSelected(newSet)
      }
    }
    setDeleting(false)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selected.size} registros de auditoria?`)) return
    setDeleting(true)
    const ids = Array.from(selected)
    const { error } = await supabase.from('audit_logs').delete().in('id', ids)
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: `${selected.size} registros excluídos com sucesso.`,
      })
      setLogs((prev) => prev.filter((l) => !selected.has(l.id)))
      setSelected(new Set())
    }
    setDeleting(false)
  }

  const filteredLogs = logs.filter((log) => {
    let matchFilter = true
    if (activeFilter) {
      const originalAct = log.action?.toUpperCase() || ''
      if (activeFilter === 'CREATE' && !['CREATE', 'INSERT', 'INCLUSÃO'].includes(originalAct))
        matchFilter = false
      if (
        activeFilter === 'UPDATE' &&
        !['UPDATE', 'EDIÇÃO', 'EDICAO', 'EDICAO_EM_LOTE'].includes(originalAct)
      )
        matchFilter = false
      if (
        activeFilter === 'DELETE' &&
        !['DELETE', 'EXCLUSÃO', 'EXCLUSAO', 'SOFT_DELETE', 'EXCLUSAO_EM_LOTE'].includes(originalAct)
      )
        matchFilter = false
    }
    if (!matchFilter) return false

    if (!search) return true
    const searchLower = search.toLowerCase()
    const userName = log.performed_by ? globalDict[log.performed_by]?.name || 'sistema' : 'sistema'
    const info = getAffectedRecordInfo(log, globalDict)
    const translatedAction = translateAction(log.action).toLowerCase()

    return (
      translatedAction.includes(searchLower) ||
      info.primary?.toLowerCase().includes(searchLower) ||
      info.secondary?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower)
    )
  })

  const sortedLogs = useMemo(() => {
    let sortable = [...filteredLogs]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''
        const aInfo = getAffectedRecordInfo(a, globalDict)
        const bInfo = getAffectedRecordInfo(b, globalDict)

        switch (sortConfig.key) {
          case 'entity_id':
            aValue = aInfo.secondary !== a.entity_id ? aInfo.secondary : ''
            bValue = bInfo.secondary !== b.entity_id ? bInfo.secondary : ''
            break
          case 'action':
            aValue = translateAction(a.action) || ''
            bValue = translateAction(b.action) || ''
            break
          case 'entity_type':
            aValue = a.entity_type || ''
            bValue = b.entity_type || ''
            break
          case 'affected_record':
            aValue = aInfo.primary || ''
            bValue = bInfo.primary || ''
            break
          case 'performed_by':
            aValue = (a.performed_by ? globalDict[a.performed_by]?.name : '') || ''
            bValue = (b.performed_by ? globalDict[b.performed_by]?.name : '') || ''
            break
          case 'created_at':
            aValue = new Date(a.created_at || 0).getTime()
            bValue = new Date(b.created_at || 0).getTime()
            break
          case 'ip_address':
            aValue = a.ip_address || ''
            bValue = b.ip_address || ''
            break
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [filteredLogs, sortConfig, globalDict])

  const toggleAll = () => {
    if (selected.size === sortedLogs.length && sortedLogs.length > 0) setSelected(new Set())
    else setSelected(new Set(sortedLogs.map((l) => l.id)))
  }

  const toggleRow = (id: string) => {
    const newSet = new Set(selected)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelected(newSet)
  }

  const handleExport = (exportFormat: 'csv' | 'pdf' | 'excel') => {
    if (exportFormat === 'csv' || exportFormat === 'excel') {
      let csvContent =
        'Data/Hora;Entidade;Ação;Registro Afetado;ID Entidade;Responsável;IP Origem\n'
      sortedLogs.forEach((log) => {
        const info = getAffectedRecordInfo(log, globalDict)
        const date = log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '-'
        const entity = log.entity_type || ''
        const action = translateAction(log.action)
        const primary = info.primary || ''
        const secondary = info.secondary !== log.entity_id ? info.secondary : ''
        const user = log.performed_by ? globalDict[log.performed_by]?.name || 'Sistema' : 'Sistema'
        const ip = log.ip_address || ''

        csvContent += `"${date}";"${entity}";"${action}";"${primary}";"${secondary}";"${user}";"${ip}"\n`
      })

      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_central_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'csv' : 'csv'}`
      a.click()
    } else {
      toast({
        title: 'Exportação',
        description: 'A exportação em PDF será disponibilizada em breve.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in mx-auto w-full max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de Auditoria</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe e rastreie todas as ações, modificações e exclusões no sistema de forma
              unificada.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" className="bg-background" onClick={() => handleExport('csv')}>
            <FileText className="mr-2 h-4 w-4 text-emerald-600" />
            CSV
          </Button>
          <Button variant="outline" className="bg-background" onClick={() => handleExport('pdf')}>
            <FileIcon className="mr-2 h-4 w-4 text-red-600" />
            PDF
          </Button>
          <Button variant="outline" className="bg-background" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
            Excel
          </Button>
        </div>
      </div>

      <AuditDashboard
        logs={logs}
        entityType="central"
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-lg">Registros de Auditoria</CardTitle>
                <CardDescription>
                  Visualize as últimas atividades registradas no sistema.
                </CardDescription>
              </div>
              {selected.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="animate-fade-in-down"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Selecionados ({selected.size})
                </Button>
              )}
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
                disabled={loading || deleting}
              >
                <History className={cn('h-4 w-4', (loading || deleting) && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-2">
                  <TableHead className="w-[180px] py-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={sortedLogs.length > 0 && selected.size === sortedLogs.length}
                        onCheckedChange={toggleAll}
                        aria-label="Selecionar todos"
                      />
                      <div
                        className="flex items-center gap-1 text-[13px] text-muted-foreground font-semibold cursor-pointer hover:text-foreground transition-colors group select-none"
                        onClick={() => handleSort('created_at')}
                      >
                        Data/Hora{' '}
                        <ArrowUpDown
                          className={cn(
                            'h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity',
                            sortConfig?.key === 'created_at' && 'opacity-100 text-foreground',
                          )}
                        />
                      </div>
                    </div>
                  </TableHead>
                  <SortableHead
                    label="Entidade"
                    sortKey="entity_type"
                    currentSort={sortConfig}
                    requestSort={handleSort}
                  />
                  <SortableHead
                    label="Ação"
                    sortKey="action"
                    currentSort={sortConfig}
                    requestSort={handleSort}
                  />
                  <SortableHead
                    label="Registro Afetado"
                    sortKey="affected_record"
                    currentSort={sortConfig}
                    requestSort={handleSort}
                  />
                  <SortableHead
                    label="ID Entidade"
                    sortKey="entity_id"
                    currentSort={sortConfig}
                    requestSort={handleSort}
                  />
                  <SortableHead
                    label="Responsável"
                    sortKey="performed_by"
                    currentSort={sortConfig}
                    requestSort={handleSort}
                  />
                  <SortableHead
                    label="IP Origem"
                    sortKey="ip_address"
                    currentSort={sortConfig}
                    requestSort={handleSort}
                  />
                  <TableHead className="text-right pr-4 text-[13px] text-muted-foreground font-semibold">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedLogs.length > 0 ? (
                  sortedLogs.map((log) => (
                    <ExpandableRow
                      key={log.id}
                      log={log}
                      userName={
                        log.performed_by
                          ? globalDict[log.performed_by]?.name || 'Sistema'
                          : 'Sistema'
                      }
                      isSelected={selected.has(log.id)}
                      onToggleSelect={toggleRow}
                      onDelete={handleDelete}
                      dict={globalDict}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
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
