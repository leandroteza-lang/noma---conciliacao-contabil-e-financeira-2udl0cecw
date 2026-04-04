import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Copy, Ban, Trash2, CheckCircle2, XCircle, Bell, EyeOff, Lock, Unlock } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export type SharedQuery = {
  id: string
  prompt: string
  created_at: string
  access_count: number
  is_protected: boolean
  is_revoked: boolean
  single_view: boolean
  notify_first_access: boolean
  user_id: string | null
  user_name?: string
}

interface Props {
  q: SharedQuery
  selected: boolean
  onSelect: (checked: boolean, id: string) => void
  onRevoke: (id: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
}

export function SharedQueriesRow({ q, selected, onSelect, onRevoke, onCopy, onDelete }: Props) {
  return (
    <TableRow
      className={cn('group transition-colors hover:bg-muted/30', selected && 'bg-muted/50')}
    >
      <TableCell className="text-center w-[40px] px-4">
        <Checkbox checked={selected} onCheckedChange={(c) => onSelect(c as boolean, q.id)} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {format(new Date(q.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </TableCell>
      <TableCell className="max-w-[250px] truncate font-medium text-foreground" title={q.prompt}>
        {q.prompt}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {q.user_name || 'Desconhecido'}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="font-mono bg-secondary/50">
          {q.access_count}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'p-1.5 rounded-md flex items-center justify-center transition-colors',
                  q.is_protected
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-muted text-muted-foreground/40',
                )}
              >
                {q.is_protected ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {q.is_protected ? 'Protegido por senha' : 'Acesso público (sem senha)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'p-1.5 rounded-md flex items-center justify-center transition-colors',
                  q.single_view
                    ? 'bg-blue-500/15 text-blue-600'
                    : 'bg-muted text-muted-foreground/40',
                )}
              >
                <EyeOff className="w-3.5 h-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {q.single_view ? 'Visualização única ativada' : 'Múltiplas visualizações permitidas'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'p-1.5 rounded-md flex items-center justify-center transition-colors',
                  q.notify_first_access
                    ? 'bg-indigo-500/15 text-indigo-600'
                    : 'bg-muted text-muted-foreground/40',
                )}
              >
                <Bell className="w-3.5 h-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {q.notify_first_access
                ? 'Notificação no primeiro acesso'
                : 'Sem notificações de acesso'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {q.is_revoked ? (
          <Badge
            variant="destructive"
            className="flex w-[90px] mx-auto items-center justify-center gap-1.5 shadow-sm text-[11px] h-6"
          >
            <XCircle className="w-3 h-3" /> Revogado
          </Badge>
        ) : (
          <Badge
            variant="default"
            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 flex w-[90px] mx-auto items-center justify-center gap-1.5 shadow-sm border-emerald-200 text-[11px] h-6"
          >
            <CheckCircle2 className="w-3 h-3" /> Ativo
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right pr-6">
        <div className="flex items-center justify-end gap-1">
          {!q.is_revoked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => onCopy(q.id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar Link</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10"
                disabled={q.is_revoked}
                onClick={() => onRevoke(q.id)}
              >
                <Ban className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Revogar Acesso</TooltipContent>
          </Tooltip>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir compartilhamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O link deixará de funcionar imediatamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(q.id)}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
