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
  const [fileBase64, setFileBase64] = useState<string>('')
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('USE_SPREADSHEET')
  const [allowIncomplete, setAllowIncomplete] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: any[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      setFile(null)
      setFileBase64('')
      setMapping({})
      setResult(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
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

  const fetchPreview = async (b64: string, name: string, sheet: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'PREVIEW',
          fileBase64: b64,
          fileName: name,
          sheetName: sheet,
          type: 'COST_CENTERS',
        },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)

      setSheets(data.sheets || [])
      setHeaders(data.headers || [])
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
        const match = EXPECTED_FIELDS.find(
          (ef) => cleanH.includes(ef.key) || ef.key.includes(cleanH),
        )
        if (match) autoMap[match.key] = h
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
    fetchPreview(fileBase64, file?.name || '', v)
  }

  const handleImport = async () => {
    setLoading(true)
    const columnMapping: Record<string, string> = {}
    Object.entries(mapping).forEach(([expected, fileCol]) => {
      if (fileCol && fileCol !== 'none') {
        columnMapping[fileCol] = expected
      }
    })

    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          type: 'COST_CENTERS',
          fileBase64,
          fileName: file?.name,
          sheetName: selectedSheet,
          columnMapping,
          organizationId: selectedOrg,
          allowIncomplete,
        },
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)

      setResult(data)
      setStep(3)
      onImportSuccess()
    } catch (err: any) {
      toast({ title: 'Erro na Importação', description: err.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <Label>Empresa Padrão</Label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={loading}>
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
                        disabled={loading}
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
                disabled={loading}
              />
              <Label htmlFor="allow-inc" className="text-sm text-slate-600 font-normal">
                Ignorar erros e importar apenas linhas válidas
              </Label>
            </div>
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
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              {step === 2 && (
                <Button onClick={handleImport} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Importar Dados
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
