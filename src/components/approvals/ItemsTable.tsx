import { format } from 'date-fns'
import { RotateCcw, Trash2, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export interface PendingItem {
  id: string
  type: string
  typeLabel: string
  name: string
  requestedAt: string | null
  requestedBy: string | null
  requestedByName?: string
  deletedAt: string | null
  deletedBy: string | null
  deletedByName?: string
  pending: boolean | null
  originalData: any
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
}: any) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        {isTrash ? 'Lixeira vazia.' : 'Nenhum item pendente de exclusão.'}
      </div>
    )
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Selecionar todos"
              />
            </th>
            <th className="px-4 py-3 font-medium text-slate-600">Tipo</th>
            <th className="px-4 py-3 font-medium text-slate-600">Identificação</th>
            <th className="px-4 py-3 font-medium text-slate-600">
              {isTrash ? 'Excluído por' : 'Solicitado por'}
            </th>
            <th className="px-4 py-3 font-medium text-slate-600">
              {isTrash ? 'Data de Exclusão' : 'Data da Solicitação'}
            </th>
            <th className="px-4 py-3 font-medium text-slate-600 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: PendingItem) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="px-4 py-3">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(c) => onSelect(item.id, !!c)}
                  aria-label={`Selecionar ${item.name}`}
                />
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-slate-600 font-normal bg-white">
                  {item.typeLabel}
                </Badge>
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
              <td className="px-4 py-3 text-slate-600">
                {isTrash ? item.deletedByName || 'Sistema' : item.requestedByName || 'Sistema'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {isTrash
                  ? item.deletedAt
                    ? format(new Date(item.deletedAt), "dd 'de' MMM 'às' HH:mm")
                    : '-'
                  : item.requestedAt
                    ? format(new Date(item.requestedAt), "dd 'de' MMM 'às' HH:mm")
                    : '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(item)}
                    disabled={!!processingId}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Restaurar
                  </Button>
                  {!isTrash ? (
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(item)}
                      disabled={!!processingId}
                      title="Aprovar Exclusão"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => onHardDelete(item)}
                      disabled={!!processingId}
                      title="Excluir Definitivamente"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
