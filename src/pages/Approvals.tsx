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
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PendingItem {
  id: string
  type: 'organization' | 'department' | 'employee'
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
  const { role } = useAuth()
  const { toast } = useToast()

  const fetchPendingItems = async () => {
    if (role !== 'admin') return
    try {
      setLoading(true)
      const [orgs, depts, emps] = await Promise.all([
        supabase.from('organizations').select('*').eq('pending_deletion', true),
        supabase.from('departments').select('*').eq('pending_deletion', true),
        supabase.from('employees').select('*').eq('pending_deletion', true),
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
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingItems()
  }, [role])

  const handleApprove = async (item: PendingItem) => {
    if (!confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE o(a) ${item.typeLabel} "${item.name}"?`))
      return

    setProcessingId(item.id)
    try {
      const table =
        item.type === 'organization'
          ? 'organizations'
          : item.type === 'department'
            ? 'departments'
            : 'employees'

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
      const table =
        item.type === 'organization'
          ? 'organizations'
          : item.type === 'department'
            ? 'departments'
            : 'employees'

      const { error } = await supabase
        .from(table)
        .update({
          pending_deletion: false,
          deletion_requested_at: null,
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
        <p className="text-slate-500 mt-1">
          Gerencie as solicitações de exclusão do sistema (Soft Delete).
        </p>
      </div>

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
                            disabled={processingId === item.id}
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
                            disabled={processingId === item.id}
                            className="gap-1.5"
                          >
                            {processingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Aprovar Exclusão
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
