import { useState, useRef, useEffect } from 'react'
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
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  XCircle,
  CheckCircle2,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const SYSTEM_FIELDS = [
  { value: 'EMPRESA', label: 'Empresa' },
  { value: 'CONTACONTABIL', label: 'Conta Contábil' },
  { value: 'TIPODECONTA', label: 'Tipo de Conta' },
  { value: 'DESCRICAO', label: 'Descrição' },
  { value: 'BANCO', label: 'Banco' },
  { value: 'AGENCIA', label: 'Agência' },
  { value: 'CONTA', label: 'Conta' },
  { value: 'DIGITO', label: 'Dígito' },
  { value: 'CLASSIFICACAO', label: 'Classificação' },
]

export function ImportBankAccountsModal({ isOpen, onClose, onSuccess }: any) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [mode, setMode] = useState('UPDATE')
  const [step, setStep] = useState<'UPLOAD' | 'MAPPING' | 'SIMULATION' | 'RESULT'>('UPLOAD')
  const [simulationData, setSimulationData] = useState<any>(null)
  const [resultData, setResultData] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('USE_SPREADSHEET')

  // Mapping state
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      if (data) setOrganizations(data)
    }
    if (isOpen) fetchOrgs()
  }, [isOpen])

  const downloadTemplate = () => {
    const defaultHeaders = [
      'EMPRESA',
      'CONTACONTABIL',
      'TIPODECONTA',
      'DESCRICAO',
      'BANCO',
      'AGENCIA',
      'CONTA',
      'DIGITO',
      'CLASSIFICACAO',
    ]
    const example = [
      'MINHA EMPRESA LTDA',
      '1.1.1.01.0001',
      'CORRENTE',
      'CONTA PRINCIPAL',
      '341',
      '0001',
      '12345',
      '6',
      'B',
    ]

    const csvContent = '\uFEFF' + defaultHeaders.join(';') + '\n' + example.join(';')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo_importacao_contas_bancarias.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setFileBase64(null)
    setSheets([])
    setSelectedSheet('')
    setHeaders([])
    setMapping({})
    setSimulationData(null)
    setResultData(null)
    setIsUploading(false)
    setIsPreviewLoading(false)
    setStep('UPLOAD')
    setMode('UPDATE')
    setSelectedOrgId('USE_SPREADSHEET')
  }

  const handleClose = () => {
    if (step === 'RESULT' && typeof onSuccess === 'function') onSuccess()
    reset()
    onClose()
  }

  const guessMapping = (sheetHeaders: string[]) => {
    const newMap: Record<string, string> = {}
    SYSTEM_FIELDS.forEach((f) => {
      const match = sheetHeaders.find((h) => {
        const norm = h
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/gi, '')
          .toLowerCase()
        if (f.value === 'EMPRESA' && norm.includes('empresa')) return true
        if (
          f.value === 'CONTACONTABIL' &&
          (norm.includes('contacontabil') || norm.includes('reduzido') || norm.includes('contabil'))
        )
          return true
        if (f.value === 'TIPODECONTA' && norm.includes('tipo')) return true
        if (f.value === 'DESCRICAO' && (norm.includes('descricao') || norm.includes('nome')))
          return true
        if (f.value === 'BANCO' && norm.includes('banco')) return true
        if (f.value === 'AGENCIA' && norm.includes('agencia')) return true
        if (
          f.value === 'CONTA' &&
          (norm === 'conta' || norm === 'numerodaconta' || norm === 'nroconta' || norm === 'numero')
        )
          return true
        if (f.value === 'DIGITO' && (norm.includes('digito') || norm === 'dv')) return true
        if (f.value === 'CLASSIFICACAO' && norm.includes('classificacao')) return true
        return false
      })
      if (match) newMap[f.value] = match
    })
    return newMap
  }

  const loadPreview = async (base64: string, fileName: string, sheet?: string) => {
    setIsPreviewLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'PREVIEW',
          type: 'BANK_ACCOUNTS',
          fileName,
          fileBase64: base64,
          sheetName: sheet,
        },
        headers: session.data.session
          ? { Authorization: `Bearer ${session.data.session.access_token}` }
          : undefined,
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      setSheets(data.sheets || [])
      setHeaders(data.headers || [])
      setSelectedSheet(sheet || data.sheets?.[0] || '')
      setMapping(guessMapping(data.headers || []))
      setStep('MAPPING')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: err.message })
      setStep('UPLOAD')
      setFile(null)
      setFileBase64(null)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    const isValid = ['.xlsx', '.xls', '.csv'].some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext),
    )
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Selecione um arquivo Excel ou CSV.',
      })
      return
    }
    setFile(selectedFile)
    setSimulationData(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const resultStr = ev.target?.result as string
      const base64 = resultStr.split(',')[1]
      setFileBase64(base64)
      await loadPreview(base64, selectedFile.name)
    }
    reader.readAsDataURL(selectedFile)
  }

  const runImport = async (isSimulation: boolean) => {
    if (!file || !fileBase64) return
    setIsUploading(true)

    try {
      const session = await supabase.auth.getSession()

      const payloadColumnMapping = Object.entries(mapping).reduce(
        (acc: any, [sysField, header]) => {
          if (header && header !== 'none') acc[header] = sysField
          return acc
        },
        {},
      )

      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          type: 'BANK_ACCOUNTS',
          fileName: file.name,
          fileBase64: fileBase64,
          allowIncomplete: true,
          mode: mode,
          simulation: isSimulation,
          organizationId: selectedOrgId === 'USE_SPREADSHEET' ? null : selectedOrgId,
          sheetName: selectedSheet,
          columnMapping: payloadColumnMapping,
        },
        headers: session.data.session
          ? { Authorization: `Bearer ${session.data.session.access_token}` }
          : undefined,
      })

      if (error) throw new Error(error.message || 'Erro ao processar importação')
      if (data?.error) throw new Error(data.error)

      if (isSimulation) {
        setSimulationData(data)
        setStep('SIMULATION')
      } else {
        setResultData(data)
        setStep('RESULT')
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro na importação', description: err.message })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadErrors = (errors: any[]) => {
    if (!errors || errors.length === 0) return
    const firstRowData = errors[0].data || {}
    const originalCols = Object.keys(firstRowData)
    const errorHeaders = ['Linha', 'Erro', ...originalCols].join(';')
    const rows = errors
      .map((err: any) => {
        const rowData = originalCols
          .map((col) => `"${String(err.data?.[col] || '').replace(/"/g, '""')}"`)
          .join(';')
        return `${err.row};"${err.error}";${rowData}`
      })
      .join('\n')

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(errorHeaders + '\n' + rows)
    const link = document.createElement('a')
    link.href = csvContent
    link.download = `erros_importacao_contas_bancarias.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Contas Bancárias</DialogTitle>
          <DialogDescription>
            {step === 'UPLOAD' && 'Faça o upload da planilha para importar suas contas bancárias.'}
            {step === 'MAPPING' && 'Vincule as colunas da planilha aos campos do sistema.'}
            {step === 'SIMULATION' && 'Valide os dados antes de confirmar a importação.'}
            {step === 'RESULT' && 'Importação concluída.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'UPLOAD' && (
            <>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" /> Baixar Modelo Padrão
                  </Button>
                </div>
                <div className="space-y-3">
                  <Label>Empresa de Destino</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USE_SPREADSHEET">
                        Utilizar coluna 'EMPRESA' da planilha
                      </SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Modo de Importação</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPDATE">Adicionar e Atualizar</SelectItem>
                      <SelectItem value="INSERT_ONLY">Importar Somente Novos</SelectItem>
                      <SelectItem value="REPLACE">Substituir Tudo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!file && !isPreviewLoading ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-sm mb-1">Clique para selecionar o arquivo</h3>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                  />
                </div>
              ) : isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg mt-4 bg-muted/20">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p className="text-sm font-medium">Lendo arquivo e identificando abas...</p>
                </div>
              ) : null}
            </>
          )}

          {step === 'MAPPING' && (
            <div className="space-y-6">
              {file && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                    <p className="font-medium text-sm">{file.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('UPLOAD')}
                    disabled={isUploading || isPreviewLoading}
                  >
                    Trocar Arquivo
                  </Button>
                </div>
              )}

              {sheets.length > 1 && (
                <div className="space-y-2">
                  <Label>Aba da Planilha</Label>
                  <Select
                    value={selectedSheet}
                    onValueChange={(v) => loadPreview(fileBase64!, file!.name, v)}
                    disabled={isPreviewLoading}
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
              )}

              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-sm">Carregando colunas...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mapeamento de Colunas</Label>
                    <span className="text-xs text-muted-foreground">
                      Vincule as colunas da planilha aos campos do sistema
                    </span>
                  </div>
                  <ScrollArea className="h-[300px] border rounded-md p-4 bg-card">
                    <div className="space-y-4">
                      {SYSTEM_FIELDS.map((field) => (
                        <div key={field.value} className="flex items-center gap-4">
                          <div className="w-1/3 text-sm font-medium">{field.label}</div>
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <Select
                              value={mapping[field.value] || 'none'}
                              onValueChange={(val) =>
                                setMapping((prev) => ({
                                  ...prev,
                                  [field.value]: val === 'none' ? '' : val,
                                }))
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione uma coluna" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-muted-foreground italic">
                                  Não mapear
                                </SelectItem>
                                {headers.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {step === 'SIMULATION' && simulationData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 p-3 rounded-md border border-blue-200">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-semibold text-sm">Simulação concluída com sucesso!</p>
              </div>

              <div className="grid grid-cols-3 gap-4 border rounded-lg p-4">
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-600">
                    {simulationData.totalToInsert || 0}
                  </span>
                  <span className="block text-xs uppercase">Novos</span>
                </div>
                <div className="text-center border-l">
                  <span className="text-2xl font-bold text-blue-600">
                    {simulationData.totalToUpdate || 0}
                  </span>
                  <span className="block text-xs uppercase">Atualizados</span>
                </div>
                <div className="text-center border-l">
                  <span className="text-2xl font-bold text-amber-600">
                    {simulationData.totalToDelete || 0}
                  </span>
                  <span className="block text-xs uppercase">Removidos</span>
                </div>
              </div>

              {simulationData.errors?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-red-600 font-semibold text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Erros Encontrados
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadErrors(simulationData.errors)}
                      className="h-8"
                    >
                      <Download className="h-3 w-3 mr-2" /> Baixar Erros
                    </Button>
                  </div>
                  <ScrollArea className="h-32 border rounded-md p-3 bg-muted/30">
                    <ul className="space-y-2 text-xs">
                      {simulationData.errors.map((err: any, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          <strong>Linha {err.row}:</strong> {err.error}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {step === 'RESULT' && resultData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 p-4 rounded-md border border-green-200">
                <CheckCircle2 className="h-6 w-6" />
                <p className="font-semibold">Importação finalizada com sucesso!</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 text-center">
                <div>
                  <span className="text-3xl font-bold text-green-600">
                    {resultData.inserted || 0}
                  </span>
                  <span className="block text-xs uppercase">Processados</span>
                </div>
                <div className="border-l">
                  <span className="text-3xl font-bold text-red-500">
                    {resultData.errors?.length || 0}
                  </span>
                  <span className="block text-xs uppercase">Erros</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'UPLOAD' && (
            <Button variant="outline" onClick={handleClose} disabled={isPreviewLoading}>
              Cancelar
            </Button>
          )}
          {step === 'MAPPING' && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('UPLOAD')}
                disabled={isUploading || isPreviewLoading}
              >
                Voltar
              </Button>
              <Button onClick={() => runImport(true)} disabled={isUploading || isPreviewLoading}>
                {isUploading ? 'Simulando...' : 'Simular'}
              </Button>
            </>
          )}
          {step === 'SIMULATION' && (
            <>
              <Button variant="outline" onClick={() => setStep('MAPPING')} disabled={isUploading}>
                Voltar
              </Button>
              <Button onClick={() => runImport(false)} disabled={isUploading}>
                {isUploading ? 'Importando...' : 'Confirmar Importação'}
              </Button>
            </>
          )}
          {step === 'RESULT' && (
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
