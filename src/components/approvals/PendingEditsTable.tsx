import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Check, X, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'

interface PendingEditsTableProps {
  edits: any[]
  processingId: string | null
  onApprove: (edit: any) => void
  onReject: (edit: any) => void
}

export function PendingEditsTable({
  edits,
  processingId,
  onApprove,
  onReject,
}: PendingEditsTableProps) {
  const [viewingEdit, setViewingEdit] = useState<any | null>(null)

  if (edits.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 flex flex-col items-center">
        <Check className="h-12 w-12 text-green-400 mb-3" />
        <p className="text-lg font-medium text-slate-700">Tudo limpo!</p>
        <p>Não há alterações pendentes de aprovação.</p>
      </div>
    )
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      bank_accounts: 'Conta Bancária',
      cost_centers: 'Centro de Custo',
      organizations: 'Empresa',
      departments: 'Departamento',
      chart_of_accounts: 'Conta Contábil',
    }
    return map[type] || type
  }

  const getFieldLabel = (field: string) => {
    const map: Record<string, string> = {
      description: 'Descrição',
      account_number: 'Número da Conta',
      agency: 'Agência',
      bank_code: 'Banco',
      account_type: 'Tipo de Conta',
      classification: 'Classificação',
      account_code: 'Conta Contábil',
      company_name: 'Empresa',
    }
    return map[field] || field
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Identificação</TableHead>
              <TableHead>Solicitado por</TableHead>
              <TableHead>Data da Solicitação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {edits.map((edit) => (
              <TableRow key={edit.id} className="hover:bg-slate-50/50">
                <TableCell className="py-3 px-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {getTypeLabel(edit.entity_type)}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 px-4 font-medium text-slate-900">
                  {edit.entity_name || 'Registro Desconhecido'}
                </TableCell>
                <TableCell className="py-3 px-4 text-slate-600 text-sm">
                  {edit.requested_by_name || '-'}
                </TableCell>
                <TableCell className="py-3 px-4 text-slate-500 text-sm whitespace-nowrap">
                  {edit.requested_at
                    ? format(new Date(edit.requested_at), "dd 'de' MMM 'às' HH:mm", {
                        locale: ptBR,
                      })
                    : '-'}
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingEdit(edit)}
                      disabled={!!processingId}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="h-4 w-4 mr-2" /> Revisar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReject(edit)}
                      disabled={!!processingId}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {processingId === edit.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApprove(edit)}
                      disabled={!!processingId}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === edit.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewingEdit} onOpenChange={(open) => !open && setViewingEdit(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Revisar Alteração</DialogTitle>
            <DialogDescription>
              Confira os dados propostos antes de aprovar ou rejeitar.
            </DialogDescription>
          </DialogHeader>

          {viewingEdit && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Registro</p>
                <p className="text-sm text-slate-900">{viewingEdit.entity_name}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-xs text-slate-500">Solicitante</p>
                    <p className="text-sm">{viewingEdit.requested_by_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Data</p>
                    <p className="text-sm">
                      {format(new Date(viewingEdit.requested_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Alterações Propostas</h4>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        <TableHead className="w-1/3">Campo</TableHead>
                        <TableHead className="w-1/3 text-red-600">Valor Atual</TableHead>
                        <TableHead className="w-1/3 text-green-600">Novo Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(viewingEdit.proposed_changes).map(
                        ([field, values]: [string, any]) => (
                          <TableRow key={field}>
                            <TableCell className="font-medium text-slate-700 capitalize">
                              {getFieldLabel(field)}
                            </TableCell>
                            <TableCell className="text-slate-500 line-through decoration-red-300">
                              {values.old !== undefined && values.old !== null && values.old !== ''
                                ? String(values.old)
                                : '-'}
                            </TableCell>
                            <TableCell className="text-green-700 font-medium">
                              {values.new !== undefined && values.new !== null && values.new !== ''
                                ? String(values.new)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewingEdit(null)}
                  disabled={!!processingId}
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onReject(viewingEdit)
                    setViewingEdit(null)
                  }}
                  disabled={!!processingId}
                >
                  <X className="h-4 w-4 mr-2" /> Rejeitar
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    onApprove(viewingEdit)
                    setViewingEdit(null)
                  }}
                  disabled={!!processingId}
                >
                  <Check className="h-4 w-4 mr-2" /> Aprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
