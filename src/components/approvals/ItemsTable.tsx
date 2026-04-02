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
import { Button } from '@/components/ui/button'
import { RotateCcw, Trash2, Loader2, Check } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface PendingItem {
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
  deletedAt?: string
  deletedBy?: string
  deletedByName?: string
  pending: boolean
  originalData: any
}

interface ItemsTableProps {
  items: PendingItem[]
  isTrash: boolean
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  processingId: string | null
  onRestore: (item: PendingItem) => void
  onApprove: (item: PendingItem) => void
  onHardDelete: (item: PendingItem) => void
}

export function ItemsTable({
  items,
  isTrash,
  selectedIds,
  onSelect,
  onSelectAll,
  processingId,
  onRestore,
  onApprove,
  onHardDelete,
}: ItemsTableProps) {
  if (items.length === 0)
    return (
      <div className="py-12 text-center text-slate-500 flex flex-col items-center">
        <Check className="h-12 w-12 text-green-400 mb-3" />
        <p className="text-lg font-medium text-slate-700">Tudo limpo!</p>
        <p>Não há {isTrash ? 'itens na lixeira' : 'solicitações pendentes'}.</p>
      </div>
    )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12 text-center">
              <Checkbox
                checked={items.length > 0 && selectedIds.length === items.length}
                onCheckedChange={(c) => onSelectAll(!!c)}
              />
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Identificação</TableHead>
            <TableHead>{isTrash ? 'Excluído por' : 'Solicitado por'}</TableHead>
            <TableHead>{isTrash ? 'Data da Exclusão' : 'Data da Solicitação'}</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50/50">
              <TableCell className="py-3 px-4 text-center">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(c) => onSelect(item.id, !!c)}
                />
              </TableCell>
              <TableCell className="py-3 px-4">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {item.typeLabel}
                </Badge>
              </TableCell>
              <TableCell className="py-3 px-4 font-medium text-slate-900">{item.name}</TableCell>
              <TableCell className="py-3 px-4 text-slate-600 text-sm">
                {isTrash ? item.deletedByName || '-' : item.requestedByName || '-'}
              </TableCell>
              <TableCell className="py-3 px-4 text-slate-500 text-sm whitespace-nowrap">
                {item.deletedAt && isTrash
                  ? format(new Date(item.deletedAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })
                  : item.requestedAt
                    ? format(new Date(item.requestedAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })
                    : '-'}
              </TableCell>
              <TableCell className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(item)}
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
                    onClick={() => (isTrash ? onHardDelete(item) : onApprove(item))}
                    disabled={!!processingId}
                    className="gap-1.5"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    {isTrash ? 'Excluir Definitivamente' : 'Aprovar Exclusão'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
