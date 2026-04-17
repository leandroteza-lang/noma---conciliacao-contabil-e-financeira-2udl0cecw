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
  ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTablePkg from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const autoTable =
  typeof autoTablePkg === 'function' ? autoTablePkg : (autoTablePkg as any).default || autoTablePkg

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
import { useSearchParams } from 'react-router-dom'

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
    case 'APPROVE':
      return 'APROVAÇÃO'
    case 'REJECT':
      return 'REJEIÇÃO'
    case 'RESTORE':
      return 'RESTAURAÇÃO'
    default:
      return act
  }
}

export const getAffectedRecordInfo = (log: any, dict: Record<string, any>, logsHistory?: any[]) => {
  let primary = 'Desconhecido'
  let secondary = log.entity_id

  const entity = dict[log.entity_id]
  if (entity) {
    primary = entity.name || primary
    secondary = entity.sub || secondary
  } else {
    // Try to find name in the current log changes
    const extractName = (c: Record<string, any>, entityType: string) => {
      if (!c) return null
      const getVal = (field: string) =>
        c[field]?.new ?? c[field]?.old ?? (typeof c[field] === 'string' ? c[field] : null)

      const storedName = getVal('_entity_name') || getVal('entity_name')
      if (storedName) return storedName

      switch (entityType?.toLowerCase()) {
        case 'usuario':
        case 'usuarios':
        case 'usuários':
        case 'cadastro_usuarios':
          return getVal('name') || getVal('email')
        case 'empresa':
        case 'empresas':
        case 'organizations':
          return getVal('name')
        case 'departamento':
        case 'departamentos':
        case 'departments':
          return getVal('name')
        case 'conta_contabil':
        case 'plano de contas':
        case 'chart_of_accounts':
          return getVal('account_name') || getVal('account_code')
        case 'centro_custo':
        case 'centros de custo':
        case 'cost_centers':
          return getVal('description') || getVal('code')
        case 'conta_bancaria':
        case 'contas bancárias':
        case 'bank_accounts':
          return getVal('description') || getVal('account_number')
        case 'tipo_conta_tga':
        case 'tipos de conta tga':
        case 'tga_account_types':
          return getVal('nome') || getVal('codigo')
        case 'mapeamento':
        case 'mapeamento de contas':
        case 'account_mapping':
          return getVal('mapping_type') || 'Mapeamento'
      }
      return null
    }

    const extractSub = (c: Record<string, any>, entityType: string) => {
      if (!c) return null
      const getVal = (field: string) =>
        c[field]?.new ?? c[field]?.old ?? (typeof c[field] === 'string' ? c[field] : null)
      switch (entityType?.toLowerCase()) {
        case 'usuario':
        case 'usuarios':
        case 'usuários':
        case 'cadastro_usuarios':
          return getVal('email') || getVal('cpf')
        case 'empresa':
        case 'empresas':
        case 'organizations':
          return getVal('cnpj') || getVal('email')
        case 'departamento':
        case 'departamentos':
        case 'departments':
          return getVal('code')
        case 'conta_contabil':
        case 'plano de contas':
        case 'chart_of_accounts':
          return getVal('account_code')
        case 'centro_custo':
        case 'centros de custo':
        case 'cost_centers':
          return getVal('code')
        case 'conta_bancaria':
        case 'contas bancárias':
        case 'bank_accounts':
          return getVal('bank_code') || getVal('agency')
        case 'tipo_conta_tga':
        case 'tipos de conta tga':
        case 'tga_account_types':
          return getVal('codigo') || getVal('abreviacao')
        case 'mapeamento':
        case 'mapeamento de contas':
        case 'account_mapping':
          return getVal('id') || 'Vínculo'
      }
      return null
    }

    if (log.changes) {
      primary = extractName(log.changes, log.entity_type) || primary
      secondary = extractSub(log.changes, log.entity_type) || secondary
    }

    // Fallback: search in other logs from the history for the same entity
    if (primary === 'Desconhecido' && logsHistory && Array.isArray(logsHistory)) {
      for (const histLog of logsHistory) {
        if (histLog.entity_id === log.entity_id && histLog.changes) {
          const histName = extractName(histLog.changes, histLog.entity_type)
          if (histName) {
            primary = histName
            secondary = extractSub(histLog.changes, histLog.entity_type) || secondary
            break
          }
        }
      }
    }
  }

  return { primary, secondary }
}

