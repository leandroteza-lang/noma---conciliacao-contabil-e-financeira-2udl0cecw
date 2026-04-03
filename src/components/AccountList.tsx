import {
  Trash2,
  Building,
  ArrowUpDown,
  Download,
  FileText,
  FileSpreadsheet,
  Edit,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
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
import { supabase } from '@/lib/supabase/client'

interface Props {
  accounts: Account[]
  organizations: Organization[]
  onDelete: (id: string) => void
  onUpdateInline?: (id: string, field: keyof Account, value: string) => Promise<boolean>
}

const getTheme = (name: string | null | undefined) => {
  const n = name?.toUpperCase() || ''
  if (n.includes('NOMA PARTS'))
    return { badge: 'bg-blue-100 text-blue-800', border: 'border-blue-500' }
  if (n.includes('LS ALMEIDA'))
    return { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-500' }
  if (n.includes('NOMA SERVICE'))
    return { badge: 'bg-orange-100 text-orange-800', border: 'border-orange-500' }
  if (n.includes('PF'))
    return { badge: 'bg-purple-100 text-purple-800', border: 'border-purple-500' }
  return { badge: 'bg-slate-100 text-slate-800', border: 'border-slate-500' }
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
          className="cursor-pointer hover:bg-slate-100/50 p-1 -m-1 rounded min-h-[28px] flex items-center"
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
        className="cursor-pointer hover:bg-slate-100/50 p-1 -m-1 rounded min-h-[28px] flex items-center"
        onClick={onEditStart}
      >
        {field === 'classificacao' ? (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200"
          >
            {value}
          </Badge>
        ) : (
          value || <span className="text-slate-300 italic text-xs">Vazio</span>
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
        className="w-full text-sm border border-blue-400 rounded p-1 outline-none ring-2 ring-blue-500/20 bg-white"
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
      className="h-7 py-1 px-2 text-sm border-blue-400 focus-visible:ring-blue-500 min-w-[100px]"
    />
  )
}

export function AccountList({ accounts, organizations, onDelete, onUpdateInline }: Props) {
  const [editing, setEditing] = useState<{ id: string; field: keyof Account } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editModalAccount, setEditModalAccount] = useState<Account | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Account
    direction: 'asc' | 'desc'
  } | null>(null)
  const { toast } = useToast()

  const handleSort = (key: keyof Account) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const sortedAccounts = useMemo(() => {
    let sortable = [...accounts]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] as string
        let bVal = b[sortConfig.key] as string

        if (sortConfig.key === 'organization_id') {
          aVal = organizations.find((o: any) => o.id === a.organization_id)?.name || ''
          bVal = organizations.find((o: any) => o.id === b.organization_id)?.name || ''
        }

        if (!aVal) aVal = ''
        if (!bVal) bVal = ''

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
      toast({ title: 'Sucesso', description: 'Exclusão solicitada com sucesso.' })
      setSelectedIds([])
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

  const handleEditCommit = async (id: string, field: keyof Account, val: string) => {
    if (!val && field !== 'organization_id') {
      // Optional: add validation here if needed, but proceeding with empty string if intended
    }
    if (onUpdateInline) {
      await onUpdateInline(id, field, val)
    }
    setEditing(null)
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalAccount) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({
          organization_id: editModalAccount.organization_id,
          account_code: editModalAccount.contaContabil,
          description: editModalAccount.descricao,
          bank_code: editModalAccount.banco,
          agency: editModalAccount.agencia,
          account_number: editModalAccount.numeroConta,
          classification: editModalAccount.classificacao,
        })
        .eq('id', editModalAccount.id)

      if (error) throw error
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
      <div className="flex flex-col items-center justify-center py-16 px-4 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm animate-in fade-in">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Building className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-slate-700">Nenhuma conta encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          {selectedIds.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-2 px-3 flex items-center gap-4 animate-in fade-in">
              <span className="text-sm font-medium text-slate-700">
                {selectedIds.length} item(ns) selecionado(s)
              </span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Excluir Selecionados
              </Button>
            </div>
          )}
        </div>
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
            <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer gap-2">
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
      </div>

      <div className="hidden lg:block rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-12 text-center">
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
                className="w-[180px] cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('organization_id')}
              >
                <div className="flex items-center gap-2">
                  Empresa <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('contaContabil')}
              >
                <div className="flex items-center gap-2">
                  Conta Contábil <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('descricao')}
              >
                <div className="flex items-center gap-2">
                  Descrição <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('banco')}
              >
                <div className="flex items-center gap-2">
                  Banco <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('agencia')}
              >
                <div className="flex items-center gap-2">
                  Agência <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('numeroConta')}
              >
                <div className="flex items-center gap-2">
                  Número Conta <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('classificacao')}
              >
                <div className="flex items-center gap-2">
                  Classificação <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAccounts.map((acc) => (
              <TableRow key={acc.id} className="group hover:bg-slate-50/50">
                <TableCell className="text-center">
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
                    'classificacao',
                  ] as const
                ).map((field) => (
                  <TableCell
                    key={field}
                    className={field === 'contaContabil' ? 'font-mono text-xs' : ''}
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => setEditModalAccount(acc)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(acc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
            <Card key={acc.id} className={cn('border-l-4 shadow-sm', theme.border)}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-3 flex-1 pr-4">
                  {(['organization_id', 'descricao', 'contaContabil'] as const).map((field) => (
                    <div
                      key={field}
                      className={
                        field === 'descricao'
                          ? 'font-bold text-lg'
                          : field === 'contaContabil'
                            ? 'font-mono text-xs text-slate-500'
                            : ''
                      }
                    >
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
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 bg-white"
                    onClick={() => setEditModalAccount(acc)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 bg-white"
                    onClick={() => onDelete(acc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <Label>Classificação</Label>
                  <Input
                    value={editModalAccount.classificacao || ''}
                    onChange={(e) =>
                      setEditModalAccount({ ...editModalAccount, classificacao: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setEditModalAccount(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
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
