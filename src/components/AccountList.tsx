import {
  Trash2,
  Building,
  ArrowUpDown,
  Download,
  FileText,
  FileSpreadsheet,
  Edit,
  Upload,
  ChevronRight,
  ChevronDown,
  GripVertical,
  ListTree,
  Search,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Organization } from '@/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAuditLog } from '@/hooks/use-audit-log'
import { supabase } from '@/lib/supabase/client'
import { AccountCombobox } from '@/components/AccountCombobox'
import { MultiSelect } from '@/components/MultiSelect'

interface Props {
  accounts: any[]
  loading?: boolean
  allChartAccounts?: any[]
  organizations: Organization[]
  onDelete: (id: string) => void
  onUpdateInline?: (id: string, field: string, value: string) => Promise<boolean>
  searchTerm?: string
  onSearchChange?: (val: string) => void
  filterOrg?: string[]
  onFilterOrgChange?: (val: string[]) => void
  filterType?: string[]
  onFilterTypeChange?: (val: string[]) => void
  filterClass?: string[]
  onFilterClassChange?: (val: string[]) => void
  filterNoAccount?: boolean
  onFilterNoAccountChange?: (val: boolean) => void
}

const getTheme = (name: string | null | undefined) => {
  const n = name?.toUpperCase() || ''
  if (n.includes('NOMA PARTS'))
    return {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      border: 'border-blue-500 dark:border-blue-700',
    }
  if (n.includes('LS ALMEIDA'))
    return {
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      border: 'border-yellow-500 dark:border-yellow-700',
    }
  if (n.includes('NOMA SERVICE'))
    return {
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      border: 'border-orange-500 dark:border-orange-700',
    }
  if (n.includes('PF'))
    return {
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      border: 'border-purple-500 dark:border-purple-700',
    }
  return {
    badge: 'bg-black/5 dark:bg-white/10 text-inherit border-transparent',
    border: 'border-border',
  }
}

const getHierarchyNodeStyle = (level: number) => {
  switch (level) {
    case 0:
      return 'bg-[#1e1b4b] text-white border-b border-white/10'
    case 1:
      return 'bg-[#312e81] text-white border-b border-white/10'
    case 2:
      return 'bg-[#4338ca] text-white border-b border-white/10'
    case 3:
      return 'bg-[#e0e7ff] text-[#1e1b4b] border-b border-[#c7d2fe]'
    default:
      return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800'
  }
}

const getHierarchyBadgeStyle = (level: number) => {
  switch (level) {
    case 0:
      return 'bg-[#312e81] text-white border border-[#3730a3]'
    case 1:
      return 'bg-[#3730a3] text-white border border-[#4338ca]'
    case 2:
      return 'bg-[#4f46e5] text-white border border-[#6366f1]'
    case 3:
      return 'bg-[#c7d2fe] text-[#1e1b4b] border border-[#a5b4fc]'
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  }
}

