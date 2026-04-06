import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ImportDepartmentsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ImportDepartmentsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportDepartmentsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<{
    inserted: number
    rejected: number
    errors: any[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResults(null)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n')
    if (lines.length === 0) return []

    const isComma = lines[0].includes(',') && !lines[0].includes(';')
    const delimiter = isComma ? ',' : ';'
    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))

    const records = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''))
      const record: any = {}
      headers.forEach((h, index) => {
        record[h] = values[index] || ''
      })
      records.push(record)
    }
    return records
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setResults(null)

    try {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx')
      let records: any[] = []
      let fileBase64: string | undefined = undefined

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        fileBase64 = btoa(binary)
      } else {
        const text = await file.text()
        records = parseCSV(text)
        if (records.length === 0) {
          throw new Error('A planilha está vazia ou o formato é inválido.')
        }
      }

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) throw new Error('Usuário não autenticado')

      const payload = {
        records,
        fileBase64,
        type: 'DEPARTMENTS',
        fileName: file.name,
        allowIncomplete: false,
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erro na importação')
      }

      const resultData = await res.json()

      if (resultData.error) {
        throw new Error(resultData.error)
      }

      setResults({
        inserted: resultData.inserted || 0,
        rejected: resultData.rejected || 0,
        errors: resultData.errors || [],
      })

      if (resultData.inserted > 0) {
        onSuccess()
        toast({
          title: 'Importação concluída',
          description: `${resultData.inserted} departamento(s) importado(s) com sucesso.`,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Departamentos em Lote</DialogTitle>
          <DialogDescription>
            Faça o upload de uma planilha XLSX ou CSV contendo as colunas NOME e CODIGO.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv, .xlsx"
                onChange={handleFileChange}
              />
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              {file ? (
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <File className="h-4 w-4 text-primary" />
                  {file.name}
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    Clique para selecionar um arquivo XLSX ou CSV
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos suportados: .xlsx, .csv
                  </p>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!file || isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Processando...' : 'Importar'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert
              variant={results.rejected > 0 ? 'destructive' : 'default'}
              className={
                results.rejected === 0
                  ? 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                  : ''
              }
            >
              {results.rejected > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
              <AlertTitle>Resumo da Importação</AlertTitle>
              <AlertDescription className="mt-2">
                <p>
                  <strong>Sucesso:</strong> {results.inserted} registro(s)
                </p>
                <p>
                  <strong>Erros:</strong> {results.rejected} registro(s)
                </p>
              </AlertDescription>
            </Alert>

            {results.errors.length > 0 && (
              <div className="mt-4 max-h-[200px] overflow-y-auto rounded-md border p-3 bg-muted/50 text-sm">
                <p className="font-medium mb-2 text-destructive">Detalhes dos erros:</p>
                <ul className="space-y-1 list-disc list-inside pl-4 text-muted-foreground">
                  {results.errors.map((err, i) => (
                    <li key={i}>
                      Linha {err.row}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
