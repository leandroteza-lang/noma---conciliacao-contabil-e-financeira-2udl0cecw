import {
  Trash2,
  Building,
  ArrowUpDown,
  Download,
  FileText,
  FileSpreadsheet,
  Edit,
  Upload,
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
  return { badge: 'bg-muted text-foreground', border: 'border-border' }
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
            className="bg-muted text-foreground font-normal hover:bg-muted/80"
          >
            {value}
          </Badge>
        ) : (
          value || <span className="text-muted-foreground/50 italic text-xs">Vazio</span>
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
        className="w-full text-sm border border-primary/50 rounded p-1 outline-none ring-2 ring-primary/20 bg-background text-foreground"
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
      className="h-7 py-1 px-2 text-sm border-primary/50 focus-visible:ring-primary min-w-[100px]"
    />
  )
}

export function AccountList({ accounts, organizations, onDelete, onUpdateInline }: Props) {
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editModalAccount, setEditModalAccount] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const { toast } = useToast()
  const { logAction } = useAuditLog()

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
        await logAction('bank_accounts', id, 'DELETE', {
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

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser') => {
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

      if (formatType === 'excel') {
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
      } else if (formatType === 'browser') {
        if (win) {
          win.document.open()
          win.document.write(
            `<iframe src="${result.pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
          )
          win.document.close()
        }
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'contas.pdf'
        link.click()
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
        await logAction('bank_accounts', id, 'UPDATE', {
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
          await logAction('bank_accounts', editModalAccount.id, 'UPDATE', changes)
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
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Excluir Selecionados
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport('browser')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> Abrir no Browser
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel (XLSX)
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

      <div className="hidden lg:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center p-2">
                <Checkbox
                  checked={
                    sortedAccounts.length > 0 && selectedIds.length === sortedAccounts.length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedIds(sortedAccounts.map((a) => a.id))
                    else setSelectedIds([])
                  }}
                />
              </TableHead>
              <TableHead
                className="w-[180px] cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('organization_id')}
              >
                <div className="flex items-center gap-2">
                  Empresa <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('contaContabil')}
              >
                <div className="flex items-center gap-2">
                  Conta Contábil <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('descricao')}
              >
                <div className="flex items-center gap-2">
                  Descrição <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('banco')}
              >
                <div className="flex items-center gap-2">
                  Banco <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('agencia')}
              >
                <div className="flex items-center gap-2">
                  Agência <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('numeroConta')}
              >
                <div className="flex items-center gap-2">
                  Conta <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('digitoConta')}
              >
                <div className="flex items-center gap-2">
                  Dígito <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('tipoConta')}
              >
                <div className="flex items-center gap-2">
                  Tipo <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted p-2"
                onClick={() => handleSort('classificacao')}
              >
                <div className="flex items-center gap-2">
                  Classificação <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-right p-2">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAccounts.map((acc) => (
              <TableRow key={acc.id} className="group hover:bg-muted/50">
                <TableCell className="text-center p-2">
                  <Checkbox
                    checked={selectedIds.includes(acc.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds((prev) => [...prev, acc.id])
                      else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                    }}
                  />
                </TableCell>
                {(
                  [
                    'organization_id',
                    'contaContabil',
                    'descricao',
                    'banco',
                    'agencia',
                    'numeroConta',
                    'digitoConta',
                    'tipoConta',
                    'classificacao',
                  ] as const
                ).map((field) => (
                  <TableCell
                    key={field}
                    className={cn('p-2', field === 'contaContabil' ? 'font-mono text-xs' : '')}
                  >
                    <EditableCell
                      value={acc[field]}
                      field={field}
                      organizations={organizations}
                      isEditing={editing?.id === acc.id && editing?.field === field}
                      onEditStart={() => setEditing({ id: acc.id, field })}
                      onEditCommit={(val: string) =>
                        val !== acc[field] ? handleEditCommit(acc.id, field, val) : setEditing(null)
                      }
                      onEditCancel={() => setEditing(null)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right p-2">
                  <div className="flex justify-end gap-2 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setEditModalAccount(acc)}
                    >
                      <Edit className="h-4 w-4 mr-1.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(acc.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {sortedAccounts.map((acc) => {
          const org = organizations.find((o) => o.id === acc.organization_id)
          const theme = getTheme(org?.name)
          return (
            <Card key={acc.id} className={cn('border-l-4 shadow-sm bg-card', theme.border)}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-3 flex-1 pr-4 text-foreground">
                  {(
                    [
                      'organization_id',
                      'descricao',
                      'contaContabil',
                      'tipoConta',
                      'classificacao',
                    ] as const
                  ).map((field) => (
                    <div
                      key={field}
                      className={cn(
                        'flex items-center gap-2',
                        field === 'descricao' && 'font-bold text-lg',
                        field === 'contaContabil' && 'font-mono text-xs text-muted-foreground',
                        (field === 'tipoConta' || field === 'classificacao') && 'text-sm',
                      )}
                    >
                      {(field === 'tipoConta' || field === 'classificacao') && (
                        <span className="text-muted-foreground text-xs font-medium uppercase w-24">
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
