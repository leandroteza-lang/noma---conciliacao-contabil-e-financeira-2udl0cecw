import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle, CheckCircle2, Info, FileSpreadsheet, ListX } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export function ImportReportModal({ open, onOpenChange, importData }: any) {
  const [activeTab, setActiveTab] = useState('all')

  const errorsList = useMemo(() => {
    if (!importData || !importData.errors_list) return []
    return Array.isArray(importData.errors_list) ? importData.errors_list : []
  }, [importData])

  const filteredErrors = useMemo(() => {
    if (activeTab === 'all') return errorsList
    return errorsList.filter((e: any) => {
      const type = e.type || 'Erro'
      if (activeTab === 'ignored') return type === 'Ignorado'
      if (activeTab === 'errors') return type === 'Erro'
      return true
    })
  }, [errorsList, activeTab])

  const handleExport = () => {
    if (errorsList.length === 0) return

    let csvContent = 'Linha;Tipo;Mensagem de Erro\n'
    errorsList.forEach((e: any) => {
      const linha = e.row || '-'
      const tipo = e.type || 'Erro'
      const msg = (e.error || '').replace(/"/g, '""')
      csvContent += `"${linha}";"${tipo}";"${msg}"\n`
    })

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_erros_importacao_${importData?.id || 'export'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!importData) return null

  const isProcessing = importData.status === 'Processing' || importData.status === 'Pending'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="px-6 py-4 bg-white border-b border-slate-200">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ListX className="h-5 w-5 text-slate-500" />
            Relatório de Auditoria da Importação
          </DialogTitle>
          <DialogDescription>
            Detalhes do processamento do arquivo{' '}
            <strong className="text-slate-700">{importData.file_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">
                Total de Linhas
              </span>
              <span className="text-2xl font-black text-slate-800">
                {importData.total_records || 0}
              </span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col gap-1">
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">
                Inseridos/Atualizados
              </span>
              <span className="text-2xl font-black text-emerald-800">
                {(importData.success_count || 0) + (importData.updated_count || 0)}
              </span>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col gap-1">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wide">
                Ignorados
              </span>
              <span className="text-2xl font-black text-slate-800">
                {importData.ignored_count || 0}
              </span>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm flex flex-col gap-1">
              <span className="text-rose-700 text-xs font-bold uppercase tracking-wide">
                Com Erro
              </span>
              <span className="text-2xl font-black text-rose-800">
                {importData.error_count || 0}
              </span>
            </div>
          </div>

          <div className="flex-1 border rounded-xl bg-white overflow-hidden flex flex-col shadow-sm">
            <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="all" className="text-xs">
                    Todos ({errorsList.length})
                  </TabsTrigger>
                  <TabsTrigger value="ignored" className="text-xs">
                    Ignorados
                  </TabsTrigger>
                  <TabsTrigger
                    value="errors"
                    className="text-xs text-rose-600 data-[state=active]:text-rose-700"
                  >
                    Erros
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 text-xs font-medium bg-white"
                disabled={errorsList.length === 0}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Exportar CSV
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {filteredErrors.length > 0 ? (
                <Table>
                  <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[80px] text-center font-bold">Linha</TableHead>
                      <TableHead className="w-[120px] font-bold">Tipo</TableHead>
                      <TableHead className="font-bold">Descrição da Ocorrência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.map((err: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-center font-mono text-xs text-slate-500">
                          {err.row || '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                              err.type === 'Ignorado' || err.error?.includes('Ignorado')
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-rose-100 text-rose-700 border border-rose-200',
                            )}
                          >
                            {err.type === 'Ignorado' || err.error?.includes('Ignorado')
                              ? 'Ignorado'
                              : 'Erro'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 break-words max-w-[500px]">
                          {err.error}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p>Processando registros...</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                      <p>Nenhuma ocorrência encontrada para este filtro.</p>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
