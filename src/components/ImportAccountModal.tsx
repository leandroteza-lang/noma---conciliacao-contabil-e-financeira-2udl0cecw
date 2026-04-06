import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { UploadCloud, FileSpreadsheet, Download, XCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportAccountModal({ isOpen, onClose, onSuccess }: any) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    setIsUploading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.xlsx')) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo Excel (.xlsx).',
      })
      return
    }
    setFile(selectedFile)
    setResult(null)
  }

  const handleImport = async () => {
    if (!file) return
    setIsUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const resultStr = e.target?.result
          if (typeof resultStr !== 'string') throw new Error('Falha ao ler o arquivo')

          const base64 = resultStr.split(',')[1]

          const {
            data: { session },
          } = await supabase.auth.getSession()

          const { data, error } = await supabase.functions.invoke('import-data', {
            body: {
              type: 'BANK_ACCOUNTS',
              fileName: file.name,
              fileBase64: base64,
              allowIncomplete: false,
            },
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          })

          if (error) throw new Error(error.message || 'Erro ao processar importação')
          if (data?.error) throw new Error(data.error)

          setResult(data)
          onSuccess()
        } catch (err: any) {
          toast({
            variant: 'destructive',
            title: 'Erro na importação',
            description: err.message,
          })
        } finally {
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setIsUploading(false)
      toast({
        variant: 'destructive',
        title: 'Erro ao ler arquivo',
        description: err.message,
      })
    }
  }

  const downloadErrors = () => {
    if (!result || !result.errors || result.errors.length === 0) return

    const firstRowData = result.errors[0].data || {}
    const originalCols = Object.keys(firstRowData)

    const headers = ['Linha', 'Erro', ...originalCols].join(';')

    const rows = result.errors
      .map((err: any) => {
        const rowData = originalCols
          .map((col) => `"${String(err.data[col] || '').replace(/"/g, '""')}"`)
          .join(';')
        return `${err.row};"${err.error}";${rowData}`
      })
      .join('\n')

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + '\n' + rows)
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `erros_importacao_contas.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Contas em Lote</DialogTitle>
          <DialogDescription>
            Faça o upload da planilha padronizada para importar múltiplas contas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result ? (
            <>
              {!file ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-sm mb-1">Clique para selecionar o arquivo</h3>
                  <p className="text-xs text-muted-foreground">
                    Apenas arquivos .xlsx são suportados
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                  >
                    Trocar
                  </Button>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processando dados remotamente...</span>
                  </div>
                  <Progress value={45} className="h-2 animate-pulse" />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-background border rounded-lg p-4 shadow-sm">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-green-600">{result.inserted}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Inseridos
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 border-l">
                  <span
                    className={`text-3xl font-bold ${result.rejected > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {result.rejected}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Rejeitados
                  </span>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4" /> Erros ({result.errors.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadErrors}
                      className="h-8 text-red-600"
                    >
                      <Download className="h-3 w-3 mr-2" /> Baixar
                    </Button>
                  </div>
                  <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/30">
                    <ul className="space-y-2 text-xs">
                      {result.errors.map((err: any, i: number) => (
                        <li key={i} className="text-muted-foreground flex items-start gap-2">
                          <span className="min-w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                          <span className="break-words">
                            <strong>Linha {err.row}:</strong> {err.error}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!file || isUploading}>
                {isUploading ? 'Importando...' : 'Confirmar'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
