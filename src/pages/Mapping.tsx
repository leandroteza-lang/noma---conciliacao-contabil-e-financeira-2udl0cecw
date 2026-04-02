import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, X, Trash2, GripVertical, Save, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function Mapping() {
  const { user } = useAuth()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [ccs, setCcs] = useState<any[]>([])
  const [cas, setCas] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [pending, setPending] = useState<{ ccId: string; caId: string }[]>([])
  const [searchCC, setSearchCC] = useState('')
  const [searchCA, setSearchCA] = useState('')
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!org) return
      setOrgId(org.id)

      const [resCC, resCA, resMap] = await Promise.all([
        supabase.from('cost_centers').select('*').eq('organization_id', org.id),
        supabase.from('chart_of_accounts').select('*').eq('organization_id', org.id),
        supabase.from('account_mapping').select('*').eq('organization_id', org.id),
      ])
      setCcs(resCC.data || [])
      setCas(resCA.data || [])
      setMappings(resMap.data || [])
    }
    load()

    const channel = supabase
      .channel('mappings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'account_mapping' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const onDragStart = (e: React.DragEvent, ccId: string) => e.dataTransfer.setData('ccId', ccId)
  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const onDrop = (e: React.DragEvent, caId: string) => {
    e.preventDefault()
    const ccId = e.dataTransfer.getData('ccId')
    if (!ccId) return

    const existsDB = mappings.some((m) => m.cost_center_id === ccId && m.chart_account_id === caId)
    const existsPending = pending.some((p) => p.ccId === ccId && p.caId === caId)

    if (existsDB || existsPending) {
      toast.error('Este mapeamento já existe.')
      return
    }
    setPending((prev) => [...prev, { ccId, caId }])
  }

  const handleSave = async () => {
    if (!pending.length || !orgId) return
    const payload = pending.map((p) => ({
      organization_id: orgId,
      cost_center_id: p.ccId,
      chart_account_id: p.caId,
      mapping_type: 'DE/PARA',
    }))

    const { error } = await supabase.from('account_mapping').insert(payload)
    if (error) {
      toast.error('Erro ao salvar mapeamentos: ' + error.message)
    } else {
      toast.success(`${pending.length} mapeamento(s) salvo(s) com sucesso!`)
      setPending([])
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('account_mapping').delete().eq('id', id)
    if (error) toast.error('Erro ao excluir mapeamento')
    else toast.success('Mapeamento excluído')
  }

  const getCC = (id: string) => ccs.find((c) => c.id === id)
  const getCA = (id: string) => cas.find((c) => c.id === id)

  const filteredCCs = ccs.filter(
    (c) =>
      c.code?.toLowerCase().includes(searchCC.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchCC.toLowerCase()),
  )
  const filteredCAs = cas.filter(
    (c) =>
      c.account_code?.toLowerCase().includes(searchCA.toLowerCase()) ||
      c.account_name?.toLowerCase().includes(searchCA.toLowerCase()),
  )
  const filteredMappings = mappings.filter((m) => {
    const cc = getCC(m.cost_center_id)
    const ca = getCA(m.chart_account_id)
    const search = filterText.toLowerCase()
    return (
      cc?.code?.toLowerCase().includes(search) ||
      cc?.description?.toLowerCase().includes(search) ||
      ca?.account_code?.toLowerCase().includes(search) ||
      ca?.account_name?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mapeamento DE/PARA</h1>
          <p className="text-slate-500 mt-1">
            Associe seus centros de custo às contas contábeis correspondentes.
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="create">Criar Mapeamento</TabsTrigger>
          <TabsTrigger value="list">Mapeamentos Ativos</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline">DE</Badge> Centros de Custo
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar centro de custo..."
                    className="pl-9"
                    value={searchCC}
                    onChange={(e) => setSearchCC(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="h-[400px] p-4 bg-slate-50/50">
                <div className="flex flex-col gap-2">
                  {filteredCCs.map((cc) => (
                    <div
                      key={cc.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, cc.id)}
                      className="p-3 border rounded-md bg-white cursor-grab active:cursor-grabbing flex items-center gap-3 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-mono text-sm font-medium text-slate-900">{cc.code}</p>
                        <p className="text-xs text-slate-500">{cc.description}</p>
                      </div>
                    </div>
                  ))}
                  {filteredCCs.length === 0 && (
                    <p className="text-sm text-center text-slate-500 py-4">
                      Nenhum centro de custo encontrado.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge>PARA</Badge> Contas Contábeis
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar conta contábil..."
                    className="pl-9"
                    value={searchCA}
                    onChange={(e) => setSearchCA(e.target.value)}
                  />
                </div>
              </CardHeader>
              <ScrollArea className="h-[400px] p-4">
                <div className="flex flex-col gap-2">
                  {filteredCAs.map((ca) => (
                    <div
                      key={ca.id}
                      onDrop={(e) => onDrop(e, ca.id)}
                      onDragOver={onDragOver}
                      className="p-3 border-2 border-dashed rounded-md bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col gap-1"
                    >
                      <p className="font-mono text-sm font-medium text-slate-900">
                        {ca.account_code}
                      </p>
                      <p className="text-xs text-slate-500">{ca.account_name}</p>
                      <p className="text-[10px] text-blue-500 font-medium mt-1 uppercase opacity-70">
                        Arraste aqui para associar
                      </p>
                    </div>
                  ))}
                  {filteredCAs.length === 0 && (
                    <p className="text-sm text-center text-slate-500 py-4">
                      Nenhuma conta encontrada.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {pending.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/30 shadow-md animate-in slide-in-from-bottom-4">
              <CardHeader className="py-4 border-b border-blue-100 bg-white/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Mapeamentos Pendentes
                    <Badge variant="secondary">{pending.length}</Badge>
                  </CardTitle>
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" /> Salvar Associações
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {pending.map((p, i) => {
                    const cc = getCC(p.ccId)
                    const ca = getCA(p.caId)
                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border shadow-sm"
                      >
                        <div className="flex-1 flex items-center gap-3 w-full">
                          <Badge variant="outline">DE</Badge>
                          <div>
                            <p className="font-mono text-sm font-medium">{cc?.code}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {cc?.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-300 hidden sm:block" />
                        <div className="flex-1 flex items-center gap-3 w-full">
                          <Badge>PARA</Badge>
                          <div>
                            <p className="font-mono text-sm font-medium">{ca?.account_code}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {ca?.account_name}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPending((arr) => arr.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Mapeamentos Existentes</CardTitle>
              <CardDescription>Consulte e gerencie as associações já realizadas.</CardDescription>
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Filtrar por código ou descrição (DE/PARA)..."
                  className="pl-9"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centro de Custo (DE)</TableHead>
                  <TableHead>Conta Contábil (PARA)</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((m) => {
                  const cc = getCC(m.cost_center_id)
                  const ca = getCA(m.chart_account_id)
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-medium">{cc?.code}</span>
                          <span className="text-xs text-slate-500">{cc?.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-medium">{ca?.account_code}</span>
                          <span className="text-xs text-slate-500">{ca?.account_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredMappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      Nenhum mapeamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
