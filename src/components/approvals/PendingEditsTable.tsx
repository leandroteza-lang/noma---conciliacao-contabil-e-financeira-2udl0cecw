import { useState } from 'react'
import { format } from 'date-fns'
import { Eye, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function PendingEditsTable({ edits, processingId, onApprove, onReject }: any) {
  const [selectedEdit, setSelectedEdit] = useState<any>(null)

  if (!edits || edits.length === 0) {
    return <div className="p-8 text-center text-slate-500">Nenhuma alteração pendente.</div>
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      bank_accounts: 'Conta Bancária',
      cost_centers: 'Centro de Custo',
      chart_of_accounts: 'Conta Contábil',
      departments: 'Departamento',
      organizations: 'Empresa',
      tipo_conta_tga: 'Tipo Conta TGA',
      cadastro_usuarios: 'Usuário',
    }
    return map[type] || type
  }

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '') return '-'
    if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-3 font-medium text-slate-600">Identificação</th>
              <th className="px-4 py-3 font-medium text-slate-600">Solicitado por</th>
              <th className="px-4 py-3 font-medium text-slate-600">Data da Solicitação</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {edits.map((edit: any) => (
              <tr key={edit.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200 bg-blue-50 font-normal"
                  >
                    {getTypeLabel(edit.entity_type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{edit.entity_name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {edit.requested_by_name || 'Desconhecido'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {edit.requested_at
                    ? format(new Date(edit.requested_at), "dd 'de' MMM 'às' HH:mm")
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEdit(edit)}
                      disabled={!!processingId}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Revisar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => onReject(edit)}
                      disabled={!!processingId}
                      title="Rejeitar"
                    >
                      {processingId === edit.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(edit)}
                      disabled={!!processingId}
                      title="Aprovar"
                    >
                      {processingId === edit.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedEdit} onOpenChange={(open) => !open && setSelectedEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Alterações</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedEdit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div>
                    <span className="text-slate-500 block mb-1">Tipo de Registro</span>
                    <span className="font-medium">{getTypeLabel(selectedEdit.entity_type)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Identificação</span>
                    <span className="font-medium">{selectedEdit.entity_name}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-medium text-slate-600">Campo</th>
                        {!selectedEdit.is_create && (
                          <th className="px-4 py-2 font-medium text-slate-600">Valor Anterior</th>
                        )}
                        <th className="px-4 py-2 font-medium text-slate-600">Novo Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(selectedEdit.proposed_changes).map(
                        ([field, vals]: [string, any]) => (
                          <tr key={field} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-700">{field}</td>
                            {!selectedEdit.is_create && (
                              <td className="px-4 py-3 text-red-600 bg-red-50/30">
                                <span className="line-through opacity-70">
                                  {formatValue(vals?.old)}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-3 text-green-600 bg-green-50/30">
                              {formatValue(vals?.new)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedEdit(null)}>
              Fechar
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={() => {
                onReject(selectedEdit)
                setSelectedEdit(null)
              }}
            >
              <X className="h-4 w-4 mr-2" /> Rejeitar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                onApprove(selectedEdit)
                setSelectedEdit(null)
              }}
            >
              <Check className="h-4 w-4 mr-2 text-white" /> Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
