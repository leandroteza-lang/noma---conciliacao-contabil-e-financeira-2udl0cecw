import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import {
  UploadCloud,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  ArrowRight,
  CheckCircle2,
  TableProperties,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const EXPECTED_FIELDS = [
  { key: 'DATAEMISSAO', label: 'Data Emissão' },
  { key: 'HISTORICO', label: 'Histórico' },
  { key: 'NOMECLIFORNEC', label: 'Nome Cli/Fornec' },
  { key: 'CONTACAIXA', label: 'Conta/Caixa' },
  { key: 'NOMECAIXA', label: 'Nome Caixa' },
  { key: 'CCUSTO', label: 'C.Custo' },
  { key: 'DESCRICAOCCUSTO', label: 'Descrição C.Custo' },
  { key: 'VALOR', label: 'Valor' },
  { key: 'VALORLIQUIDO', label: 'Valor Líquido' },
  { key: 'COMPENSADO', label: 'Compensado' },
  { key: 'TIPOOPERACAO', label: 'Tipo Operação' },
  { key: 'DTCOMPENS', label: 'Dt Compens.' },
  { key: 'CONTACAIXADESTINO', label: 'Conta/Caixa Destino' },
  { key: 'FORMAPAGTO', label: 'Forma Pagto' },
  { key: 'NDOCUMENTO', label: 'Nº Documento' },
  { key: 'FP', label: 'FP' },
  { key: 'NCHEQUE', label: 'Nº Cheque' },
  { key: 'DATAVENCTO', label: 'Data Vencto' },
  { key: 'NOMINALA', label: 'Nominal a' },
  { key: 'EMITENTECHEQUE', label: 'Emitente Cheque' },
  { key: 'CNPJCPF', label: 'CNPJ/CPF' },
  { key: 'NEXTRATO', label: 'Nº Extrato' },
  { key: 'FILIAL', label: 'Filial' },
  { key: 'DATACANC', label: 'Data Canc.' },
  { key: 'DATAESTORNO', label: 'Data Estorno' },
  { key: 'BANCO', label: 'Banco' },
  { key: 'CCORRENTE', label: 'C.Corrente' },
  { key: 'CODCLIFOR', label: 'Cód.Cli/For' },
  { key: 'DEPARTAMENTO', label: 'Departamento' },
]

export function ImportErpFinancialModal({
  open,
  onOpenChange,
  onImportSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onImportSuccess: () => void
}) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string>('')
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [allowIncomplete, setAllowIncomplete] = useState(true)
  const [result, setResult] = useState<{ inserted: number; errors: any[] } | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      setFile(null)
      setFileBase64('')
      setAllRecords([])
      setMapping({})
      setResult(null)
      setSelectedOrg('')
      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => {
          if (data) {
            setOrgs(data)
            if (data.length > 0) setSelectedOrg(data[0].id)
          }
        })
    }
  }, [open])

  const [allRecords, setAllRecords] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)

    const isCsv = f.name.toLowerCase().endsWith('.csv')
    if (isCsv) {
      const readWithEncoding = (encoding: string) => {
        const reader = new FileReader()
        reader.onload = (evt) => {
          const text = evt.target?.result as string
          if (!text) return

          if (encoding === 'utf-8' && text.includes('\uFFFD')) {
            readWithEncoding('iso-8859-1')
            return
          }

          const delimiter = text.split(';').length > text.split(',').length ? ';' : ','
          const rows: string[][] = []
          let currentRow: string[] = []
          let currentCell = ''
          let inQuotes = false

          for (let i = 0; i < text.length; i++) {
            const char = text[i]
            const nextChar = text[i + 1]

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                currentCell += '"'
                i++
              } else {
                inQuotes = !inQuotes
              }
            } else if (char === delimiter && !inQuotes) {
              currentRow.push(currentCell)
              currentCell = ''
            } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
              if (char === '\r') i++
              currentRow.push(currentCell)
              if (currentRow.some((c) => c.trim() !== '')) rows.push(currentRow)
              currentRow = []
              currentCell = ''
            } else {
              currentCell += char
            }
          }
          if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell)
            if (currentRow.some((c) => c.trim() !== '')) rows.push(currentRow)
          }

          let rawRecords: any[] = []
          if (rows.length > 0) {
            const headers = rows[0].map((h) => h.trim())
            for (let i = 1; i < rows.length; i++) {
              const values = rows[i].map((v) => v.trim())
              const row: any = {}
              headers.forEach((h, idx) => {
                row[h] = values[idx] || ''
              })
              rawRecords.push(row)
            }
          }

          setSheets(['CSV Data'])
          setSelectedSheet('CSV Data')
          const hdrs = rawRecords.length > 0 ? Object.keys(rawRecords[0]) : []
          setHeaders(hdrs)
          setAllRecords(rawRecords)
          setPreviewRows(rawRecords.slice(0, 3))
          setTotalRecords(rawRecords.length)

          const autoMap: Record<string, string> = {}
          hdrs.forEach((h: string) => {
            const cleanH = h
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toUpperCase()
              .trim()
              .replace(/[^A-Z0-9]/g, '')
            const match = EXPECTED_FIELDS.find((ef) => {
              const cleanEf = ef.key.replace(/[^A-Z0-9]/g, '')
              return cleanH === cleanEf || cleanH.includes(cleanEf) || cleanEf.includes(cleanH)
            })
            if (match) autoMap[match.key] = h
          })
          setMapping(autoMap)
          setStep(2)
        }
        reader.readAsText(f, encoding)
      }
      readWithEncoding('utf-8')
    } else {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        const result = evt.target?.result as string
        if (!result) return
        const b64 = result.split(',')[1]
        setFileBase64(b64)
        await fetchPreview(b64, f.name, '')
      }
      reader.readAsDataURL(f)
    }
  }

  const fetchPreview = async (b64: string, name: string, sheet: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'PARSE_ALL',
          fileBase64: b64,
          fileName: name,
          sheetName: sheet,
          type: 'ERP_FINANCIAL_MOVEMENTS',
        },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)

      setSheets(data.sheets || [])
      setHeaders(data.headers || [])
      if (data.records) {
        setAllRecords(data.records)
        setPreviewRows(data.records.slice(0, 3))
      }
      setTotalRecords(data.totalRecords || 0)

      if (!sheet && data.sheets?.length > 0) {
        setSelectedSheet(data.sheets[0])
      }

      const autoMap: Record<string, string> = {}
      data.headers?.forEach((h: string) => {
        const cleanH = h
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .trim()
          .replace(/[^A-Z0-9]/g, '')

        const match = EXPECTED_FIELDS.find((ef) => {
          const cleanEf = ef.key.replace(/[^A-Z0-9]/g, '')
          return cleanH === cleanEf || cleanH.includes(cleanEf) || cleanEf.includes(cleanH)
        })
        if (match) autoMap[match.key] = h
      })
      setMapping(autoMap)
      setStep(2)
    } catch (err: any) {
      toast({
        title: 'Erro ao processar arquivo',
        description: err.message,
        variant: 'destructive',
      })
      setStep(1)
    }
    setLoading(false)
  }

  const handleSheetChange = (v: string) => {
    setSelectedSheet(v)
    fetchPreview(fileBase64, file?.name || '', v)
  }

  const handleImport = async () => {
    if (!selectedOrg) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma empresa padrão.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setProgress(0)
    const columnMapping: Record<string, string> = {}
    Object.entries(mapping).forEach(([expected, fileCol]) => {
      if (fileCol && fileCol !== 'none') {
        columnMapping[fileCol] = expected
      }
    })

    try {
      const CHUNK_SIZE = 2000
      let totalInserted = 0
      const allErrors: any[] = []
      const total = totalRecords || 1

      for (let offset = 0; offset < total; offset += CHUNK_SIZE) {
        setProgress(Math.min(Math.round((offset / total) * 100), 99))

        const chunkRecords = allRecords.slice(offset, offset + CHUNK_SIZE)

        const { data, error } = await supabase.functions.invoke('import-data', {
          body: {
            type: 'ERP_FINANCIAL_MOVEMENTS',
            records: chunkRecords,
            fileName: file?.name,
            sheetName: selectedSheet,
            columnMapping,
            organizationId: selectedOrg,
            allowIncomplete,
            mode: 'INSERT_ONLY',
            offset,
            skipHistory: offset + CHUNK_SIZE < total,
            totalRecords: total,
          },
        })

        if (error) {
          throw new Error(
            error.message === 'Edge Function returned a non-2xx status code'
              ? 'Erro de comunicação. A planilha pode ser muito grande ou estar mal formatada.'
              : error.message,
          )
        }

        if (data?.error) throw new Error(data.error)

        totalInserted += data.inserted || 0
        if (data.errors && Array.isArray(data.errors)) {
          allErrors.push(...data.errors)
        }
      }

      setProgress(100)
      setResult({ inserted: totalInserted, errors: allErrors })
      setStep(3)
      onImportSuccess()
    } catch (err: any) {
      console.error('Import error:', err)
      toast({
        title: 'Erro na Importação',
        description: err.message || 'Ocorreu um erro inesperado durante o processamento.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Movimento Financeiro TGA</DialogTitle>
          <DialogDescription>Mapeie as colunas da sua planilha para o sistema.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 1 && (
            <div
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors my-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-slate-400 mb-4" />
              <p className="text-sm font-medium text-slate-700">
                Clique para selecionar um arquivo
              </p>
              <p className="text-xs text-slate-500 mt-1">Suporta .xlsx e .csv</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
              />
              {loading && <Loader2 className="h-6 w-6 animate-spin mt-4 text-primary" />}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up py-4 flex-1 overflow-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aba da Planilha</Label>
                  <Select
                    value={selectedSheet}
                    onValueChange={handleSheetChange}
                    disabled={loading || sheets.length <= 1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a aba" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheets.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Empresa Padrão (*)</Label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {previewRows.length > 0 && (
                <div className="border rounded-md bg-slate-50/50 flex flex-col mt-4 overflow-hidden">
                  <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
                    <TableProperties className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Pré-visualização dos Dados</h4>
                  </div>
                  <ScrollArea className="w-full">
                    <div className="max-h-[200px]">
                      <Table className="text-xs">
                        <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm">
                          <TableRow>
                            {headers.map((h) => (
                              <TableHead
                                key={h}
                                className="whitespace-nowrap px-3 py-2 h-auto font-semibold"
                              >
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((row, i) => (
                            <TableRow key={i}>
                              {headers.map((h) => (
                                <TableCell
                                  key={h}
                                  className="whitespace-nowrap max-w-[150px] truncate px-3 py-2"
                                >
                                  {String(row[h] || '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}

              <div className="border rounded-md p-4 bg-slate-50/50">
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Mapeamento de Colunas
                </h4>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {EXPECTED_FIELDS.map((ef) => (
                      <div key={ef.key} className="flex flex-col gap-1.5">
                        <Label className="text-xs text-slate-600 truncate" title={ef.label}>
                          {ef.label}
                        </Label>
                        <Select
                          value={mapping[ef.key] || 'none'}
                          onValueChange={(v) => setMapping((prev) => ({ ...prev, [ef.key]: v }))}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Não mapear" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">
                              Não mapear
                            </SelectItem>
                            {headers.map((h) => (
                              <SelectItem key={h} value={h} className="text-xs">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="allow-inc"
                  checked={allowIncomplete}
                  onCheckedChange={(v) => setAllowIncomplete(!!v)}
                  disabled={loading}
                />
                <Label htmlFor="allow-inc" className="text-sm text-slate-600 font-normal">
                  Ignorar erros e importar apenas linhas válidas
                </Label>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fade-in-up flex-1">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <h3 className="text-xl font-semibold text-slate-900">Importação Concluída</h3>
              <p className="text-slate-500">
                {result.inserted} registros foram inseridos com sucesso.
              </p>
              {result.errors && result.errors.length > 0 && (
                <div className="w-full mt-6 bg-red-50 p-4 rounded-md border border-red-100 max-w-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {result.errors.length} Erros Encontrados
                  </h4>
                  <ScrollArea className="h-32">
                    <ul className="text-xs text-red-700 space-y-1 list-disc pl-4">
                      {result.errors.slice(0, 50).map((e, i) => (
                        <li key={i}>
                          Linha {e.row}: {e.error}
                        </li>
                      ))}
                      {result.errors.length > 50 && (
                        <li className="font-medium pt-1">
                          ... e mais {result.errors.length - 50} erros.
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t mt-auto">
          {step !== 3 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              {step === 2 && (
                <Button
                  onClick={handleImport}
                  disabled={loading || !selectedOrg}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {progress}%
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Importar Dados
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
