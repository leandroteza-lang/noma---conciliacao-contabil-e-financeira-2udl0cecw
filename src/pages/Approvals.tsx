import { useState, useEffect } from 'react'
import { CheckSquare, Trash2, RotateCcw, Loader2, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PendingItem {
  id: string
  type:
    | 'organization'
    | 'department'
    | 'employee'
    | 'cost_center'
    | 'chart_account'
    | 'bank_account'
  typeLabel: string
  name: string
  requestedAt: string
  requestedBy?: string
  requestedByName?: string
  originalData: any
}

export default function Approvals() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { role } = useAuth()
  const { toast } = useToast()

  const fetchPendingItems = async () => {
    if (role !== 'admin') return
    try {
      setLoading(true)
      const [orgs, depts, emps, costs, charts, banks] = await Promise.all([
        supabase.from('organizations').select('*').eq('pending_deletion', true),
        supabase.from('departments').select('*').eq('pending_deletion', true),
        supabase.from('employees').select('*').eq('pending_deletion', true),
        supabase.from('cost_centers').select('*').eq('pending_deletion', true),
        supabase.from('chart_of_accounts').select('*').eq('pending_deletion', true),
        supabase.from('bank_accounts').select('*').eq('pending_deletion', true),
      ])

      const unified: PendingItem[] = [
        ...(orgs.data || []).map((o) => ({
          id: o.id,
          type: 'organization' as const,
          typeLabel: 'Empresa',
          name: o.name,
          requestedAt: o.deletion_requested_at || o.created_at,
          requestedBy: o.deletion_requested_by,
          originalData: o,
        })),
        ...(depts.data || []).map((d) => ({
          id: d.id,
          type: 'department' as const,
          typeLabel: 'Departamento',
          name: d.name,
          requestedAt: d.deletion_requested_at || d.created_at,
          requestedBy: d.deletion_requested_by,
          originalData: d,
        })),
        ...(emps.data || []).map((e) => ({
          id: e.id,
          type: 'employee' as const,
          typeLabel: 'Funcionário',
          name: e.name,
          requestedAt: e.deletion_requested_at || e.created_at,
          requestedBy: e.deletion_requested_by,
          originalData: e,
        })),
        ...(costs.data || []).map((c) => ({
          id: c.id,
          type: 'cost_center' as const,
          typeLabel: 'Centro de Custo',
          name: `${c.code} - ${c.description}`,
          requestedAt: c.deletion_requested_at || c.created_at,
          requestedBy: c.deletion_requested_by,
          originalData: c,
        })),
        ...(charts.data || []).map((c) => ({
          id: c.id,
          type: 'chart_account' as const,
          typeLabel: 'Conta Contábil',
          name: `${c.account_code} - ${c.account_name}`,
          requestedAt: c.deletion_requested_at || c.created_at,
          requestedBy: c.deletion_requested_by,
          originalData: c,
        })),
        ...(banks.data || []).map((b) => ({
          id: b.id,
          type: 'bank_account' as const,
          typeLabel: 'Conta Bancária',
          name: `${b.bank_code} - ${b.description}`,
          requestedAt: b.deletion_requested_at || b.created_at,
          requestedBy: b.deletion_requested_by,
          originalData: b,
        })),
      ]

      const requesterIds = [...new Set(unified.map((i) => i.requestedBy).filter(Boolean))]
      if (requesterIds.length > 0) {
        const { data: requesters } = await supabase
          .from('employees')
          .select('user_id, name')
          .in('user_id', requesterIds)
        const reqMap: Record<string, string> = {}
        requesters?.forEach((r) => {
          if (r.user_id) reqMap[r.user_id] = r.name
        })
        unified.forEach((i) => {
          if (i.requestedBy) {
            i.requestedByName = reqMap[i.requestedBy] || 'Usuário Desconhecido'
          }
        })
      }

      unified.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      setItems(unified)
      setSelectedIds((prev) => prev.filter((id) => unified.some((i) => i.id === id)))
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingItems()
  }, [role])

  const getTableForType = (type: PendingItem['type']) => {
    switch (type) {
      case 'organization':
        return 'organizations'
      case 'department':
        return 'departments'
      case 'employee':
        return 'employees'
      case 'cost_center':
        return 'cost_centers'
      case 'chart_account':
        return 'chart_of_accounts'
      case 'bank_account':
        return 'bank_accounts'
      default:
        return ''
    }
  }

  const handleApprove = async (item: PendingItem) => {
    if (!confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE o(a) ${item.typeLabel} "${item.name}"?`))
      return

    setProcessingId(item.id)
    try {
      const table = getTableForType(item.type)
      const { error } = await supabase.from(table).delete().eq('id', item.id)

      if (error) {
        if (error.message.includes('violates foreign key constraint')) {
          throw new Error(
            'Não é possível excluir. Existem registros vinculados a este item no sistema.',
          )
        }
        throw error
      }

      toast({ title: 'Excluído', description: 'Registro removido permanentemente.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro na exclusão', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRestore = async (item: PendingItem) => {
    setProcessingId(item.id)
    try {
      const table = getTableForType(item.type)
      const { error } = await supabase
        .from(table)
        .update({
          pending_deletion: false,
          deletion_requested_at: null,
          deletion_requested_by: null,
        })
        .eq('id', item.id)

      if (error) throw error

      toast({ title: 'Restaurado', description: 'O registro voltou a ficar ativo no sistema.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro ao restaurar', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    if (
      !confirm(
        `Deseja realmente EXCLUIR DEFINITIVAMENTE os ${selectedIds.length} itens selecionados?`,
      )
    )
      return

    setProcessingId('bulk')
    try {
      const itemsToProcess = items.filter((i) => selectedIds.includes(i.id))
      let hasError = false

      for (const item of itemsToProcess) {
        const table = getTableForType(item.type)
        const { error } = await supabase.from(table).delete().eq('id', item.id)
        if (error) hasError = true
      }

      if (hasError) {
        toast({
          title: 'Aviso',
          description:
            'Alguns itens não puderam ser excluídos devido a relacionamentos no banco de dados.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Exclusão concluída',
          description: 'Os registros selecionados foram permanentemente removidos.',
        })
      }
      setSelectedIds([])
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro na exclusão em lote', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return

    setProcessingId('bulk')
    try {
      const itemsToProcess = items.filter((i) => selectedIds.includes(i.id))

      for (const item of itemsToProcess) {
        const table = getTableForType(item.type)
        await supabase
          .from(table)
          .update({
            pending_deletion: false,
            deletion_requested_at: null,
            deletion_requested_by: null,
          })
          .eq('id', item.id)
      }

      toast({
        title: 'Restauração concluída',
        description: 'Os registros selecionados foram restaurados com sucesso.',
      })
      setSelectedIds([])
      fetchPendingItems()
    } catch (e: any) {
      toast({
        title: 'Erro na restauração em lote',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  if (role !== 'admin') {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Restrito</h2>
        <p className="text-slate-500">
          Apenas administradores podem acessar a central de aprovações.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CheckSquare className="h-8 w-8 text-blue-600" />
          Central de Aprovações
        </h1>
        <p className="text-slate-500 mt-1">Gerencie as solicitações de exclusão do sistema.</p>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} item(ns) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              disabled={processingId === 'bulk'}
              className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {processingId === 'bulk' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Restaurar Selecionados
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkApprove}
              disabled={processingId === 'bulk'}
              className="gap-2"
            >
              {processingId === 'bulk' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Aprovar Selecionados
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exclusões Pendentes</CardTitle>
          <CardDescription>
            Revise os registros marcados para exclusão por outros usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center">
              <Check className="h-12 w-12 text-green-400 mb-3" />
              <p className="text-lg font-medium text-slate-700">Tudo limpo!</p>
              <p>Não há solicitações de exclusão pendentes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={items.length > 0 && selectedIds.length === items.length}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedIds(items.map((i) => i.id))
                          else setSelectedIds([])
                        }}
                      />
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome / Identificação</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Data da Solicitação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-3 px-4 text-center">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds((prev) => [...prev, item.id])
                            else setSelectedIds((prev) => prev.filter((id) => id !== item.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 border-orange-200"
                        >
                          {item.typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-900">
                        {item.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-600 text-sm">
                        {item.requestedByName || '-'}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-500 text-sm">
                        {item.requestedAt
                          ? format(new Date(item.requestedAt), "dd 'de' MMMM 'às' HH:mm", {
                              locale: ptBR,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(item)}
                            disabled={!!processingId}
                            className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {processingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restaurar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleApprove(item)}
                            disabled={!!processingId}
                            className="gap-1.5"
                          >
                            {processingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Aprovar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
