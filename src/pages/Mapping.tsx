import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Search, Upload, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AccountCombobox, Account } from '@/components/AccountCombobox'
import { ImportMappingModal } from '@/components/ImportMappingModal'
import { cn } from '@/lib/utils'

export default function Mapping() {
  const { user } = useAuth()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<any[]>([])
  const [ccs, setCcs] = useState<any[]>([])
  const [cas, setCas] = useState<Account[]>([])
  const [mappings, setMappings] = useState<any[]>([])

  const [filterStatus, setFilterStatus] = useState<'all' | 'mapped' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  const [selectedCCs, setSelectedCCs] = useState<Set<string>>(new Set())
  const [batchCaId, setBatchCaId] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)

  const load = async () => {
    if (!user) return
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')

    if (orgsData) setOrgs(orgsData)

    const currentOrgId = orgId || orgsData?.[0]?.id
    if (!currentOrgId) return
    if (!orgId) setOrgId(currentOrgId)

    const [resCC, resCA, resMap] = await Promise.all([
      supabase
        .from('cost_centers')
        .select('*')
        .eq('organization_id', currentOrgId)
        .is('deleted_at', null),
      supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('organization_id', currentOrgId)
        .is('deleted_at', null),
      supabase.from('account_mapping').select('*').eq('organization_id', currentOrgId),
    ])
    setCcs(resCC.data || [])
    setCas(resCA.data || [])
    setMappings(resMap.data || [])
  }

  const loadRef = useRef(load)
  loadRef.current = load

  const debouncedLoad = useMemo(() => {
    let timeout: any
    return () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        loadRef.current()
      }, 300)
    }
  }, [])

  useEffect(() => {
    debouncedLoad()
    const channel = supabase
      .channel('mappings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_mapping' },
        debouncedLoad,
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [debouncedLoad, orgId])

  const enrichedCCs = useMemo(() => {
    // Ordenar hierarquicamente pelo código
    const sortedCCs = [...ccs].sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }),
    )

    return sortedCCs.map((cc) => {
      const mapping = mappings.find((m) => m.cost_center_id === cc.id)
      const level = (cc.code || '').split('.').length - 1
      // É sintético se existir algum outro centro de custo que comece com o código dele + "."
      const isSynthetic = sortedCCs.some(
        (other) => other.id !== cc.id && (other.code || '').startsWith((cc.code || '') + '.'),
      )

      return {
        ...cc,
        mappingId: mapping?.id,
        mappedCa: mapping ? cas.find((c) => c.id === mapping.chart_account_id) : null,
        level,
        isSynthetic,
      }
    })
  }, [ccs, cas, mappings])

  const filteredCCs = useMemo(() => {
    let result = enrichedCCs
    if (filterStatus === 'mapped') result = result.filter((c) => c.mappingId)
    if (filterStatus === 'pending') result = result.filter((c) => !c.mappingId && !c.isSynthetic)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((cc) => {
        const matchCC =
          cc.code?.toLowerCase().includes(q) || cc.description?.toLowerCase().includes(q)
        const matchCA =
          cc.mappedCa &&
          (cc.mappedCa.account_code?.toLowerCase().includes(q) ||
            cc.mappedCa.classification?.toLowerCase().includes(q) ||
            cc.mappedCa.account_name?.toLowerCase().includes(q))
        return matchCC || matchCA
      })
    }
    return result
  }, [enrichedCCs, filterStatus, search])

  const totalPages = Math.ceil(filteredCCs.length / ITEMS_PER_PAGE)
  const paginatedCCs = filteredCCs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages)
  }, [totalPages, page])

  const total = enrichedCCs.length
  const mappedCount = enrichedCCs.filter((c) => c.mappingId).length
  const progress = total === 0 ? 0 : Math.round((mappedCount / total) * 100)

  const handleMap = async (ccId: string, caId: string, existingMappingId?: string) => {
    if (!orgId) return
    if (existingMappingId) {
      await supabase.from('account_mapping').delete().eq('id', existingMappingId)
    }
    const { error } = await supabase.from('account_mapping').insert({
      organization_id: orgId,
      cost_center_id: ccId,
      chart_account_id: caId,
      mapping_type: 'DE/PARA',
    })
    if (error) toast.error('Erro ao mapear: ' + error.message)
    else toast.success('Conta vinculada com sucesso')
  }

  const handleRemove = async (mappingId: string) => {
    const { error } = await supabase.from('account_mapping').delete().eq('id', mappingId)
    if (error) toast.error('Erro ao remover: ' + error.message)
    else toast.success('Vínculo removido')
  }

  const handleBatchMap = async () => {
    if (!orgId || selectedCCs.size === 0 || !batchCaId) return
    const ccIds = Array.from(selectedCCs)
    const existingMappings = mappings.filter((m) => ccIds.includes(m.cost_center_id))
    if (existingMappings.length > 0) {
      await supabase
        .from('account_mapping')
        .delete()
        .in(
          'id',
          existingMappings.map((m) => m.id),
        )
    }
    const payloads = ccIds.map((ccId) => ({
      organization_id: orgId,
      cost_center_id: ccId,
      chart_account_id: batchCaId,
      mapping_type: 'DE/PARA',
    }))
    const { error } = await supabase.from('account_mapping').insert(payloads)
    if (error) toast.error('Erro ao mapear em lote: ' + error.message)
    else {
      toast.success(`${ccIds.length} centro(s) de custo mapeado(s) com sucesso!`)
      setSelectedCCs(new Set())
      setBatchCaId('')
    }
  }

  const handleAutoMap = async () => {
    if (!orgId) return
    const unmapped = enrichedCCs.filter((c) => !c.mappingId)
    if (unmapped.length === 0) return toast.info('Todos os centros de custo já estão mapeados.')

    const payloads: any[] = []
    unmapped.forEach((cc) => {
      const match = cas.find(
        (ca) =>
          ca.account_code === cc.code ||
          (ca.account_name &&
            cc.description &&
            ca.account_name.toLowerCase() === cc.description.toLowerCase()),
      )
      if (match) {
        payloads.push({
          organization_id: orgId,
          cost_center_id: cc.id,
          chart_account_id: match.id,
          mapping_type: 'DE/PARA (Auto)',
        })
      }
    })
    if (payloads.length === 0)
      return toast.info('Nenhuma sugestão óbvia encontrada para os itens pendentes.')
    const { error } = await supabase.from('account_mapping').insert(payloads)
    if (error) toast.error('Erro no auto-mapeamento: ' + error.message)
    else toast.success(`${payloads.length} mapeamentos sugeridos aplicados!`)
  }

  const toggleCC = (id: string) => {
    const newSet = new Set(selectedCCs)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCCs(newSet)
  }

  const toggleAll = () => {
    const analytics = paginatedCCs.filter((c) => !c.isSynthetic)
    if (selectedCCs.size === analytics.length && analytics.length > 0) {
      setSelectedCCs(new Set())
    } else {
      setSelectedCCs(new Set(analytics.map((c) => c.id)))
    }
  }

  const getRowStyle = (cc: any) => {
    if (cc.isSynthetic) {
      switch (cc.level) {
        case 0:
          return 'bg-blue-900 text-white font-semibold'
        case 1:
          return 'bg-blue-800 text-white font-semibold'
        case 2:
          return 'bg-blue-700 text-white font-semibold'
        case 3:
          return 'bg-blue-600 text-white font-medium'
        case 4:
          return 'bg-blue-500 text-white font-medium'
        case 5:
          return 'bg-blue-400 text-slate-900 font-medium'
        case 6:
          return 'bg-blue-300 text-slate-900 font-medium'
        default:
          return 'bg-blue-200 text-slate-900 font-medium'
      }
    }
    return cc.mappingId
      ? 'bg-white hover:bg-slate-50 text-slate-700'
      : 'bg-amber-50/20 hover:bg-amber-50/40 text-slate-700'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mapeamento DE/PARA</h1>
            {orgs.length > 0 && (
              <Select
                value={orgId || ''}
                onValueChange={(val) => {
                  setOrgId(val)
                  setPage(1)
                  setSelectedCCs(new Set())
                }}
              >
                <SelectTrigger className="w-[220px] h-8 bg-white border-slate-200 shadow-sm">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            Associe seus Centros de Custo (TGA) às Contas Contábeis de forma ágil e centralizada.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="secondary"
            onClick={handleAutoMap}
            className="flex-1 md:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Sugestão Inteligente
          </Button>
          <Button onClick={() => setImportOpen(true)} className="flex-1 md:flex-none">
            <Upload className="h-4 w-4 mr-2" />
            Importar Planilha
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-slate-700 font-semibold">Progresso do Mapeamento Geral</span>
              <span className="text-emerald-600">{progress}% Concluído</span>
            </div>
            <Progress value={progress} className="h-2.5 bg-slate-200" />
          </div>
          <div className="flex gap-6 text-sm text-slate-600 shrink-0 w-full md:w-auto justify-around md:justify-start">
            <div className="text-center md:text-left">
              <span className="block text-2xl font-bold text-slate-900 leading-none">
                {mappedCount}
              </span>
              <span className="text-xs uppercase tracking-wider font-medium">Mapeados</span>
            </div>
            <div className="w-px bg-slate-200 hidden md:block"></div>
            <div className="text-center md:text-left">
              <span className="block text-2xl font-bold text-amber-500 leading-none">
                {total - mappedCount}
              </span>
              <span className="text-xs uppercase tracking-wider font-medium">Pendentes</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between bg-white rounded-t-xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código, classificação ou descrição..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(val: any) => {
                setFilterStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os itens</SelectItem>
                <SelectItem value="mapped">Somente Mapeados</SelectItem>
                <SelectItem value="pending">Somente Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCCs.size > 0 && (
          <div className="bg-blue-50/80 border-b border-blue-100 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600 hover:bg-blue-700">
                {selectedCCs.size} selecionados
              </Badge>
              <span className="text-sm font-medium text-blue-900 hidden sm:inline">
                Definir conta contábil para os itens selecionados:
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-[400px]">
              <AccountCombobox
                accounts={cas}
                value={batchCaId}
                onChange={setBatchCaId}
                placeholder="Buscar conta a aplicar..."
              />
              <Button
                size="sm"
                onClick={handleBatchMap}
                disabled={!batchCaId}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Aplicar Lote
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b shadow-sm sticky top-0 z-10">
              <TableRow className="h-9 hover:bg-slate-50">
                <TableHead className="w-[40px] p-1 px-4 border-r border-slate-200">
                  <Checkbox
                    checked={
                      paginatedCCs.filter((c) => !c.isSynthetic).length > 0 &&
                      selectedCCs.size === paginatedCCs.filter((c) => !c.isSynthetic).length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-[50%] p-2 border-r border-slate-200">
                  <Badge variant="outline" className="mr-2 border-slate-300 bg-white">
                    DE
                  </Badge>{' '}
                  Centro de Custo TGA
                </TableHead>
                <TableHead className="p-2">
                  <Badge className="mr-2 bg-slate-700 hover:bg-slate-800 text-white border-0">
                    PARA
                  </Badge>{' '}
                  Conta Contábil Vinculada
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCCs.map((cc) => (
                <TableRow
                  key={cc.id}
                  className={cn('transition-colors h-9 border-b border-slate-100', getRowStyle(cc))}
                >
                  <TableCell className="p-1 px-4 w-[40px] border-r border-slate-200/40">
                    {!cc.isSynthetic && (
                      <Checkbox
                        checked={selectedCCs.has(cc.id)}
                        onCheckedChange={() => toggleCC(cc.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="p-1 border-r border-slate-200/40">
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${cc.level * 1.25}rem` }}
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          'w-5 h-5 p-0 flex items-center justify-center shrink-0 rounded text-[10px] font-bold border-0',
                          cc.isSynthetic ? 'bg-white/20 text-inherit' : 'bg-blue-50 text-blue-600',
                        )}
                        title={cc.isSynthetic ? 'Conta Sintética' : 'Conta Analítica'}
                      >
                        {cc.isSynthetic ? 'S' : 'A'}
                      </Badge>
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs font-semibold whitespace-nowrap">
                          {cc.code}
                        </span>
                        <span className="text-xs truncate opacity-90" title={cc.description}>
                          {cc.description}
                        </span>
                        {!cc.mappingId && !cc.isSynthetic && (
                          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-1 px-2">
                    {(!cc.isSynthetic || cc.mappingId) && (
                      <div className="max-w-[400px]">
                        <AccountCombobox
                          accounts={cas}
                          value={cc.mappedCa?.id}
                          onChange={(caId) => handleMap(cc.id, caId, cc.mappingId)}
                          onClear={cc.mappingId ? () => handleRemove(cc.mappingId) : undefined}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCCs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                    Nenhum centro de custo encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t bg-slate-50/50">
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setPage((p) => Math.max(1, p - 1))
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-slate-500 px-4 font-medium">
                    Página {page} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setPage((p) => Math.min(totalPages, p + 1))
                    }}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <ImportMappingModal open={importOpen} onOpenChange={setImportOpen} orgId={orgId} />
    </div>
  )
}
