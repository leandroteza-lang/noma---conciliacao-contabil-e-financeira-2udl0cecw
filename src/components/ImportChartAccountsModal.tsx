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
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function ImportChartAccountsModal({ isOpen, onClose, onSuccess }: any) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [mode, setMode] = useState('UPDATE')
  const [step, setStep] = useState<'UPLOAD' | 'SIMULATION' | 'RESULT'>('UPLOAD')
  const [simulationData, setSimulationData] = useState<any>(null)
  const [resultData, setResultData] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('USE_SPREADSHEET')
  const [rootMapping, setRootMapping] = useState<
    Record<string, { nature: string; account_type: string; account_behavior: string }>
  >({})

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      if (data) setOrganizations(data)
    }
    if (isOpen) {
      fetchOrgs()
    }
  }, [isOpen])

  const reset = () => {
    setFile(null)
    setSimulationData(null)
    setResultData(null)
    setIsUploading(false)
    setStep('UPLOAD')
    setMode('UPDATE')
    setSelectedOrgId('USE_SPREADSHEET')
    setRootMapping({})
  }

  const handleClose = () => {
    if (step === 'RESULT' && typeof onSuccess === 'function') {
      onSuccess()
    }
    reset()
    onClose()
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
        description: 'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv).',
      })
      return
    }
    setFile(selectedFile)
    setSimulationData(null)
    setStep('UPLOAD')
  }

  const runImport = async (isSimulation: boolean) => {
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
              type: 'CHART_ACCOUNTS',
              fileName: file.name,
              fileBase64: base64,
              allowIncomplete: false,
              mode: mode,
              simulation: isSimulation,
              organizationId: selectedOrgId === 'USE_SPREADSHEET' ? null : selectedOrgId,
              rootMapping: !isSimulation ? rootMapping : undefined,
            },
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
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

  const downloadErrors = (errors: any[]) => {
    if (!errors || errors.length === 0) return

    const firstRowData = errors[0].data || {}
    const originalCols = Object.keys(firstRowData)

    const headers = ['Linha', 'Erro', ...originalCols].join(';')

    const rows = errors
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
    link.setAttribute('download', `erros_importacao_plano_contas.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Plano de Contas</DialogTitle>
          <DialogDescription>
            {step === 'UPLOAD' &&
              'Faça o upload da planilha padronizada para importar seu plano de contas.'}
            {step === 'SIMULATION' && 'Valide os dados antes de confirmar a importação.'}
            {step === 'RESULT' && 'Importação concluída.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'UPLOAD' && (
            <>
              <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Se você selecionar uma empresa, a coluna EMPRESA da planilha será ignorada.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Modo de Importação</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPDATE">Adicionar e Atualizar (Recomendado)</SelectItem>
                      <SelectItem value="INSERT_ONLY">Importar Somente Novos</SelectItem>
                      <SelectItem value="REPLACE">
                        Substituir Tudo (Remove contas não enviadas na planilha)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === 'REPLACE' && (
                    <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        <strong>Atenção:</strong> O modo "Substituir Tudo" irá deletar as contas
                        existentes que não estiverem na planilha. Um backup automático será criado
                        antes da operação.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!file ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-sm mb-1">Clique para selecionar o arquivo</h3>
                  <p className="text-xs text-muted-foreground">
                    Arquivos suportados: .xlsx, .xls, .csv
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 mt-4">
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
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processando dados remotamente...</span>
                  </div>
                  <Progress value={45} className="h-2 animate-pulse" />
                </div>
              )}
            </>
          )}

          {step === 'SIMULATION' && simulationData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-md border border-blue-200">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Simulação concluída com sucesso!</p>
                  <p>Revise o impacto da importação antes de aplicar as alterações.</p>
                </div>
              </div>

              {simulationData.detectedMasks?.length > 0 && (
                <div className="bg-slate-50 border p-3 rounded-md">
                  <Label className="text-xs text-muted-foreground">
                    Máscaras Detectadas (Classificação):
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {simulationData.detectedMasks.map((m: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-xs font-mono"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 bg-background border rounded-lg p-4 shadow-sm">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold text-green-600">
                    {simulationData.totalToInsert}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Novos
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 border-l">
                  <span className="text-2xl font-bold text-blue-600">
                    {simulationData.totalToUpdate}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Atualizados
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 border-l">
                  <span
                    className={`text-2xl font-bold ${simulationData.totalToDelete > 0 ? 'text-amber-600' : 'text-slate-400'}`}
                  >
                    {simulationData.totalToDelete}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Removidos
                  </span>
                </div>
              </div>

              {simulationData.uniqueRoots?.length > 0 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-slate-800">
                      Mapeamento de Contas Raiz (Opcional)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Se sua planilha já possui as colunas de Natureza, Grupo e Comportamento, você
                      pode ignorar este passo. Caso contrário, defina abaixo para aplicar
                      automaticamente nas contas.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {simulationData.uniqueRoots.map((root: string) => (
                      <div
                        key={root}
                        className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-md shadow-sm"
                      >
                        <div className="flex items-center gap-2 border-b pb-2">
                          <Badge variant="secondary" className="font-mono text-sm bg-slate-100">
                            {root}
                          </Badge>
                          <span className="text-xs font-medium text-slate-600">Raiz Contábil</span>
                        </div>
                        <Select
                          value={rootMapping[root]?.nature || ''}
                          onValueChange={(v) =>
                            setRootMapping((prev) => ({
                              ...prev,
                              [root]: { ...(prev[root] || {}), nature: v },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Natureza" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATIVO">ATIVO</SelectItem>
                            <SelectItem value="PASSIVO">PASSIVO</SelectItem>
                            <SelectItem value="RECEITAS">RECEITAS</SelectItem>
                            <SelectItem value="DESPESAS">DESPESAS</SelectItem>
                            <SelectItem value="OUTRAS">OUTRAS</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={rootMapping[root]?.account_type || ''}
                          onValueChange={(v) =>
                            setRootMapping((prev) => ({
                              ...prev,
                              [root]: { ...(prev[root] || {}), account_type: v },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Grupo Contábil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Passivo">Passivo</SelectItem>
                            <SelectItem value="Receita">Receita</SelectItem>
                            <SelectItem value="Despesa">Despesa</SelectItem>
                            <SelectItem value="Patrimônio Líquido">Patrimônio Líquido</SelectItem>
                            <SelectItem value="Custos">Custos</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={rootMapping[root]?.account_behavior || ''}
                          onValueChange={(v) =>
                            setRootMapping((prev) => ({
                              ...prev,
                              [root]: { ...(prev[root] || {}), account_behavior: v },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Tipo (Comportamento)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Devedora">Devedora</SelectItem>
                            <SelectItem value="Credora">Credora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {simulationData.errors?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4" /> Erros Encontrados (
                      {simulationData.errors.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadErrors(simulationData.errors)}
                      className="h-8 text-red-600"
                    >
                      <Download className="h-3 w-3 mr-2" /> Baixar Erros
                    </Button>
                  </div>
                  <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/30">
                    <ul className="space-y-2 text-xs">
                      {simulationData.errors.map((err: any, i: number) => (
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

          {step === 'RESULT' && resultData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-4 rounded-md border border-green-200">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-semibold text-base">Importação finalizada com sucesso!</p>
                  <p>O plano de contas foi atualizado no banco de dados.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-background border rounded-lg p-4 shadow-sm mt-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-green-600">{resultData.inserted}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Registros Processados
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 border-l">
                  <span
                    className={`text-3xl font-bold ${resultData.errors?.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {resultData.errors?.length || 0}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Erros / Rejeitados
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'UPLOAD' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={() => runImport(true)} disabled={!file || isUploading}>
                {isUploading ? 'Simulando...' : 'Simular Importação'}
              </Button>
            </>
          )}
          {step === 'SIMULATION' && (
            <>
              <Button variant="outline" onClick={() => setStep('UPLOAD')} disabled={isUploading}>
                Voltar
              </Button>
              <Button onClick={() => runImport(false)} disabled={isUploading}>
                {isUploading ? 'Importando...' : 'Confirmar e Importar'}
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
