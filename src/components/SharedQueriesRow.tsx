import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Copy, Ban, Eye, Trash2, CheckCircle2, XCircle } from 'lucide-react'
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

export type SharedQuery = {
  id: string
  prompt: string
  created_at: string
  access_count: number
  is_protected: boolean
  is_revoked: boolean
  single_view: boolean
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
    <TableRow className="group transition-colors hover:bg-muted/30">
      <TableCell className="text-center">
        <Checkbox checked={selected} onCheckedChange={(c) => onSelect(c as boolean, q.id)} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm font-medium">
        {format(new Date(q.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
      </TableCell>
      <TableCell className="max-w-[250px] truncate text-muted-foreground" title={q.prompt}>
        {q.prompt}
      </TableCell>
      <TableCell className="text-sm font-medium">{q.user_name}</TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="font-mono">
          {q.access_count}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        {q.is_revoked ? (
          <Badge
            variant="destructive"
            className="flex w-[90px] mx-auto items-center justify-center gap-1.5 shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5" /> Revogado
          </Badge>
        ) : (
          <Badge
            variant="default"
            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 flex w-[90px] mx-auto items-center justify-center gap-1.5 shadow-sm border-emerald-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                disabled={q.is_revoked}
                onClick={() => onRevoke(q.id)}
              >
                <Ban className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Revogar Acesso</TooltipContent>
          </Tooltip>
          {!q.is_revoked ? (
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
          ) : (
            <div className="w-8 h-8" />
          )}
          {q.is_protected ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 flex items-center justify-center text-muted-foreground bg-secondary/50 rounded-md">
                  <Eye className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Protegido por Senha</TooltipContent>
            </Tooltip>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </TableCell>
    </TableRow>
  )
}
