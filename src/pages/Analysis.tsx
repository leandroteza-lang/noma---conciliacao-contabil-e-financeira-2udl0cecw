import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Analysis() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [movementType, setMovementType] = useState('all')
  const [selectedCostCenter, setSelectedCostCenter] = useState('all')

  const [movements, setMovements] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(
    async (currentOrgId: string) => {
      try {
        const { data: ccData, error: ccError } = await supabase
          .from('cost_centers')
          .select('id, description')
          .eq('organization_id', currentOrgId)

        if (ccError) throw ccError
        setCostCenters(ccData || [])

        const { data: movData, error: movError } = await supabase
          .from('financial_movements')
          .select(`
            id, amount, movement_date, status, 
            cost_center:cost_centers(id, description)
          `)
          .eq('organization_id', currentOrgId)
          .gte('movement_date', startDate)
          .lte('movement_date', endDate)

        if (movError) throw movError
        setMovements(movData || [])
      } catch (error: any) {
        toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    },
    [startDate, endDate, toast],
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
      .channel('analysis')
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
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, fetchData])

  const processedData = useMemo(() => {
    const filtered = movements.filter((m) => {
      const isRev = Number(m.amount) >= 0
      const isExp = Number(m.amount) < 0
      if (movementType === 'revenue' && !isRev) return false
      if (movementType === 'expense' && !isExp) return false
      if (selectedCostCenter !== 'all' && m.cost_center?.id !== selectedCostCenter) return false
      return true
    })

    const ccMap = filtered.reduce((acc: any, curr: any) => {
      const name = curr.cost_center?.description || 'Sem Centro'
      acc[name] = (acc[name] || 0) + Number(curr.amount || 0)
      return acc
    }, {})
    const costCenterData = Object.entries(ccMap).map(([name, value]) => ({ name, value }))

    const dateMap = filtered.reduce((acc: any, curr: any) => {
      const d = curr.movement_date || 'Desc'
      acc[d] = (acc[d] || 0) + Number(curr.amount || 0)
      return acc
    }, {})
    const periodData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }))

    const monthMap = filtered.reduce((acc: any, curr: any) => {
      const m = curr.movement_date ? curr.movement_date.substring(0, 7) : 'Desc'
      acc[m] = (acc[m] || 0) + Number(curr.amount || 0)
      return acc
    }, {})
    const cashFlowData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, value }))

    const revExpMap = movements
      .filter((m) => selectedCostCenter === 'all' || m.cost_center?.id === selectedCostCenter)
      .reduce((acc: any, curr: any) => {
        const m = curr.movement_date ? curr.movement_date.substring(0, 7) : 'Desc'
        if (!acc[m]) acc[m] = { month: m, receita: 0, despesa: 0 }
        const val = Number(curr.amount || 0)
        if (val >= 0) acc[m].receita += val
        else acc[m].despesa += Math.abs(val)
        return acc
      }, {})
    const revExpData = Object.values(revExpMap).sort((a: any, b: any) =>
      a.month.localeCompare(b.month),
    )

    return { costCenterData, periodData, cashFlowData, revExpData }
  }, [movements, selectedCostCenter, movementType])

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('export-analysis', {
        body: { format, ...processedData },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const a = document.createElement('a')
      if (format === 'excel' && data.csv) {
        a.href = URL.createObjectURL(new Blob([data.csv], { type: 'text/csv' }))
        a.download = 'analises.csv'
      } else if (format === 'pdf' && data.pdf) {
        a.href = data.pdf
        a.download = 'analises.pdf'
      }
      a.click()
      toast({ title: 'Sucesso', description: 'Arquivo gerado com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Análises Gerenciais</h1>
        <p className="text-slate-500 mt-2">Indicadores financeiros e desempenho por área.</p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center">
        <div className="flex gap-2 items-center">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-slate-500 text-sm">até</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Select value={movementType} onValueChange={setMovementType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="revenue">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Centro de Custo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Centros</SelectItem>
            {costCenters.map((cc) => (
              <SelectItem key={cc.id} value={cc.id}>
                {cc.description}
              </SelectItem>
            ))}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldo por Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {processedData.costCenterData.length ? (
              <ChartContainer config={{ value: { label: 'Valor', color: '#0088FE' } }}>
                <BarChart
                  data={processedData.costCenterData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparativo Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {processedData.revExpData.length ? (
              <ChartContainer
                config={{
                  receita: { label: 'Receitas', color: '#10b981' },
                  despesa: { label: 'Despesas', color: '#ef4444' },
                }}
              >
                <BarChart data={processedData.revExpData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="receita" fill="var(--color-receita)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" fill="var(--color-despesa)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {processedData.cashFlowData.length ? (
              <ChartContainer config={{ value: { label: 'Fluxo', color: '#3b82f6' } }}>
                <LineChart data={processedData.cashFlowData}>
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

        <Card>
          <CardHeader>
            <CardTitle>Movimentações por Período</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {processedData.periodData.length ? (
              <ChartContainer config={{ value: { label: 'Valor', color: '#8b5cf6' } }}>
                <LineChart data={processedData.periodData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="step"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={false}
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
    </div>
  )
}