function EditableCell({
  value,
  field,
  isEditing,
  onEditStart,
  onEditCommit,
  onEditCancel,
  organizations,
  isChartNode,
}: any) {
  const [tempVal, setTempVal] = useState(value)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    if (isEditing) {
      setTempVal(value)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing, value])

  const handleBlur = () => onEditCommit(tempVal)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onEditCommit(tempVal)
    if (e.key === 'Escape') onEditCancel()
  }

  if (!isEditing) {
    if (field === 'organization_id') {
      const org = organizations.find((o: Organization) => o.id === value)
      const theme = getTheme(org?.name)
      return (
        <div
          className={cn(
            'p-0.5 -m-0.5 rounded min-h-[20px] flex items-center',
            !isChartNode && 'cursor-pointer hover:bg-muted/50',
          )}
          onClick={onEditStart}
        >
          <Badge
            variant="outline"
            className={cn('py-0.5 whitespace-nowrap shadow-sm', theme.badge)}
          >
            {org?.name || 'Desconhecida'}
          </Badge>
        </div>
      )
    }

    return (
      <div
        className="p-0.5 -m-0.5 rounded min-h-[20px] flex items-center w-full min-w-0 cursor-pointer hover:bg-muted/50"
        onClick={onEditStart}
      >
        {field === 'classificacao' ? (
          <Badge
            variant="secondary"
            className="bg-black/5 dark:bg-white/10 text-inherit border-transparent font-normal hover:bg-black/10 dark:hover:bg-white/20"
          >
            {value}
          </Badge>
        ) : (
          <span className="truncate w-full block">
            {value || <span className="opacity-50 italic text-[0.85em]">Vazio</span>}
          </span>
        )}
      </div>
    )
  }

  if (field === 'organization_id') {
    return (
      <select
        ref={inputRef}
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-[1em] border border-primary/50 rounded p-1 outline-none ring-2 ring-primary/20 bg-background text-foreground"
      >
        <option value="">Selecione...</option>
        {organizations.map((org: Organization) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    )
  }

  if (field === 'tipoConta') {
    return (
      <select
        ref={inputRef}
        value={tempVal || ''}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-[1em] border border-primary/50 rounded p-0.5 outline-none ring-2 ring-primary/20 bg-background text-foreground h-6"
      >
        <option value="">Selecione...</option>
        <option value="CAIXA">CAIXA</option>
        <option value="CORRENTE">CORRENTE</option>
        <option value="POUPANÇA">POUPANÇA</option>
        <option value="APLICAÇÕES">APLICAÇÕES</option>
        <option value="OUTRAS">OUTRAS</option>
      </select>
    )
  }

  if (field === 'classificacao') {
    return (
      <select
        ref={inputRef}
        value={tempVal || ''}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-[1em] border border-primary/50 rounded p-0.5 outline-none ring-2 ring-primary/20 bg-background text-foreground h-6"
      >
        <option value="">Selecione...</option>
        <option value="C">C</option>
        <option value="B">B</option>
      </select>
    )
  }

  return (
    <Input
      ref={inputRef}
      value={tempVal}
      onChange={(e) => setTempVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-6 py-0 px-1 text-[1em] border-primary/50 focus-visible:ring-primary min-w-[100px] w-full"
    />
  )
}

export function AccountList({
  accounts,
  loading,
  allChartAccounts,
  organizations,
  onDelete,
  onUpdateInline,
  searchTerm,
  onSearchChange,
  filterOrg = [],
  onFilterOrgChange,
  filterType = [],
  onFilterTypeChange,
  filterClass = [],
  onFilterClassChange,
  filterNoAccount = false,
  onFilterNoAccountChange,
}: Props) {
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editModalAccount, setEditModalAccount] = useState<any | null>(null)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [bulkEditData, setBulkEditData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  const modalChartAccounts = useMemo(() => {
    if (!editModalAccount?.organization_id || !allChartAccounts) return []
    return allChartAccounts
      .filter((a) => a.organization_id === editModalAccount.organization_id)
      .sort((a, b) => (a.classification || '').localeCompare(b.classification || ''))
  }, [editModalAccount?.organization_id, allChartAccounts])

  const selectedChartAccountId = useMemo(() => {
    if (!editModalAccount?.contaContabil) return undefined
    const acc = modalChartAccounts.find((a) => a.account_code === editModalAccount.contaContabil)
    return acc ? acc.id : undefined
  }, [modalChartAccounts, editModalAccount?.contaContabil])

  const defaultColumns = useMemo(
    () => [
      { id: 'organization_id', label: 'Empresa', sortable: true },
      { id: 'code', label: 'Código', sortable: true },
      { id: 'contaContabil', label: 'Conta Contábil', sortable: true },
      { id: 'descricao', label: 'Descrição', sortable: true },
      { id: 'banco', label: 'Banco', sortable: true },
      { id: 'agencia', label: 'Agência', sortable: true },
      { id: 'numeroConta', label: 'Conta', sortable: true },
      { id: 'digitoConta', label: 'Dígito', sortable: true },
      { id: 'tipoConta', label: 'Tipo', sortable: true },
      { id: 'classificacao', label: 'Classificação', sortable: true },
    ],
    [],
  )

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('bank_accounts_columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.length === defaultColumns.length) return parsed
      } catch {
        /* intentionally ignored */
      }
    }
    return defaultColumns
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_columns', JSON.stringify(columns))
  }, [columns])

  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const { logAction } = useAuditLog()

  const [bulkDragPos, setBulkDragPos] = useState({ x: 0, y: 0 })
  const [isBulkDragging, setIsBulkDragging] = useState(false)
  const bulkDragStartPos = useRef({ x: 0, y: 0 })

  const handleBulkPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsBulkDragging(true)
    bulkDragStartPos.current = { x: e.clientX - bulkDragPos.x, y: e.clientY - bulkDragPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleBulkPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isBulkDragging) {
      setBulkDragPos({
        x: e.clientX - bulkDragStartPos.current.x,
        y: e.clientY - bulkDragStartPos.current.y,
      })
    }
  }

  const handleBulkPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsBulkDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const [editDragPos, setEditDragPos] = useState({ x: 0, y: 0 })
  const [isEditDragging, setIsEditDragging] = useState(false)
  const editDragStartPos = useRef({ x: 0, y: 0 })

  const handleEditPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsEditDragging(true)
    editDragStartPos.current = { x: e.clientX - editDragPos.x, y: e.clientY - editDragPos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleEditPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditDragging) {
      setEditDragPos({
        x: e.clientX - editDragStartPos.current.x,
        y: e.clientY - editDragStartPos.current.y,
      })
    }
  }

  const handleEditPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsEditDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const [tableFontSize, setTableFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('bank_accounts_table_font_size')
    return saved ? parseInt(saved, 10) : 11
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_table_font_size', tableFontSize.toString())
  }, [tableFontSize])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'))
    if (isNaN(fromIdx) || fromIdx === index) return
    const newCols = [...columns]
    const [moved] = newCols.splice(fromIdx, 1)
    newCols.splice(index, 0, moved)
    setColumns(newCols)
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedIds(next)
  }

  const visibleAccounts = useMemo(() => {
    let sortable = [...accounts]

    if (sortConfig) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]
        if (sortConfig.key === 'organization_id') {
          aVal = organizations.find((o: any) => o.id === a.organization_id)?.name || ''
          bVal = organizations.find((o: any) => o.id === b.organization_id)?.name || ''
        }
        aVal = String(aVal || '').toLowerCase()
        bVal = String(bVal || '').toLowerCase()
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    } else {
      sortable.sort((a, b) => {
        const cA = String(a.classificacao || '').toLowerCase()
        const cB = String(b.classificacao || '').toLowerCase()
        return cA.localeCompare(cB)
      })
    }

    return sortable
  }, [accounts, sortConfig, organizations])

  const handleExpandAll = () => {
    const allIds = accounts.map((a) => a.id)
    setExpandedIds(new Set(allIds))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  const handleExpandAnalytic = () => {
    setExpandedIds(new Set())
  }

  const handleBulkEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.length === 0) return

    setIsSaving(true)
    try {
      const updates: any = {}
      if (bulkEditData.organization_id) updates.organization_id = bulkEditData.organization_id
      if (bulkEditData.tipoConta) updates.account_type = bulkEditData.tipoConta
      if (bulkEditData.classificacao) updates.classification = bulkEditData.classificacao
      if (bulkEditData.banco) updates.bank_code = bulkEditData.banco

      if (Object.keys(updates).length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum campo preenchido para alteração.' })
        setIsSaving(false)
        return
      }

      const { error } = await supabase.from('bank_accounts').update(updates).in('id', selectedIds)

      if (error) throw error

      for (const id of selectedIds) {
        const changes: any = {}
        if (updates.organization_id) changes.organization_id = { new: updates.organization_id }
        if (updates.account_type) changes.account_type = { new: updates.account_type }
        if (updates.classification) changes.classification = { new: updates.classification }
        if (updates.bank_code) changes.bank_code = { new: updates.bank_code }

        await logAction('Contas Bancárias', id, 'UPDATE_BULK', changes)
      }

      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} contas atualizadas com sucesso!`,
      })
      setIsBulkEditOpen(false)
      setSelectedIds([])
      setBulkEditData({})
      window.dispatchEvent(new CustomEvent('refresh-bank-accounts'))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} conta(s)?`)) return

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
      })
      .in('id', selectedIds)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      for (const id of selectedIds) {
        await logAction('Contas Bancárias', id, 'DELETE', {
          pending_deletion: { old: false, new: true },
        })
      }
      toast({ title: 'Sucesso', description: 'Exclusão solicitada com sucesso.' })
      setSelectedIds([])
    }
  }

  const handleExportTemplate = async () => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando modelo...' })

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: 'excel',
        data: [
          {
            Empresa: 'Exemplo Ltda',
            'Conta Contábil': '1.01.01.01',
            Descrição: 'Conta Principal',
            Banco: '001',
            Agência: '1234',
            'Número da Conta': '12345',
            Dígito: '6',
            'Tipo de Conta': 'Conta Corrente',
            Classificação: 'Ativo',
          },
        ],
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-bank-accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        throw new Error('Falha ao exportar modelo')
      }

      const result = await res.json()

      const binaryString = atob(result.excel)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'modelo_importacao_contas_bancarias.xlsx'
      link.click()
      toast({ title: 'Sucesso', description: 'Modelo gerado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser' | 'csv' | 'txt') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })

      let win: Window | null = null
      if (formatType === 'browser') {
        win = window.open('', '_blank')
        if (win) {
          win.document.write('Gerando relatório, aguarde...')
        }
      }

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const payload = {
        format: formatType === 'browser' ? 'pdf' : formatType,
        data: visibleAccounts.map((acc) => ({
          Empresa: organizations.find((o: any) => o.id === acc.organization_id)?.name || '-',
          Código: acc.code || '-',
          'Conta Contábil': acc.contaContabil || '-',
          Descrição: acc.descricao || '-',
          Banco: acc.banco || '-',
          Agência: acc.agencia || '-',
          Número: acc.numeroConta || '-',
          Dígito: acc.digitoConta || '-',
          'Tipo Conta': acc.tipoConta || '-',
          Classificação: acc.classificacao || '-',
        })),
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-bank-accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) {
        if (win) win.close()
        throw new Error('Falha ao exportar')
      }

      const result = await res.json()

      if (formatType === 'excel' && result.excel) {
        const binaryString = atob(result.excel)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'contas.xlsx'
        link.click()
      } else if (formatType === 'csv' && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas.csv'
        a.click()
        URL.revokeObjectURL(url)
      } else if (formatType === 'txt' && result.txt) {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas.txt'
        a.click()
        URL.revokeObjectURL(url)
      } else if (formatType === 'browser' && result.pdf) {
        if (win) {
          win.document.open()
          win.document.write(
            `<iframe src="${result.pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:absolute;" allowfullscreen></iframe>`,
          )
          win.document.close()
        }
      } else if (formatType === 'pdf' && result.pdf) {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'contas.pdf'
        link.click()
      } else {
        if (win) win.close()
      }

      toast({ title: 'Sucesso', description: 'Relatório gerado com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleEditCommit = async (id: string, field: string, val: string) => {
    if (onUpdateInline) {
      const oldAccMatch = accounts.find((a) => a.id === id)
      const oldAcc = oldAccMatch ? { ...oldAccMatch } : null
      const success = await onUpdateInline(id, field, val)
      if (success !== false && oldAcc && String(oldAcc[field]) !== String(val)) {
        const dbFieldMap: Record<string, string> = {
          organization_id: 'organization_id',
          code: 'code',
          contaContabil: 'account_code',
          descricao: 'description',
          banco: 'bank_code',
          agencia: 'agency',
          numeroConta: 'account_number',
          digitoConta: 'check_digit',
          tipoConta: 'account_type',
          classificacao: 'classification',
        }
        const dbField = dbFieldMap[field] || field
        await logAction('Contas Bancárias', id, 'UPDATE', {
          [dbField]: { old: oldAcc[field], new: val },
        })
      }
    }
    setEditing(null)
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalAccount) return

    setIsSaving(true)
    try {
      const oldAccMatch = accounts.find((a) => a.id === editModalAccount.id)
      const oldAcc = oldAccMatch ? { ...oldAccMatch } : null

      const { error } = await supabase
        .from('bank_accounts')
        .update({
          organization_id: editModalAccount.organization_id,
          code: editModalAccount.code,
          account_code: editModalAccount.contaContabil,
          description: editModalAccount.descricao,
          bank_code: editModalAccount.banco,
          agency: editModalAccount.agencia,
          account_number: editModalAccount.numeroConta,
          check_digit: editModalAccount.digitoConta,
          account_type: editModalAccount.tipoConta,
          classification: editModalAccount.classificacao,
        })
        .eq('id', editModalAccount.id)

      if (error) throw error

      if (oldAcc) {
        const changes: any = {}
        if (String(oldAcc.code) !== String(editModalAccount.code))
          changes.code = { old: oldAcc.code, new: editModalAccount.code }
        if (String(oldAcc.organization_id) !== String(editModalAccount.organization_id))
          changes.organization_id = {
            old: oldAcc.organization_id,
            new: editModalAccount.organization_id,
          }
        if (String(oldAcc.contaContabil) !== String(editModalAccount.contaContabil))
          changes.account_code = { old: oldAcc.contaContabil, new: editModalAccount.contaContabil }
        if (String(oldAcc.descricao) !== String(editModalAccount.descricao))
          changes.description = { old: oldAcc.descricao, new: editModalAccount.descricao }
        if (String(oldAcc.banco) !== String(editModalAccount.banco))
          changes.bank_code = { old: oldAcc.banco, new: editModalAccount.banco }
        if (String(oldAcc.agencia) !== String(editModalAccount.agencia))
          changes.agency = { old: oldAcc.agencia, new: editModalAccount.agencia }
        if (String(oldAcc.numeroConta) !== String(editModalAccount.numeroConta))
          changes.account_number = { old: oldAcc.numeroConta, new: editModalAccount.numeroConta }
        if (String(oldAcc.digitoConta) !== String(editModalAccount.digitoConta))
          changes.check_digit = { old: oldAcc.digitoConta, new: editModalAccount.digitoConta }
        if (String(oldAcc.tipoConta) !== String(editModalAccount.tipoConta))
          changes.account_type = { old: oldAcc.tipoConta, new: editModalAccount.tipoConta }
        if (String(oldAcc.classificacao) !== String(editModalAccount.classificacao))
          changes.classification = {
            old: oldAcc.classificacao,
            new: editModalAccount.classificacao,
          }

        if (Object.keys(changes).length > 0) {
          await logAction('Contas Bancárias', editModalAccount.id, 'UPDATE', changes)
        }
      }

      toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso!' })
      setEditModalAccount(null)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const selectableAccounts = visibleAccounts

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3">
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-2 flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                {selectedIds.length} conta(s) selecionada(s)
              </span>
              <span
                className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80 truncate max-w-[200px] sm:max-w-md md:max-w-lg mt-0.5"
                title={accounts
                  .filter((a) => selectedIds.includes(a.id))
                  .map((a) => a.descricao || a.code)
                  .join(', ')}
              >
                {accounts
                  .filter((a) => selectedIds.includes(a.id))
                  .map((a) => a.descricao || a.code)
                  .join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkEditOpen(true)}
                className="h-8 gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Edit className="h-4 w-4" /> Editar Lote
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 gap-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] gap-3 items-center w-full bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
          <div
            className={cn(
              'flex items-center gap-1.5 h-10 px-1 rounded-md border shadow-sm shrink-0 bg-white dark:bg-slate-900 transition-colors',
              filterOrg.length > 0 || filterType.length > 0 || filterClass.length > 0
                ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800',
            )}
          >
            <div className="w-[180px] shrink-0">
              <MultiSelect
                title="Empresa"
                options={organizations.map((org) => ({ label: org.name || '', value: org.id }))}
                selected={filterOrg}
                onChange={(val) => onFilterOrgChange?.(val)}
                isActive={filterOrg.length > 0}
              />
            </div>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0"></div>

            <div className="w-[130px] shrink-0">
              <MultiSelect
                title="Tipo"
                options={[
                  { label: 'CAIXA', value: 'CAIXA' },
                  { label: 'CORRENTE', value: 'CORRENTE' },
                  { label: 'POUPANÇA', value: 'POUPANÇA' },
                  { label: 'APLICAÇÕES', value: 'APLICAÇÕES' },
                  { label: 'OUTRAS', value: 'OUTRAS' },
                ]}
                selected={filterType}
                onChange={(val) => onFilterTypeChange?.(val)}
                isActive={filterType.length > 0}
              />
            </div>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0"></div>

            <div className="w-[140px] shrink-0">
              <MultiSelect
                title="Classificação"
                options={[
                  { label: 'C', value: 'C' },
                  { label: 'B', value: 'B' },
                ]}
                selected={filterClass}
                onChange={(val) => onFilterClassChange?.(val)}
                isActive={filterClass.length > 0}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2 ml-1">
              <Button
                variant={filterNoAccount ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterNoAccountChange?.(!filterNoAccount)}
                className={cn(
                  'h-8 px-2.5 text-xs font-medium transition-colors shadow-sm',
                  filterNoAccount
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-900/70'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300',
                )}
                title="Auditar contas sem Conta Contábil vinculada"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                Sem Conta Contábil
              </Button>
            </div>

            {(filterOrg.length > 0 ||
              filterType.length > 0 ||
              filterClass.length > 0 ||
              filterNoAccount ||
              searchTerm) && (
              <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-800 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  onClick={() => {
                    onFilterOrgChange?.([])
                    onFilterTypeChange?.([])
                    onFilterClassChange?.([])
                    onSearchChange?.('')
                    onFilterNoAccountChange?.(false)
                  }}
                >
                  Limpar Todos
                </Button>
              </div>
            )}
          </div>

          <div className="relative flex-1 w-full min-w-[200px] h-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
            <Input
              type="text"
              placeholder="Buscar contas..."
              className="w-full h-full pl-9 pr-9 border border-slate-300 dark:border-slate-700 hover:border-indigo-300 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 bg-white dark:bg-slate-900 transition-all shadow-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
              value={searchTerm || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => onSearchChange?.('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <div
              className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md p-0.5 border border-slate-200 dark:border-slate-800 shadow-sm h-10"
              title="Tamanho da Fonte das Tabelas"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-transparent"
                onClick={() => setTableFontSize((p) => Math.max(8, p - 1))}
              >
                A-
              </Button>
              <span className="text-[12px] font-medium text-slate-500 w-5 text-center select-none">
                {tableFontSize}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-transparent"
                onClick={() => setTableFontSize((p) => Math.min(24, p + 1))}
              >
                A+
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-10 bg-white dark:bg-slate-900">
                  <Download className="h-4 w-4" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleExport('txt')}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="h-4 w-4" /> TXT
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport('csv')}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="h-4 w-4" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport('excel')}
                  className="cursor-pointer gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel (XLSX)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport('pdf')}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="h-4 w-4" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport('browser')}
                  className="cursor-pointer gap-2"
                >
                  <FileText className="h-4 w-4" /> Abrir no Browser
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm">
                  <Upload className="h-4 w-4" /> Importar em Lote
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportTemplate} className="cursor-pointer gap-2">
                  <Download className="h-4 w-4 text-blue-600" /> Exportar Modelo Padrão
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link to="/import">
                    <Upload className="h-4 w-4 text-green-600" /> Importar Planilha
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-muted-foreground bg-card rounded-xl border border-dashed border-border shadow-sm animate-in fade-in flex-1">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-semibold text-foreground">Carregando contas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-muted-foreground bg-card rounded-xl border border-dashed border-border shadow-sm animate-in fade-in flex-1">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Building className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <p className="text-lg font-semibold text-foreground">Nenhuma conta encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre uma nova conta ou ajuste os filtros.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden lg:flex flex-col flex-1 min-h-0 rounded-xl border-2 border-indigo-950 bg-card shadow-sm overflow-hidden">
            <div className="flex justify-start items-center gap-2 p-2 bg-white dark:bg-slate-950 border-b border-indigo-100 dark:border-indigo-900 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="h-8 gap-2 text-xs font-medium"
              >
                <ListTree className="h-4 w-4" /> Expandir Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAnalytic}
                className="h-8 text-xs font-medium"
              >
                Expandir Analítico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="h-8 text-xs font-medium"
              >
                Recolher Todos
              </Button>
            </div>
            <Table
              className="border-collapse"
              wrapperClassName="flex-1 overflow-auto max-h-[calc(100vh-230px)]"
              style={{ fontSize: `${tableFontSize}px` }}
            >
              <TableHeader className="bg-indigo-950 sticky top-0 z-20 shadow-md">
                <TableRow disableZebra className="border-0 hover:bg-indigo-950 bg-indigo-950">
                  <TableHead className="w-12 text-center py-1 px-2 text-white font-normal text-[1.1em] border-0 sticky top-0 bg-indigo-950 z-20 hover:bg-indigo-950">
                    <Checkbox
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950"
                      checked={
                        selectableAccounts.length > 0 &&
                        selectedIds.length === selectableAccounts.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(selectableAccounts.map((a) => a.id))
                        else setSelectedIds([])
                      }}
                    />
                  </TableHead>
                  {columns.map((col, idx) => (
                    <TableHead
                      key={col.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, idx)}
                      className="cursor-move py-1 px-2 text-white font-normal text-[1.1em] border-0 select-none sticky top-0 bg-indigo-950 z-20 hover:bg-indigo-950"
                    >
                      {' '}
                      <div
                        className="flex items-center gap-2"
                        onClick={() => col.sortable && handleSort(col.id)}
                      >
                        <GripVertical className="h-3 w-3 opacity-30 cursor-grab active:cursor-grabbing shrink-0" />
                        {col.label}
                        {col.sortable && (
                          <ArrowUpDown className="h-3 w-3 opacity-50 cursor-pointer shrink-0" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right py-1 px-2 text-white font-normal text-[1.1em] border-0 w-24 sticky top-0 bg-indigo-950 z-20 hover:bg-indigo-950">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAccounts.map((acc, index) => {
                  const isEven = index % 2 === 1
                  const isExpanded = expandedIds.has(acc.id)

                  return (
                    <Fragment key={acc.id}>
                      <TableRow
                        className={cn(
                          'border-0 group/row text-[1em] transition-colors h-7',
                          isEven ? 'bg-[#bfdbfe]/40 dark:bg-slate-800/40' : 'bg-transparent',
                          'hover:bg-muted/50 dark:hover:bg-slate-700/50',
                        )}
                      >
                        <TableCell className="text-center py-0 px-2 border-0 h-7">
                          <Checkbox
                            className={cn(
                              'data-[state=checked]:bg-indigo-950 data-[state=checked]:border-indigo-950 data-[state=checked]:text-white',
                              isEven && 'border-black/50',
                            )}
                            checked={selectedIds.includes(acc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, acc.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                            }}
                          />
                        </TableCell>

                        {columns.map((col) => {
                          const isCodeCol = col.id === 'code' || col.id === 'descricao'
                          const isEmptyAccount = col.id === 'contaContabil' && !acc[col.id]

                          return (
                            <TableCell
                              key={col.id}
                              className={cn(
                                'py-0 px-2 border-0 h-7 transition-colors',
                                col.id === 'contaContabil' ? 'font-mono text-[0.95em]' : '',
                                isCodeCol ? 'font-medium' : '',
                                col.id === 'tipoConta'
                                  ? '!text-slate-800 dark:!text-slate-300'
                                  : '',
                                isEmptyAccount && !isExpanded
                                  ? 'bg-amber-50 dark:bg-amber-950/20'
                                  : '',
                              )}
                            >
                              <div className="flex items-center gap-1.5 w-full min-w-0">
                                {isEmptyAccount && (
                                  <AlertTriangle
                                    className="h-3.5 w-3.5 text-amber-500 shrink-0"
                                    title="Conta Contábil ausente"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <EditableCell
                                    value={acc[col.id]}
                                    field={col.id}
                                    organizations={organizations}
                                    isEditing={editing?.id === acc.id && editing?.field === col.id}
                                    onEditStart={() => setEditing({ id: acc.id, field: col.id })}
                                    onEditCommit={(val: string) =>
                                      val !== acc[col.id]
                                        ? handleEditCommit(acc.id, col.id, val)
                                        : setEditing(null)
                                    }
                                    onEditCancel={() => setEditing(null)}
                                    isChartNode={false}
                                  />
                                </div>
                              </div>
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right py-0 px-2 border-0 h-7">
                          <div className="flex justify-end items-center gap-1 opacity-100 transition-opacity">
                            {acc.hierarchyArray && acc.hierarchyArray.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  'h-6 px-1.5 text-[10px] transition-colors gap-1 border',
                                  isEven
                                    ? 'text-black/70 hover:text-indigo-950 hover:bg-black/10 border-black/10'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10 border-border',
                                )}
                                onClick={() => toggleExpand(acc.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="h-3 w-3" /> Recolher
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-3 w-3" /> Expandir
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-6 w-6 transition-colors',
                                isEven
                                  ? 'text-black/70 hover:text-indigo-950 hover:bg-black/10'
                                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                              )}
                              onClick={() => setEditModalAccount(acc)}
                              title="Editar"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-6 w-6 transition-colors',
                                isEven
                                  ? 'text-black/70 hover:text-red-700 hover:bg-red-500/20'
                                  : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                              )}
                              onClick={() => onDelete(acc.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && acc.hierarchyArray && acc.hierarchyArray.length > 0 && (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell colSpan={columns.length + 2} className="p-0 border-0">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 border-b border-indigo-100 dark:border-indigo-900 shadow-inner">
                              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider px-1">
                                Raiz Hierárquica
                              </div>
                              <div className="flex flex-col rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                                {acc.hierarchyArray.map((node: any, i: number) => (
                                  <div
                                    key={node.classification}
                                    className={cn(
                                      'px-2 py-0.5 flex items-center justify-between text-[0.95em] h-6',
                                      getHierarchyNodeStyle(i),
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        className={cn(
                                          'font-mono text-[10px] font-bold px-1.5 py-0 rounded shadow-sm h-4 leading-tight flex items-center',
                                          getHierarchyBadgeStyle(i),
                                        )}
                                      >
                                        {node.classification}
                                      </Badge>
                                      <span className="font-semibold leading-none">
                                        {node.account_name}
                                      </span>
                                    </div>
                                    <div className="text-[11px] opacity-70 font-mono leading-none">
                                      Cód: {node.account_code || '-'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden flex-1 overflow-auto p-1">
            {visibleAccounts.map((acc) => {
              const org = organizations.find((o) => o.id === acc.organization_id)
              const theme = getTheme(org?.name)
              const isExpanded = expandedIds.has(acc.id)

              return (
                <Card
                  key={acc.id}
                  className={cn('border-l-4 shadow-sm bg-card overflow-hidden', theme.border)}
                >
                  <CardContent className="p-4 flex justify-between items-start">
                    <div className="space-y-3 flex-1 pr-4 text-foreground min-w-0">
                      {columns.map((col) => (
                        <div
                          key={col.id}
                          className={cn(
                            'flex items-center gap-2 text-[1em]',
                            col.id === 'organization_id' ||
                              col.id === 'code' ||
                              col.id === 'descricao'
                              ? 'font-bold'
                              : 'font-normal',
                            col.id === 'descricao' && 'text-[1.1em]',
                            col.id === 'contaContabil' && 'font-mono text-muted-foreground',
                            col.id === 'tipoConta' ? '!text-slate-800 dark:!text-slate-300' : '',
                            col.id === 'contaContabil' && !acc[col.id]
                              ? 'bg-amber-50 dark:bg-amber-950/20 p-1 rounded -mx-1'
                              : '',
                          )}
                        >
                          <span className="text-muted-foreground text-[0.85em] font-medium uppercase w-24 shrink-0 flex items-center gap-1">
                            {col.id === 'contaContabil' && !acc[col.id] && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                            {col.label}:
                          </span>
                          <div className="flex-1 min-w-0 flex items-center">
                            {' '}
                            <EditableCell
                              value={acc[col.id]}
                              field={col.id}
                              organizations={organizations}
                              isEditing={editing?.id === acc.id && editing?.field === col.id}
                              onEditStart={() => setEditing({ id: acc.id, field: col.id })}
                              onEditCommit={(val: string) =>
                                val !== acc[col.id]
                                  ? handleEditCommit(acc.id, col.id, val)
                                  : setEditing(null)
                              }
                              onEditCancel={() => setEditing(null)}
                              isChartNode={false}
                            />
                          </div>{' '}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 bg-background border-border justify-start"
                        onClick={() => setEditModalAccount(acc)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 bg-background border-border justify-start"
                        onClick={() => onDelete(acc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                      </Button>
                      {acc.hierarchyArray && acc.hierarchyArray.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 bg-background border-border justify-start"
                          onClick={() => toggleExpand(acc.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="h-3.5 w-3.5 mr-2" /> Recolher
                            </>
                          ) : (
                            <>
                              <ChevronRight className="h-3.5 w-3.5 mr-2" /> Expandir
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                  {isExpanded && acc.hierarchyArray && acc.hierarchyArray.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 border-t border-indigo-100 dark:border-indigo-900 shadow-inner">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider px-1">
                        Raiz Hierárquica
                      </div>
                      <div className="flex flex-col rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                        {acc.hierarchyArray.map((node: any, i: number) => (
                          <div
                            key={node.classification}
                            className={cn(
                              'px-2 py-1 flex flex-col gap-0.5 text-sm',
                              getHierarchyNodeStyle(i),
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  'font-mono text-[10px] font-bold px-1.5 py-0 rounded shadow-sm h-4 leading-tight flex items-center',
                                  getHierarchyBadgeStyle(i),
                                )}
                              >
                                {node.classification}
                              </Badge>
                              <span className="text-[11px] opacity-70 font-mono ml-auto leading-none">
                                Cód: {node.account_code || '-'}
                              </span>
                            </div>
                            <span className="font-semibold text-[12px] leading-tight">
                              {node.account_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Dialog
        open={isBulkEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsBulkEditOpen(false)
            setBulkEditData({})
            setBulkDragPos({ x: 0, y: 0 })
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[500px]"
          style={
            bulkDragPos.x !== 0 || bulkDragPos.y !== 0
              ? { marginLeft: bulkDragPos.x, marginTop: bulkDragPos.y }
              : undefined
          }
        >
          <DialogHeader
            className="cursor-move select-none p-3 -m-3 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            onPointerDown={handleBulkPointerDown}
            onPointerMove={handleBulkPointerMove}
            onPointerUp={handleBulkPointerUp}
          >
            <DialogTitle>Editar em Lote ({selectedIds.length} contas)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBulkEditSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nova Empresa</Label>
              <select
                value={bulkEditData.organization_id || ''}
                onChange={(e) =>
                  setBulkEditData({ ...bulkEditData, organization_id: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Manter original...</option>
                {organizations.map((org: Organization) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Novo Tipo de Conta</Label>
              <Select
                value={bulkEditData.tipoConta || 'NONE'}
                onValueChange={(val) =>
                  setBulkEditData({ ...bulkEditData, tipoConta: val === 'NONE' ? '' : val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Manter original..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Manter original...</SelectItem>
                  <SelectItem value="CAIXA">CAIXA</SelectItem>
                  <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                  <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                  <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                  <SelectItem value="OUTRAS">OUTRAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nova Classificação</Label>
              <Select
                value={bulkEditData.classificacao || 'NONE'}
                onValueChange={(val) =>
                  setBulkEditData({ ...bulkEditData, classificacao: val === 'NONE' ? '' : val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Manter original..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Manter original...</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Novo Banco</Label>
              <Input
                placeholder="Manter original..."
                value={bulkEditData.banco || ''}
                onChange={(e) => setBulkEditData({ ...bulkEditData, banco: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setIsBulkEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? 'Salvando...' : 'Aplicar a Todos'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editModalAccount}
        onOpenChange={(open) => {
          if (!open) {
            setEditModalAccount(null)
            setEditDragPos({ x: 0, y: 0 })
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[500px]"
          style={
            editDragPos.x !== 0 || editDragPos.y !== 0
              ? { marginLeft: editDragPos.x, marginTop: editDragPos.y }
              : undefined
          }
        >
          <DialogHeader
            className="cursor-move select-none p-3 -m-3 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            onPointerDown={handleEditPointerDown}
            onPointerMove={handleEditPointerMove}
            onPointerUp={handleEditPointerUp}
          >
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          {editModalAccount && (
            <form onSubmit={handleEditSave} className="space-y-4 mt-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="space-y-2 col-span-12">
                  <Label>Empresa</Label>
                  <select
                    value={editModalAccount.organization_id || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, organization_id: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Selecione...</option>
                    {organizations.map((org: Organization) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-4">
                  <Label>Código</Label>
                  <Input
                    value={editModalAccount.code || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, code: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-8">
                  <Label>Conta Contábil</Label>
                  <AccountCombobox
                    accounts={modalChartAccounts}
                    value={selectedChartAccountId}
                    onChange={(val) => {
                      const acc = modalChartAccounts.find((a) => a.id === val)
                      if (acc) {
                        setEditModalAccount({
                          ...editModalAccount,
                          contaContabil: acc.account_code,
                        })
                      }
                    }}
                    onClear={() => setEditModalAccount({ ...editModalAccount, contaContabil: '' })}
                    placeholder="Selecione a conta contábil..."
                    disabled={!editModalAccount.organization_id}
                  />
                </div>
                <div className="space-y-2 col-span-12">
                  <Label>Descrição</Label>
                  <Input
                    value={editModalAccount.descricao || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, descricao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-6">
                  <Label>Banco</Label>
                  <Input
                    value={editModalAccount.banco || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, banco: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-6">
                  <Label>Agência</Label>
                  <Input
                    value={editModalAccount.agencia || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, agencia: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-8">
                  <Label>Número da Conta</Label>
                  <Input
                    value={editModalAccount.numeroConta || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, numeroConta: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-4">
                  <Label>Dígito</Label>
                  <Input
                    value={editModalAccount.digitoConta || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, digitoConta: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-6">
                  <Label>Tipo Conta</Label>
                  <Select
                    value={editModalAccount.tipoConta || 'NONE'}
                    onValueChange={(val) =>
                      setEditModalAccount({
                        ...editModalAccount,
                        tipoConta: val === 'NONE' ? '' : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Selecione...</SelectItem>
                      <SelectItem value="CAIXA">CAIXA</SelectItem>
                      <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                      <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                      <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                      <SelectItem value="OUTRAS">OUTRAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-6">
                  <Label>Classificação</Label>
                  <Select
                    value={editModalAccount.classificacao || 'NONE'}
                    onValueChange={(val) =>
                      setEditModalAccount({
                        ...editModalAccount,
                        classificacao: val === 'NONE' ? '' : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Selecione...</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button type="button" variant="outline" onClick={() => setEditModalAccount(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
