import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ShieldAlert, Activity } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/client'

export function EntityAuditHistory({
  entityId,
  entityName,
  open,
  onOpenChange,
}: {
  entityId: string | null
  entityName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && entityId) {
      fetchLogs()
    } else {
      setLogs([])
    }
  }, [open, entityId])

  const fetchLogs = async () => {
    setLoading(true)
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('*, audit_details(*)')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (!auditError && auditData) {
      setLogs(auditData)

      const userIds = Array.from(new Set(auditData.map((l) => l.performed_by).filter(Boolean)))
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('cadastro_usuarios')
          .select('user_id, name')
          .in('user_id', userIds)

        if (usersData) {
          const userMap: Record<string, string> = {}
          usersData.forEach((u) => {
            userMap[u.user_id] = u.name
          })
          setUsers(userMap)
        }
      }
    }
    setLoading(false)
  }

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    if (act === 'CREATE' || act === 'INSERT')
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full">
          INCLUSÃO
        </Badge>
      )
    if (act === 'UPDATE')
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full">
          EDIÇÃO
        </Badge>
      )
    if (act === 'DELETE')
      return (
        <Badge
          variant="destructive"
          className="shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full"
        >
          EXCLUSÃO
        </Badge>
      )
    return (
      <Badge
        variant="secondary"
        className="shadow-none px-2.5 py-0.5 text-[11px] font-bold rounded-full"
      >
        {act}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Histórico de Auditoria
          </SheetTitle>
          <SheetDescription>
            Visualizando o rastreio de alterações para o registro{' '}
            {entityName ? (
              <strong className="text-foreground">"{entityName}"</strong>
            ) : (
              'selecionado'
            )}
            .
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg overflow-hidden bg-card shadow-sm animate-fade-in-down"
              >
                <div className="bg-muted/40 px-4 py-3 flex items-center justify-between border-b">
                  <div className="flex items-center gap-3">
                    {getActionBadge(log.action)}
                    <span className="text-sm font-semibold text-foreground">
                      {users[log.performed_by] || 'Sistema'}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {log.created_at
                      ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
                      : '-'}
                  </span>
                </div>

                {log.audit_details && log.audit_details.length > 0 ? (
                  <div className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableHead className="text-xs h-8 font-semibold">Campo</TableHead>
                          <TableHead className="text-xs h-8 font-semibold">Antes</TableHead>
                          <TableHead className="text-xs h-8 font-semibold">Depois</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {log.audit_details
                          .filter((d: any) => d.old_value !== d.new_value)
                          .map((detail: any) => (
                            <TableRow key={detail.id} className="hover:bg-muted/5">
                              <TableCell className="text-xs font-medium text-foreground">
                                {detail.field_name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground/80 line-through">
                                {detail.old_value || (
                                  <span className="italic text-muted-foreground/40">vazio</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {detail.new_value || (
                                  <span className="italic font-normal text-muted-foreground/40">
                                    vazio
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-muted/5">
                    Nenhum detalhe de campo foi modificado nesta ação.
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-muted/5 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-foreground font-semibold">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
                Este registro ainda não possui um histórico de alterações rastreadas.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
