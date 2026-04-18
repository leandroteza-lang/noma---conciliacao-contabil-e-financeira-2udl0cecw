import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UploadCloud, CheckCircle2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportErpFinancialModal({ open, onOpenChange, onImportSuccess }: any) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [orgs, setOrgs] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [filePath, setFilePath] = useState<string>('')

  const ERP_COLUMNS = [
    'Compensado',
    'Tipo Operação',
    'Data Emissão',
    'Dt Compens.',
    'Conta/Caixa',
    'Nome Caixa',
    'Conta/Caixa Destino',
    'Forma Pagto',
    'C.Custo',
    'Descrição C.Custo',
    'Valor',
    'Valor Líquido',
    'Nº Documento',
    'Nome Cli/Fornec',
    'Histórico',
    'FP',
    'Nº Cheque',
    'Data Vencto',
    'Nominal a',
    'Emitente Cheque',
    'CNPJ/CPF',
    'Nº Extrato',
    'Filial',
    'Data Canc.',
    'Data Estorno',
    'Banco',
    'C.Corrente',
    'Cód.Cli/For',
    'Departamento',
  ]

  useEffect(() => {
    if (open) {
      setStep(1)
      setFile(null)
      setPreviewData(null)
      setColumnMapping({})
      supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .then(({ data }) => {
          if (data) {
            setOrgs(data)
            if (data.length > 0) setSelectedOrg(data[0].id)
          }
        })
    }
  }, [open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      setLoading(true)
      try {
        const path = `${user?.id}_${Date.now()}_${selectedFile.name}`
        const { error: uploadErr } = await supabase.storage
          .from('imports')
          .upload(path, selectedFile)
        if (uploadErr) throw uploadErr

        setFilePath(path)

        const { data, error } = await supabase.functions.invoke('import-data', {
          body: { action: 'PREVIEW', filePath: path, fileName: selectedFile.name },
        })
        if (error) throw error

        setPreviewData(data)

        const initialMap: Record<string, string> = {}
        const normalizedHeaders = data.headers.map((h: string) =>
          h.toLowerCase().replace(/[^a-z0-9]/g, ''),
        )

        ERP_COLUMNS.forEach((erpCol) => {
          const normErp = erpCol.toLowerCase().replace(/[^a-z0-9]/g, '')
          const matchIdx = normalizedHeaders.findIndex(
            (nh: string) => normErp.includes(nh) || nh.includes(normErp),
          )
          if (matchIdx !== -1) {
            initialMap[data.headers[matchIdx]] = erpCol
          }
        })
        setColumnMapping(initialMap)

        setStep(2)
      } catch (err: any) {
        toast({
          title: 'Erro ao carregar arquivo',
          description: err.message,
          variant: 'destructive',
        })
        setFile(null)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleImport = async () => {
    if (!selectedOrg) {
      toast({ title: 'Selecione uma empresa', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'START_BACKGROUND',
          type: 'ERP_FINANCIAL_MOVEMENTS',
          filePath,
          fileName: file?.name,
          organizationId: selectedOrg,
          columnMapping,
        },
      })
      if (error) throw error

      toast({
        title: 'Importação Iniciada',
        description:
          'O arquivo está sendo processado em segundo plano. Você pode continuar usando o sistema.',
      })
      onImportSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao iniciar importação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Movimento Financeiro TGA</DialogTitle>
          <p className="text-sm text-slate-500">
            {step === 1
              ? 'Selecione a planilha para importação.'
              : 'Mapeie as colunas da sua planilha para o sistema.'}
          </p>
        </DialogHeader>

        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            {loading ? (
              <Loader2 className="h-12 w-12 animate-spin text-slate-400 mb-4" />
            ) : (
              <>
                <UploadCloud className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Clique para selecionar ou arraste o arquivo
                </h3>
                <p className="text-sm text-slate-500 mb-6">Formatos suportados: CSV, XLSX</p>
                <div className="relative">
                  <Input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                  />
                  <Button variant="outline">Selecionar Arquivo</Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && previewData && (
          <div className="flex-1 overflow-hidden flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Aba da Planilha</label>
                <Select defaultValue={previewData.sheets[0]}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {previewData.sheets.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Empresa Padrão (*)</label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden flex flex-col h-48">
              <div className="bg-slate-100 p-2 border-b text-sm font-medium flex items-center gap-2">
                <Table className="h-4 w-4" /> Pré-visualização dos Dados
              </div>
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((h: string) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.previewRows.map((row: any, i: number) => (
                      <TableRow key={i}>
                        {previewData.headers.map((h: string) => (
                          <TableCell key={h} className="whitespace-nowrap truncate max-w-[150px]">
                            {String(row[h] || '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="border rounded-lg bg-white p-4 flex-1 overflow-y-auto">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Mapeamento de Colunas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previewData.headers.map((h: string) => (
                  <div key={h}>
                    <label
                      className="text-xs font-medium text-slate-500 mb-1 block truncate"
                      title={h}
                    >
                      {h}
                    </label>
                    <Select
                      value={columnMapping[h] || 'ignore'}
                      onValueChange={(val) =>
                        setColumnMapping((prev) => ({ ...prev, [h]: val === 'ignore' ? '' : val }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Ignorar coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore" className="text-slate-400 italic">
                          Ignorar coluna
                        </SelectItem>
                        {ERP_COLUMNS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === 2 && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleImport}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Importar Dados
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