const fieldTranslations: Record<string, string> = {
  _entity_name: 'Nome do Registro',
  entity_name: 'Nome do Registro',
  organization_id: 'Empresa',
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

  if (field === 'approval_status') {
    const statuses: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    }
    return statuses[val] || val
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

function ExpandableRow({
  log,
  userName,
  isSelected,
  onToggleSelect,
  onDelete,
  dict,
  allLogs,
}: any) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!expanded && details.length === 0) {
      setLoadingDetails(true)
      const { data } = await supabase.from('audit_details').select('*').eq('audit_log_id', log.id)

      let finalDetails = data || []

      if (finalDetails.length === 0 && log.changes && typeof log.changes === 'object') {
        finalDetails = Object.entries(log.changes).map(([field, val]: [string, any], index) => {
          let oldVal = null
          let newVal = null
          if (val !== null && typeof val === 'object' && ('old' in val || 'new' in val)) {
            oldVal =
              val.old !== undefined && val.old !== null
                ? typeof val.old === 'object'
                  ? JSON.stringify(val.old)
                  : String(val.old)
                : null
            newVal =
              val.new !== undefined && val.new !== null
                ? typeof val.new === 'object'
                  ? JSON.stringify(val.new)
                  : String(val.new)
                : null
          } else {
            newVal =
              val !== undefined && val !== null
                ? typeof val === 'object'
                  ? JSON.stringify(val)
                  : String(val)
                : null
          }
          return {
            id: `fallback-${index}`,
            audit_log_id: log.id,
            field_name: field,
            old_value: oldVal,
            new_value: newVal,
          }
        })
      }

      setDetails(finalDetails)
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
    if (!entity) return ''
    const map: Record<string, string> = {
      usuario: 'Cadastro de Usuários',
      usuarios: 'Cadastro de Usuários',
      usuários: 'Cadastro de Usuários',
      cadastro_usuarios: 'Cadastro de Usuários',
      empresa: 'Empresas',
      empresas: 'Empresas',
      organizations: 'Empresas',
      departamento: 'Departamentos',
      departamentos: 'Departamentos',
      departments: 'Departamentos',
      conta_contabil: 'Plano de Contas',
      'plano de contas': 'Plano de Contas',
      chart_of_accounts: 'Plano de Contas',
      centro_custo: 'Centros de Custo',
      'centros de custo': 'Centros de Custo',
      cost_centers: 'Centros de Custo',
      conta_bancaria: 'Listagem de Contas',
      'contas bancárias': 'Listagem de Contas',
      bank_accounts: 'Listagem de Contas',
      mapeamento: 'Mapeamento DE/PARA',
      'mapeamento de/para': 'Mapeamento DE/PARA',
      account_mapping: 'Mapeamento DE/PARA',
      tipo_conta_tga: 'Tipos de Conta TGA',
      'tipos de conta tga': 'Tipos de Conta TGA',
      tga_account_types: 'Tipos de Conta TGA',
    }
    return map[entity?.toLowerCase()] || entity
  }

  const info = getAffectedRecordInfo(log, dict, allLogs)

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
              {log.created_at && !isNaN(new Date(log.created_at).getTime())
                ? format(new Date(log.created_at), 'dd/MM/yyyy, HH:mm:ss', { locale: ptBR })
                : '-'}
            </span>{' '}
          </div>
        </TableCell>
        <TableCell className="font-medium text-muted-foreground text-[13px]">
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
              ) : details.filter((d) => {
                  const isInternal = [
                    '_entity_name',
                    'entity_name',
                    '_snapshot',
                    'id',
                    'created_at',
                    'updated_at',
                    'deleted_at',
                    'deleted_by',
                    'organization_id',
                    'user_id',
                    'pending_deletion',
                  ].includes(d.field_name)
                  if (isInternal) return false

                  const oldV =
                    d.old_value !== null && d.old_value !== undefined
                      ? String(d.old_value).trim()
                      : ''
                  const newV =
                    d.new_value !== null && d.new_value !== undefined
                      ? String(d.new_value).trim()
                      : ''
                  if (oldV === newV) return false

                  return true
                }).length > 0 ? (
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
                      {details
                        .filter((d) => {
                          const isInternal = [
                            '_entity_name',
                            'entity_name',
                            '_snapshot',
                            'id',
                            'created_at',
                            'updated_at',
                            'deleted_at',
                            'deleted_by',
                            'organization_id',
                            'user_id',
                            'pending_deletion',
                          ].includes(d.field_name)
                          if (isInternal) return false

                          const oldV =
                            d.old_value !== null && d.old_value !== undefined
                              ? String(d.old_value).trim()
                              : ''
                          const newV =
                            d.new_value !== null && d.new_value !== undefined
                              ? String(d.new_value).trim()
                              : ''
                          if (oldV === newV) return false

                          return true
                        })
                        .map((detail) => (
                          <TableRow key={detail.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground text-sm">
                              {translateField(detail.field_name)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {detail.old_value !== null &&
                              detail.old_value !== undefined &&
                              String(detail.old_value).trim() !== '' ? (
                                <span className="line-through decoration-destructive/40">
                                  {formatValue(String(detail.old_value), detail.field_name, dict)}
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
                              String(detail.new_value).trim() !== '' ? (
                                formatValue(String(detail.new_value), detail.field_name, dict)
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
  const [searchParams] = useSearchParams()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [entityFilter, setEntityFilter] = useState<string>(searchParams.get('entity') || 'todos')
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
      { data: tgas },
      { data: mappings },
    ] = await Promise.all([
      supabase.from('cadastro_usuarios').select('id, user_id, name, email'),
      supabase.from('organizations').select('id, name, cnpj'),
      supabase.from('departments').select('id, name, code'),
      supabase.from('cost_centers').select('id, description, code'),
      supabase.from('chart_of_accounts').select('id, account_name, account_code'),
      supabase.from('bank_accounts').select('id, description, account_number'),
      supabase.from('tipo_conta_tga').select('id, nome, codigo'),
      supabase.from('account_mapping').select('id, cost_center_id, chart_account_id, mapping_type'),
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
    tgas?.forEach((t) => {
      dict[t.id] = {
        name: t.nome || '',
        sub: t.codigo || '',
        type: 'tipo_conta_tga',
      }
    })
    mappings?.forEach((m) => {
      const cc = costs?.find((c) => c.id === m.cost_center_id)
      const ca = charts?.find((c) => c.id === m.chart_account_id)
      dict[m.id] = {
        name: `DE: ${cc?.code || '?'} PARA: ${ca?.account_code || '?'}`,
        sub: m.mapping_type || 'Mapeamento',
        type: 'mapeamento',
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

    if (entityFilter !== 'todos') {
      const filterMap: Record<string, string[]> = {
        usuario: ['usuario', 'usuarios', 'cadastro_usuarios', 'Usuários'],
        empresa: ['empresa', 'organizations', 'Empresas'],
        departamento: ['departamento', 'departments', 'Departamentos'],
        conta_contabil: ['conta_contabil', 'chart_of_accounts', 'Plano de Contas'],
        centro_custo: ['centro_custo', 'cost_centers', 'Centros de Custo'],
        conta_bancaria: ['conta_bancaria', 'bank_accounts', 'Contas Bancárias'],
        tipo_conta_tga: ['tipo_conta_tga', 'tga_account_types', 'Tipos de Conta TGA'],
        mapeamento: [
          'account_mapping',
          'Mapeamento de Contas',
          'mapeamento',
          'mapeamento de/para',
          'Mapeamento DE/PARA',
        ],
      }
      query = query.in('entity_type', filterMap[entityFilter] || [entityFilter])
    }

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
    const info = getAffectedRecordInfo(log, globalDict, logs)
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
        const aInfo = getAffectedRecordInfo(a, globalDict, logs)
        const bInfo = getAffectedRecordInfo(b, globalDict, logs)

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

  const handleExport = (exportFormat: 'csv' | 'pdf' | 'excel' | 'txt' | 'browser') => {
    if (sortedLogs.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Não há dados para exportar.',
      })
      return
    }

    const safeFormatDate = (dateStr: string | null) => {
      if (!dateStr) return '-'
      try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return '-'
        return format(d, 'dd/MM/yyyy HH:mm:ss')
      } catch (e) {
        return '-'
      }
    }

    const data = sortedLogs.map((log) => {
      const info = getAffectedRecordInfo(log, globalDict, logs)
      const date = safeFormatDate(log.created_at)
      const entity = log.entity_type || ''
      const action = translateAction(log.action)
      const primary = info.primary || ''
      const secondary = info.secondary !== log.entity_id ? info.secondary : ''
      const user = log.performed_by ? globalDict[log.performed_by]?.name || 'Sistema' : 'Sistema'
      const ip = log.ip_address || ''
      return { date, entity, action, primary, secondary, user, ip }
    })

    if (exportFormat === 'csv') {
      let csvContent =
        'Data/Hora;Entidade;Ação;Registro Afetado;ID Entidade;Responsável;IP Origem\n'
      data.forEach((row) => {
        csvContent += `"${row.date}";"${row.entity}";"${row.action}";"${row.primary}";"${row.secondary}";"${row.user}";"${row.ip}"\n`
      })
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_central_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } else if (exportFormat === 'excel') {
      const wsData = data.map((row) => ({
        'Data/Hora': row.date,
        Entidade: row.entity,
        Ação: row.action,
        'Registro Afetado': row.primary,
        'ID Entidade': row.secondary,
        Responsável: row.user,
        'IP Origem': row.ip,
      }))
      const ws = XLSX.utils.json_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Auditoria')
      XLSX.writeFile(wb, `auditoria_central_${new Date().toISOString().split('T')[0]}.xlsx`)
    } else if (exportFormat === 'txt') {
      let txtContent =
        'RELATÓRIO DE AUDITORIA CENTRAL\n=========================================\n\n'
      data.forEach((row) => {
        txtContent += `Data/Hora: ${row.date}\n`
        txtContent += `Entidade: ${row.entity}\n`
        txtContent += `Ação: ${row.action}\n`
        txtContent += `Registro Afetado: ${row.primary}\n`
        txtContent += `ID Entidade: ${row.secondary}\n`
        txtContent += `Responsável: ${row.user}\n`
        txtContent += `IP Origem: ${row.ip}\n`
        txtContent += '-----------------------------------------\n'
      })
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_central_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
    } else if (exportFormat === 'pdf' || exportFormat === 'browser') {
      try {
        const doc = new jsPDF('landscape')
        doc.setFontSize(16)
        doc.text('Relatório de Auditoria Central', 14, 20)
        doc.setFontSize(10)
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 28)

        const tableData = data.map((row) => [
          row.date,
          row.entity,
          row.action,
          row.primary,
          row.secondary,
          row.user,
          row.ip,
        ])

        autoTable(doc, {
          head: [
            [
              'Data/Hora',
              'Entidade',
              'Ação',
              'Registro Afetado',
              'ID Entidade',
              'Responsável',
              'IP Origem',
            ],
          ],
          body: tableData,
          startY: 35,
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        })

        if (exportFormat === 'browser') {
          const pdfBlob = doc.output('blob')
          const pdfUrl = URL.createObjectURL(pdfBlob)
          window.open(pdfUrl, '_blank')
        } else {
          doc.save(`auditoria_central_${new Date().toISOString().split('T')[0]}.pdf`)
        }
      } catch (err: any) {
        console.error('Erro ao gerar PDF:', err)
        toast({
          title: 'Erro ao gerar PDF',
          description: err?.message || 'Ocorreu um erro inesperado durante a geração do documento.',
          variant: 'destructive',
        })
      }
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
        <div className="flex items-center gap-2 self-start flex-wrap">
          <Button variant="outline" className="bg-background" onClick={() => handleExport('csv')}>
            <FileText className="mr-2 h-4 w-4 text-emerald-600" />
            CSV
          </Button>
          <Button variant="outline" className="bg-background" onClick={() => handleExport('txt')}>
            <FileText className="mr-2 h-4 w-4 text-gray-600" />
            TXT
          </Button>
          <Button variant="outline" className="bg-background" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
            Excel
          </Button>
          <Button variant="outline" className="bg-background" onClick={() => handleExport('pdf')}>
            <FileIcon className="mr-2 h-4 w-4 text-red-600" />
            PDF
          </Button>
          <Button
            variant="outline"
            className="bg-background"
            onClick={() => handleExport('browser')}
          >
            <ExternalLink className="mr-2 h-4 w-4 text-primary" />
            Navegador
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
                  <SelectItem value="usuario">Cadastro de Usuários</SelectItem>
                  <SelectItem value="empresa">Empresas</SelectItem>
                  <SelectItem value="departamento">Departamentos</SelectItem>
                  <SelectItem value="conta_contabil">Plano de Contas</SelectItem>
                  <SelectItem value="centro_custo">Centros de Custo</SelectItem>
                  <SelectItem value="conta_bancaria">Listagem de Contas</SelectItem>
                  <SelectItem value="tipo_conta_tga">Tipos de Conta TGA</SelectItem>
                  <SelectItem value="mapeamento">Mapeamento DE/PARA</SelectItem>
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
                      allLogs={logs}
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
