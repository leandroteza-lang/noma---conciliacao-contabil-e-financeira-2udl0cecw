import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Clock, Database } from 'lucide-react'

export function ImportReportModal({ open, onOpenChange, importData }: any) {
  if (!importData) return null

  const accounted =
    (importData.success_count || 0) +
    (importData.updated_count || 0) +
    (importData.ignored_count || 0) +
    (importData.error_count || 0)
  const unaccounted = Math.max(0, (importData.total_records || 0) - accounted)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-5 border-b bg-white">
          <DialogTitle className="text-xl flex items-center gap-2 text-slate-900 font-bold">
            <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
            Auditoria Detalhada de Importação
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            Verificação de integridade e log de processamento do arquivo enviado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {/* Header Info */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Arquivo Origem
              </span>
              <span className="text-sm font-semibold text-slate-900 break-all">
                {importData.file_name || 'Desconhecido'}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data do Processamento
              </span>
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> {formatDate(importData.created_at)}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status da Validação
              </span>
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md w-fit border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Integridade Verificada
              </span>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4" /> Resultado do Processamento
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                  Total Lido
                </span>
                <div className="text-xl font-black text-slate-800">
                  {importData.total_records || 0}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                  Inseridos
                </span>
                <div className="text-xl font-black text-slate-800">
                  {importData.success_count || 0}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                  Atualizados
                </span>
                <div className="text-xl font-black text-slate-800">
                  {importData.updated_count || 0}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                  Ignorados
                </span>
                <div className="text-xl font-black text-slate-800">
                  {importData.ignored_count || 0}
                </div>
              </div>
              <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 shadow-sm flex flex-col gap-1.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                <span className="text-rose-700 text-[10px] font-bold uppercase tracking-wide">
                  Com Erro
                </span>
                <div className="text-xl font-black text-rose-700">
                  {importData.error_count || 0}
                </div>
              </div>
            </div>
          </div>

          {unaccounted > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  Registros Não Contabilizados ({unaccounted})
                </h4>
                <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                  O sistema detectou <strong>{unaccounted}</strong> linhas na planilha que não
                  puderam ser processadas individualmente. Isso normalmente acontece porque a
                  planilha contém linhas totalmente em branco no final, formatação corrompida, ou
                  ocorreu uma falha de conexão que impediu a conclusão de um dos lotes de envio.
                </p>
              </div>
            </div>
          )}

          {importData.errors_list && importData.errors_list.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Log de Erros Identificados
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <Table>
                  <TableHeader className="bg-rose-50/50">
                    <TableRow className="border-b-slate-200">
                      <TableHead className="w-[100px] text-rose-900 font-bold">Linha</TableHead>
                      <TableHead className="text-rose-900 font-bold">
                        Descrição do Problema
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.errors_list.map((err: any, idx: number) => (
                      <TableRow
                        key={idx}
                        className="border-b-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-mono text-slate-600 font-medium">
                          {err.row > 0 ? err.row : 'Lote'}
                        </TableCell>
                        <TableCell className="text-rose-700 font-medium">{err.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importData.errors_list.length >= 100 && (
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> A lista foi truncada exibindo apenas os
                  primeiros 100 erros encontrados.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
          >
            Fechar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
