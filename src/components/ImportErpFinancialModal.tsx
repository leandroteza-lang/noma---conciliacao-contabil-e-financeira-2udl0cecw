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

  const normalizeText = (text: string) =>
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')

  const ERP_COLUMNS_SYNONYMS: Record<string, string[]> = {
    Compensado: ['compensado', 'status'],
    'Tipo Operação': ['tipooperacao', 'tipo', 'operacao', 'tipodeoperacao', 'tipolancamento'],
    'Data Emissão': ['dataemissao', 'emissao', 'datadeemissao', 'dtemissao', 'data', 'dataemiss'],
    'Dt Compens.': ['dtcompens', 'datacompensacao', 'compensacao', 'datadecompensacao'],
    'Conta/Caixa': ['contacaixa', 'conta', 'caixa', 'codigoconta'],
    'Nome Caixa': ['nomecaixa', 'nomedocaixa', 'descricaocaixa', 'banco', 'caixanome'],
    'Conta/Caixa Destino': ['contacaixadestino', 'contadestino', 'caixadestino', 'destino'],
    'Forma Pagto': [
      'formapagto',
      'formapagamento',
      'pagamento',
      'tipopagamento',
      'formadepagamento',
    ],
    'C.Custo': ['ccusto', 'centrocusto', 'centrodecusto', 'cc', 'codigocentrocusto', 'centro'],
    'Descrição C.Custo': ['descricaoccusto', 'descricaocentrocusto', 'nomecentrocusto', 'desccc'],
    Valor: ['valor', 'vlr', 'valorbruto', 'val', 'vlrbruto', 'saida', 'entrada'],
    'Valor Líquido': ['valorliquido', 'vlrliquido', 'liquido'],
    'Nº Documento': ['ndocumento', 'documento', 'numerodocumento', 'numdoc', 'doc'],
    'Nome Cli/Fornec': [
      'nomeclifornec',
      'cliente',
      'fornecedor',
      'nomecliente',
      'nomefornecedor',
      'cliforn',
      'favorecido',
      'razaosocial',
    ],
    Histórico: ['historico', 'descricao', 'obs', 'observacao', 'hist', 'detalhe'],
    FP: ['fp'],
    'Nº Cheque': ['ncheque', 'numerocheque', 'cheque', 'numcheque'],
    'Data Vencto': ['datavencto', 'vencimento', 'datavencimento', 'vencto', 'dtvencto', 'datavenc'],
    'Nominal a': ['nominala', 'nominal', 'beneficiario'],
    'Emitente Cheque': ['emitentecheque', 'emitente'],
    'CNPJ/CPF': ['cnpjcpf', 'cnpj', 'cpf', 'documentofederal', 'docfederal', 'documento'],
    'Nº Extrato': ['nextrato', 'extrato', 'numeroextrato'],
    Filial: ['filial', 'empresa', 'loja', 'unidade'],
    'Data Canc.': ['datacanc', 'datacancelamento', 'cancelamento', 'dtcanc'],
    'Data Estorno': ['dataestorno', 'estorno', 'dtestorno'],
    Banco: ['banco', 'instituicao', 'codbanco'],
    'C.Corrente': ['ccorrente', 'contacorrente', 'corrente'],
    'Cód.Cli/For': ['codclifor', 'codigocliente', 'codigofornecedor', 'codcliente'],
    Departamento: ['departamento', 'depto', 'setor', 'area'],
  }

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
        let headers: string[] = []
        let previewRows: any[] = []
        let sheetNames: string[] = []

        if (selectedFile.name.endsWith('.csv')) {
          const text = await selectedFile.slice(0, 1024 * 500).text() // Read first 500KB
          const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
          if (lines.length > 0) {
            const separator = lines[0].includes(';') ? ';' : ','

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

            headers = splitLine(lines[0]).map((h) => h.trim())

            for (let i = 1; i < Math.min(lines.length, 6); i++) {
              const values = splitLine(lines[i])
              const row: any = {}
              headers.forEach((h, idx) => {
                row[h] = values[idx] !== undefined ? values[idx].trim() : ''
              })
              previewRows.push(row)
            }
            sheetNames = ['DADOS (CSV)']
          }
        } else {
          const arrayBuffer = await selectedFile.arrayBuffer()
          const XLSX = await import('xlsx')
          const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
          sheetNames = wb.SheetNames
          if (wb.SheetNames.length > 0) {
            const firstSheet = wb.SheetNames[0]
            const ws = wb.Sheets[firstSheet]
            const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
            if (raw.length > 0) {
              headers = Object.keys(raw[0])
              previewRows = raw.slice(0, 5).map((row: any) => {
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
          }
        }

        const data = {
          sheets: sheetNames,
          headers,
          previewRows,
        }

        setPreviewData(data)

        const initialMap: Record<string, string> = {}
        const normalizedHeaders = data.headers.map((h: string) => normalizeText(h))
        const usedTargets = new Set<string>()

        data.headers.forEach((header: string, idx: number) => {
          const nh = normalizedHeaders[idx]
          if (!nh) return
          let matchedErpCol = ''

          // 1. Exact match in synonyms
          for (const [erpCol, synonyms] of Object.entries(ERP_COLUMNS_SYNONYMS)) {
            if (usedTargets.has(erpCol)) continue
            if (synonyms.includes(nh)) {
              matchedErpCol = erpCol
              break
            }
          }

          // 2. Substring match in synonyms
          if (!matchedErpCol) {
            for (const [erpCol, synonyms] of Object.entries(ERP_COLUMNS_SYNONYMS)) {
              if (usedTargets.has(erpCol)) continue
              if (synonyms.some((syn) => nh.includes(syn) || syn.includes(nh))) {
                matchedErpCol = erpCol
                break
              }
            }
          }

          // 3. Fallback to ERP_COLUMNS text match
          if (!matchedErpCol) {
            for (const erpCol of ERP_COLUMNS) {
              if (usedTargets.has(erpCol)) continue
              const normErp = normalizeText(erpCol)
              if (normErp === nh || normErp.includes(nh) || nh.includes(normErp)) {
                matchedErpCol = erpCol
                break
              }
            }
          }

          if (matchedErpCol) {
            initialMap[header] = matchedErpCol
            usedTargets.add(matchedErpCol)
          }
        })
        setColumnMapping(initialMap)

        setStep(2)
      } catch (err: any) {
        toast({
          title: 'Erro ao ler arquivo',
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

    if (!file) {
      toast({ title: 'Arquivo não encontrado', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const path = `${user?.id}_${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('imports').upload(path, file)

      if (uploadErr) throw uploadErr

      setFilePath(path)

      const { error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'START_BACKGROUND',
          type: 'ERP_FINANCIAL_MOVEMENTS',
          filePath: path,
          fileName: file.name,
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
      const errorMessage = err?.message || 'Erro desconhecido ao processar requisição.'
      toast({
        title: 'Erro ao iniciar importação',
        description: errorMessage.includes('non-2xx status')
          ? 'O serviço de importação está temporariamente indisponível. Por favor, tente novamente em alguns instantes.'
          : errorMessage,
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
