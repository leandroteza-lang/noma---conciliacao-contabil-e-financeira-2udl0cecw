import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Building2,
  AlignLeft,
  Pencil,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  RotateCcw,
  Target,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ImportChartAccountsModal } from '@/components/ImportChartAccountsModal'
import { ChartAccountFormModal } from '@/components/ChartAccountFormModal'
import { ChartAccountBulkEditModal } from '@/components/ChartAccountBulkEditModal'
import { DeletePlanModal } from '@/components/DeletePlanModal'
import { UndoImportPlanModal } from '@/components/UndoImportPlanModal'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ChartAccount {
  id: string
  account_code: string
  account_name: string
  account_type: string
  classification?: string
  organization_id?: string
  organization: { name: string } | null
  account_level?: string
  account_behavior?: string
  nature?: string
  purpose?: string
}

export default function ChartAccounts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<ChartAccount[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [purposeSearch, setPurposeSearch] = useState('')
  const [debouncedPurpose, setDebouncedPurpose] = useState('')

  const [orgFilter, setOrgFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [behaviorFilter, setBehaviorFilter] = useState('all')
  const [natureFilter, setNatureFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [isImportOpen, setIsImportOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'classification',
    direction: 'asc',
  })
  const [refreshCounter, setRefreshCounter] = useState(0)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [isDeletePlanOpen, setIsDeletePlanOpen] = useState(false)
  const [isUndoImportOpen, setIsUndoImportOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null)

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [accountsToDelete, setAccountsToDelete] = useState<ChartAccount[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, step: '' })

  const [organizationsList, setOrganizationsList] = useState<{ id: string; name: string }[]>([])
  const [summary, setSummary] = useState({ ativo: 0, passivo: 0, receita: 0, despesa: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPurpose(purposeSearch)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [purposeSearch])

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
    if (data) setOrganizationsList(data)
  }

  const fetchSummary = async () => {
    const types = [
      { key: 'ativo', search: '%ATIVO%' },
      { key: 'passivo', search: '%PASSIVO%' },
      { key: 'receita', search: '%RECEITA%' },
      { key: 'despesa', search: '%DESPESA%' },
    ]
    const counts = { ativo: 0, passivo: 0, receita: 0, despesa: 0 }

    await Promise.all(
      types.map(async (t) => {
        let q = supabase
          .from('chart_of_accounts')
          .select('*', { count: 'exact', head: true })
          .or(`nature.ilike.${t.search},account_type.ilike.${t.search}`)
          .neq('pending_deletion', true)
          .is('deleted_at', null)
        if (orgFilter !== 'all') q = q.eq('organization_id', orgFilter)

        const { count } = await q
        if (t.key === 'ativo') counts.ativo = count || 0
        if (t.key === 'passivo') counts.passivo = count || 0
        if (t.key === 'receita') counts.receita = count || 0
        if (t.key === 'despesa') counts.despesa = count || 0
      }),
    )

    setSummary(counts)
  }

  const fetchAccounts = async () => {
    setLoading(true)

    let query = supabase
      .from('chart_of_accounts')
      .select('*, organization:organizations(name)', { count: 'exact' })
      .neq('pending_deletion', true)
      .is('deleted_at', null)

    if (debouncedSearch) {
      query = query.or(
        `account_code.ilike.%${debouncedSearch}%,account_name.ilike.%${debouncedSearch}%,classification.ilike.%${debouncedSearch}%`,
      )
    }

    if (debouncedPurpose) {
      query = query.ilike('purpose', `%${debouncedPurpose}%`)
    }

    if (levelFilter !== 'all') {
      query = query.eq('account_level', levelFilter)
    }

    if (behaviorFilter !== 'all') {
      query = query.eq('account_behavior', behaviorFilter)
    }

    if (natureFilter !== 'all') {
      const search =
        natureFilter === 'RECEITAS'
          ? '%RECEITA%'
          : natureFilter === 'DESPESAS'
            ? '%DESPESA%'
            : `%${natureFilter}%`
      query = query.or(`nature.ilike.${search},account_type.ilike.${search}`)
    }

    if (orgFilter !== 'all') {
      query = query.eq('organization_id', orgFilter)
    }

    const sortCol = sortConfig?.key || 'classification'
    const sortDir = sortConfig?.direction === 'asc'
    query = query.order(sortCol, { ascending: sortDir })

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (!error && data) {
      setAccounts(data)
      setTotalCount(count || 0)
      setSelectedIds((prev) => prev.filter((id) => data.some((d) => d.id === id)))
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchOrganizations()
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchAccounts()
    fetchSummary()
  }, [
    user,
    debouncedSearch,
    debouncedPurpose,
    levelFilter,
    behaviorFilter,
    natureFilter,
    orgFilter,
    sortConfig,
    currentPage,
    itemsPerPage,
    refreshCounter,
  ])

  useEffect(() => {
    if (!user) return
    let timeoutId: NodeJS.Timeout
    const channel = supabase
      .channel('schema-db-changes-chart-accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_of_accounts' }, () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setRefreshCounter((prev) => prev + 1)
        }, 2000)
      })
      .subscribe()
    return () => {
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [user])

  const getRowClassName = (acc: ChartAccount) => {
    const code = acc.classification || acc.account_code || ''
    const level = (code.match(/\./g) || []).length + 1

    if (acc.account_level === 'Sintética') {
      if (level === 1) return 'bg-indigo-950 font-bold text-white hover:bg-indigo-900'
      if (level === 2) return 'bg-blue-800 font-semibold text-white hover:bg-blue-700'
      if (level === 3) return 'bg-blue-500 font-medium text-white hover:bg-blue-400'
      if (level === 4) return 'bg-blue-200 font-medium text-blue-950 hover:bg-blue-300'
      return 'bg-blue-50 font-medium text-blue-900 hover:bg-blue-100'
    }

    return 'bg-white font-normal text-slate-700 hover:bg-slate-50'
  }

  const handleSaveAccount = async (data: any) => {
    if (editingAccount) {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update(data)
        .eq('id', editingAccount.id)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso.' })
        setIsFormOpen(false)
        fetchAccounts()
      }
    } else {
      const { error } = await supabase.from('chart_of_accounts').insert(data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        toast({ title: 'Sucesso', description: 'Conta criada com sucesso.' })
        setIsFormOpen(false)
        fetchAccounts()
      }
    }
  }

  const handleBulkEditSave = async (data: any) => {
    if (selectedIds.length === 0) return
    toast({ title: 'Aguarde', description: 'Atualizando contas...' })

    const chunkSize = 100
    let hasError = false
    let errorMessage = ''

    for (let i = 0; i < selectedIds.length; i += chunkSize) {
      const chunk = selectedIds.slice(i, i + chunkSize)
      const { error } = await supabase.from('chart_of_accounts').update(data).in('id', chunk)
      if (error) {
        hasError = true
        errorMessage = error.message
        break
      }
    }

    if (hasError) {
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: `${selectedIds.length} contas atualizadas.` })
      setIsBulkEditOpen(false)
      setSelectedIds([])
      fetchAccounts()
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const paginatedData = accounts

  const getIndentFromAcc = (acc: ChartAccount) => {
    const code = acc.classification || acc.account_code || ''
    const level = (code.match(/\./g) || []).length
    return level * 1.5
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    const selectedAccs = accounts.filter((a) => selectedIds.includes(a.id))
    const missingIds = selectedIds.filter((id) => !selectedAccs.find((a) => a.id === id))
    const allAccs = [...selectedAccs, ...missingIds.map((id) => ({ id }) as ChartAccount)]
    setAccountsToDelete(allAccs)
    setIsDeleteConfirmOpen(true)
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser' | 'csv' | 'txt') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando relatório...' })

      let win: Window | null = null
      if (formatType === 'browser') {
        win = window.open('', '_blank')
        if (win) {
          win.document.write('Gerando relatório, aguarde...')
        }
      }

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      let query = supabase
        .from('chart_of_accounts')
        .select('*, organization:organizations(name)')
        .neq('pending_deletion', true)
        .is('deleted_at', null)

      if (debouncedSearch) {
        query = query.or(
          `account_code.ilike.%${debouncedSearch}%,account_name.ilike.%${debouncedSearch}%,classification.ilike.%${debouncedSearch}%`,
        )
      }
      if (debouncedPurpose) query = query.ilike('purpose', `%${debouncedPurpose}%`)
      if (levelFilter !== 'all') query = query.eq('account_level', levelFilter)
      if (behaviorFilter !== 'all') query = query.eq('account_behavior', behaviorFilter)
      if (natureFilter !== 'all') query = query.ilike('nature', natureFilter)
      if (orgFilter !== 'all') query = query.eq('organization_id', orgFilter)

      const sortCol = sortConfig?.key || 'classification'
      const sortDir = sortConfig?.direction === 'asc'
      query = query.order(sortCol, { ascending: sortDir })

      const { data: allExportData, error: expError } = await query
      if (expError) throw expError

      const payload = {
        format: formatType === 'browser' ? 'pdf' : formatType,
        data: (allExportData || []).map((acc) => ({
          Empresa: acc.organization?.name || '-',
          'Código Reduzido': acc.account_code || '-',
          Classificação: acc.classification || '-',
          Nome: acc.account_name,
          Nível: acc.account_level || '-',
          Tipo: acc.account_behavior || '-',
          Natureza: acc.nature || acc.account_type || '-',
        })),
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-chart-accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        if (win) win.close()
        throw new Error('Falha ao exportar')
      }

      const result = await res.json()

      if (formatType === 'excel') {
        const binaryString = atob(result.excel)
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'plano_de_contas.xlsx'
        link.click()
      } else if (formatType === 'csv') {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'plano_de_contas.csv'
        link.click()
      } else if (formatType === 'txt') {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'plano_de_contas.txt'
        link.click()
      } else if (formatType === 'browser') {
        if (win) {
          win.document.open()
          win.document.write(
            `<iframe src="${result.pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
          )
          win.document.close()
        }
      } else {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = 'plano_de_contas.pdf'
        link.click()
      }
      toast({ title: 'Sucesso', description: 'Relatório gerado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = (acc: ChartAccount) => {
    setAccountsToDelete([acc])
    setIsDeleteConfirmOpen(true)
  }

  const executeDeletion = async () => {
    setIsDeleting(true)
    setDeleteProgress({ current: 0, total: 0, step: 'Coletando dados das contas...' })

    try {
      const idsToFetch = accountsToDelete.map((a) => a.id)
      let fullAccountsToDelete: any[] = []
      const chunkSize = 100

      for (let i = 0; i < idsToFetch.length; i += chunkSize) {
        const chunk = idsToFetch.slice(i, i + chunkSize)
        const { data } = await supabase
          .from('chart_of_accounts')
          .select('id, account_level, classification, organization_id')
          .in('id', chunk)
        if (data) fullAccountsToDelete.push(...data)
        setDeleteProgress((prev) => ({
          ...prev,
          current: Math.min(idsToFetch.length, i + chunkSize),
          total: idsToFetch.length,
        }))
      }

      let allIdsToProcess = new Set<string>(fullAccountsToDelete.map((a) => a.id))
      const synthetics = fullAccountsToDelete.filter(
        (a) => a.account_level === 'Sintética' && a.classification,
      )

      setDeleteProgress({
        current: 0,
        total: synthetics.length,
        step: 'Mapeando hierarquia de contas filhas...',
      })

      let processedSynthetics = 0
      for (const synth of synthetics) {
        let query = supabase
          .from('chart_of_accounts')
          .select('id')
          .or(
            `classification.like.${synth.classification}.%,classification.like.${synth.classification}-%`,
          )

        if (synth.organization_id) {
          query = query.eq('organization_id', synth.organization_id)
        } else {
          query = query.is('organization_id', null)
        }

        const { data: children } = await query
        if (children) {
          children.forEach((c) => allIdsToProcess.add(c.id))
        }
        processedSynthetics++
        setDeleteProgress((prev) => ({ ...prev, current: processedSynthetics }))
      }

      const targetIds = Array.from(allIdsToProcess)
      setDeleteProgress({
        current: 0,
        total: targetIds.length,
        step: 'Verificando vínculos contábeis...',
      })

      const blockedIds = new Set<string>()

      for (let i = 0; i < targetIds.length; i += chunkSize) {
        const chunk = targetIds.slice(i, i + chunkSize)
        const [{ data: mappings }, { data: debits }, { data: credits }] = await Promise.all([
          supabase.from('account_mapping').select('chart_account_id').in('chart_account_id', chunk),
          supabase
            .from('accounting_entries')
            .select('debit_account_id')
            .in('debit_account_id', chunk),
          supabase
            .from('accounting_entries')
            .select('credit_account_id')
            .in('credit_account_id', chunk),
        ])

        mappings?.forEach((m: any) => {
          if (m.chart_account_id) blockedIds.add(m.chart_account_id)
        })
        debits?.forEach((d: any) => {
          if (d.debit_account_id) blockedIds.add(d.debit_account_id)
        })
        credits?.forEach((c: any) => {
          if (c.credit_account_id) blockedIds.add(c.credit_account_id)
        })

        setDeleteProgress((prev) => ({
          ...prev,
          current: Math.min(targetIds.length, i + chunkSize),
        }))
      }

      const toDelete = targetIds.filter((id) => !blockedIds.has(id))
      const blockedCount = blockedIds.size

      if (toDelete.length === 0) {
        toast({
          title: 'Ação Bloqueada',
          description: 'Todas as contas selecionadas possuem vínculos e não podem ser excluídas.',
          variant: 'destructive',
        })
        setIsDeleting(false)
        setIsDeleteConfirmOpen(false)
        return
      }

      setDeleteProgress({ current: 0, total: toDelete.length, step: 'Excluindo contas...' })

      let deletedCount = 0
      for (let i = 0; i < toDelete.length; i += chunkSize) {
        const chunk = toDelete.slice(i, i + chunkSize)
        const { error } = await supabase.from('chart_of_accounts').delete().in('id', chunk)
        if (error) throw error
        deletedCount += chunk.length
        setDeleteProgress((prev) => ({ ...prev, current: deletedCount }))
      }

      if (blockedCount > 0) {
        toast({
          title: 'Ação Parcialmente Concluída',
          description: `${deletedCount} conta(s) excluída(s). ${blockedCount} conta(s) possuem vínculos e não puderam ser excluídas.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: `${deletedCount} conta(s) excluída(s) com sucesso.`,
        })
      }

      setSelectedIds([])
      fetchAccounts()
      fetchSummary()
      setIsDeleteConfirmOpen(false)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-[1400px] py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground">Gerencie a hierarquia contábil das suas empresas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsUndoImportOpen(true)}
            className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4" /> Desfazer Importação
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
          >
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport('browser')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> Abrir no Browser
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('csv')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4 text-blue-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('txt')}
                className="cursor-pointer gap-2"
              >
                <FileText className="h-4 w-4 text-gray-600" /> TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" onClick={() => setIsDeletePlanOpen(true)} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir Plano
          </Button>
          <Button
            onClick={() => {
              setEditingAccount(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={cn(
            'group relative overflow-hidden rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-1',
            'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-blue-500/30',
            natureFilter === 'ATIVO' ? 'ring-4 ring-blue-400 ring-offset-2 shadow-blue-500/50' : '',
          )}
          onClick={() => {
            setNatureFilter(natureFilter === 'ATIVO' ? 'all' : 'ATIVO')
            setCurrentPage(1)
          }}
        >
          <CardContent className="p-6 h-full flex flex-col justify-between min-h-[140px] relative z-10">
            <div className="space-y-1">
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">
                Contas de Ativo
              </p>
              <p className="text-4xl font-bold tracking-tight">{summary.ativo}</p>
            </div>
            <p className="text-blue-100/80 text-xs mt-4 font-medium">Total de contas cadastradas</p>
          </CardContent>
          <Landmark className="absolute -bottom-4 -right-4 h-32 w-32 text-white opacity-10 rotate-[-15deg] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]" />
        </Card>
        <Card
          className={cn(
            'group relative overflow-hidden rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-1',
            'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white shadow-lg hover:shadow-rose-500/30',
            natureFilter === 'PASSIVO'
              ? 'ring-4 ring-rose-400 ring-offset-2 shadow-rose-500/50'
              : '',
          )}
          onClick={() => {
            setNatureFilter(natureFilter === 'PASSIVO' ? 'all' : 'PASSIVO')
            setCurrentPage(1)
          }}
        >
          <CardContent className="p-6 h-full flex flex-col justify-between min-h-[140px] relative z-10">
            <div className="space-y-1">
              <p className="text-rose-100 text-sm font-semibold uppercase tracking-wider">
                Contas de Passivo
              </p>
              <p className="text-4xl font-bold tracking-tight">{summary.passivo}</p>
            </div>
            <p className="text-rose-100/80 text-xs mt-4 font-medium">Total de contas cadastradas</p>
          </CardContent>
          <Wallet className="absolute -bottom-4 -right-4 h-32 w-32 text-white opacity-10 rotate-[-15deg] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]" />
        </Card>
        <Card
          className={cn(
            'group relative overflow-hidden rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-1',
            'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/30',
            natureFilter === 'RECEITAS'
              ? 'ring-4 ring-emerald-400 ring-offset-2 shadow-emerald-500/50'
              : '',
          )}
          onClick={() => {
            setNatureFilter(natureFilter === 'RECEITAS' ? 'all' : 'RECEITAS')
            setCurrentPage(1)
          }}
        >
          <CardContent className="p-6 h-full flex flex-col justify-between min-h-[140px] relative z-10">
            <div className="space-y-1">
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">
                Contas de Receita
              </p>
              <p className="text-4xl font-bold tracking-tight">{summary.receita}</p>
            </div>
            <p className="text-emerald-100/80 text-xs mt-4 font-medium">
              Total de contas cadastradas
            </p>
          </CardContent>
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-white opacity-10 rotate-[-15deg] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]" />
        </Card>
        <Card
          className={cn(
            'group relative overflow-hidden rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:-translate-y-1',
            'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white shadow-lg hover:shadow-orange-500/30',
            natureFilter === 'DESPESAS'
              ? 'ring-4 ring-orange-400 ring-offset-2 shadow-orange-500/50'
              : '',
          )}
          onClick={() => {
            setNatureFilter(natureFilter === 'DESPESAS' ? 'all' : 'DESPESAS')
            setCurrentPage(1)
          }}
        >
          <CardContent className="p-6 h-full flex flex-col justify-between min-h-[140px] relative z-10">
            <div className="space-y-1">
              <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider">
                Contas de Despesa
              </p>
              <p className="text-4xl font-bold tracking-tight">{summary.despesa}</p>
            </div>
            <p className="text-orange-100/80 text-xs mt-4 font-medium">
              Total de contas cadastradas
            </p>
          </CardContent>
          <TrendingDown className="absolute -bottom-4 -right-4 h-32 w-32 text-white opacity-10 rotate-[-15deg] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]" />
        </Card>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} item(ns) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkEditOpen(true)}
              className="gap-2"
            >
              Editar em Lote
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="h-4 w-4" /> Excluir Selecionados
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <CardTitle>Listagem de Contas</CardTitle>
              <CardDescription>Visualize e filtre sua estrutura contábil.</CardDescription>
            </div>

            {/* Extended Filters Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-44">
                  <Select
                    value={orgFilter}
                    onValueChange={(v) => {
                      setOrgFilter(v)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Empresas</SelectItem>
                      {organizationsList.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-40">
                  <Select
                    value={levelFilter}
                    onValueChange={(v) => {
                      setLevelFilter(v)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Níveis</SelectItem>
                      <SelectItem value="Sintética">Sintética</SelectItem>
                      <SelectItem value="Analítica">Analítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-40">
                  <Select
                    value={behaviorFilter}
                    onValueChange={(v) => {
                      setBehaviorFilter(v)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="Devedora">Devedora</SelectItem>
                      <SelectItem value="Credora">Credora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-40">
                  <Select
                    value={natureFilter}
                    onValueChange={(v) => {
                      setNatureFilter(v)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Natureza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Naturezas</SelectItem>
                      <SelectItem value="ATIVO">ATIVO</SelectItem>
                      <SelectItem value="PASSIVO">PASSIVO</SelectItem>
                      <SelectItem value="RECEITAS">RECEITAS</SelectItem>
                      <SelectItem value="DESPESAS">DESPESAS</SelectItem>
                      <SelectItem value="OUTRAS">OUTRAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-[280px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Código, nome, classif..."
                    className="pl-8 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="relative w-full sm:w-[220px]">
                  <Target className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por finalidade..."
                    className="pl-8 bg-white"
                    value={purposeSearch}
                    onChange={(e) => setPurposeSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="[&_td]:p-2 [&_th]:p-2 text-xs">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 && selectedIds.length === paginatedData.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(paginatedData.map((d) => d.id))
                        else setSelectedIds([])
                      }}
                    />
                  </TableHead>
                  <TableHead
                    className="w-[120px] cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('organization')}
                  >
                    <div className="flex items-center gap-2">
                      Empresa <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[110px] cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('account_code')}
                  >
                    <div className="flex items-center gap-2">
                      Cód. Reduzido <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[120px] cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('classification')}
                  >
                    <div className="flex items-center gap-2">
                      Classificação <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="min-w-[200px] cursor-pointer hover:bg-slate-100 whitespace-nowrap"
                    onClick={() => handleSort('account_name')}
                  >
                    <div className="flex items-center gap-2">
                      Nome da Conta <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[90px] text-center whitespace-nowrap">Nível</TableHead>
                  <TableHead className="w-[90px] text-center whitespace-nowrap">Tipo</TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap">Natureza</TableHead>
                  <TableHead className="min-w-[150px] whitespace-nowrap">Finalidade</TableHead>
                  <TableHead className="w-[80px] text-right whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Carregando plano de contas...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((acc) => {
                    const code = acc.classification || acc.account_code || ''
                    const level = (code.match(/\./g) || []).length + 1

                    return (
                      <TableRow key={acc.id} className={getRowClassName(acc)}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedIds.includes(acc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, acc.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                            }}
                            className={cn(
                              acc.account_level === 'Sintética' && level <= 3
                                ? 'border-white/70 data-[state=checked]:bg-white data-[state=checked]:text-blue-900'
                                : '',
                            )}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5 opacity-80">
                            <Building2 className="h-3 w-3 opacity-60 shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {acc.organization?.name || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap opacity-80">
                          {acc.account_code || '-'}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap opacity-90">
                          {acc.classification || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div
                            className="flex items-center"
                            style={{ paddingLeft: `${getIndentFromAcc(acc)}rem` }}
                          >
                            <AlignLeft className="h-3 w-3 opacity-40 shrink-0 mr-2" />
                            <span
                              className={cn(
                                acc.account_level === 'Sintética' ? 'font-semibold uppercase' : '',
                              )}
                            >
                              {acc.account_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {acc.account_level && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-medium border-transparent shadow-sm rounded-full px-2.5',
                                acc.account_level === 'Sintética'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800',
                              )}
                            >
                              {acc.account_level}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {acc.account_behavior && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-medium border-transparent shadow-sm rounded-full px-2.5',
                                acc.account_behavior === 'Devedora'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-purple-100 text-purple-800',
                              )}
                            >
                              {acc.account_behavior}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap truncate max-w-[140px] opacity-80">
                          {acc.nature || acc.account_type || '-'}
                        </TableCell>
                        <TableCell
                          className="truncate max-w-[150px] opacity-60 italic"
                          title={acc.purpose}
                        >
                          {acc.purpose || '-'}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingAccount(acc)
                                setIsFormOpen(true)
                              }}
                              className={cn(
                                'h-7 w-7 opacity-70 hover:opacity-100 transition-colors',
                                level <= 3 && acc.account_level === 'Sintética'
                                  ? 'hover:bg-white/20 text-white'
                                  : 'hover:bg-black/5 hover:text-blue-600 text-slate-500',
                              )}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(acc)}
                              className={cn(
                                'h-7 w-7 opacity-70 hover:opacity-100 transition-colors',
                                level <= 3 && acc.account_level === 'Sintética'
                                  ? 'hover:bg-white/20 text-white'
                                  : 'hover:bg-black/5 hover:text-red-600 text-slate-500',
                              )}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Nenhuma conta contábil encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <ImportChartAccountsModal
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onSuccess={fetchAccounts}
          />

          <ChartAccountFormModal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveAccount}
            initialData={editingAccount}
          />

          <ChartAccountBulkEditModal
            isOpen={isBulkEditOpen}
            onClose={() => setIsBulkEditOpen(false)}
            onSave={handleBulkEditSave}
            count={selectedIds.length}
          />

          <DeletePlanModal
            isOpen={isDeletePlanOpen}
            onClose={() => setIsDeletePlanOpen(false)}
            onSuccess={() => {
              fetchAccounts()
              fetchSummary()
            }}
            organizations={organizationsList}
          />

          <UndoImportPlanModal
            isOpen={isUndoImportOpen}
            onClose={() => setIsUndoImportOpen(false)}
            onSuccess={() => {
              fetchAccounts()
              fetchSummary()
            }}
            organizations={organizationsList}
          />

          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 mt-2">
                    {!isDeleting ? (
                      <>
                        <p>
                          Você está prestes a excluir <strong>{accountsToDelete.length}</strong>{' '}
                          conta(s) selecionada(s).
                        </p>
                        {accountsToDelete.some((a) => a.account_level === 'Sintética') && (
                          <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200">
                            <strong>Atenção:</strong> Você selecionou contas Sintéticas. Todas as
                            contas analíticas e subcontas pertencentes a estes níveis também serão
                            excluídas em cascata.
                          </div>
                        )}
                        <p>
                          Esta ação não pode ser desfeita. Contas com vínculos (lançamentos ou
                          mapeamentos) não serão excluídas.
                        </p>
                      </>
                    ) : (
                      <div className="space-y-4 py-4">
                        <div className="flex justify-between text-sm font-medium text-slate-700">
                          <span>{deleteProgress.step}</span>
                          {deleteProgress.total > 0 && (
                            <span>
                              {Math.round((deleteProgress.current / deleteProgress.total) * 100)}%
                            </span>
                          )}
                        </div>
                        <Progress
                          value={
                            deleteProgress.total > 0
                              ? (deleteProgress.current / deleteProgress.total) * 100
                              : 0
                          }
                          className="h-2 transition-all"
                        />
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              {!isDeleting && (
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <Button variant="destructive" onClick={executeDeletion} disabled={isDeleting}>
                    Sim, excluir
                  </Button>
                </AlertDialogFooter>
              )}
            </AlertDialogContent>
          </AlertDialog>

          {!loading && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 hidden sm:block">Itens por página:</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="1000">1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 whitespace-nowrap">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
