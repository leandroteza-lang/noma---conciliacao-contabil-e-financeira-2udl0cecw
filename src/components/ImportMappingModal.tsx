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

    if (selectedFile) {
      setPreviewLoading(true)
      try {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const result = event.target?.result as string
            if (!result) throw new Error('Falha ao ler o arquivo')
            const base64 = result.split(',')[1]

            const {
              data: { session },
            } = await supabase.auth.getSession()

            const { data, error } = await supabase.functions.invoke('import-data', {
              body: {
                action: 'PREVIEW',
                type: 'MAPPINGS',
                fileName: selectedFile.name,
                fileBase64: base64,
              },
              headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
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
        reader.onerror = () => {
          toast.error('Erro ao ler o arquivo.')
          setPreviewLoading(false)
        }
        reader.readAsDataURL(selectedFile)
      } catch (err) {
        setPreviewLoading(false)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return
    if (!selectedOrg) {
      toast.error('Por favor, selecione uma empresa.')
      return
    }
    setLoading(true)
    setProgress(0)
    setResults(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string
          if (!result) throw new Error('Falha ao ler o arquivo')
          const base64 = result.split(',')[1]

          const {
            data: { session },
          } = await supabase.auth.getSession()

          setProgress(5)
          const parseRes = await supabase.functions.invoke('import-data', {
            body: {
              action: 'PARSE_ALL',
              type: 'MAPPINGS',
              fileName: file.name,
              fileBase64: base64,
              sheetName: selectedSheet,
            },
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          })

          if (parseRes.error) throw parseRes.error
          if (parseRes.data?.error) throw new Error(parseRes.data.error)

          const allRecords = parseRes.data?.records || []
          const totalRecords = allRecords.length

          if (totalRecords === 0) {
            toast.info('Nenhum registro encontrado na planilha.')
            setLoading(false)
            return
          }

          const CHUNK_SIZE = 1000
          let inserted = 0
          let rejected = 0
          let errors: any[] = []

          for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
            const chunk = allRecords.slice(i, i + CHUNK_SIZE)

            const {
              data: { session: currentSession },
            } = await supabase.auth.getSession()
            const chunkMode =
              i === 0 ? importMode : importMode === 'REPLACE' ? 'UPDATE' : importMode

            const chunkRes = await supabase.functions.invoke('import-data', {
              body: {
                type: 'MAPPINGS',
                fileName: file.name,
                organizationId: selectedOrg,
                mode: chunkMode,
                records: chunk,
                offset: i,
                skipHistory: true,
              },
              headers: currentSession
                ? { Authorization: `Bearer ${currentSession.access_token}` }
                : undefined,
            })

            if (chunkRes.error) throw chunkRes.error
            if (chunkRes.data?.error) throw new Error(chunkRes.data.error)

            inserted += chunkRes.data?.inserted || 0
            rejected += chunkRes.data?.rejected || 0
            if (chunkRes.data?.errors) {
              errors = [...errors, ...chunkRes.data.errors]
            }

            setProgress(Math.min(100, Math.round(((i + CHUNK_SIZE) / totalRecords) * 100)))
          }

          setProgress(100)
          setResults({ inserted, rejected, errors })

          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            await supabase.from('import_history').insert({
              user_id: userData.user.id,
              import_type: 'MAPPINGS',
              file_name: file.name,
              total_records: totalRecords,
              success_count: inserted,
              error_count: rejected,
              status: 'Completed',
            })
          }

          if (inserted > 0 || rejected > 0) {
            onSuccess?.()
          }

          if (inserted > 0) {
            toast.success(`${inserted} mapeamentos importados com sucesso!`)
            if (rejected === 0) {
              setTimeout(() => onOpenChange(false), 2000)
            }
          } else if (rejected > 0) {
            toast.warning(`Importação finalizada com ${rejected} rejeições.`)
          } else {
            toast.info('Nenhum registro foi importado.')
          }
        } catch (err: any) {
          toast.error('Erro na importação: ' + err.message)
        } finally {
          setLoading(false)
        }
      }
      reader.onerror = () => {
        toast.error('Erro ao ler o arquivo.')
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      toast.error('Erro ao processar arquivo: ' + err.message)
      setLoading(false)
    }
  }

  const reset = () => {
    setResults(null)
    setFile(null)
    setSheets([])
    setSelectedSheet('')
    setPreviewInfo(null)
    setProgress(0)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset()
        onOpenChange(val)
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
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
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
              <Select value={importMode} onValueChange={setImportMode}>
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
                  disabled={previewLoading}
                />
                {previewLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>

            {sheets.length > 0 && (
              <div className="grid w-full items-center gap-1.5 animate-in fade-in duration-300">
                <Label htmlFor="sheet">Aba da Planilha</Label>
                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
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
                Outras colunas serão ignoradas. Linhas sem correspondência exata no banco serão
                marcadas como rejeitadas.
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
                  <span>Importando registros...</span>
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
