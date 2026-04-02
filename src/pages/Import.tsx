import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, AlertCircle, CheckCircle2, FileType2 } from 'lucide-react'
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

const IMPORT_TYPES = {
  BANK_ACCOUNTS: {
    id: 'BANK_ACCOUNTS',
    label: 'Contas Bancárias',
    required: ['EMPRESA', 'CONTA_CONTABIL', 'DESCRICAO'],
  },
  COST_CENTERS: {
    id: 'COST_CENTERS',
    label: 'Centros de Custo',
    required: ['EMPRESA', 'CODIGO_CC', 'NOME_CC'],
  },
  CHART_OF_ACCOUNTS: {
    id: 'CHART_OF_ACCOUNTS',
    label: 'Plano de Contas',
    required: ['CODIGO', 'CLASSIFICACAO', 'NOME_CONTA'],
  },
  MAPPING: {
    id: 'MAPPING',
    label: 'Mapeamento DE/PARA',
    required: ['DE_CONTA', 'PARA_CONTA', 'TIPO'],
  },
}

export default function Import() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [importType, setImportType] = useState<string>('')

  const [rawData, setRawData] = useState<any[]>([])

  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

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
    setIsUploading(true)

    // Simulando leitura do arquivo Excel e extração das abas
    setTimeout(() => {
      setSheets(['DE-PARA', 'PLANO_TGA', 'CADASTRO_CAIXA_BCOS_TGA', 'GERAR_LCTO_DOMINIO'])
      setSelectedSheet('')
      setImportType('')
      setRawData([])
      setIsUploading(false)
      toast({
        title: 'Arquivo carregado',
        description: 'Selecione a aba e o tipo de dados para continuar.',
      })
    }, 1500)
  }

  useEffect(() => {
    if (selectedSheet && importType) {
      // Mock de extração de dados da aba selecionada
      const req = IMPORT_TYPES[importType as keyof typeof IMPORT_TYPES].required
      const rows = []
      const numRows = Math.floor(Math.random() * 50) + 20

      for (let i = 0; i < numRows; i++) {
        const row: any = {}
        req.forEach((col) => {
          // Probabilidade pequena de vir vazio para simular validação
          const isMissing = Math.random() < 0.1
          row[col] = isMissing ? '' : `Mock ${col} ${i + 1}`
        })
        row['COLUNA_EXTRA'] = `Extra info ${i + 1}`
        rows.push(row)
      }
      setRawData(rows)
    } else {
      setRawData([])
    }
  }, [selectedSheet, importType])

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
      }
    }

    const errors: { row: number; missing: string[] }[] = []

    rawData.forEach((row, idx) => {
      const missing = req.filter((col) => !row[col] || String(row[col]).trim() === '')
      if (missing.length > 0) {
        invalid++
        if (errors.length < 5) {
          errors.push({ row: idx + 1, missing })
        }
      } else {
        valid++
      }
    })

    return { valid, invalid, total: rawData.length, missingColumns: [], errors }
  }, [rawData, importType])

  const columns = useMemo(() => {
    if (rawData.length === 0) return []
    return Object.keys(rawData[0])
  }, [rawData])

  const confirmImport = () => {
    if (!validationInfo || validationInfo.valid === 0 || validationInfo.missingColumns.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Não há registros válidos para importar.',
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    const interval = setInterval(() => {
      setImportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setIsImporting(false)
          toast({
            title: 'Importação Concluída',
            description: `${validationInfo.valid} registros foram importados com sucesso.`,
          })
          setTimeout(() => {
            setFile(null)
            setSheets([])
            setSelectedSheet('')
            setImportType('')
            setRawData([])
          }, 2000)
          return 100
        }
        return p + 20
      })
    }, 500)
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importação de Dados</h1>
          <p className="text-muted-foreground">
            Importe suas planilhas Excel (.xlsx) para o sistema.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Selecionar Arquivo</CardTitle>
          <CardDescription>
            Faça o upload do seu arquivo Excel para iniciar a importação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">
                Clique para selecionar ou arraste o arquivo
              </h3>
              <p className="text-sm text-muted-foreground">Apenas arquivos .xlsx são suportados</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                onClick={() => {
                  setFile(null)
                  setSheets([])
                  setSelectedSheet('')
                  setImportType('')
                  setRawData([])
                }}
                disabled={isUploading || isImporting}
              >
                Trocar arquivo
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lendo arquivo...</span>
              </div>
              <Progress value={45} className="h-2 animate-pulse" />
            </div>
          )}
        </CardContent>
      </Card>

      {sheets.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>2. Configuração de Importação</CardTitle>
            <CardDescription>
              Selecione a aba da planilha e o tipo de dados correspondente.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Aba da Planilha</Label>
              <Select value={selectedSheet} onValueChange={setSelectedSheet} disabled={isImporting}>
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
              <Select value={importType} onValueChange={setImportType} disabled={isImporting}>
                <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSheet && importType && validationInfo && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>3. Validação e Preview</CardTitle>
            <CardDescription>
              Revise as primeiras linhas e os resultados da validação de colunas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationInfo.missingColumns.length > 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Estrutura Inválida</AlertTitle>
                <AlertDescription>
                  A planilha selecionada não possui as colunas obrigatórias para este tipo de dado.
                  <br className="my-1" />
                  Colunas ausentes:{' '}
                  <span className="font-semibold">{validationInfo.missingColumns.join(', ')}</span>
                </AlertDescription>
              </Alert>
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
                    Linhas Válidas
                  </span>
                </div>
                <div className="bg-red-500/10 p-4 rounded-lg flex flex-col items-center justify-center text-center border border-red-500/20">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-500">
                    {validationInfo.invalid}
                  </span>
                  <span className="text-sm text-red-600/80 dark:text-red-500/80 font-medium">
                    Linhas Inválidas
                  </span>
                </div>
              </div>
            )}

            {validationInfo.invalid > 0 && validationInfo.missingColumns.length === 0 && (
              <Alert className="bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Atenção: Linhas com Erro</AlertTitle>
                <AlertDescription>
                  Existem {validationInfo.invalid} linhas com campos obrigatórios vazios. Elas serão{' '}
                  <strong>ignoradas</strong> na importação.
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {validationInfo.errors.map((e, i) => (
                      <li key={i}>
                        Linha {e.row}: Campos vazios ({e.missing.join(', ')})
                      </li>
                    ))}
                    {validationInfo.invalid > 5 && (
                      <li>...e mais {validationInfo.invalid - 5} linhas com erro.</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationInfo.invalid === 0 &&
              validationInfo.missingColumns.length === 0 &&
              rawData.length > 0 && (
                <Alert className="bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Tudo Certo!</AlertTitle>
                  <AlertDescription>
                    Os dados estão no formato correto e prontos para importação.
                  </AlertDescription>
                </Alert>
              )}

            {columns.length > 0 && validationInfo.missingColumns.length === 0 && (
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <FileType2 className="h-4 w-4 text-muted-foreground" />
                  Preview dos Dados (Primeiras 5 linhas)
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">#</TableHead>
                        {columns.map((col) => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.slice(0, 5).map((row, idx) => {
                        const isRowInvalid = IMPORT_TYPES[
                          importType as keyof typeof IMPORT_TYPES
                        ].required.some((c) => !row[c])
                        return (
                          <TableRow
                            key={idx}
                            className={isRowInvalid ? 'bg-red-500/5 hover:bg-red-500/10' : ''}
                          >
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            {columns.map((col) => (
                              <TableCell key={col}>
                                {!row[col] &&
                                IMPORT_TYPES[
                                  importType as keyof typeof IMPORT_TYPES
                                ].required.includes(col) ? (
                                  <Badge variant="destructive" className="text-[10px] h-5">
                                    Vazio
                                  </Badge>
                                ) : (
                                  <span
                                    className="truncate max-w-[200px] inline-block"
                                    title={row[col]}
                                  >
                                    {row[col]}
                                  </span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      })}
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
                  <span>Importando dados para o banco...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que os dados e as colunas estão corretos antes de continuar.
                </p>
                <Button
                  onClick={confirmImport}
                  disabled={
                    !validationInfo ||
                    validationInfo.valid === 0 ||
                    validationInfo.missingColumns.length > 0
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Importação
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
