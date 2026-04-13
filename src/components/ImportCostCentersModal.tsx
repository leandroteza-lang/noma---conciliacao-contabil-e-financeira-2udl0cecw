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
  Play,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'

const EXPECTED_FIELDS = [
  { key: 'CODIGO', label: 'Código (*)', aliases: ['CODIGO', 'COD'] },
  { key: 'DESCRICAO', label: 'Descrição (*)', aliases: ['DESCRICAO', 'NOME'] },
  { key: 'EMPRESA', label: 'Empresa (Coluna)', aliases: ['EMPRESA'] },
  { key: 'TIPOTGA', label: 'Tipo Conta TGA', aliases: ['TIPOTGA'] },
  { key: 'TIPO', label: 'Tipo TGA', aliases: ['TIPO'] },
  {
    key: 'FIXO_VARIAVEL',
    label: 'Fixo/Variável',
    aliases: ['FIXOOUVARIAVEL', 'FIXO_VARIAVEL', 'FIXOVARIAVEL'],
  },
  { key: 'CLASSIFICACAO', label: 'Classificação', aliases: ['CLASSIFICACAO'] },
  { key: 'OPERACIONAL', label: 'Operacional', aliases: ['OPERACIONAL'] },
  { key: 'TIPOLCTO', label: 'Tipo Lançamento', aliases: ['TIPOLCTO', 'TIPODELANCAMENTO'] },
  { key: 'CONTABILIZA', label: 'Contabiliza', aliases: ['CONTABILIZA'] },
  { key: 'OBSERVACOES', label: 'Observações', aliases: ['OBSERVACOES', 'OBS'] },
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
  const [totalRecords, setTotalRecords] = useState(0)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('USE_SPREADSHEET')
  const [mode, setMode] = useState<string>('UPSERT')
  const [allowIncomplete, setAllowIncomplete] = useState(false)
  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [result, setResult] = useState<{ inserted: number; errors: any[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      setFile(null)
      setRawRecords([])
      setMapping({})
      setResult(null)
      setSimulationResult(null)
      setTotalRecords(0)
      setIsImporting(false)
      setSelectedOrg('USE_SPREADSHEET')
      setMode('UPSERT')
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
      script.onerror = () => reject(new Error('Falha ao carregar XLSX'))
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
        records = parseCSV(new TextDecoder('utf-8').decode(buffer))
        sheetsFound = ['CSV Data']
        setSelectedSheet('CSV Data')
      } else {
        const XLSX = await loadXlsxScript()
        const workbook = XLSX.read(buffer, { type: 'array' })
        sheetsFound = workbook.SheetNames
        setSelectedSheet(workbook.SheetNames[0])
        records = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
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
          .replace(/[^A-Z0-9]/g, '')
          .toUpperCase()
          .trim()

        const exactMatch = EXPECTED_FIELDS.find((ef) =>
          ef.aliases.some((alias) => {
            const cleanAlias = alias.replace(/[^A-Z0-9]/g, '')
            return cleanH === cleanAlias
          }),
        )
        if (exactMatch && !autoMap[exactMatch.key]) {
          autoMap[exactMatch.key] = h
        }
      })

      hdrs.forEach((h: string) => {
        if (Object.values(autoMap).includes(h)) return

        const cleanH = h
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Z0-9]/g, '')
          .toUpperCase()
          .trim()

        const partialMatch = EXPECTED_FIELDS.find((ef) =>
          ef.aliases.some((alias) => {
            const cleanAlias = alias.replace(/[^A-Z0-9]/g, '')
            return cleanH.includes(cleanAlias)
          }),
        )
        if (partialMatch && !autoMap[partialMatch.key]) {
          autoMap[partialMatch.key] = h
        }
      })

      setMapping(autoMap)
      setStep(2)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      setStep(1)
    }
    setLoading(false)
  }

  const handleSheetChange = (v: string) => {
    setSelectedSheet(v)
    if ((window as any)._tempWorkbook) {
      const records = (window as any).XLSX.utils.sheet_to_json(
        (window as any)._tempWorkbook.Sheets[v],
        { defval: '' },
      )
      setRawRecords(records)
      setTotalRecords(records.length)
      const hdrs = records.length > 0 ? Object.keys(records[0]) : []
      setHeaders(hdrs)
    }
  }

  const buildProcessedRecords = () => {
    const columnMapping: Record<string, string> = {}
    Object.entries(mapping).forEach(([expected, fileCol]) => {
      if (fileCol && fileCol !== 'none') columnMapping[fileCol] = expected
    })

    return rawRecords.map((r: any, index: number) => {
      const normalized: any = { _originalIndex: index + 1 }
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
  }

  const handleSimulate = async () => {
    setIsImporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          type: 'COST_CENTERS',
          records: buildProcessedRecords(),
          fileName: file?.name,
          sheetName: selectedSheet,
          organizationId: selectedOrg,
          mode,
          allowIncomplete,
          simulation: true,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setSimulationResult(data)
      setStep(3)
    } catch (err: any) {
      toast({ title: 'Erro na Simulação', description: err.message, variant: 'destructive' })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          type: 'COST_CENTERS',
          records: buildProcessedRecords(),
          fileName: file?.name,
          sheetName: selectedSheet,
          organizationId: selectedOrg,
          mode,
          allowIncomplete,
          simulation: false,
          totalRecords,
          skipHistory: false,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setResult({ inserted: data.inserted || 0, errors: data.errors || [] })
      setStep(4)
      onImportSuccess()
    } catch (err: any) {
      toast({ title: 'Erro na Importação', description: err.message, variant: 'destructive' })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={isImporting ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Centros de Custo (TGA)</DialogTitle>
          <DialogDescription>
            Mapeie as colunas e simule a importação para a sua empresa.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100"
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
                  disabled={isImporting || sheets.length <= 1}
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
                <Label>Empresa de Destino</Label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={isImporting}>
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
              <div className="space-y-2 col-span-2">
                <Label>Modo de Importação</Label>
                <Select value={mode} onValueChange={setMode} disabled={isImporting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPSERT">Adicionar e Atualizar (Padrão)</SelectItem>
                    <SelectItem value="INSERT_ONLY">Importar Somente Novos</SelectItem>
                    <SelectItem value="REPLACE">Substituir Tudo (Cuidado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-md p-4 bg-slate-50/50">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Mapeamento de Colunas
              </h4>
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {EXPECTED_FIELDS.map((ef) => (
                    <div key={ef.key} className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-sm text-slate-600">{ef.label}</Label>
                      <Select
                        value={mapping[ef.key] || 'none'}
                        onValueChange={(v) => setMapping((prev) => ({ ...prev, [ef.key]: v }))}
                        disabled={isImporting}
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
                disabled={isImporting}
              />
              <Label htmlFor="allow-inc" className="text-sm text-slate-600 font-normal">
                Ignorar erros e importar apenas linhas válidas
              </Label>
            </div>
          </div>
        )}

        {step === 3 && simulationResult && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Resumo da Simulação</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  Registros a Inserir: <strong>{simulationResult.totalToInsert}</strong>
                </li>
                <li>
                  Registros a Atualizar: <strong>{simulationResult.totalToUpdate}</strong>
                </li>
                {mode === 'REPLACE' && (
                  <li className="text-red-600">
                    Registros a Excluir: <strong>{simulationResult.totalToDelete}</strong>
                  </li>
                )}
              </ul>
            </div>
            {simulationResult.errors?.length > 0 && (
              <div className="bg-red-50 p-4 rounded-md border border-red-100">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {simulationResult.errors.length} Erros/Alertas
                </h4>
                <ScrollArea className="h-32">
                  <ul className="text-xs text-red-700 space-y-1 list-disc pl-4">
                    {simulationResult.errors.slice(0, 50).map((e: any, i: number) => (
                      <li key={i}>
                        Linha {e.row}: {e.error}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                {!allowIncomplete && (
                  <p className="text-xs text-red-600 mt-2">
                    Como "Ignorar erros" não está marcado, a importação pode falhar.
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-slate-600">Deseja prosseguir com a importação definitiva?</p>
          </div>
        )}

        {step === 4 && result && (
          <div className="py-6 flex flex-col items-center space-y-4 animate-fade-in-up">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-medium text-slate-900">Importação Concluída</h3>
            <p className="text-slate-500">{result.inserted} registros inseridos ou atualizados.</p>
            {result.errors?.length > 0 && (
              <div className="w-full mt-4 bg-yellow-50 p-4 rounded-md border border-yellow-100">
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {result.errors.length} Alertas/Ignorados
                </h4>
                <ScrollArea className="h-32">
                  <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-4">
                    {result.errors.slice(0, 50).map((e: any, i: number) => (
                      <li key={i}>
                        Linha {e.row}: {e.error}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 || step === 2 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                Cancelar
              </Button>
              {step === 2 && (
                <Button onClick={handleSimulate} disabled={isImporting}>
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}{' '}
                  Simular
                </Button>
              )}
            </>
          ) : step === 3 ? (
            <>
              <Button variant="outline" onClick={() => setStep(2)} disabled={isImporting}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}{' '}
                Confirmar
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
