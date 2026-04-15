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
import {
  Search,
  Upload,
  Sparkles,
  ListTree,
  Unlink,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  ExternalLink,
} from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { AccountCombobox, Account } from '@/components/AccountCombobox'
import { ImportMappingModal } from '@/components/ImportMappingModal'
import { MappingRow } from '@/components/MappingRow'
import { cn } from '@/lib/utils'

export default function Mapping() {
  const { user, role } = useAuth() as any
  const isAdmin = role === 'admin'
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [batchCaId, setBatchCaId] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)
  const [batchActionType, setBatchActionType] = useState<'unlink' | 'delete_cc' | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'excel' | 'csv' | 'txt' | 'pdf' | 'browser') => {
    if (filteredCCs.length === 0) {
      toast.info('Não há dados para exportar com os filtros atuais.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Gerando exportação...')

    try {
      const exportData = filteredCCs.map((cc) => {
        const ccStr = `${cc.code || ''} - ${cc.description || ''}`.replace(/^- | -$/, '').trim()
        const caStr = cc.mappedCa
          ? `${cc.mappedCa.account_code || ''} - ${cc.mappedCa.account_name || ''}`
              .replace(/^- | -$/, '')
              .trim()
          : 'Não vinculado'
        const status = cc.mappingId ? 'Mapeado' : 'Pendente'

        return {
          'Centro de Custo': ccStr,
          'Conta Contábil': caStr,
          Status: status,
          ccCode: cc.code || '',
          ccDesc: cc.description || '',
          caCode: cc.mappedCa?.account_code || '',
          caDesc: cc.mappedCa?.account_name || '',
          level: cc.level || 0,
          isSynthetic: !!cc.isSynthetic,
          mapped: !!cc.mappingId,
        }
      })

      const { data, error } = await supabase.functions.invoke('export-mappings', {
        body: { format, data: exportData },
      })

      if (error) throw new Error(error.message)

      if (format === 'excel' && data.excel) {
        const url = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excel}`
        const a = document.createElement('a')
        a.href = url
        a.download = `Mapeamentos_${new Date().toISOString().split('T')[0]}.xlsx`
        a.click()
      } else if (format === 'csv' && data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Mapeamentos_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'txt' && data.txt) {
        const blob = new Blob([data.txt], { type: 'text/plain;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Mapeamentos_${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'browser' && data.html) {
        const browserWindow = window.open('', '_blank')
        if (browserWindow) {
          browserWindow.document.open()
          browserWindow.document.write(data.html)
          browserWindow.document.close()
        } else {
          toast.error(
            'O navegador bloqueou a abertura da nova aba. Permita pop-ups para este site.',
          )
        }
      } else if (format === 'pdf' && data.pdf) {
        const a = document.createElement('a')
        a.href = data.pdf
        a.download = `Mapeamentos_${new Date().toISOString().split('T')[0]}.pdf`
        a.click()
      }

      toast.success('Exportação concluída!', { id: toastId })
    } catch (err: any) {
      toast.error('Erro ao exportar: ' + err.message, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

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
          .neq('pending_deletion', true)
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
        pendingDeletion: mapping?.pending_deletion,
        ccPendingDeletion: cc.pending_deletion,
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

  const visibleCCs = useMemo(() => {
    if (debouncedSearch) return filteredCCs

    const collapsedCodes = enrichedCCs
      .filter((c) => collapsedGroups.has(c.id) && c.code)
      .map((c) => c.code!)

    return filteredCCs.filter((cc) => {
      if (!cc.code) return true
      return !collapsedCodes.some((collapsedCode) => cc.code!.startsWith(collapsedCode + '.'))
    })
  }, [filteredCCs, collapsedGroups, enrichedCCs, debouncedSearch])

  const totalPages = Math.ceil(visibleCCs.length / itemsPerPage)
  const paginatedCCs = visibleCCs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages)
  }, [totalPages, page])

  const analyticalCCs = enrichedCCs.filter((c) => !c.isSynthetic)
  const total = analyticalCCs.length
  const mappedCount = analyticalCCs.filter((c) => c.mappingId).length
  const progress = total === 0 ? 0 : Math.round((mappedCount / total) * 100)

  const handleRemove = useCallback(
    async (mappingId: string) => {
      if (!mappingId) return

      const { error } = await supabase
        .from('account_mapping')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .eq('id', mappingId)

      if (error) {
        toast.error('Erro ao solicitar exclusão: ' + error.message)
      } else {
        toast.success('Solicitação de exclusão enviada para aprovação')
        window.dispatchEvent(new Event('refresh-approvals-badge'))
        loadRef.current()
      }
    },
    [user?.id],
  )

  const handleMap = useCallback(
    async (ccId: string, caId: any, existingMappingId?: string) => {
      if (!orgId) return
      const targetCaId = typeof caId === 'object' ? caId?.id : caId
      if (!targetCaId) {
        if (existingMappingId) return handleRemove(existingMappingId)
        return
      }

      if (!isAdmin) {
        const isCreate = !existingMappingId
        const newId = existingMappingId || crypto.randomUUID()
        const proposed: any = {
          organization_id: orgId,
          cost_center_id: ccId,
          chart_account_id: targetCaId,
          mapping_type: 'DE/PARA',
          id: newId,
        }
        if (isCreate) {
          proposed.__action = 'CREATE'
        }

        const { error } = await supabase.from('pending_changes').insert({
          entity_type: 'account_mapping',
          entity_id: newId,
          proposed_changes: proposed,
          requested_by: user?.id,
        })

        if (error) {
          toast.error('Erro ao solicitar mapeamento: ' + error.message)
        } else {
          toast.success('Solicitação enviada para aprovação')
        }
        return
      }

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
        await supabase
          .from('account_mapping')
          .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
          .eq('id', existingMappingId)
      }
      await supabase
        .from('account_mapping')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
        .eq('cost_center_id', ccId)
        .eq('organization_id', orgId)
        .is('deleted_at', null)

      const { error } = await supabase.from('account_mapping').insert({
        organization_id: orgId,
        cost_center_id: ccId,
        chart_account_id: targetCaId,
        mapping_type: 'DE/PARA',
      })

      if (error) {
        toast.error('Erro ao mapear: ' + error.message)
        loadRef.current()
      } else {
        toast.success('Conta vinculada com sucesso')
        loadRef.current()
      }
    },
    [orgId, handleRemove, isAdmin, user?.id],
  )

  const handleBatchMap = async () => {
    if (!orgId || selectedCCs.size === 0 || !batchCaId) return

    const targetBatchCaId = typeof batchCaId === 'object' ? (batchCaId as any)?.id : batchCaId
    if (!targetBatchCaId) return

    const ccIds = Array.from(selectedCCs)

    if (!isAdmin) {
      const pendingInserts = ccIds.map((ccId) => {
        const existing = mappings.find((m) => m.cost_center_id === ccId)
        const isCreate = !existing
        const newId = existing ? existing.id : crypto.randomUUID()
        const proposed: any = {
          organization_id: orgId,
          cost_center_id: ccId,
          chart_account_id: targetBatchCaId,
          mapping_type: 'DE/PARA',
          id: newId,
        }

        if (isCreate) {
          proposed.__action = 'CREATE'
        }

        return {
          entity_type: 'account_mapping',
          entity_id: newId,
          proposed_changes: proposed,
          requested_by: user?.id,
        }
      })

      const { error } = await supabase.from('pending_changes').insert(pendingInserts)
      if (error) toast.error('Erro ao enviar para aprovação: ' + error.message)
      else {
        toast.success(`${ccIds.length} solicitações enviadas para aprovação!`)
        setSelectedCCs(new Set())
        setBatchCaId('')
      }
      return
    }

    const existingMappings = mappings.filter((m) => ccIds.includes(m.cost_center_id))
    if (existingMappings.length > 0) {
      await supabase
        .from('account_mapping')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
        .in(
          'id',
          existingMappings.map((m) => m.id),
        )
    }

    await supabase
      .from('account_mapping')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .in('cost_center_id', ccIds)
      .eq('organization_id', orgId)
      .is('deleted_at', null)

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
    const existingMappings = mappings.filter((m) => ccIds.includes(m.cost_center_id))
    if (existingMappings.length === 0) {
      toast.info('Nenhum vínculo encontrado para excluir nos itens selecionados.')
      setBatchActionType(null)
      return
    }

    const { error } = await supabase
      .from('account_mapping')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .in(
        'id',
        existingMappings.map((m) => m.id),
      )

    if (error) {
      toast.error('Erro ao solicitar desvinculação: ' + error.message)
    } else {
      toast.success(
        `${existingMappings.length} solicitações de desvinculação enviadas para aprovação!`,
      )
      window.dispatchEvent(new Event('refresh-approvals-badge'))
      setSelectedCCs(new Set())
      setBatchActionType(null)
      loadRef.current()
    }
  }

  const handleBatchDeleteCC = async () => {
    if (!orgId || selectedCCs.size === 0) return

    const ccIds = Array.from(selectedCCs)

    const { error } = await supabase
      .from('cost_centers')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .in('id', ccIds)

    if (error) {
      toast.error('Erro ao solicitar exclusão de cadastro: ' + error.message)
    } else {
      toast.success(
        `${ccIds.length} solicitações de exclusão de Centro de Custo enviadas para aprovação!`,
      )
      window.dispatchEvent(new Event('refresh-approvals-badge'))
      setSelectedCCs(new Set())
      setBatchActionType(null)
      loadRef.current()
    }
  }

  const handleRemoveAll = async () => {
    if (!orgId) return

    const existingMappings = mappings.filter((m) => m.organization_id === orgId)
    if (existingMappings.length === 0) {
      toast.info('Nenhuma vinculação encontrada nesta empresa.')
      return
    }

    const { error } = await supabase
      .from('account_mapping')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .eq('organization_id', orgId)
      .is('deleted_at', null)

    if (error) {
      toast.error('Erro ao solicitar limpeza: ' + error.message)
    } else {
      toast.success('Solicitação de exclusão geral enviada para aprovação!')
      window.dispatchEvent(new Event('refresh-approvals-badge'))
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

    if (!isAdmin) {
      const pendingInserts = payloads.map((p) => {
        const newId = crypto.randomUUID()
        return {
          entity_type: 'account_mapping',
          entity_id: newId,
          proposed_changes: { ...p, id: newId, __action: 'CREATE' },
          requested_by: user?.id,
        }
      })
      const { error } = await supabase.from('pending_changes').insert(pendingInserts)
      if (error) toast.error('Erro no auto-mapeamento: ' + error.message)
      else toast.success(`${payloads.length} mapeamentos sugeridos enviados para aprovação!`)
      return
    }

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

  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedCCs((prev) => {
      const analytics = paginatedCCs.filter((c) => !c.isSynthetic && !c.ccPendingDeletion)
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
    setCollapsedGroups(new Set())
  }, [filteredCCs])

  const handleExpandAnalytic = useCallback(() => {
    setExpandedAccounts(new Set())
    setCollapsedGroups(new Set())
  }, [])

  const handleCollapseAll = useCallback(() => {
    setExpandedAccounts(new Set())
    const allGroupIds = filteredCCs.filter((cc) => cc.isSynthetic).map((cc) => cc.id)
    setCollapsedGroups(new Set(allGroupIds))
  }, [filteredCCs])

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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 md:mt-0">
          <Button
            variant="secondary"
            onClick={handleAutoMap}
            className="w-full sm:w-auto justify-start bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
          >
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            Sugestão Inteligente
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isExporting}
                variant="outline"
                className="w-full sm:w-auto bg-white shadow-sm border-slate-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="h-4 w-4 mr-2" />
                TXT
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF (Download)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('browser')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Browser
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setImportOpen(true)}
            className="w-full sm:w-auto justify-start bg-[#cc0000] hover:bg-[#aa0000] text-white shadow-sm"
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
              <span className={progress === 100 ? 'text-emerald-600' : 'text-blue-600'}>
                {progress}% Concluído
              </span>
            </div>
            <Progress
              value={progress}
              className={cn(
                'h-2.5 bg-slate-100 transition-all',
                progress === 100 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-600',
              )}
            />
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
                onClick={handleExpandAnalytic}
                className="h-10 sm:h-9 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white shadow-sm"
              >
                Expandir Analítico
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
              <Button className="flex-1 sm:flex-none bg-[#cc0000] hover:bg-[#aa0000] text-white shadow-sm">
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Solicitar Exclusão Geral</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Solicitar exclusão de todos os vínculos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso enviará a solicitação de remoção das contas contábeis vinculadas de{' '}
                  <strong>todos</strong> os centros de custo desta empresa para a Central de
                  Aprovações.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveAll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sim, solicitar
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="shrink-0 bg-[#cc0000] hover:bg-[#aa0000] text-white shadow-sm"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Excluir...</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setBatchActionType('unlink')}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Desvincular Contas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setBatchActionType('delete_cc')}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Centros de Custo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog
                open={batchActionType === 'unlink'}
                onOpenChange={(open) => !open && setBatchActionType(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Solicitar desvinculação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você está prestes a solicitar a exclusão do <strong>vínculo contábil</strong>{' '}
                      de <strong>{selectedCCs.size}</strong> centro(s) de custo. Os registros irão
                      para a Central de Aprovações. O centro de custo em si NÃO será excluído.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBatchRemove}
                      className="bg-[#cc0000] hover:bg-[#aa0000] text-white"
                    >
                      Sim, desvincular
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={batchActionType === 'delete_cc'}
                onOpenChange={(open) => !open && setBatchActionType(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Solicitar exclusão de Centros de Custo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você está prestes a solicitar a <strong>exclusão definitiva</strong> do
                      cadastro de <strong>{selectedCCs.size}</strong> centro(s) de custo (e seus
                      vínculos). As solicitações irão para a Central de Aprovações.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBatchDeleteCC}
                      className="bg-[#cc0000] hover:bg-[#aa0000] text-white"
                    >
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-indigo-950 border-b border-indigo-900 shadow-sm sticky top-0 z-10">
              <TableRow className="h-14 hover:bg-indigo-950 border-b-0">
                <TableHead className="w-[40px] text-center border-r border-indigo-900/50 align-middle">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={
                        paginatedCCs.filter((c) => !c.isSynthetic).length > 0 &&
                        selectedCCs.size === paginatedCCs.filter((c) => !c.isSynthetic).length
                      }
                      onCheckedChange={toggleAll}
                      className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-indigo-950"
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[40%] text-center border-r border-indigo-900/50 p-3 align-middle">
                  <div className="flex items-center justify-center gap-2 w-full">
                    <Badge
                      variant="outline"
                      className="border-white/30 bg-white/10 text-white font-bold"
                    >
                      DE
                    </Badge>
                    <span className="font-bold text-white text-[15px] tracking-wide">
                      Centro de Custo TGA
                    </span>
                  </div>
                </TableHead>
                <TableHead className="w-[60%] p-3 pr-4 text-center align-middle">
                  <div className="flex items-center justify-center gap-2 w-full">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 font-bold">
                      PARA
                    </Badge>
                    <span className="font-bold text-white text-[15px] tracking-wide">
                      Conta Contábil Vinculada
                    </span>
                  </div>
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
                  isGroupCollapsed={collapsedGroups.has(cc.id)}
                  enrichedCAs={enrichedCAs}
                  onToggleCC={toggleCC}
                  onToggleExpand={toggleExpand}
                  onToggleGroup={toggleGroup}
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
