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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

const EXPECTED_FIELDS = [
  { key: 'CODIGO', label: 'Código (*)' },
  { key: 'DESCRICAO', label: 'Descrição (*)' },
  { key: 'EMPRESA', label: 'Empresa (Coluna)' },
  { key: 'TIPOTGA', label: 'Tipo Conta TGA' },
  { key: 'TIPO', label: 'Tipo TGA' },
  { key: 'FIXO_VARIAVEL', label: 'Fixo/Variável' },
  { key: 'CLASSIFICACAO', label: 'Classificação' },
  { key: 'OPERACIONAL', label: 'Operacional' },
  { key: 'TIPOLCTO', label: 'Tipo Lançamento' },
  { key: 'CONTABILIZA', label: 'Contabiliza' },
  { key: 'OBSERVACOES', label: 'Observações' },
]

export function ImportCostCentersModal({
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
  const [rawRecords, setRawRecords] = useState<any[]>([])
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('USE_SPREADSHEET')
  const [allowIncomplete, setAllowIncomplete] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: any[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      setFile(null)
      setRawRecords([])
      setMapping({})
      setResult(null)
      setTotalRecords(0)
      setProgress(0)
      setIsImporting(false)
      setSelectedOrg('USE_SPREADSHEET')
      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => {
          if (data) setOrgs(data)
        })
    }
  }, [open])

  const parseCSV = (text: string) => {
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

    const parsedRecords: any[] = []
    if (rows.length > 0) {
      const hdrs = rows[0].map((h) => h.trim())
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].map((v) => v.trim())
        const row: any = {}
        hdrs.forEach((h, idx) => {
          row[h] = values[idx] || ''
        })
        parsedRecords.push(row)
      }
    }
    return parsedRecords
  }

  const loadXlsxScript = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).XLSX) return resolve((window as any).XLSX)
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      script.onload = () => resolve((window as any).XLSX)
      script.onerror = () => reject(new Error('Falha ao carregar biblioteca Excel'))
      document.body.appendChild(script)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setLoading(true)

    try {
      const isCsv = f.name.toLowerCase().endsWith('.csv')
      const buffer = await f.arrayBuffer()

      let records: any[] = []
      let sheetsFound: string[] = []

      if (isCsv) {
        const text = new TextDecoder('utf-8').decode(buffer)
        records = parseCSV(text)
        sheetsFound = ['CSV Data']
        setSelectedSheet('CSV Data')
      } else {
        const XLSX = await loadXlsxScript()
        const workbook = XLSX.read(buffer, { type: 'array' })
        sheetsFound = workbook.SheetNames
        const targetSheet = workbook.SheetNames[0]
        setSelectedSheet(targetSheet)
        const worksheet = workbook.Sheets[targetSheet]
        records = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        ;(window as any)._tempWorkbook = workbook
      }

      setSheets(sheetsFound)
      setTotalRecords(records.length)
      setRawRecords(records)

      const hdrs = records.length > 0 ? Object.keys(records[0]) : []
      setHeaders(hdrs)

      const autoMap: Record<string, string> = {}
      hdrs.forEach((h: string) => {
        const cleanH = h
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .trim()
        const match = EXPECTED_FIELDS.find(
          (ef) => cleanH.includes(ef.key) || ef.key.includes(cleanH),
        )
        if (match) autoMap[match.key] = h
      })
      setMapping(autoMap)
      setStep(2)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao ler o arquivo: ' + err.message,
        variant: 'destructive',
      })
      setStep(1)
    }
    setLoading(false)
  }

  const handleSheetChange = (v: string) => {
    setSelectedSheet(v)
    if ((window as any)._tempWorkbook) {
      const XLSX = (window as any).XLSX
      const worksheet = (window as any)._tempWorkbook.Sheets[v]
      const records = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      setRawRecords(records)
      setTotalRecords(records.length)
      const hdrs = records.length > 0 ? Object.keys(records[0]) : []
      setHeaders(hdrs)

      const autoMap: Record<string, string> = {}
      hdrs.forEach((h: string) => {
        const cleanH = h
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .trim()
        const match = EXPECTED_FIELDS.find(
          (ef) => cleanH.includes(ef.key) || ef.key.includes(cleanH),
        )
        if (match) autoMap[match.key] = h
      })
      setMapping(autoMap)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    setProgress(0)

    const columnMapping: Record<string, string> = {}
    Object.entries(mapping).forEach(([expected, fileCol]) => {
      if (fileCol && fileCol !== 'none') {
        columnMapping[fileCol] = expected
      }
    })

    const processedRecords = rawRecords.map((r: any, index: number) => {
      const normalized: any = {}
      normalized._originalIndex = index + 1
      for (const key in r) {
        const mappedKey = columnMapping[key] || key
        const cleanKey = mappedKey
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .trim()
        normalized[cleanKey] = r[key] !== null && r[key] !== undefined ? String(r[key]).trim() : ''
      }
      return normalized
    })

    processedRecords.sort((a: any, b: any) => {
      const getValHelper = (r: any, possibleKeys: string[]) => {
        const keys = Object.keys(r)
        for (const pk of possibleKeys) {
          const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
          for (const k of keys) {
            const cleanK = k.replace(/[^A-Z0-9]/g, '')
            if (cleanK === cleanPk) return r[k]
          }
        }
        return null
      }
      const codeA = String(getValHelper(a, ['COD', 'CODIGO']) || '')
      const codeB = String(getValHelper(b, ['COD', 'CODIGO']) || '')
      return codeA.length - codeB.length
    })

    const BATCH_SIZE = 500
    const total = processedRecords.length > 0 ? processedRecords.length : BATCH_SIZE

    let totalInserted = 0
    let allErrors: any[] = []

    try {
      for (let offset = 0; offset < total; offset += BATCH_SIZE) {
        const chunk = processedRecords.slice(offset, offset + BATCH_SIZE)
        if (chunk.length === 0) break
        setProgress(Math.min(Math.round((offset / total) * 100), 99))

        let attempts = 0
        let success = false

        while (attempts < 3 && !success) {
          try {
            const { data, error } = await supabase.functions.invoke('import-data', {
              body: {
                type: 'COST_CENTERS',
                records: chunk,
                fileName: file?.name,
                sheetName: selectedSheet,
                organizationId: selectedOrg,
                allowIncomplete,
                skipHistory: true,
              },
            })

            if (error) throw error
            if (data?.error) throw new Error(data.error)

            totalInserted += data.inserted || 0
            if (data.errors && data.errors.length > 0) {
              allErrors = [...allErrors, ...data.errors]
            }
            success = true
          } catch (err: any) {
            attempts++
            if (attempts >= 3) {
              const errMsg =
                err.message === 'Edge Function returned a non-2xx status code'
                  ? `Erro de conexão ao processar lote. O servidor demorou muito para responder ou a conexão falhou.`
                  : err.message
              throw new Error(errMsg)
            }
            await new Promise((r) => setTimeout(r, 1500))
          }
        }
      }

      setProgress(100)
      setResult({ inserted: totalInserted, errors: allErrors })

      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.id) {
        await supabase.from('import_history').insert({
          user_id: userData.user.id,
          import_type: 'COST_CENTERS',
          file_name: file?.name || 'Importação',
          total_records: totalRecords,
          success_count: totalInserted,
          error_count: allErrors.length,
          status: 'Completed',
        })
      }

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
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={isImporting ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Centros de Custo</DialogTitle>
          <DialogDescription>Mapeie as colunas da sua planilha para o sistema.</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-10 w-10 text-slate-400 mb-4" />
            <p className="text-sm font-medium text-slate-700">Clique para selecionar um arquivo</p>
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
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aba da Planilha</Label>
                <Select
                  value={selectedSheet}
                  onValueChange={handleSheetChange}
                  disabled={loading || isImporting || sheets.length <= 1}
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
                <Label>Empresa Padrão</Label>
                <Select
                  value={selectedOrg}
                  onValueChange={setSelectedOrg}
                  disabled={loading || isImporting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USE_SPREADSHEET">Usar coluna da planilha</SelectItem>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-md p-4 bg-slate-50/50">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Mapeamento de Colunas
              </h4>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {EXPECTED_FIELDS.map((ef) => (
                    <div key={ef.key} className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-sm text-slate-600">{ef.label}</Label>
                      <Select
                        value={mapping[ef.key] || 'none'}
                        onValueChange={(v) => setMapping((prev) => ({ ...prev, [ef.key]: v }))}
                        disabled={loading || isImporting}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Não mapear" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não mapear</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-inc"
                checked={allowIncomplete}
                onCheckedChange={(v) => setAllowIncomplete(!!v)}
                disabled={loading || isImporting}
              />
              <Label htmlFor="allow-inc" className="text-sm text-slate-600 font-normal">
                Ignorar erros e importar apenas linhas válidas
              </Label>
            </div>

            {isImporting && (
              <div className="space-y-2 mt-4 p-4 border rounded-md bg-slate-50 animate-fade-in-up">
                <div className="flex justify-between text-sm font-medium text-slate-700">
                  <span>Processando loteamento do arquivo...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-slate-500">
                  Enviando {totalRecords} registros em lotes para evitar sobrecarga. Por favor, não
                  feche esta janela.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && result && (
          <div className="py-6 flex flex-col items-center space-y-4 animate-fade-in-up">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-medium text-slate-900">Importação Concluída</h3>
            <p className="text-slate-500">
              {result.inserted} registros foram inseridos com sucesso.
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="w-full mt-4 bg-red-50 p-4 rounded-md border border-red-100">
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

        <DialogFooter>
          {step !== 3 ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || isImporting}
              >
                Cancelar
              </Button>
              {step === 2 && (
                <Button onClick={handleImport} disabled={loading || isImporting}>
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importando...' : 'Importar Dados'}
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
