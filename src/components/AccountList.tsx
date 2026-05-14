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
  CornerDownRight,
  GripVertical,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Account, Organization } from '@/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAuditLog } from '@/hooks/use-audit-log'
import { supabase } from '@/lib/supabase/client'

interface Props {
  accounts: any[]
  organizations: Organization[]
  onDelete: (id: string) => void
  onUpdateInline?: (id: string, field: string, value: string) => Promise<boolean>
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

const COLUMNS_DEF = [
  { id: 'organization_id', label: 'Empresa', width: 'w-[180px]' },
  { id: 'code', label: 'Código', width: 'w-[100px]' },
  { id: 'contaContabil', label: 'Conta Contábil', width: 'w-[140px]' },
  { id: 'descricao', label: 'Descrição', width: 'min-w-[200px]' },
  { id: 'banco', label: 'Banco', width: 'w-[100px]' },
  { id: 'agencia', label: 'Agência', width: 'w-[100px]' },
  { id: 'numeroConta', label: 'Conta', width: 'w-[120px]' },
  { id: 'digitoConta', label: 'Dígito', width: 'w-[80px]' },
  { id: 'tipoConta', label: 'Tipo', width: 'w-[120px]' },
  { id: 'classificacao', label: 'Classificação', width: 'w-[140px]' },
]

const getHierarchyNodeStyle = (nodeLevel: number, isSyntheticNode: boolean) => {
  if (!isSyntheticNode)
    return { backgroundColor: '#ffffff', color: '#334155', borderBottom: '1px solid #f1f5f9' }
  switch (nodeLevel) {
    case 1:
      return {
        backgroundColor: '#1e1b4b',
        color: '#ffffff',
        fontWeight: 700,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }
    case 2:
      return {
        backgroundColor: '#312e81',
        color: '#ffffff',
        fontWeight: 600,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }
    case 3:
      return {
        backgroundColor: '#3730a3',
        color: '#ffffff',
        fontWeight: 500,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }
    case 4:
      return {
        backgroundColor: '#e0e7ff',
        color: '#1e1b4b',
        fontWeight: 500,
        borderBottom: '1px solid #c7d2fe',
      }
    default:
      return {
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        fontWeight: 500,
        borderBottom: '1px solid #e2e8f0',
      }
  }
}

const getHierarchyBadgeStyle = (nodeLevel: number, isSyntheticNode: boolean) => {
  if (!isSyntheticNode)
    return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
  switch (nodeLevel) {
    case 1:
      return { backgroundColor: '#312e81', color: '#ffffff', border: '1px solid #3730a3' }
    case 2:
      return { backgroundColor: '#3730a3', color: '#ffffff', border: '1px solid #4338ca' }
    case 3:
      return { backgroundColor: '#4338ca', color: '#ffffff', border: '1px solid #4f46e5' }
    case 4:
      return { backgroundColor: '#c7d2fe', color: '#1e1b4b', border: '1px solid #a5b4fc' }
    default:
      return { backgroundColor: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1' }
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
          className="cursor-pointer hover:bg-muted/50 p-1 -m-1 rounded min-h-[28px] flex items-center"
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
        className="cursor-pointer hover:bg-muted/50 p-1 -m-1 rounded min-h-[28px] flex items-center"
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
          value || <span className="opacity-50 italic text-[0.85em]">Vazio</span>
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

  return (
    <Input
      ref={inputRef}
      value={tempVal}
      onChange={(e) => setTempVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-7 py-1 px-2 text-[1em] border-primary/50 focus-visible:ring-primary min-w-[100px]"
    />
  )
}

export function AccountList({ accounts, organizations, onDelete, onUpdateInline }: Props) {
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editModalAccount, setEditModalAccount] = useState<any | null>(null)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [bulkEditData, setBulkEditData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const { toast } = useToast()
  const { logAction } = useAuditLog()

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('bank_accounts_col_order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const missing = COLUMNS_DEF.map((c) => c.id).filter((id) => !parsed.includes(id))
        return [...parsed, ...missing]
      } catch {
        return COLUMNS_DEF.map((c) => c.id)
      }
    }
    return COLUMNS_DEF.map((c) => c.id)
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_col_order', JSON.stringify(columnOrder))
  }, [columnOrder])

  const [draggedCol, setDraggedCol] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, col: string) => {
    setDraggedCol(col)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, col: string) => {
    e.preventDefault()
    if (!draggedCol || draggedCol === col) return
    const newOrder = [...columnOrder]
    const fromIndex = newOrder.indexOf(draggedCol)
    const toIndex = newOrder.indexOf(col)
    newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, draggedCol)
    setColumnOrder(newOrder)
    setDraggedCol(null)
  }

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [hierarchies, setHierarchies] = useState<Record<string, any[]>>({})
  const [loadingHierarchies, setLoadingHierarchies] = useState<Record<string, boolean>>({})

  const toggleRow = async (acc: any) => {
    const newSet = new Set(expandedRows)
    if (newSet.has(acc.id)) {
      newSet.delete(acc.id)
      setExpandedRows(newSet)
    } else {
      newSet.add(acc.id)
      setExpandedRows(newSet)
      if (!hierarchies[acc.id] && !loadingHierarchies[acc.id]) {
        loadHierarchy(acc)
      }
    }
  }

  const expandAll = () => {
    const newSet = new Set<string>()
    accounts.forEach((acc) => {
      newSet.add(acc.id)
      if (!hierarchies[acc.id] && !loadingHierarchies[acc.id]) {
        loadHierarchy(acc)
      }
    })
    setExpandedRows(newSet)
  }

  const collapseAll = () => {
    setExpandedRows(new Set())
  }

  const loadHierarchy = async (acc: any) => {
    setLoadingHierarchies((prev) => ({ ...prev, [acc.id]: true }))
    try {
      const orgId = acc.organization_id
      const accountCode = acc.contaContabil
      if (!accountCode) {
        setHierarchies((prev) => ({ ...prev, [acc.id]: [] }))
        return
      }

      const { data: matches } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .or(`account_code.eq."${accountCode}",classification.eq."${accountCode}"`)
        .is('deleted_at', null)

      const targetAcc = matches && matches.length > 0 ? matches[0] : null

      if (!targetAcc || !targetAcc.classification) {
        setHierarchies((prev) => ({ ...prev, [acc.id]: [] }))
        return
      }

      const parts = targetAcc.classification.split('.')
      const prefixes = parts.map((_: any, i: number) => parts.slice(0, i + 1).join('.'))

      const { data: hierarchy } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .in('classification', prefixes)
        .is('deleted_at', null)
        .order('classification', { ascending: true })

      setHierarchies((prev) => ({ ...prev, [acc.id]: hierarchy || [] }))
    } catch (error) {
      console.error(error)
      setHierarchies((prev) => ({ ...prev, [acc.id]: [] }))
    } finally {
      setLoadingHierarchies((prev) => ({ ...prev, [acc.id]: false }))
    }
  }

  const [tableFontSize, setTableFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('bank_accounts_table_font_size')
    return saved ? parseInt(saved, 10) : 11
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_table_font_size', tableFontSize.toString())
  }, [tableFontSize])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedAccounts = useMemo(() => {
    let sortable = [...accounts]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'organization_id') {
          aVal = organizations.find((o: any) => o.id === a.organization_id)?.name || ''
          bVal = organizations.find((o: any) => o.id === b.organization_id)?.name || ''
        }

        if (aVal === undefined || aVal === null) aVal = ''
        if (bVal === undefined || bVal === null) bVal = ''
        aVal = String(aVal)
        bVal = String(bVal)

        if (aVal.toLowerCase() < bVal.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal.toLowerCase() > bVal.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [accounts, sortConfig, organizations])

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
        data: sortedAccounts.map((acc) => ({
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
    if (!val && field !== 'organization_id') {
      // Optional: add validation here if needed, but proceeding with empty string if intended
    }
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

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-muted-foreground bg-card rounded-xl border border-dashed border-border shadow-sm animate-in fade-in">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Building className="h-8 w-8 text-muted-foreground/70" />
        </div>
        <p className="text-lg font-semibold text-foreground">Nenhuma conta encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre uma nova conta ou ajuste os filtros.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          {selectedIds.length > 0 && (
            <div className="bg-muted/50 border border-border rounded-md p-2 px-3 flex items-center gap-4 animate-in fade-in">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.length} item(ns) selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBulkEditOpen(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" /> Editar em Lote
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Excluir Selecionados
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="hidden sm:flex gap-1 border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronDown className="h-3.5 w-3.5" /> Expandir Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="hidden sm:flex gap-1 border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-3.5 w-3.5" /> Recolher Todos
          </Button>
          <div
            className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md p-0.5 border border-slate-200 dark:border-slate-800 shadow-sm"
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
              <Button variant="outline" className="gap-2">
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
              <Button className="gap-2 bg-cyan-400 hover:bg-cyan-500 text-white border-none">
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

      <div className="hidden lg:block rounded-xl border-2 border-indigo-950 bg-card shadow-sm overflow-x-auto">
        <Table className="border-collapse min-w-full" style={{ fontSize: `${tableFontSize}px` }}>
          <TableHeader className="bg-indigo-950">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-12 text-center py-2 px-2 text-white font-normal text-[1.1em] border-0">
                <Checkbox
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-950"
                  checked={
                    sortedAccounts.length > 0 && selectedIds.length === sortedAccounts.length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedIds(sortedAccounts.map((a) => a.id))
                    else setSelectedIds([])
                  }}
                />
              </TableHead>
              <TableHead className="w-10 py-2 px-2 text-white border-0"></TableHead>
              {columnOrder.map((colId) => {
                const colDef = COLUMNS_DEF.find((c) => c.id === colId)
                if (!colDef) return null
                return (
                  <TableHead
                    key={colDef.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, colDef.id)}
                    onDragOver={(e) => handleDragOver(e, colDef.id)}
                    onDrop={(e) => handleDrop(e, colDef.id)}
                    onClick={() => handleSort(colDef.id)}
                    className={cn(
                      'cursor-pointer hover:bg-indigo-950/80 py-2 px-2 text-white font-normal text-[1.1em] border-0 transition-opacity',
                      colDef.width,
                      draggedCol === colDef.id &&
                        'opacity-30 border-dashed border-2 border-white/50',
                    )}
                  >
                    <div className="flex items-center gap-2 select-none group whitespace-nowrap">
                      <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing shrink-0" />
                      {colDef.label} <ArrowUpDown className="h-3 w-3 opacity-50 shrink-0" />
                    </div>
                  </TableHead>
                )
              })}
              <TableHead className="text-right py-2 px-2 text-white font-normal text-[1.1em] border-0">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAccounts.map((acc, index) => {
              const isEven = index % 2 === 1
              const isExpanded = expandedRows.has(acc.id)
              return (
                <Fragment key={acc.id}>
                  <TableRow className="border-0 group/row text-[1em] odd:bg-transparent odd:text-black dark:odd:text-white even:bg-[#bfdbfe] even:text-black dark:even:text-black hover:even:bg-[#93c5fd] hover:odd:bg-muted/50 transition-colors">
                    <TableCell className="text-center py-2 px-2 border-0">
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
                    <TableCell className="py-2 px-2 border-0 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-6 w-6 rounded-full hover:bg-black/10',
                          isExpanded && 'bg-black/5',
                        )}
                        onClick={() => toggleRow(acc)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    {columnOrder.map((field) => (
                      <TableCell
                        key={field}
                        className={cn(
                          'py-2 px-2 border-0',
                          field === 'contaContabil' ? 'font-mono' : '',
                          field === 'organization_id' || field === 'descricao'
                            ? 'font-bold'
                            : 'font-normal',
                          field === 'tipoConta' ? '!text-black dark:!text-black' : '',
                        )}
                      >
                        <EditableCell
                          value={acc[field as keyof typeof acc]}
                          field={field}
                          organizations={organizations}
                          isEditing={editing?.id === acc.id && editing?.field === field}
                          onEditStart={() => setEditing({ id: acc.id, field })}
                          onEditCommit={(val: string) =>
                            val !== acc[field as keyof typeof acc]
                              ? handleEditCommit(acc.id, field, val)
                              : setEditing(null)
                          }
                          onEditCancel={() => setEditing(null)}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right py-2 px-2 border-0">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 transition-colors',
                            isEven
                              ? 'text-black/70 hover:text-indigo-950 hover:bg-black/10'
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                          )}
                          onClick={() => setEditModalAccount(acc)}
                        >
                          <Edit className="h-4 w-4 mr-1.5" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 transition-colors',
                            isEven
                              ? 'text-black/70 hover:text-red-700 hover:bg-red-500/20'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                          )}
                          onClick={() => onDelete(acc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="border-0 bg-slate-50 dark:bg-slate-900/50">
                      <TableCell colSpan={columnOrder.length + 3} className="p-0 border-0">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 shadow-inner border-y border-slate-200 dark:border-slate-800">
                          <div className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                            <CornerDownRight className="h-4 w-4" /> Raiz Hierárquica da Conta
                            Vinculada
                          </div>
                          {loadingHierarchies[acc.id] ? (
                            <div className="text-sm text-slate-500 p-2 animate-pulse">
                              Carregando hierarquia...
                            </div>
                          ) : hierarchies[acc.id]?.length > 0 ? (
                            <div className="flex flex-col rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ml-6">
                              {hierarchies[acc.id].map((node) => {
                                const level = (node.classification?.match(/\./g) || []).length + 1
                                const isSyn = node.account_level === 'Sintética'
                                return (
                                  <div
                                    key={node.id}
                                    className="flex items-center gap-3 p-2"
                                    style={getHierarchyNodeStyle(level, isSyn)}
                                  >
                                    <span
                                      className="font-mono text-xs px-2 py-0.5 rounded shadow-sm"
                                      style={getHierarchyBadgeStyle(level, isSyn)}
                                    >
                                      {node.classification}
                                    </span>
                                    <span className="text-sm font-medium">{node.account_name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500 p-2 italic ml-6 border-l-2 border-slate-300 pl-4">
                              Nenhuma hierarquia encontrada. Verifique se a Conta Contábil "
                              {acc.contaContabil || ''}" está mapeada corretamente no Plano de
                              Contas.
                            </div>
                          )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {sortedAccounts.map((acc) => {
          const org = organizations.find((o) => o.id === acc.organization_id)
          const theme = getTheme(org?.name)
          const isExpanded = expandedRows.has(acc.id)
          return (
            <Card key={acc.id} className={cn('border-l-4 shadow-sm bg-card', theme.border)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1 pr-4 text-foreground">
                    {(
                      [
                        'organization_id',
                        'code',
                        'descricao',
                        'contaContabil',
                        'tipoConta',
                        'classificacao',
                      ] as const
                    ).map((field) => (
                      <div
                        key={field}
                        className={cn(
                          'flex items-center gap-2 text-[1em]',
                          field === 'organization_id' || field === 'descricao'
                            ? 'font-bold'
                            : 'font-normal',
                          field === 'descricao' && 'text-[1.1em]',
                          field === 'contaContabil' && 'font-mono text-muted-foreground',
                          field === 'tipoConta' ? '!text-black dark:!text-black' : '',
                        )}
                      >
                        {(field === 'tipoConta' || field === 'classificacao') && (
                          <span className="text-muted-foreground text-[0.85em] font-medium uppercase w-24">
                            {field === 'tipoConta' ? 'Tipo:' : 'Classificação:'}
                          </span>
                        )}
                        <div className="flex-1">
                          <EditableCell
                            value={acc[field]}
                            field={field}
                            organizations={organizations}
                            isEditing={editing?.id === acc.id && editing?.field === field}
                            onEditStart={() => setEditing({ id: acc.id, field })}
                            onEditCommit={(val: string) =>
                              val !== acc[field]
                                ? handleEditCommit(acc.id, field, val)
                                : setEditing(null)
                            }
                            onEditCancel={() => setEditing(null)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 bg-background border-border"
                      onClick={() => toggleRow(acc)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
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
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                      <CornerDownRight className="h-4 w-4" /> Raiz Hierárquica
                    </div>
                    {loadingHierarchies[acc.id] ? (
                      <div className="text-sm text-slate-500 p-2 animate-pulse">
                        Carregando hierarquia...
                      </div>
                    ) : hierarchies[acc.id]?.length > 0 ? (
                      <div className="flex flex-col rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        {hierarchies[acc.id].map((node) => {
                          const level = (node.classification?.match(/\./g) || []).length + 1
                          const isSyn = node.account_level === 'Sintética'
                          return (
                            <div
                              key={node.id}
                              className="flex items-center gap-3 p-2"
                              style={getHierarchyNodeStyle(level, isSyn)}
                            >
                              <span
                                className="font-mono text-xs px-2 py-0.5 rounded shadow-sm"
                                style={getHierarchyBadgeStyle(level, isSyn)}
                              >
                                {node.classification}
                              </span>
                              <span className="text-sm font-medium">{node.account_name}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 p-2 italic border-l-2 border-slate-300 pl-4">
                        Nenhuma hierarquia encontrada.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={isBulkEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsBulkEditOpen(false)
            setBulkEditData({})
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
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
              <Input
                placeholder="Manter original..."
                value={bulkEditData.tipoConta || ''}
                onChange={(e) => setBulkEditData({ ...bulkEditData, tipoConta: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nova Classificação</Label>
              <Input
                placeholder="Manter original..."
                value={bulkEditData.classificacao || ''}
                onChange={(e) =>
                  setBulkEditData({ ...bulkEditData, classificacao: e.target.value })
                }
              />
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

      <Dialog open={!!editModalAccount} onOpenChange={(open) => !open && setEditModalAccount(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          {editModalAccount && (
            <form onSubmit={handleEditSave} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Empresa</Label>
                  <select
                    value={editModalAccount.organization_id || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, organization_id: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={editModalAccount.code || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, code: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta Contábil</Label>
                  <Input
                    value={editModalAccount.contaContabil || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, contaContabil: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={editModalAccount.descricao || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, descricao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={editModalAccount.banco || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, banco: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input
                    value={editModalAccount.agencia || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, agencia: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número da Conta</Label>
                    <Input
                      value={editModalAccount.numeroConta || ''}
                      onChange={(e) =>
                        setEditModalAccount({ ...editModalAccount, numeroConta: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dígito</Label>
                    <Input
                      value={editModalAccount.digitoConta || ''}
                      onChange={(e) =>
                        setEditModalAccount({ ...editModalAccount, digitoConta: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Conta</Label>
                    <Input
                      value={editModalAccount.tipoConta || ''}
                      onChange={(e) =>
                        setEditModalAccount({ ...editModalAccount, tipoConta: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Classificação</Label>
                    <Input
                      value={editModalAccount.classificacao || ''}
                      onChange={(e) =>
                        setEditModalAccount({ ...editModalAccount, classificacao: e.target.value })
                      }
                    />
                  </div>
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
