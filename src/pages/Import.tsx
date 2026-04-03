import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileType2,
  UploadCloud,
  XCircle,
  List,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as XLSX from 'xlsx'

const IMPORT_TYPES = {
  COMPANIES: {
    id: 'COMPANIES',
    label: 'Empresas (Edge Function)',
    required: ['NOME'],
    optional: ['CNPJ', 'CPF', 'EMAIL', 'TELEFONE', 'ENDERECO', 'OBSERVACOES'],
  },
  DEPARTMENTS: {
    id: 'DEPARTMENTS',
    label: 'Departamentos (Edge Function)',
    required: ['NOME'],
    optional: ['CODIGO'],
  },
  EMPLOYEES: {
    id: 'EMPLOYEES',
    label: 'Funcionários (Edge Function)',
    required: ['NOME'],
    optional: [
      'CPF',
      'EMAIL',
      'TELEFONE',
      'ENDERECO',
      'OBSERVACOES',
      'DEPARTAMENTO_CODIGO',
      'PERFIL',
    ],
  },
  FINANCIAL_ENTRIES: {
    id: 'FINANCIAL_ENTRIES',
    label: 'Lançamentos Domínio (Edge Function)',
    required: [
      'EMPRESA',
      'DATA',
      'DESCRICAO',
      'VALOR',
      'CENTRO_CUSTO',
      'CONTA_DEBITO',
      'CONTA_CREDITO',
    ],
    optional: ['TIPO_MOVIMENTO'],
  },
  BANK_ACCOUNTS: {
    id: 'BANK_ACCOUNTS',
    label: 'Contas Bancárias (Edge Function)',
    required: ['EMPRESA', 'CONTA_CONTABIL'],
    optional: [
      'CODCAIXA',
      'DESCRICAO',
      'NUMBANCO',
      'NUMAGENCIA',
      'NROCONTA',
      'CLASSIFICACAO',
      'DIGITOCONTA',
    ],
  },
  COST_CENTERS: {
    id: 'COST_CENTERS',
    label: 'Centros de Custo (Edge Function)',
    required: ['EMPRESA', 'COD', 'DESCRICAO'],
    optional: ['TIPO_TGA', 'FIXO_OU_VARIAVEL', 'CLASSIFICACAO', 'OPERACIONAL'],
  },
  CHART_ACCOUNTS: {
    id: 'CHART_ACCOUNTS',
    label: 'Plano de Contas (Edge Function)',
    required: ['EMPRESA', 'CODIGO_CONTA', 'NOME_CONTA', 'TIPO_CONTA'],
    optional: [],
  },
  MAPPINGS: {
    id: 'MAPPINGS',
    label: 'Mapeamento DE/PARA (Edge Function)',
    required: ['EMPRESA', 'CENTRO_CUSTO', 'CONTA_CONTABIL'],
    optional: ['TIPO_MAPEAMENTO'],
  },
}

interface ImportError {
  row: number
  error: string
  data: any
}

interface ImportResult {
  inserted: number
  rejected: number
  errors: ImportError[]
}

