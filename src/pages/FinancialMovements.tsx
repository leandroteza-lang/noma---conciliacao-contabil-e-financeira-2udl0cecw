import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { ImportErpFinancialModal } from '@/components/ImportErpFinancialModal'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function FinancialMovements() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [activeImport, setActiveImport] = useState<any>(null)
  const pageSize = 15

  const fetchActiveImport = async () => {
    if (!user) return
    const { data } = await supabase
      .from('import_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('import_type', 'ERP_FINANCIAL_MOVEMENTS')
      .in('status', ['Processing', 'Pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setActiveImport(data)
    }
  }

  const fetchDataSilent = async () => {
    if (!user) return
    let query = supabase
      .from('erp_financial_movements')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('data_emissao', { ascending: false })

    if (search) {
      query = query.or(
        `historico.ilike.%${search}%,nome_cli_fornec.ilike.%${search}%,c_custo.ilike.%${search}%`,
      )
    }

    const {
      data: result,
      count,
      error,
    } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (!error && result) {
      setData(result)
      setTotalCount(count || 0)
    }
  }

  useEffect(() => {
    fetchActiveImport()
  }, [user])

  useEffect(() => {
    let interval: any
    if (activeImport && ['Processing', 'Pending'].includes(activeImport.status)) {
      interval = setInterval(async () => {
        if (!user) return
        const { data } = await supabase
          .from('import_history')
          .select('*')
          .eq('id', activeImport.id)
          .single()

        if (data) {
          setActiveImport(data)
          fetchDataSilent()
          if (data.status === 'Completed' || data.status === 'Error') {
            clearInterval(interval)
            fetchChart()
            setTimeout(() => setActiveImport(null), 8000)
          }
        }
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeImport?.status, activeImport?.id, user, page, search])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('erp_financial_movements')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('data_emissao', { ascending: false })

    if (search) {
      query = query.or(
        `historico.ilike.%${search}%,nome_cli_fornec.ilike.%${search}%,c_custo.ilike.%${search}%`,
      )
    }

    const {
      data: result,
      count,
      error,
    } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
    if (!error && result) {
      setData(result)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const fetchChart = async () => {
    if (!user) return
    const { data: all } = await supabase
      .from('erp_financial_movements')
      .select('data_emissao, valor')
      .is('deleted_at', null)
      .order('data_emissao', { ascending: true })
      .limit(1000)

    if (all) {
      const agg = all.reduce((acc: any, row) => {
        const date = row.data_emissao
          ? row.data_emissao.split('-').slice(0, 2).join('/')
          : 'Sem data'
        if (!acc[date]) acc[date] = 0
        acc[date] += Number(row.valor || 0)
        return acc
      }, {})
      const cData = Object.keys(agg).map((k) => ({ date: k, value: agg[k] }))
      setChartData(cData.slice(-12))
    }
  }

  useEffect(() => {
    fetchData()
    fetchChart()
  }, [user, page, search])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
      {activeImport && (
        <Card
          className={`shadow-sm border ${activeImport.status === 'Error' ? 'border-red-200 bg-red-50/50' : activeImport.status === 'Completed' ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50'}`}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeImport.status === 'Processing' || activeImport.status === 'Pending' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : activeImport.status === 'Error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium text-slate-800">
                  {activeImport.status === 'Processing' &&
                    activeImport.total_records === 0 &&
                    'Lendo e preparando arquivo...'}
                  {activeImport.status === 'Processing' &&
                    activeImport.total_records > 0 &&
                    'Processando importação...'}
                  {activeImport.status === 'Pending' && 'Aguardando processamento...'}
                  {activeImport.status === 'Error' && 'Erro na importação'}
                  {activeImport.status === 'Completed' && 'Importação concluída com sucesso!'}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-600">
                {activeImport.total_records > 0
                  ? `${activeImport.processed_records || 0} / ${activeImport.total_records} registros (${Math.round(((activeImport.processed_records || 0) / activeImport.total_records) * 100)}%)`
                  : 'Iniciando...'}
              </span>
            </div>

            <Progress
              value={
                activeImport.total_records > 0
                  ? ((activeImport.processed_records || 0) / activeImport.total_records) * 100
                  : 0
              }
              className={`h-2 ${activeImport.status === 'Error' ? 'bg-red-100 [&>div]:bg-red-600' : activeImport.status === 'Completed' ? 'bg-green-100 [&>div]:bg-green-600' : 'bg-blue-100 [&>div]:bg-blue-600'}`}
            />

            {activeImport.status === 'Processing' && (
              <p className="text-xs text-slate-500">
                Isso pode levar alguns minutos dependendo do tamanho do arquivo. Você pode continuar
                usando o sistema. A grade será atualizada automaticamente.
              </p>
            )}

            {activeImport.status === 'Error' &&
              activeImport.errors_list &&
              activeImport.errors_list.length > 0 && (
                <div className="text-xs text-red-600 mt-1 max-h-20 overflow-y-auto bg-red-100 p-2 rounded">
                  <p className="font-semibold mb-1">Últimos erros encontrados:</p>
                  <ul className="list-disc pl-4">
                    {activeImport.errors_list.slice(0, 3).map((err: any, idx: number) => (
                      <li key={idx}>
                        Linha {err.row}: {err.error}
                      </li>
                    ))}
                    {activeImport.errors_list.length > 3 && (
                      <li>... e mais {activeImport.errors_list.length - 3} erros.</li>
                    )}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Movimento Financeiro TGA
          </h1>
          <p className="text-slate-500 mt-1">
            Gestão, visualização e conciliação de lançamentos do ERP
          </p>
        </div>
        <Button onClick={() => setIsImportOpen(true)} className="shadow-sm">
          <UploadCloud className="mr-2 h-4 w-4" />
          Importar Planilha
        </Button>
      </div>

      {chartData.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <BarChart3 className="h-4 w-4 text-primary" />
              Volume de Movimentação Financeira (R$)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] pt-4">
            <ChartContainer
              config={{ value: { label: 'Valor (R$)', color: 'hsl(var(--primary))' } }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por histórico, cliente ou centro de custo..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="text-sm font-medium text-slate-500 ml-auto bg-white px-3 py-1 rounded-md border">
              {totalCount} registros
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    Emissão
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    Vencimento
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    Documento
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    Cliente/Fornecedor
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap min-w-[200px]">
                    Histórico
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    Conta/Caixa
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    Banco
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    F. Pagto
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">
                    C. Custo
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 whitespace-nowrap">
                    Valor Líquido
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-600 whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-600 whitespace-nowrap">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center h-48 text-slate-500">
                      Nenhum movimento financeiro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => {
                    const missingFields = []
                    if (!row.data_emissao) missingFields.push('Data de Emissão')
                    if (!row.c_custo) missingFields.push('Centro de Custo')
                    if (row.valor_liquido === null || row.valor_liquido === undefined)
                      missingFields.push('Valor Líquido')
                    const isMissing = missingFields.length > 0

                    return (
                      <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="whitespace-nowrap text-slate-600">
                          {editingId === row.id ? (
                            <Input
                              type="date"
                              className="h-8 w-36 px-2"
                              value={editForm.data_emissao || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, data_emissao: e.target.value })
                              }
                            />
                          ) : (
                            <span className={!row.data_emissao ? 'text-red-500 font-bold' : ''}>
                              {row.data_emissao ? formatDate(row.data_emissao) : 'Indisponível'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-600">
                          {editingId === row.id ? (
                            <Input
                              type="date"
                              className="h-8 w-36 px-2"
                              value={editForm.data_vencto || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, data_vencto: e.target.value })
                              }
                            />
                          ) : (
                            <span>{row.data_vencto ? formatDate(row.data_vencto) : '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                          {editingId === row.id ? (
                            <Input
                              className="h-8 w-28"
                              value={editForm.n_documento || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, n_documento: e.target.value })
                              }
                            />
                          ) : (
                            row.n_documento || '-'
                          )}
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate text-slate-600"
                          title={row.nome_cli_fornec}
                        >
                          {editingId === row.id ? (
                            <Input
                              className="h-8"
                              value={editForm.nome_cli_fornec || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, nome_cli_fornec: e.target.value })
                              }
                            />
                          ) : (
                            row.nome_cli_fornec || '-'
                          )}
                        </TableCell>
                        <TableCell
                          className="max-w-[250px] truncate text-slate-600"
                          title={row.historico}
                        >
                          {editingId === row.id ? (
                            <Input
                              className="h-8"
                              value={editForm.historico || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, historico: e.target.value })
                              }
                            />
                          ) : (
                            row.historico || '-'
                          )}
                        </TableCell>
                        <TableCell
                          className="max-w-[150px] truncate text-slate-600"
                          title={`${row.conta_caixa || ''} ${row.nome_caixa || ''}`}
                        >
                          {editingId === row.id ? (
                            <Input
                              className="h-8"
                              value={editForm.conta_caixa || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, conta_caixa: e.target.value })
                              }
                            />
                          ) : (
                            `${row.conta_caixa || ''} ${row.nome_caixa ? `- ${row.nome_caixa}` : ''}` ||
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-600">
                          {editingId === row.id ? (
                            <Input
                              className="h-8 w-24"
                              value={editForm.banco || ''}
                              onChange={(e) => setEditForm({ ...editForm, banco: e.target.value })}
                            />
                          ) : (
                            row.banco || '-'
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-600">
                          {editingId === row.id ? (
                            <Input
                              className="h-8 w-24"
                              value={editForm.forma_pagto || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, forma_pagto: e.target.value })
                              }
                            />
                          ) : (
                            row.forma_pagto || '-'
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 whitespace-nowrap">
                          {editingId === row.id ? (
                            <Input
                              className="h-8 w-24"
                              value={editForm.c_custo || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, c_custo: e.target.value })
                              }
                            />
                          ) : (
                            <span className={!row.c_custo ? 'text-red-500 font-bold' : ''}>
                              {row.c_custo || 'Sem C. Custo'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 whitespace-nowrap">
                          {editingId === row.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 w-28 text-right ml-auto"
                              value={editForm.valor_liquido || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  valor_liquido: parseFloat(e.target.value),
                                })
                              }
                            />
                          ) : (
                            <span
                              className={row.valor_liquido === null ? 'text-red-500 font-bold' : ''}
                            >
                              {row.valor_liquido !== null
                                ? new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(row.valor_liquido)
                                : 'R$ 0,00'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMissing ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 cursor-help">
                                  Dados Incompletos
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-red-50 border-red-200 text-red-900 shadow-md">
                                <p className="font-semibold mb-1">Campos ausentes:</p>
                                <ul className="list-disc pl-4 text-xs">
                                  {missingFields.map((f) => (
                                    <li key={f}>{f}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 cursor-help">
                                  {row.status || 'Pendente'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-white border-slate-700 shadow-md">
                                <p className="text-xs max-w-[200px]">
                                  O registro foi importado com sucesso, mas ainda não foi conciliado
                                  ou exportado.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingId === row.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-green-600 font-semibold hover:text-green-700"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('erp_financial_movements')
                                    .update(editForm)
                                    .eq('id', row.id)
                                  if (!error) {
                                    setData(
                                      data.map((d) =>
                                        d.id === row.id ? { ...d, ...editForm } : d,
                                      ),
                                    )
                                    setEditingId(null)
                                  }
                                }}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-red-600 hover:text-red-700"
                                onClick={() => setEditingId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setEditingId(row.id)
                                setEditForm(row)
                              }}
                            >
                              Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
            </Button>
            <span className="text-sm font-medium text-slate-600">
              Página {page + 1} de {Math.ceil(totalCount / pageSize) || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= totalCount || loading}
            >
              Próxima <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ImportErpFinancialModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={() => {
          setPage(0)
          fetchActiveImport()
        }}
      />
    </div>
  )
}
