import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, X, Edit2, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export default function EntryList({
  orgId,
  accounts,
  costCenters,
  refreshKey,
}: {
  orgId: string
  accounts: any[]
  costCenters: any[]
  refreshKey: number
}) {
  const [entries, setEntries] = useState<any[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState('Todos')
  const [ccFilter, setCcFilter] = useState('Todos')
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const fetchEntries = async () => {
    let q = supabase
      .from('accounting_entries')
      .select('*')
      .eq('organization_id', orgId)
      .order('entry_date', { ascending: false })
      .limit(200)

    if (dateFrom) q = q.gte('entry_date', dateFrom)
    if (dateTo) q = q.lte('entry_date', dateTo)
    if (status !== 'Todos') q = q.eq('status', status)
    if (ccFilter !== 'Todos') q = q.eq('cost_center_id', ccFilter)

    const { data } = await q
    if (data) setEntries(data)
  }

  useEffect(() => {
    if (orgId) {
      fetchEntries()

      const channel = supabase
        .channel('accounting_entries_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'accounting_entries',
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            fetchEntries()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [orgId, refreshKey, dateFrom, dateTo, status, ccFilter])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('accounting_entries').delete().eq('id', id)
    if (error) return toast.error('Erro ao excluir lançamento')
    toast.success('Excluído com sucesso')
  }

  const handleEdit = (entry: any) => {
    setEditId(entry.id)
    setEditForm({
      date: entry.entry_date || '',
      desc: entry.description || '',
      amount: entry.amount || '',
      cc: entry.cost_center_id || 'none',
      deb: entry.debit_account_id || '',
      cred: entry.credit_account_id || '',
      status: entry.status || 'Pendente',
    })
  }

  const handleSave = async (id: string) => {
    if (editForm.deb === editForm.cred) return toast.error('Débito e crédito não podem ser iguais.')
    const amt = parseFloat(editForm.amount)
    if (isNaN(amt) || amt <= 0) return toast.error('Valor inválido.')

    const { error } = await supabase
      .from('accounting_entries')
      .update({
        entry_date: editForm.date,
        description: editForm.desc,
        amount: amt,
        cost_center_id: editForm.cc === 'none' ? null : editForm.cc,
        debit_account_id: editForm.deb,
        credit_account_id: editForm.cred,
        status: editForm.status,
      } as any)
      .eq('id', id)

    if (error) return toast.error('Erro ao salvar')
    setEditId(null)
    toast.success('Lançamento atualizado!')
  }

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.account_name || '-'
  const getCcCode = (id: string) => costCenters?.find((c) => c.id === id)?.code || '-'
  const formatCur = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-slate-50 p-4 rounded-md border border-slate-100">
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Centro de Custo</Label>
          <Select value={ccFilter} onValueChange={setCcFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {costCenters?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} - {c.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setDateFrom('')
            setDateTo('')
            setCcFilter('Todos')
            setStatus('Todos')
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[110px]">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]">Valor</TableHead>
              <TableHead className="w-[120px]">C. Custo</TableHead>
              <TableHead className="w-[180px]">Conta Débito</TableHead>
              <TableHead className="w-[180px]">Conta Crédito</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  Nenhum lançamento encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
            {entries.map((e) =>
              editId === e.id ? (
                <TableRow key={e.id} className="bg-slate-50/50">
                  <TableCell className="p-2">
                    <Input
                      type="date"
                      className="w-full h-8 px-2"
                      value={editForm.date}
                      onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      className="w-full h-8 px-2"
                      value={editForm.desc}
                      onChange={(ev) => setEditForm({ ...editForm, desc: ev.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      className="w-full h-8 px-2"
                      value={editForm.amount}
                      onChange={(ev) => setEditForm({ ...editForm, amount: ev.target.value })}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Select
                      value={editForm.cc}
                      onValueChange={(v) => setEditForm({ ...editForm, cc: v })}
                    >
                      <SelectTrigger className="w-full h-8 px-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {costCenters?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Select
                      value={editForm.deb}
                      onValueChange={(v) => setEditForm({ ...editForm, deb: v })}
                    >
                      <SelectTrigger className="w-full h-8 px-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Select
                      value={editForm.cred}
                      onValueChange={(v) => setEditForm({ ...editForm, cred: v })}
                    >
                      <SelectTrigger className="w-full h-8 px-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <Select
                      value={editForm.status}
                      onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                    >
                      <SelectTrigger className="w-full h-8 px-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSave(e.id)}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditId(null)}
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">
                    {e.entry_date ? e.entry_date.split('-').reverse().join('/') : '-'}
                  </TableCell>
                  <TableCell
                    className="font-medium text-sm truncate max-w-[200px]"
                    title={e.description}
                  >
                    {e.description}
                  </TableCell>
                  <TableCell className="text-sm">{formatCur(e.amount)}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {e.cost_center_id ? getCcCode(e.cost_center_id) : '-'}
                  </TableCell>
                  <TableCell
                    className="text-xs text-slate-600 truncate max-w-[150px]"
                    title={getAccountName(e.debit_account_id)}
                  >
                    {getAccountName(e.debit_account_id)}
                  </TableCell>
                  <TableCell
                    className="text-xs text-slate-600 truncate max-w-[150px]"
                    title={getAccountName(e.credit_account_id)}
                  >
                    {getAccountName(e.credit_account_id)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        e.status === 'Concluído'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : e.status === 'Cancelado'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      )}
                    >
                      {e.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(e)}
                      >
                        <Edit2 className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja realmente excluir este lançamento contábil? Esta ação não pode
                              ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(e.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
