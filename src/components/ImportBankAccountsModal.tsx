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
import { UploadCloud, FileSpreadsheet, Download, XCircle, CheckCircle2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function ImportBankAccountsModal({ isOpen, onClose, onSuccess }: any) {
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
    const headers = [
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

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + example.join(';')
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
    setSimulationData(null)
    setResultData(null)
    setIsUploading(false)
    setStep('UPLOAD')
    setMode('UPDATE')
    setSelectedOrgId('USE_SPREADSHEET')
  }

  const handleClose = () => {
    if (step === 'RESULT' && typeof onSuccess === 'function') onSuccess()
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
        description: 'Selecione um arquivo Excel ou CSV.',
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
          const session = await supabase.auth.getSession()

          const { data, error } = await supabase.functions.invoke('import-data', {
            body: {
              type: 'BANK_ACCOUNTS',
              fileName: file.name,
              fileBase64: base64,
              allowIncomplete: false,
              mode: mode,
              simulation: isSimulation,
              organizationId: selectedOrgId === 'USE_SPREADSHEET' ? null : selectedOrgId,
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
      reader.readAsDataURL(file)
    } catch (err: any) {
      setIsUploading(false)
      toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: err.message })
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
    link.href = csvContent
    link.download = `erros_importacao_contas_bancarias.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Contas Bancárias</DialogTitle>
          <DialogDescription>
            {step === 'UPLOAD' &&
              'Faça o upload da planilha padronizada para importar suas contas bancárias.'}
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

              {!file ? (
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
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 mt-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
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
            </>
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
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={() => runImport(true)} disabled={!file || isUploading}>
                {isUploading ? 'Simulando...' : 'Simular'}
              </Button>
            </>
          )}
          {step === 'SIMULATION' && (
            <>
              <Button variant="outline" onClick={() => setStep('UPLOAD')} disabled={isUploading}>
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
