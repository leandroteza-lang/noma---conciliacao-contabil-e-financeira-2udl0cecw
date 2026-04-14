import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
import { MappingRow } from '@/components/MappingRow'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])
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

    let currentOrgId = orgId
    if (!currentOrgId && orgsData && orgsData.length > 0) {
      const nomaParts = orgsData.find((o) => (o.name || '').trim().toUpperCase() === 'NOMA PARTS')
      currentOrgId = nomaParts ? nomaParts.id : orgsData[0].id
      setOrgId(currentOrgId)
    }
    if (!currentOrgId) return

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

  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    loadRef.current()
  }, [orgId, refreshCounter])

  useEffect(() => {
    let timeoutId: any
    const channel = supabase
      .channel('mappings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'account_mapping' }, () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => setRefreshCounter((prev) => prev + 1), 2000)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timeoutId)
    }
  }, [])

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
    if (debouncedSearch) {
      const normalizeStr = (str: string | null | undefined) => {
        if (!str) return ''
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      }

      const searchTerms = normalizeStr(debouncedSearch).split(' ').filter(Boolean)

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
  }, [enrichedCCs, filterStatus, debouncedSearch])

  const totalPages = Math.ceil(filteredCCs.length / itemsPerPage)
  const paginatedCCs = filteredCCs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages)
  }, [totalPages, page])

  const analyticalCCs = enrichedCCs.filter((c) => !c.isSynthetic)
  const total = analyticalCCs.length
  const mappedCount = analyticalCCs.filter((c) => c.mappingId).length
  const progress = total === 0 ? 0 : Math.round((mappedCount / total) * 100)

  const handleRemove = useCallback(async (mappingId: string) => {
    if (!mappingId) return

    // Optimistic Update
    setMappings((prev) => prev.filter((m) => m.id !== mappingId))

    const { error } = await supabase.from('account_mapping').delete().eq('id', mappingId)

    if (error) {
      toast.error('Erro ao remover: ' + error.message)
      loadRef.current() // Revert optimistic update
    } else {
      toast.success('Vínculo removido')
      loadRef.current()
    }
  }, [])

  const handleMap = useCallback(
    async (ccId: string, caId: any, existingMappingId?: string) => {
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
        loadRef.current() // Revert optimistic update
      } else {
        toast.success('Conta vinculada com sucesso')
        loadRef.current()
      }
    },
    [orgId, handleRemove],
  )

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
      loadRef.current()
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
      loadRef.current()
    } else {
      toast.success(`${ccIds.length} centro(s) de custo desvinculado(s) com sucesso!`)
      setSelectedCCs(new Set())
      loadRef.current()
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
      loadRef.current()
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
      loadRef.current()
    }
  }

  const toggleCC = useCallback((id: string) => {
    setSelectedCCs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedCCs((prev) => {
      const analytics = paginatedCCs.filter((c) => !c.isSynthetic)
      if (prev.size === analytics.length && analytics.length > 0) {
        return new Set()
      } else {
        return new Set(analytics.map((c) => c.id))
      }
    })
  }, [paginatedCCs])

  const handleExpandAll = useCallback(() => {
    const allExpandableIds = filteredCCs
      .filter(
        (cc) => cc.mappedCa && cc.mappedCa.hierarchyArray && cc.mappedCa.hierarchyArray.length > 0,
      )
      .map((cc) => cc.id)
    setExpandedAccounts(new Set(allExpandableIds))
  }, [filteredCCs])

  const handleCollapseAll = useCallback(() => {
    setExpandedAccounts(new Set())
  }, [])

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
        <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 md:mt-0">
          <Button
            variant="secondary"
            onClick={handleAutoMap}
            className="w-full sm:w-[220px] justify-start bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
          >
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            Sugestão Inteligente
          </Button>
          <Button
            onClick={() => setImportOpen(true)}
            className="w-full sm:w-[220px] justify-start bg-[#cc0000] hover:bg-[#aa0000] text-white shadow-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Planilha
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row items-center gap-8 bg-white rounded-t-xl">
          <div className="flex-1 w-full">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-slate-700 font-semibold">Progresso do Mapeamento Geral</span>
              <span className="text-emerald-600">{progress}% Concluído</span>
            </div>
            <Progress value={progress} className="h-2.5 bg-slate-100 [&>div]:bg-[#cc0000]" />
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-4 shrink-0">
            <div
              className={cn(
                'flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-xl p-4 min-w-[130px]',
                'bg-gradient-to-r from-[#003d82] to-[#0099ff] text-white shadow-lg hover:shadow-xl hover:shadow-[#0099ff]/20',
                filterStatus === 'mapped' && 'ring-4 ring-[#0099ff] ring-offset-2',
              )}
              onClick={() => {
                setFilterStatus(filterStatus === 'mapped' ? 'all' : 'mapped')
                setPage(1)
              }}
              title="Filtrar por Mapeados"
            >
              <span className="text-3xl font-bold leading-none">{mappedCount}</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase mt-1 opacity-90">
                Mapeados
              </span>
            </div>

            <div
              className={cn(
                'flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-xl p-4 min-w-[130px]',
                'bg-gradient-to-r from-[#8b4513] to-[#ff8c00] text-white shadow-lg hover:shadow-xl hover:shadow-[#ff8c00]/20',
                filterStatus === 'pending' && 'ring-4 ring-[#ff8c00] ring-offset-2',
              )}
              onClick={() => {
                setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')
                setPage(1)
              }}
              title="Filtrar por Pendentes"
            >
              <span className="text-3xl font-bold leading-none">{total - mappedCount}</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase mt-1 opacity-90">
                Pendentes
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="p-4 border-b flex flex-col xl:flex-row gap-4 justify-between bg-white rounded-t-xl">
          <div className="flex flex-wrap items-center gap-3 flex-1">
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="h-10 sm:h-9 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white shadow-sm"
              >
                <ListTree className="h-3.5 w-3.5 mr-1.5" />
                Expandir Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="h-10 sm:h-9 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white shadow-sm"
              >
                Recolher Todos
              </Button>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Excluir Todas Vinculações Contábeis</span>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="shrink-0"
                    title="Remover vínculo dos selecionados"
                  >
                    <Unlink className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Desvincular</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desvincular contas selecionadas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você está prestes a remover o vínculo contábil de{' '}
                      <strong>{selectedCCs.size}</strong> centro(s) de custo. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBatchRemove}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sim, desvincular
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
              {paginatedCCs.map((cc, index) => (
                <MappingRow
                  key={cc.id}
                  cc={cc}
                  index={index}
                  isSelected={selectedCCs.has(cc.id)}
                  isExpanded={expandedAccounts.has(cc.id)}
                  enrichedCAs={enrichedCAs}
                  onToggleCC={toggleCC}
                  onToggleExpand={toggleExpand}
                  onMap={handleMap}
                  onRemove={handleRemove}
                />
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
                  <SelectValue placeholder="500" />
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

      <ImportMappingModal
        open={importOpen}
        onOpenChange={setImportOpen}
        orgId={orgId}
        onSuccess={() => setRefreshCounter((prev) => prev + 1)}
      />
    </div>
  )
}
