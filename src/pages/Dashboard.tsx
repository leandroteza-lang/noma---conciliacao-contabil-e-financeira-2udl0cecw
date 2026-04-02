import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658']

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('all')
  const [movements, setMovements] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(
    async (currentOrgId: string) => {
      try {
        let query = supabase
          .from('financial_movements')
          .select(`
        id, amount, movement_date, status, bank_account:bank_accounts(id, description), cost_center:cost_centers(id, description)
      `)
          .eq('organization_id', currentOrgId)
          .gte('movement_date', startDate)
          .lte('movement_date', endDate)

        if (statusFilter !== 'all') query = query.eq('status', statusFilter)

        const [{ data: movData, error: movError }, { data: mapData, error: mapError }] =
          await Promise.all([
            query,
            supabase
              .from('account_mapping')
              .select(`
          id, mapping_type, cost_center:cost_centers(code, description), chart_account:chart_of_accounts(account_code, account_name)
        `)
              .eq('organization_id', currentOrgId),
          ])
        if (movError) throw movError
        if (mapError) throw mapError
        setMovements(movData || [])
        setMappings(mapData || [])
      } catch (error: any) {
        toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    },
    [startDate, endDate, statusFilter, toast],
  )

  useEffect(() => {
    if (user) {
      supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) {
            setOrgId(data.id)
            fetchData(data.id)
          } else setLoading(false)
        })
    }
  }, [user, fetchData])

  useEffect(() => {
    if (!orgId) return
    const channel = supabase
      .channel('dash')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_movements',
          filter: `organization_id=eq.${orgId}`,
        },
        () => fetchData(orgId),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_mapping',
          filter: `organization_id=eq.${orgId}`,
        },
        () => fetchData(orgId),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, fetchData])

  const bankData = useMemo(() => {
    const g = movements.reduce((acc: any, curr: any) => {
      const n = curr.bank_account?.description || 'Sem Conta'
      acc[n] = (acc[n] || 0) + Number(curr.amount || 0)
      return acc
    }, {})
    return Object.entries(g).map(([name, value]) => ({ name, value }))
  }, [movements])

  const costCenterData = useMemo(() => {
    const g = movements.reduce((acc: any, curr: any) => {
      const n = curr.cost_center?.description || 'Sem Centro'
      acc[n] = (acc[n] || 0) + Number(curr.amount || 0)
      return acc
    }, {})
    return Object.entries(g).map(([name, value]) => ({ name, value }))
  }, [movements])

  const cashFlowData = useMemo(() => {
    const g = movements.reduce((acc: any, curr: any) => {
      const m = curr.movement_date ? curr.movement_date.substring(0, 7) : 'Desc'
      acc[m] = (acc[m] || 0) + Number(curr.amount || 0)
      return acc
    }, {})
    return Object.entries(g)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, value }))
  }, [movements])

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('export-dashboard', {
        body: { format, bankData, costCenterData, cashFlowData },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const a = document.createElement('a')
      if (format === 'excel' && data.csv) {
        a.href = URL.createObjectURL(new Blob([data.csv], { type: 'text/csv' }))
        a.download = 'dashboard.csv'
      } else if (format === 'pdf' && data.pdf) {
        a.href = data.pdf
        a.download = 'dashboard.pdf'
      }
      a.click()
      toast({ title: 'Sucesso', description: `Arquivo gerado.` })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Gerencial</h1>
        <p className="text-slate-500 mt-2">Visão consolidada da saúde financeira e mapeamentos.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 items-center">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-slate-500 text-sm">até</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => handleExport('excel')} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}{' '}
          CSV
        </Button>
        <Button
          variant="default"
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}{' '}
          PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldo por Conta Bancária</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {bankData.length ? (
              <ChartContainer config={{ value: { label: 'Saldo' } }}>
                <PieChart>
                  <Pie
                    data={bankData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {bankData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lançamentos por Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {costCenterData.length ? (
              <ChartContainer config={{ value: { label: 'Valor', color: '#0088FE' } }}>
                <BarChart
                  data={costCenterData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {cashFlowData.length ? (
              <ChartContainer config={{ value: { label: 'Fluxo', color: '#00C49F' } }}>
                <LineChart
                  data={cashFlowData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapeamentos DE/PARA</CardTitle>
          <CardDescription>Regras de contabilidade ativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Conta Contábil</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-slate-500">
                      Nenhum mapeamento.
                    </TableCell>
                  </TableRow>
                ) : (
                  mappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {m.cost_center?.code} - {m.cost_center?.description}
                      </TableCell>
                      <TableCell>
                        {m.chart_account?.account_code} - {m.chart_account?.account_name}
                      </TableCell>
                      <TableCell>{m.mapping_type}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
