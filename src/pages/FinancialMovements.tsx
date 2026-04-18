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
import { Loader2, Search, ArrowLeft, ArrowRight, BarChart3, UploadCloud } from 'lucide-react'
import { ImportErpFinancialModal } from '@/components/ImportErpFinancialModal'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'

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
  const pageSize = 15

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
                  <TableHead className="font-semibold text-slate-600">Emissão</TableHead>
                  <TableHead className="font-semibold text-slate-600">Documento</TableHead>
                  <TableHead className="font-semibold text-slate-600">Cliente/Fornecedor</TableHead>
                  <TableHead className="font-semibold text-slate-600">Histórico</TableHead>
                  <TableHead className="font-semibold text-slate-600">C. Custo</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">
                    Valor Líquido
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="text-center font-semibold text-slate-600">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-48 text-slate-500">
                      Nenhum movimento financeiro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => {
                    const isMissing =
                      !row.data_emissao || !row.c_custo || row.valor_liquido === null
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
                              {row.data_emissao
                                ? new Date(row.data_emissao).toLocaleDateString('pt-BR')
                                : 'Data Indisponível'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {editingId === row.id ? (
                            <Input
                              className="h-8"
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
                        <TableCell className="text-slate-600">
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
                        <TableCell className="text-right font-semibold text-slate-900">
                          {editingId === row.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 w-24 text-right"
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isMissing ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}
                          >
                            {isMissing ? 'Dados Incompletos' : row.status || 'Pendente'}
                          </span>
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
          fetchData()
          fetchChart()
        }}
      />
    </div>
  )
}
