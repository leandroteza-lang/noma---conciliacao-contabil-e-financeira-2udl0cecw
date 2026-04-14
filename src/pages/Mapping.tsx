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
import { Search, Upload, Sparkles, AlertCircle, ListTree, Unlink, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  const [itemsPerPage, setItemsPerPage] = useState(50)

  const [selectedCCs, setSelectedCCs] = useState<Set<string>>(new Set())
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
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

    const fetchAllCostCenters = async () => {
      let all: any[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data } = await supabase
          .from('cost_centers')
          .select('*')
          .eq('organization_id', currentOrgId)
          .is('deleted_at', null)
          .range(page * 1000, (page + 1) * 1000 - 1)
        if (data && data.length > 0) {
          all.push(...data)
          if (data.length < 1000) hasMore = false
          else page++
        } else {
          hasMore = false
        }
      }
      return all
    }

    const fetchAllChartAccounts = async () => {
      let all: any[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .eq('organization_id', currentOrgId)
          .is('deleted_at', null)
          .range(page * 1000, (page + 1) * 1000 - 1)
        if (data && data.length > 0) {
          all.push(...data)
          if (data.length < 1000) hasMore = false
          else page++
        } else {
          hasMore = false
        }
      }
      return all
    }

    const fetchAllMappings = async () => {
      let all: any[] = []
      let page = 0
      let hasMore = true
      while (hasMore) {
        const { data } = await supabase
          .from('account_mapping')
          .select('*')
          .eq('organization_id', currentOrgId)
          .range(page * 1000, (page + 1) * 1000 - 1)
        if (data && data.length > 0) {
          all.push(...data)
          if (data.length < 1000) hasMore = false
          else page++
        } else {
          hasMore = false
        }
      }
      return all
    }

    const [ccData, caData, mapData] = await Promise.all([
      fetchAllCostCenters(),
      fetchAllChartAccounts(),
      fetchAllMappings(),
    ])

    setCcs(ccData)
    setCas(caData)
    setMappings(mapData)
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

  const enrichedCAs = useMemo(() => {
    return cas.map((ca) => {
      let hierarchyPath = ca.account_name || ''
      let hierarchyArray: Account[] = []

      if (ca.classification) {
        const parents = cas
          .filter(
            (c) =>
              c.classification &&
              ca.classification!.startsWith(c.classification) &&
              ca.classification !== c.classification,
          )
          .sort((a, b) => a.classification!.length - b.classification!.length)

        if (parents.length > 0) {
          hierarchyPath = [...parents.map((p) => p.account_name), ca.account_name]
            .filter(Boolean)
            .join(' > ')
        }
        hierarchyArray = [...parents, ca]
      } else {
        hierarchyArray = [ca]
      }
      return { ...ca, hierarchyPath, hierarchyArray }
    })
  }, [cas])

  const enrichedCCs = useMemo(() => {
    const sortedCCs = [...ccs].sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }),
    )

    return sortedCCs.map((cc) => {
      const mapping = mappings.find((m) => m.cost_center_id === cc.id)
      const level = (cc.code || '').split('.').length - 1
      const isSynthetic = sortedCCs.some(
        (other) => other.id !== cc.id && (other.code || '').startsWith((cc.code || '') + '.'),
      )

      let hierarchyPath = cc.description || ''
      if (cc.code) {
        const parents = sortedCCs
          .filter((c) => c.code && cc.code!.startsWith(c.code) && cc.code !== c.code)
          .sort((a, b) => a.code!.length - b.code!.length)

        if (parents.length > 0) {
          hierarchyPath = [...parents.map((p) => p.description), cc.description]
            .filter(Boolean)
            .join(' > ')
        }
      }

      return {
        ...cc,
        mappingId: mapping?.id,
        mappedCa: mapping ? enrichedCAs.find((c) => c.id === mapping.chart_account_id) : null,
        level,
        isSynthetic,
        hierarchyPath,
      }
    })
  }, [ccs, enrichedCAs, mappings])

  const filteredCCs = useMemo(() => {
    let result = enrichedCCs
    if (filterStatus === 'mapped') result = result.filter((c) => c.mappingId)
    if (filterStatus === 'pending') result = result.filter((c) => !c.mappingId && !c.isSynthetic)
    if (search) {
      const normalizeStr = (str: string | null | undefined) => {
        if (!str) return ''
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      }

      const searchTerms = normalizeStr(search).split(' ').filter(Boolean)

      result = result.filter((cc) => {
        const targetString = [
          normalizeStr(cc.code),
          normalizeStr(cc.description),
          normalizeStr(cc.hierarchyPath),
          cc.mappedCa ? normalizeStr(cc.mappedCa.account_code) : '',
          cc.mappedCa ? normalizeStr(cc.mappedCa.classification) : '',
          cc.mappedCa ? normalizeStr(cc.mappedCa.account_name) : '',
          cc.mappedCa ? normalizeStr(cc.mappedCa.hierarchyPath) : '',
        ].join(' ')

        return searchTerms.every((term) => targetString.includes(term))
      })
    }
    return result
  }, [enrichedCCs, filterStatus, search])

  const totalPages = Math.ceil(filteredCCs.length / itemsPerPage)
  const paginatedCCs = filteredCCs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages)
  }, [totalPages, page])

  const analyticalCCs = enrichedCCs.filter((c) => !c.isSynthetic)
  const total = analyticalCCs.length
  const mappedCount = analyticalCCs.filter((c) => c.mappingId).length
  const progress = total === 0 ? 0 : Math.round((mappedCount / total) * 100)

  const handleMap = async (ccId: string, caId: any, existingMappingId?: string) => {
    if (!orgId) return
    const targetCaId = typeof caId === 'object' ? caId?.id : caId
    if (!targetCaId) {
      if (existingMappingId) return handleRemove(existingMappingId)
      return
    }

    // Optimistic Update
    setMappings((prev) => {
      const filtered = prev.filter((m) => m.id !== existingMappingId && m.cost_center_id !== ccId)
      return [
        ...filtered,
        {
          id: 'temp-' + Date.now(),
          organization_id: orgId,
          cost_center_id: ccId,
          chart_account_id: targetCaId,
          mapping_type: 'DE/PARA',
        },
      ]
    })

    if (existingMappingId) {
      await supabase.from('account_mapping').delete().eq('id', existingMappingId)
    }
    // Delete by cost_center_id just to be safe and avoid duplicates
    await supabase
      .from('account_mapping')
      .delete()
      .eq('cost_center_id', ccId)
      .eq('organization_id', orgId)

    const { error } = await supabase.from('account_mapping').insert({
      organization_id: orgId,
      cost_center_id: ccId,
      chart_account_id: targetCaId,
      mapping_type: 'DE/PARA',
    })

    if (error) {
      toast.error('Erro ao mapear: ' + error.message)
      load() // Revert optimistic update
    } else {
      toast.success('Conta vinculada com sucesso')
      load()
    }
  }

  const handleRemove = async (mappingId: string) => {
    if (!mappingId) return

    // Optimistic Update
    setMappings((prev) => prev.filter((m) => m.id !== mappingId))

    const { error } = await supabase.from('account_mapping').delete().eq('id', mappingId)

    if (error) {
      toast.error('Erro ao remover: ' + error.message)
      load() // Revert optimistic update
    } else {
      toast.success('Vínculo removido')
      load()
    }
  }

  const handleBatchMap = async () => {
    if (!orgId || selectedCCs.size === 0 || !batchCaId) return

    const targetBatchCaId = typeof batchCaId === 'object' ? (batchCaId as any)?.id : batchCaId
    if (!targetBatchCaId) return

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

    // Also delete by cost_center_id to avoid unique constraint violations or duplicates
    await supabase
      .from('account_mapping')
      .delete()
      .in('cost_center_id', ccIds)
      .eq('organization_id', orgId)

    const payloads = ccIds.map((ccId) => ({
      organization_id: orgId,
      cost_center_id: ccId,
      chart_account_id: targetBatchCaId,
      mapping_type: 'DE/PARA',
    }))
    const { error } = await supabase.from('account_mapping').insert(payloads)

    if (error) {
      toast.error('Erro ao mapear em lote: ' + error.message)
    } else {
      toast.success(`${ccIds.length} centro(s) de custo mapeado(s) com sucesso!`)
      setSelectedCCs(new Set())
      setBatchCaId('')
      load()
    }
  }

  const handleBatchRemove = async () => {
    if (!orgId || selectedCCs.size === 0) return

    const ccIds = Array.from(selectedCCs)

    // Optimistic Update
    setMappings((prev) => prev.filter((m) => !ccIds.includes(m.cost_center_id)))

    const { error } = await supabase
      .from('account_mapping')
      .delete()
      .in('cost_center_id', ccIds)
      .eq('organization_id', orgId)

    if (error) {
      toast.error('Erro ao desvincular em lote: ' + error.message)
      load()
    } else {
      toast.success(`${ccIds.length} centro(s) de custo desvinculado(s) com sucesso!`)
      setSelectedCCs(new Set())
      load()
    }
  }

  const handleRemoveAll = async () => {
    if (!orgId) return

    const { error } = await supabase.from('account_mapping').delete().eq('organization_id', orgId)

    if (error) {
      toast.error('Erro ao limpar mapeamentos: ' + error.message)
    } else {
      toast.success('Todos os mapeamentos foram removidos com sucesso!')
      setMappings([])
      setSelectedCCs(new Set())
      load()
    }
  }

  const handleAutoMap = async () => {
    if (!orgId) return
    const unmapped = enrichedCCs.filter((c) => !c.mappingId && !c.isSynthetic)
    if (unmapped.length === 0)
      return toast.info('Todos os centros de custo analíticos já estão mapeados.')

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

    if (error) {
      toast.error('Erro no auto-mapeamento: ' + error.message)
    } else {
      toast.success(`${payloads.length} mapeamentos sugeridos aplicados!`)
      load()
    }
  }

  const toggleCC = (id: string) => {
    const newSet = new Set(selectedCCs)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCCs(newSet)
  }

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedAccounts)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedAccounts(newSet)
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
          return 'bg-indigo-950 font-bold text-white hover:bg-indigo-900'
        case 1:
          return 'bg-blue-800 font-semibold text-white hover:bg-blue-700'
        case 2:
          return 'bg-blue-500 font-medium text-white hover:bg-blue-400'
        case 3:
          return 'bg-blue-200 font-medium text-blue-950 hover:bg-blue-300'
        default:
          return 'bg-blue-50 font-medium text-blue-900 hover:bg-blue-100'
      }
    }
    return cc.mappingId
      ? 'bg-white font-normal text-slate-700 hover:bg-slate-50'
      : 'bg-amber-50/20 font-normal text-slate-700 hover:bg-amber-50/40'
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
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
        <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
          <Button
            variant="secondary"
            onClick={handleAutoMap}
            className="flex-1 md:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sugestão Inteligente</span>
            <span className="sm:hidden">Sugestão</span>
          </Button>
          <Button onClick={() => setImportOpen(true)} className="flex-1 md:flex-none">
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Importar Planilha</span>
            <span className="sm:hidden">Importar</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Limpar Tudo</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover todos os mapeamentos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso removerá as contas contábeis vinculadas de <strong>todos</strong> os centros
                  de custo desta empresa. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveAll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sim, remover tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              <span className="text-sm font-medium text-blue-900 hidden lg:inline">
                Ações em lote para os itens selecionados:
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:w-[300px] min-w-0">
                <AccountCombobox
                  accounts={enrichedCAs}
                  value={batchCaId}
                  onChange={(val) => {
                    const id = typeof val === 'object' ? (val as any)?.id : val
                    setBatchCaId(id || '')
                  }}
                  placeholder="Buscar conta a aplicar..."
                />
              </div>
              <Button
                size="sm"
                onClick={handleBatchMap}
                disabled={!batchCaId}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Aplicar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBatchRemove}
                className="shrink-0"
                title="Remover vínculo dos selecionados"
              >
                <Unlink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Desvincular</span>
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
                <TableHead className="w-[40%] p-2 border-r border-slate-200">
                  <Badge variant="outline" className="mr-2 border-slate-300 bg-white">
                    DE
                  </Badge>{' '}
                  Centro de Custo TGA
                </TableHead>
                <TableHead className="p-2 w-[60%] pr-4">
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
                  className={cn('transition-colors border-b border-slate-100', getRowStyle(cc))}
                >
                  <TableCell className="p-1.5 px-4 w-[40px] border-r border-slate-200/40 align-top pt-2">
                    {!cc.isSynthetic && (
                      <Checkbox
                        checked={selectedCCs.has(cc.id)}
                        onCheckedChange={() => toggleCC(cc.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="p-1.5 border-r border-slate-200/40 align-top pt-2 max-w-0">
                    <div
                      className="flex items-center gap-2 w-full min-w-0"
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
                      <div className="flex flex-col overflow-hidden text-left cursor-default w-full min-w-0">
                        <div className="flex items-center gap-2 truncate w-full min-w-0">
                          <span className="font-mono text-[11px] font-semibold whitespace-nowrap shrink-0">
                            {cc.code}
                          </span>
                          <span className="text-xs truncate font-medium">{cc.description}</span>
                          {!cc.mappingId && !cc.isSynthetic && (
                            <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-1.5 px-2 pr-4 align-top pt-1.5 max-w-0">
                    {(!cc.isSynthetic || cc.mappingId) && (
                      <div className="flex flex-col gap-1 w-full min-w-0">
                        <div className="flex items-start gap-2 w-full min-w-0">
                          <div className="flex-1 min-w-0">
                            <AccountCombobox
                              accounts={enrichedCAs}
                              value={cc.mappedCa?.id}
                              onChange={(caId) => {
                                const selectedId =
                                  typeof caId === 'object' ? (caId as any)?.id : caId
                                if (selectedId) {
                                  handleMap(cc.id, selectedId, cc.mappingId)
                                } else {
                                  if (cc.mappingId) handleRemove(cc.mappingId)
                                }
                              }}
                              onClear={cc.mappingId ? () => handleRemove(cc.mappingId) : undefined}
                            />
                          </div>
                          {cc.mappedCa &&
                            cc.mappedCa.hierarchyArray &&
                            cc.mappedCa.hierarchyArray.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleExpand(cc.id)}
                                className={cn(
                                  'h-9 px-3 text-xs font-medium shrink-0 transition-colors bg-white shadow-sm',
                                  expandedAccounts.has(cc.id)
                                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                                    : 'text-slate-700 hover:bg-slate-50 border-slate-200',
                                )}
                                title="Ver raiz da conta"
                              >
                                <ListTree className="h-3.5 w-3.5 mr-1" />
                                {expandedAccounts.has(cc.id) ? 'Recolher' : 'Expandir'}
                              </Button>
                            )}
                        </div>

                        {expandedAccounts.has(cc.id) &&
                          cc.mappedCa &&
                          cc.mappedCa.hierarchyArray && (
                            <div className="mt-2 mb-2 rounded-md overflow-hidden border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                              <div className="bg-slate-50 px-2 py-1.5 border-b border-slate-200">
                                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                                  Raiz Hierárquica
                                </span>
                              </div>
                              <div className="flex flex-col">
                                {cc.mappedCa.hierarchyArray.map((node: any) => {
                                  const code = node.classification || node.account_code || ''
                                  const level = (code.match(/\./g) || []).length + 1

                                  let rowClass =
                                    'bg-white font-normal text-slate-700 hover:bg-slate-50'
                                  let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'

                                  if (node.account_level === 'Sintética') {
                                    if (level === 1) {
                                      rowClass =
                                        'bg-indigo-950 font-bold text-white hover:bg-indigo-900'
                                      badgeClass = 'bg-indigo-900 text-white border-indigo-800'
                                    } else if (level === 2) {
                                      rowClass =
                                        'bg-blue-800 font-semibold text-white hover:bg-blue-700'
                                      badgeClass = 'bg-blue-700 text-white border-blue-600'
                                    } else if (level === 3) {
                                      rowClass =
                                        'bg-blue-500 font-medium text-white hover:bg-blue-400'
                                      badgeClass = 'bg-blue-600 text-white border-blue-500'
                                    } else if (level === 4) {
                                      rowClass =
                                        'bg-blue-200 font-medium text-blue-950 hover:bg-blue-300'
                                      badgeClass = 'bg-blue-300 text-blue-900 border-blue-400'
                                    } else {
                                      rowClass =
                                        'bg-blue-50 font-medium text-blue-900 hover:bg-blue-100'
                                      badgeClass = 'bg-blue-100 text-blue-800 border-blue-200'
                                    }
                                  }

                                  return (
                                    <div
                                      key={node.id}
                                      className={cn(
                                        'flex items-center gap-2 px-2 py-1.5 transition-colors border-b border-slate-100/50 last:border-0',
                                        rowClass,
                                      )}
                                      style={{ paddingLeft: `${Math.max(0.5, level * 0.75)}rem` }}
                                    >
                                      <span
                                        className={cn(
                                          'font-mono text-[10px] px-1 rounded border shadow-sm shrink-0',
                                          badgeClass,
                                        )}
                                      >
                                        {code}
                                      </span>
                                      <span className="text-[11px] truncate">
                                        {node.account_name}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
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

        {totalPages > 0 && (
          <div className="p-4 border-t bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Itens por página:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val) => {
                  setItemsPerPage(Number(val))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[80px] h-8 bg-white border-slate-200">
                  <SelectValue placeholder="50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 && (
              <Pagination className="w-auto mx-0">
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
            )}
          </div>
        )}
      </Card>

      <ImportMappingModal open={importOpen} onOpenChange={setImportOpen} orgId={orgId} />
    </div>
  )
}