export default function Import() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [importType, setImportType] = useState<string>('')

  const [rawData, setRawData] = useState<any[]>([])

  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
    if (lines.length === 0) return []

    const firstLine = lines[0]
    const separator = firstLine.includes(';') ? ';' : ','

    const splitLine = (str: string) => {
      const result = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < str.length; i++) {
        const char = str[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === separator && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += char
        }
      }
      result.push(current)
      return result
    }

    const headers = splitLine(lines[0]).map((h) => h.trim())
    const result = []

    for (let i = 1; i < lines.length; i++) {
      const values = splitLine(lines[i])
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] !== undefined ? values[index].trim() : ''
      })
      result.push(row)
    }
    return result
  }

  const processSheetData = (ws: XLSX.WorkSheet) => {
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
    return raw.map((row: any) => {
      const newRow: any = {}
      for (const key in row) {
        let val = row[key]
        if (val instanceof Date) {
          val = val.toISOString().split('T')[0]
        } else {
          val = String(val).trim()
        }
        newRow[key.trim()] = val
      }
      return newRow
    })
  }

  const detectImportType = (parsedData: any[]) => {
    if (parsedData.length > 0) {
      const headers = Object.keys(parsedData[0])
      let detectedType = ''
      for (const [key, config] of Object.entries(IMPORT_TYPES)) {
        const hasAllRequired = config.required.every((req) => headers.includes(req))
        if (hasAllRequired) {
          detectedType = key
          break
        }
      }
      if (detectedType) {
        setImportType(detectedType)
      } else {
        setImportType('')
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo .csv ou .xlsx.',
      })
      return
    }

    setFile(selectedFile)
    setIsUploading(true)
    setImportResult(null)
    setWorkbook(null)
    setImportType('')

    try {
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text()
        const parsedData = parseCSV(text)

        setRawData(parsedData)
        setSheets(['DADOS (CSV)'])
        setSelectedSheet('DADOS (CSV)')
        detectImportType(parsedData)
      } else {
        const arrayBuffer = await selectedFile.arrayBuffer()
        const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
        setWorkbook(wb)
        setSheets(wb.SheetNames)

        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0]
          setSelectedSheet(firstSheet)

          const parsedData = processSheetData(wb.Sheets[firstSheet])
          setRawData(parsedData)
          detectImportType(parsedData)
        }
      }

      setIsUploading(false)
      toast({
        title: 'Arquivo processado',
        description: 'Dados extraídos com sucesso. Selecione a aba se necessário.',
      })
    } catch (err: any) {
      setIsUploading(false)
      toast({
        variant: 'destructive',
        title: 'Erro ao ler arquivo',
        description: err.message,
      })
    }
  }

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName)
    setImportResult(null)
    if (workbook) {
      const parsedData = processSheetData(workbook.Sheets[sheetName])
      setRawData(parsedData)
      detectImportType(parsedData)
    }
  }

  const validationInfo = useMemo(() => {
    if (!importType || rawData.length === 0) return null

    const req = IMPORT_TYPES[importType as keyof typeof IMPORT_TYPES].required
    let valid = 0
    let invalid = 0
    const missingColumns = req.filter((c) => !Object.keys(rawData[0] || {}).includes(c))

    if (missingColumns.length > 0) {
      return {
        valid: 0,
        invalid: rawData.length,
        total: rawData.length,
        missingColumns,
        errors: [],
        validRecords: [],
      }
    }

    const errors: { row: number; missing: string[] }[] = []
    const validRecords: any[] = []

    rawData.forEach((row, idx) => {
      const missing = req.filter((col) => !row[col] || String(row[col]).trim() === '')
      if (missing.length > 0) {
        invalid++
        errors.push({ row: idx + 1, missing })
      } else {
        valid++
        validRecords.push(row)
      }
    })

    return { valid, invalid, total: rawData.length, missingColumns: [], errors, validRecords }
  }, [rawData, importType])

  const previewData = useMemo(() => {
    if (!importType || rawData.length === 0) return []
    const req = IMPORT_TYPES[importType as keyof typeof IMPORT_TYPES].required
    let filtered = rawData
    if (showOnlyErrors) {
      filtered = rawData.filter((row) => req.some((c) => !row[c] || String(row[c]).trim() === ''))
    }
    return filtered.slice(0, 5)
  }, [rawData, showOnlyErrors, importType])

  const columns = useMemo(() => {
    if (rawData.length === 0) return []
    return Object.keys(rawData[0])
  }, [rawData])

  const confirmImport = async () => {
    if (!validationInfo || validationInfo.validRecords.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhum registro válido para importar.',
      })
      return
    }

    setIsImporting(true)
    setImportProgress(30)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          records: validationInfo.validRecords,
          type: importType,
          fileName: file?.name || 'Importação',
        },
        headers: session
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : undefined,
      })

      if (error) throw new Error(error.message || 'Erro desconhecido ao chamar a função')
      if (data?.error) throw new Error(data.error)

      setImportProgress(100)
      setImportResult(data)

      toast({
        title: 'Processamento Finalizado',
        description: `${data.inserted} registros inseridos, ${data.rejected} rejeitados.`,
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha na Importação',
        description: err.message,
      })
      setImportProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    if (!importType) return
    const config = IMPORT_TYPES[importType as keyof typeof IMPORT_TYPES]
    const headers = [...config.required, ...config.optional].join(';')
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + '\n')
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `template_${importType.toLowerCase()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetForm = () => {
    setFile(null)
    setWorkbook(null)
    setSheets([])
    setSelectedSheet('')
    setImportType('')
    setRawData([])
    setImportResult(null)
    setShowOnlyErrors(false)
  }

  const downloadErrors = () => {
    if (!importResult || importResult.errors.length === 0) return

    const firstRowData = importResult.errors[0].data || {}
    const originalCols = Object.keys(firstRowData)

    const headers = ['Linha', 'Erro', ...originalCols].join(';')

    const rows = importResult.errors
      .map((err) => {
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
    link.setAttribute('download', `erros_importacao_${importType}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadHistory = async () => {
    const { data } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setHistory(data)
  }

  useEffect(() => {
    if (isHistoryOpen) loadHistory()
  }, [isHistoryOpen])

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Importação de Dados</h1>
          <p className="text-muted-foreground">
            Importe planilhas Excel ou CSV para cadastro em lote. Validado em tempo real.
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
          <List className="h-4 w-4 mr-2" />
          Histórico
        </Button>
      </div>

      {!importResult && (
        <Card>
          <CardHeader>
            <CardTitle>1. Selecionar Arquivo</CardTitle>
            <CardDescription>
              Faça o upload do seu arquivo Excel (.xlsx) ou CSV (.csv) para iniciar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-1">
                  Clique para selecionar ou arraste o arquivo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Arquivos .xlsx e .csv são suportados
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  disabled={isUploading || isImporting}
                >
                  Trocar arquivo
                </Button>
              </div>
            )}

            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando arquivo...</span>
                </div>
                <Progress value={45} className="h-2 animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!importResult && sheets.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>2. Configuração de Importação</CardTitle>
            <CardDescription>
              Selecione a aba e o tipo de importação para validar os dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Aba da Planilha</Label>
              <Select
                value={selectedSheet}
                onValueChange={handleSheetChange}
                disabled={isImporting || file?.name.endsWith('.csv')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a aba..." />
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
              <Label>Tipo de Dados</Label>
              <div className="flex gap-2">
                <Select value={importType} onValueChange={setImportType} disabled={isImporting}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(IMPORT_TYPES).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {importType && (
                  <Button variant="outline" onClick={downloadTemplate} title="Baixar Modelo CSV">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!importResult && selectedSheet && importType && validationInfo && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>3. Validação e Preview</CardTitle>
            <CardDescription>
              Revise os dados antes de enviá-los para processamento no banco.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationInfo.missingColumns.length > 0 ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Estrutura Inválida</AlertTitle>
                  <AlertDescription>
                    A aba selecionada não possui todas as colunas obrigatórias para este tipo de
                    importação.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 bg-muted/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Colunas Encontradas na
                      Planilha
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.length > 0 ? (
                        columns.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs font-normal">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Nenhuma coluna encontrada. Verifique se a planilha possui cabeçalho.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-md p-4 bg-red-500/5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" /> Colunas Obrigatórias Ausentes
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {validationInfo.missingColumns.map((c) => (
                        <Badge key={c} variant="destructive" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center text-center border">
                  <span className="text-3xl font-bold">{validationInfo.total}</span>
                  <span className="text-sm text-muted-foreground font-medium">Total de Linhas</span>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg flex flex-col items-center justify-center text-center border border-green-500/20">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-500">
                    {validationInfo.valid}
                  </span>
                  <span className="text-sm text-green-600/80 dark:text-green-500/80 font-medium">
                    Prontas para Envio
                  </span>
                </div>
                <div className="bg-red-500/10 p-4 rounded-lg flex flex-col items-center justify-center text-center border border-red-500/20">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-500">
                    {validationInfo.invalid}
                  </span>
                  <span className="text-sm text-red-600/80 dark:text-red-500/80 font-medium">
                    Incompletas (Ignoradas)
                  </span>
                </div>
              </div>
            )}

            {validationInfo.invalid > 0 && validationInfo.missingColumns.length === 0 && (
              <div className="space-y-4">
                <Alert className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Atenção: Linhas Ignoradas</AlertTitle>
                  <AlertDescription>
                    {validationInfo.invalid} linhas não possuem todas as colunas obrigatórias e não
                    serão enviadas.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-md p-4 bg-amber-50/50 dark:bg-amber-950/10">
                  <h4 className="font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-3">
                    <List className="h-4 w-4" /> Relatório de Pendências
                  </h4>
                  <ScrollArea className="h-32 w-full pr-4">
                    <ul className="space-y-2 text-sm">
                      {validationInfo.errors.map((err) => (
                        <li key={err.row} className="flex items-start gap-2 text-muted-foreground">
                          <span className="min-w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                          <span>
                            <strong>Linha {err.row}:</strong> As colunas obrigatórias a seguir estão
                            vazias:{' '}
                            <span className="font-medium text-foreground">
                              {err.missing.join(', ')}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </div>
            )}

            {columns.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileType2 className="h-4 w-4 text-muted-foreground" />
                    Preview dos Dados (Exibindo até 5 linhas)
                  </h3>
                  {validationInfo.invalid > 0 && validationInfo.missingColumns.length === 0 && (
                    <div className="flex items-center space-x-2 bg-muted/50 p-1.5 rounded-md border">
                      <Switch
                        id="show-errors"
                        checked={showOnlyErrors}
                        onCheckedChange={setShowOnlyErrors}
                      />
                      <Label htmlFor="show-errors" className="cursor-pointer">
                        Mostrar apenas erros
                      </Label>
                    </div>
                  )}
                </div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[60px] text-center">Linha</TableHead>
                        {columns.map((col) => (
                          <TableHead key={col} className="whitespace-nowrap">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.length > 0 ? (
                        previewData.map((row, idx) => {
                          const originalIndex = rawData.indexOf(row) + 1
                          const req = IMPORT_TYPES[importType as keyof typeof IMPORT_TYPES].required
                          const isInvalid = req.some((c) => !row[c] && columns.includes(c))
                          return (
                            <TableRow
                              key={originalIndex}
                              className={
                                isInvalid
                                  ? 'bg-red-500/10 hover:bg-red-500/20 transition-colors'
                                  : ''
                              }
                            >
                              <TableCell className="text-center text-muted-foreground font-medium">
                                {originalIndex}
                              </TableCell>
                              {columns.map((col) => {
                                const isMissingRequired = !row[col] && req.includes(col)
                                return (
                                  <TableCell
                                    key={col}
                                    className={isMissingRequired ? 'bg-red-500/20' : ''}
                                  >
                                    {isMissingRequired ? (
                                      <Badge variant="destructive" className="text-[10px] h-5">
                                        Vazio
                                      </Badge>
                                    ) : (
                                      <span
                                        className="truncate max-w-[150px] inline-block"
                                        title={row[col]}
                                      >
                                        {row[col]}
                                      </span>
                                    )}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                            Nenhum registro encontrado para a visualização atual.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-stretch border-t bg-muted/20 p-6">
            {isImporting ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Processando dados no servidor (Edge Function)...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-muted-foreground">
                  Os dados válidos serão processados remotamente.
                </p>
                <Button
                  onClick={confirmImport}
                  disabled={validationInfo.valid === 0 || validationInfo.missingColumns.length > 0}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar e Processar
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      )}

      {importResult && (
        <Card className="animate-fade-in border-green-500/30">
          <CardHeader className="bg-green-500/5 pb-8">
            <div className="mx-auto bg-green-500/20 p-4 rounded-full mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl">Processamento Concluído</CardTitle>
            <CardDescription className="text-center">
              A Edge Function finalizou a validação e inserção dos registros no banco de dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="-mt-6">
            <div className="grid grid-cols-2 gap-4 bg-background border rounded-lg p-6 shadow-sm">
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl font-bold text-green-600">{importResult.inserted}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Inseridos com Sucesso
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 border-l">
                <span
                  className={`text-4xl font-bold ${importResult.rejected > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  {importResult.rejected}
                </span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Rejeitados/Duplicados
                </span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Relatório de Erros ({importResult.errors.length}
                    )
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrors}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Erros (CSV)
                  </Button>
                </div>
                <ScrollArea className="h-40 w-full rounded-md border p-4 bg-muted/30">
                  <ul className="space-y-2 text-sm">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-muted-foreground flex items-start gap-2">
                        <span className="min-w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                        <span>
                          <strong>Linha {err.row}:</strong> {err.error}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4 bg-muted/10 p-6 border-t">
            <Button variant="outline" onClick={resetForm}>
              Importar Novo Arquivo
            </Button>
            <Button asChild>
              <Link
                to={
                  importType === 'COST_CENTERS'
                    ? '/centros-de-custo'
                    : importType === 'CHART_ACCOUNTS'
                      ? '/plano-de-contas'
                      : importType === 'MAPPINGS'
                        ? '/mapeamento'
                        : importType === 'FINANCIAL_ENTRIES'
                          ? '/lancamentos'
                          : importType === 'COMPANIES'
                            ? '/empresas'
                            : importType === 'DEPARTMENTS'
                              ? '/departamentos'
                              : importType === 'EMPLOYEES'
                                ? '/funcionarios'
                                : '/'
                }
              >
                <List className="h-4 w-4 mr-2" />
                Ir para o Cadastro
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico de Importações</DialogTitle>
            <DialogDescription>
              Acompanhe o status dos últimos lotes processados na sua conta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right text-green-600">Sucesso</TableHead>
                  <TableHead className="text-right text-red-600">Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={h.file_name}>
                        {h.file_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {IMPORT_TYPES[h.import_type as keyof typeof IMPORT_TYPES]?.label ||
                            h.import_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{h.total_records}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {h.success_count}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        {h.error_count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhuma importação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
