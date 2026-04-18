import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ImportMappingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string | null
  onSuccess?: () => void
}

export function ImportMappingModal({
  open,
  onOpenChange,
  orgId,
  onSuccess,
}: ImportMappingModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')

  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [importMode, setImportMode] = useState<string>('UPDATE')

  const [previewInfo, setPreviewInfo] = useState<{ totalRecords?: number } | null>(null)
  const [progress, setProgress] = useState(0)

  const [results, setResults] = useState<{
    inserted?: number
    rejected?: number
    errors?: any[]
  } | null>(null)

  useEffect(() => {
    if (open) {
      loadOrgs()
      setSelectedOrg(orgId || '')
    } else {
      reset()
    }
  }, [open, orgId])

  const loadOrgs = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
    if (data) setOrganizations(data)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setSheets([])
    setSelectedSheet('')
    setUploadedFilePath(null)
    setPreviewInfo(null)

    if (selectedFile) {
      setPreviewLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) throw new Error('Sessão expirada. Faça login novamente.')

        const fileExt = selectedFile.name.split('.').pop()
        const filePath = `${session.user.id}/${Date.now()}_${selectedFile.name}`

        const { error: uploadError } = await supabase.storage
          .from('imports')
          .upload(filePath, selectedFile, { upsert: true })

        if (uploadError)
          throw new Error('Falha ao enviar arquivo para análise: ' + uploadError.message)

        setUploadedFilePath(filePath)

        const { data, error } = await supabase.functions.invoke('import-data', {
          body: {
            action: 'PREVIEW',
            type: 'MAPPINGS',
            fileName: selectedFile.name,
            filePath: filePath,
          },
        })

        if (error) throw error
        if (data?.error) throw new Error(data.error)
        if (data?.sheets) {
          setSheets(data.sheets)
          if (data.sheets.length > 0) {
            setSelectedSheet(data.sheets[0])
          }
          setPreviewInfo({
            totalRecords: data.totalRecords,
          })
        }
      } catch (err: any) {
        toast.error('Erro ao ler abas da planilha: ' + err.message)
      } finally {
        setPreviewLoading(false)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !uploadedFilePath) return
    if (!selectedOrg) {
      toast.error('Por favor, selecione uma empresa.')
      return
    }
    setLoading(true)
    setProgress(0)
    setResults(null)

    try {
      const { data: jobData, error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'START_BACKGROUND',
          type: 'MAPPINGS',
          fileName: file.name,
          filePath: uploadedFilePath,
          sheetName: selectedSheet,
          organizationId: selectedOrg,
          mode: importMode,
          totalRecords: previewInfo?.totalRecords || 0,
        },
      })

      if (error) throw error
      if (jobData?.error) throw new Error(jobData.error)

      const importId = jobData.importId

      const pollInterval = setInterval(async () => {
        const { data: job } = await supabase
          .from('import_history')
          .select(
            'status, processed_records, total_records, success_count, error_count, errors_list',
          )
          .eq('id', importId)
          .single()

        if (job) {
          const processed = job.processed_records || 0
          const total = job.total_records || previewInfo?.totalRecords || 1
          setProgress(Math.min(100, Math.round((processed / total) * 100)))

          if (job.status === 'Completed' || job.status === 'Error') {
            clearInterval(pollInterval)
            setProgress(100)
            setResults({
              inserted: job.success_count || 0,
              rejected: job.error_count || 0,
              errors: job.errors_list || [],
            })
            setLoading(false)

            if ((job.success_count || 0) > 0 || (job.error_count || 0) > 0) {
              onSuccess?.()
            }

            if (job.status === 'Completed') {
              if ((job.success_count || 0) > 0) {
                toast.success(`${job.success_count} mapeamentos importados com sucesso!`)
                if ((job.error_count || 0) === 0) {
                  setTimeout(() => onOpenChange(false), 2000)
                }
              } else if ((job.error_count || 0) > 0) {
                toast.warning(`Importação finalizada com ${job.error_count} rejeições.`)
              } else {
                toast.info('Nenhum registro foi importado.')
              }
            } else {
              toast.error('Ocorreu um erro durante o processamento em background.')
            }
          }
        }
      }, 2000)
    } catch (err: any) {
      toast.error('Erro na importação: ' + err.message)
      setLoading(false)
    }
  }

  const reset = () => {
    setResults(null)
    setFile(null)
    setUploadedFilePath(null)
    setSheets([])
    setSelectedSheet('')
    setPreviewInfo(null)
    setProgress(0)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && !loading) reset()
        if (!loading) onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Mapeamento DE/PARA</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha (Excel ou CSV) para vincular Centros de Custo às Contas
            Contábeis automaticamente.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="org">Empresa</Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={loading}>
                <SelectTrigger id="org">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5 animate-in fade-in duration-300">
              <Label htmlFor="mode">Modo de Importação</Label>
              <Select value={importMode} onValueChange={setImportMode} disabled={loading}>
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPDATE">Adicionar e Atualizar (Padrão)</SelectItem>
                  <SelectItem value="INSERT_ONLY">Importar Somente Novos</SelectItem>
                  <SelectItem value="REPLACE">Substituir Tudo (Cuidado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">Arquivo da Planilha</Label>
              <div className="relative">
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  disabled={previewLoading || loading}
                />
                {previewLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>

            {sheets.length > 0 && (
              <div className="grid w-full items-center gap-1.5 animate-in fade-in duration-300">
                <Label htmlFor="sheet">Aba da Planilha</Label>
                <Select value={selectedSheet} onValueChange={setSelectedSheet} disabled={loading}>
                  <SelectTrigger id="sheet">
                    <SelectValue placeholder="Selecione a aba" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-600">
              <p className="font-medium mb-2 flex items-center gap-2 text-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Colunas Obrigatórias:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>CENTROCUSTO:</strong> Código exato do Centro de Custo TGA.
                </li>
                <li>
                  <strong>CONTACONTABIL:</strong> Código Reduzido da Conta Contábil.
                </li>
              </ul>
              <p className="mt-3 text-xs opacity-80">
                Outras colunas serão ignoradas. Processamento assíncrono habilitado para suportar
                alto volume de registros.
              </p>
            </div>

            {previewInfo && !loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 animate-in fade-in duration-300">
                <p className="font-semibold flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Planilha Carregada
                </p>
                <p>
                  Encontramos aproximadamente <strong>{previewInfo.totalRecords}</strong> registros
                  na aba selecionada.
                </p>
                <p className="mt-2 text-xs opacity-90">
                  Clique no botão abaixo para confirmar e iniciar a importação.
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Processando registros no servidor...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={
                !file ||
                !uploadedFilePath ||
                !selectedOrg ||
                (!selectedSheet && sheets.length > 0) ||
                loading ||
                previewLoading
              }
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Processando Importação...' : 'Confirmar e Importar Planilha'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-around text-center p-4 bg-slate-50 rounded-lg border">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{results.inserted || 0}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Mapeados</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <p className="text-3xl font-bold text-red-500">{results.rejected || 0}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Rejeitados</p>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto rounded-md border border-red-100 bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-800 mb-2">Divergências encontradas:</p>
                <ul className="space-y-2">
                  {results.errors.map((e: any, i: number) => (
                    <li key={i} className="text-red-700 flex flex-col sm:flex-row sm:gap-2">
                      <span className="font-medium whitespace-nowrap">Linha {e.row}:</span>
                      <span>{e.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button className="w-full" variant="outline" onClick={reset}>
              Fazer nova importação
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
