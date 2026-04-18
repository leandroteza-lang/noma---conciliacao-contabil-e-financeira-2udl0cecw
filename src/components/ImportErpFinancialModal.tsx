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
  const [selectedSheet, setSelectedSheet] = useState<string>('')
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
          const bufferChunk = await selectedFile.slice(0, 1024 * 500).arrayBuffer() // Read first 500KB
          let text = new TextDecoder('utf-8').decode(bufferChunk)
          if (text.includes('\uFFFD')) {
            text = new TextDecoder('iso-8859-1').decode(bufferChunk)
          }
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
        if (sheetNames.length > 0) setSelectedSheet(sheetNames[0])

        const initialMap: Record<string, string> = {}
        const normalizedHeaders = data.headers.map((h: string) => normalizeText(h))
        const usedTargets = new Set<string>()

        let savedMapping: Record<string, string> = {}
        try {
          savedMapping = JSON.parse(localStorage.getItem('erpColumnMapping') || '{}')
        } catch (e) {
          console.warn('Failed to parse saved mapping', e)
        }

        data.headers.forEach((header: string, idx: number) => {
          const nh = normalizedHeaders[idx]
          if (!nh) return
          let matchedErpCol = ''

          // 0. Check saved mapping first
          if (savedMapping[header] && !usedTargets.has(savedMapping[header])) {
            matchedErpCol = savedMapping[header]
          }

          // 1. Exact match in synonyms
          if (!matchedErpCol) {
            for (const [erpCol, synonyms] of Object.entries(ERP_COLUMNS_SYNONYMS)) {
              if (usedTargets.has(erpCol)) continue
              if (synonyms.includes(nh)) {
                matchedErpCol = erpCol
                break
              }
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

  const safeParseDate = (val: any) => {
    if (val === null || val === undefined || val === '') return null
    const numVal = Number(val)
    if (!isNaN(numVal) && String(val).trim() !== '' && numVal > 10000 && numVal < 100000) {
      const date = new Date(Math.round((numVal - 25569) * 86400 * 1000))
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
    }
    if (typeof val === 'string') {
      let clean = val.trim()
      if (clean.includes('T')) clean = clean.split('T')[0]

      const ptBrMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
      if (ptBrMatch) {
        const day = parseInt(ptBrMatch[1], 10)
        const month = parseInt(ptBrMatch[2], 10)
        const year = parseInt(ptBrMatch[3], 10)
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
      }

      const ptBrShortMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/)
      if (ptBrShortMatch) {
        const day = parseInt(ptBrShortMatch[1], 10)
        const month = parseInt(ptBrShortMatch[2], 10)
        let year = parseInt(ptBrShortMatch[3], 10)
        year = year < 50 ? 2000 + year : 1900 + year
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
      }

      const isoMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
      if (isoMatch) {
        return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`
      }
    }
    try {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    } catch (e) {
      // ignore invalid dates
    }
    return null
  }

  const safeParseNum = (val: any) => {
    if (val === null || val === undefined || val === '') return null
    if (typeof val === 'number') return val
    let str = String(val).trim()
    if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str)
    const commas = (str.match(/,/g) || []).length
    const dots = (str.match(/\./g) || []).length
    if (dots > 0 && commas > 0) {
      const lastComma = str.lastIndexOf(',')
      const lastDot = str.lastIndexOf('.')
      if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.')
      else str = str.replace(/,/g, '')
    } else if (commas === 1 && dots === 0) str = str.replace(',', '.')
    else if (commas > 1 && dots === 0) str = str.replace(/,/g, '')
    else if (dots > 1 && commas === 0) str = str.replace(/\./g, '')
    str = str.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(str)
    return isNaN(parsed) ? null : parsed
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
      localStorage.setItem('erpColumnMapping', JSON.stringify(columnMapping))

      toast({
        title: 'Lendo arquivo...',
        description: 'O arquivo está sendo lido e preparado no seu navegador. Por favor, aguarde.',
      })

      let rawRecords: any[] = []

      // 1. Parser Frontend
      if (file.name.toLowerCase().endsWith('.csv')) {
        const fileBuffer = await file.arrayBuffer()
        let textContent = new TextDecoder('utf-8').decode(fileBuffer)
        if (textContent.includes('\uFFFD')) {
          textContent = new TextDecoder('iso-8859-1').decode(fileBuffer)
        }
        const firstLineLimit =
          textContent.indexOf('\n') > -1
            ? textContent.indexOf('\n')
            : Math.min(textContent.length, 1000)
        const firstLine = textContent.substring(0, firstLineLimit)
        const delimiter =
          (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','

        let headers: string[] = []
        let currentRow: string[] = []
        let currentCell = ''
        let inQuotes = false

        for (let i = 0; i < textContent.length; i++) {
          const char = textContent[i]
          const nextChar = textContent[i + 1]
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentCell += '"'
              i++
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === delimiter && !inQuotes) {
            currentRow.push(currentCell)
            currentCell = ''
          } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            if (char === '\r') i++
            currentRow.push(currentCell)
            if (headers.length === 0) {
              headers = currentRow.map((h) => h.trim())
            } else if (currentRow.some((c) => c.trim() !== '')) {
              let rowObj: any = {}
              for (let j = 0; j < headers.length; j++) {
                rowObj[headers[j] || `COL${j}`] = currentRow[j] || ''
              }
              rawRecords.push(rowObj)
            }
            currentRow = []
            currentCell = ''
          } else {
            currentCell += char
          }
        }
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell)
          if (headers.length > 0 && currentRow.some((c) => c.trim() !== '')) {
            let rowObj: any = {}
            for (let j = 0; j < headers.length; j++) {
              rowObj[headers[j] || `COL${j}`] = currentRow[j] || ''
            }
            rawRecords.push(rowObj)
          }
        }
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const XLSX = await import('xlsx')
        const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
        const targetSheet = selectedSheet || previewData?.sheets?.[0] || wb.SheetNames[0]
        const ws = wb.Sheets[targetSheet]
        rawRecords = XLSX.utils.sheet_to_json(ws, { defval: '' })
      }

      // 2. Normalizar Registros
      const dateCols = [
        'DATAEMISSAO',
        'EMISSAO',
        'DTCOMPENS',
        'COMPENSACAO',
        'DATAVENCTO',
        'VENCTO',
        'VENCIMENTO',
        'DATACANC',
        'CANCELAMENTO',
        'DATAESTORNO',
        'ESTORNO',
        'DATA',
      ]
      const numCols = ['VALOR', 'VALORLIQUIDO']

      const normalizedRecords = rawRecords.map((r: any, index: number) => {
        const normalized: any = {}
        normalized._originalIndex = index + 1
        for (const key in r) {
          const mappedKey = columnMapping[key] || key
          const cleanKey = mappedKey
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z0-9]/gi, '')
            .toUpperCase()
            .trim()

          let val = r[key]
          if (dateCols.includes(cleanKey)) {
            val = safeParseDate(val) || ''
          } else if (numCols.includes(cleanKey)) {
            val = safeParseNum(val)
            val = val !== null ? val : ''
          } else {
            val =
              val !== null && val !== undefined
                ? String(val)
                    .replace(
                      new RegExp(
                        '[\\u0000-\\u0008\\u000B-\\u000C\\u000E-\\u001F\\u007F-\\u009F]',
                        'g',
                      ),
                      '',
                    )
                    .trim()
                : ''
          }
          normalized[cleanKey] = val
        }
        return normalized
      })

      // 3. Criar registro no banco de dados com a quantidade final de registros para evitar update bloqueado por RLS
      const { data: history, error: historyError } = await supabase
        .from('import_history')
        .insert({
          user_id: user?.id,
          import_type: 'ERP_FINANCIAL_MOVEMENTS',
          file_name: file.name,
          status: 'Processing',
          organization_id: selectedOrg,
          total_records: normalizedRecords.length,
        })
        .select()
        .single()

      if (historyError) throw historyError

      const CHUNK_SIZE = 2000
      const totalChunks = Math.ceil(normalizedRecords.length / CHUNK_SIZE)

      if (totalChunks === 0) {
        toast({ title: 'Importação Concluída', description: 'Nenhum registro encontrado.' })
        onImportSuccess()
        onOpenChange(false)
        return
      }

      toast({
        title: 'Preparando envio',
        description: `Enviando dados (${totalChunks} pacotes) para o servidor...`,
      })

      // 4. Upload de chunks para o storage
      for (let i = 0; i < totalChunks; i += 5) {
        const batch = []
        for (let j = i; j < i + 5 && j < totalChunks; j++) {
          const chunk = normalizedRecords.slice(j * CHUNK_SIZE, (j + 1) * CHUNK_SIZE)
          batch.push(
            supabase.storage
              .from('imports')
              .upload(`${history.id}/chunk_${j}.json`, JSON.stringify(chunk), {
                contentType: 'application/json',
                upsert: true,
              }),
          )
        }
        await Promise.all(batch)
      }

      // 5. Iniciar processo de chunks no backend
      const { error } = await supabase.functions.invoke('import-data', {
        body: {
          action: 'PROCESS_CHUNK',
          importId: history.id,
          type: 'ERP_FINANCIAL_MOVEMENTS',
          chunkIndex: 0,
          totalChunks: totalChunks,
          totalRecords: normalizedRecords.length,
          organizationId: selectedOrg,
          userId: user?.id,
          inserted: 0,
          rejected: 0,
          errors: [],
        },
      })

      if (error) throw error

      toast({
        title: 'Processamento Iniciado',
        description:
          'Os dados foram enviados para o servidor. Você pode continuar usando o sistema.',
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
                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
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
