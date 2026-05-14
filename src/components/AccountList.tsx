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
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
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
import { Organization } from '@/types'
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

const getRowStyle = (acc: any) => {
  if (acc.isChartNode) {
    if (acc.level === 0)
      return 'font-bold bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border-b border-indigo-100 dark:border-indigo-900'
    if (acc.level === 1)
      return 'font-semibold bg-slate-50/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-300'
    return 'font-medium bg-slate-50/40 dark:bg-slate-900/40'
  }
  return ''
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
            'p-1 -m-1 rounded min-h-[28px] flex items-center',
            !isChartNode && 'cursor-pointer hover:bg-muted/50',
          )}
          onClick={onEditStart}
        >
          <Badge
            variant="outline"
            className={cn('py-0.5 whitespace-nowrap shadow-sm', theme.badge)}
          >
            {org?.name || (isChartNode ? '-' : 'Desconhecida')}
          </Badge>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'p-1 -m-1 rounded min-h-[28px] flex items-center w-full min-w-0',
          !isChartNode && 'cursor-pointer hover:bg-muted/50',
        )}
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
          <span
            className={cn(
              'truncate w-full block',
              isChartNode &&
                field === 'descricao' &&
                'font-bold text-indigo-900 dark:text-indigo-200',
            )}
          >
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

  return (
    <Input
      ref={inputRef}
      value={tempVal}
      onChange={(e) => setTempVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-7 py-1 px-2 text-[1em] border-primary/50 focus-visible:ring-primary min-w-[100px] w-full"
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

  const accountsWithHierarchy = useMemo(() => {
    let sortable = [...accounts]

    sortable = sortable.map((a) => ({
      ...a,
      hierarchyPath: String(a.hierarchyPath ?? a.classificacao ?? a.code ?? '').trim(),
    }))

    if (!sortConfig) {
      sortable.sort((a, b) => a.hierarchyPath.localeCompare(b.hierarchyPath))
    } else {
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
    }

    const pathToId = new Map<string, string>()
    sortable.forEach((a) => {
      if (a.hierarchyPath) pathToId.set(a.hierarchyPath, a.id)
    })

    return sortable.map((a) => {
      const parts = (a.hierarchyPath || '').split('.')
      let parentId = null
      let tempParts = [...parts]
      while (tempParts.length > 1) {
        tempParts.pop()
        const parentPath = tempParts.join('.')
        if (pathToId.has(parentPath)) {
          parentId = pathToId.get(parentPath)
          break
        }
      }

      const hasChildren = sortable.some(
        (b) =>
          b.hierarchyPath &&
          b.hierarchyPath.startsWith(a.hierarchyPath + '.') &&
          b.hierarchyPath !== a.hierarchyPath,
      )

      return {
        ...a,
        parentId,
        hasChildren,
        level: parts.length > 0 && a.hierarchyPath ? parts.length - 1 : 0,
      }
    })
  }, [accounts, sortConfig, organizations])

  const visibleAccounts = useMemo(() => {
    if (sortConfig !== null) return accountsWithHierarchy.filter((a) => !a.isChartNode)

    return accountsWithHierarchy.filter((a) => {
      if (!a.parentId) return true
      let current = a
      while (current.parentId) {
        if (!expandedIds.has(current.parentId)) return false
        const parent = accountsWithHierarchy.find((x) => x.id === current.parentId)
        if (!parent) break
        current = parent
      }
      return true
    })
  }, [accountsWithHierarchy, expandedIds, sortConfig])

  const toggleExpandAll = () => {
    if (expandedIds.size > 0) setExpandedIds(new Set())
    else {
      const allWithChildren = accountsWithHierarchy.filter((a) => a.hasChildren).map((a) => a.id)
      setExpandedIds(new Set(allWithChildren))
    }
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
        data: visibleAccounts
          .filter((a) => !a.isChartNode)
          .map((acc) => ({
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

  const selectableAccounts = visibleAccounts.filter((a) => !a.isChartNode)

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

          <Button
            variant="outline"
            className="gap-2"
            onClick={toggleExpandAll}
            title="Expandir/Recolher Todos"
          >
            <ListTree className="h-4 w-4" /> {expandedIds.size > 0 ? 'Recolher' : 'Expandir'}
          </Button>

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

      <div className="hidden lg:block rounded-xl border-2 border-indigo-950 bg-card shadow-sm overflow-hidden">
        <Table className="border-collapse" style={{ fontSize: `${tableFontSize}px` }}>
          <TableHeader className="bg-indigo-950">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-12 text-center py-2 px-2 text-white font-normal text-[1.1em] border-0">
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
                  className="cursor-move hover:bg-indigo-950/80 py-2 px-2 text-white font-normal text-[1.1em] border-0 select-none"
                >
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
              <TableHead className="text-right py-2 px-2 text-white font-normal text-[1.1em] border-0 w-24">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAccounts.map((acc, index) => {
              const isEven = index % 2 === 1
              const rowStyle = sortConfig === null ? getRowStyle(acc) : ''

              return (
                <TableRow
                  key={acc.id}
                  className={cn(
                    'border-0 group/row text-[1em] transition-colors',
                    isEven ? 'bg-[#bfdbfe]/40 dark:bg-slate-800/40' : 'bg-transparent',
                    'hover:bg-muted/50 dark:hover:bg-slate-700/50',
                    rowStyle,
                  )}
                >
                  <TableCell className="text-center py-2 px-2 border-0">
                    {!acc.isChartNode && (
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
                    )}
                  </TableCell>

                  {columns.map((col) => {
                    const isCodeCol = col.id === 'code' || col.id === 'descricao'
                    const showHierarchy = !sortConfig && col.id === 'descricao'

                    return (
                      <TableCell
                        key={col.id}
                        className={cn(
                          'py-2 px-2 border-0',
                          col.id === 'contaContabil' ? 'font-mono text-[0.95em]' : '',
                          isCodeCol && !rowStyle ? 'font-medium' : '',
                          col.id === 'tipoConta' ? '!text-slate-800 dark:!text-slate-300' : '',
                        )}
                      >
                        <div className="flex items-center gap-1 w-full min-w-0">
                          {showHierarchy && (
                            <div
                              className="flex items-center shrink-0"
                              style={{ paddingLeft: `${acc.level * 1.5}rem` }}
                            >
                              {acc.hasChildren ? (
                                <button
                                  onClick={() => toggleExpand(acc.id)}
                                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded mr-1 transition-colors"
                                >
                                  {expandedIds.has(acc.id) ? (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-5 h-5 mr-1 inline-block shrink-0" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <EditableCell
                              value={acc[col.id]}
                              field={col.id}
                              organizations={organizations}
                              isEditing={editing?.id === acc.id && editing?.field === col.id}
                              onEditStart={() =>
                                !acc.isChartNode && setEditing({ id: acc.id, field: col.id })
                              }
                              onEditCommit={(val: string) =>
                                val !== acc[col.id]
                                  ? handleEditCommit(acc.id, col.id, val)
                                  : setEditing(null)
                              }
                              onEditCancel={() => setEditing(null)}
                              isChartNode={acc.isChartNode}
                            />
                          </div>
                        </div>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right py-2 px-2 border-0">
                    {!acc.isChartNode && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-7 w-7 transition-colors',
                            isEven
                              ? 'text-black/70 hover:text-indigo-950 hover:bg-black/10'
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                          )}
                          onClick={() => setEditModalAccount(acc)}
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-7 w-7 transition-colors',
                            isEven
                              ? 'text-black/70 hover:text-red-700 hover:bg-red-500/20'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                          )}
                          onClick={() => onDelete(acc.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {visibleAccounts.map((acc) => {
          if (acc.isChartNode) {
            return (
              <div
                key={acc.id}
                className="col-span-1 md:col-span-2 bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-md flex items-center gap-2"
              >
                <div
                  style={{ paddingLeft: `${acc.level * 1}rem` }}
                  className="flex items-center gap-2"
                >
                  {acc.hasChildren ? (
                    <button
                      onClick={() => toggleExpand(acc.id)}
                      className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded"
                    >
                      {expandedIds.has(acc.id) ? (
                        <ChevronDown className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                      )}
                    </button>
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                    {acc.classificacao} - {acc.descricao}
                  </span>
                </div>
              </div>
            )
          }

          const org = organizations.find((o) => o.id === acc.organization_id)
          const theme = getTheme(org?.name)
          const rowStyle = sortConfig === null ? getRowStyle(acc) : ''

          return (
            <Card
              key={acc.id}
              className={cn('border-l-4 shadow-sm bg-card', theme.border, rowStyle)}
            >
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-3 flex-1 pr-4 text-foreground min-w-0">
                  {columns.map((col) => (
                    <div
                      key={col.id}
                      className={cn(
                        'flex items-center gap-2 text-[1em]',
                        col.id === 'organization_id' || col.id === 'code' || col.id === 'descricao'
                          ? 'font-bold'
                          : 'font-normal',
                        col.id === 'descricao' && 'text-[1.1em]',
                        col.id === 'contaContabil' && 'font-mono text-muted-foreground',
                        col.id === 'tipoConta' ? '!text-slate-800 dark:!text-slate-300' : '',
                      )}
                    >
                      <span className="text-muted-foreground text-[0.85em] font-medium uppercase w-24 shrink-0">
                        {col.label}:
                      </span>
                      <div className="flex-1 min-w-0 flex items-center">
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
                          isChartNode={acc.isChartNode}
                        />
                      </div>
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
                </div>
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
