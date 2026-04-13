import { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Building2,
  Layers,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Filter,
  Activity,
  BarChart2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pencil,
  Edit2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ImportCostCentersModal } from '@/components/ImportCostCentersModal'
import { UndoImportCostCentersModal } from '@/components/UndoImportCostCentersModal'
import { CostCenterBulkEditModal } from '@/components/CostCenterBulkEditModal'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useAuditLog } from '@/hooks/use-audit-log'
import { cn } from '@/lib/utils'

interface CostCenter {
  id: string
  code: string
  description: string
  parent_id: string | null
  type_tga: string | null
  fixed_variable: string | null
  classification: string | null
  operational: string | null
  tipo_lcto: string | null
  tipo_tga_id: string | null
  contabiliza: string | null
  observacoes: string | null
  organization: { name: string } | null
  organization_id: string | null
  tipo_conta_tga: { nome: string } | null
}

export default function CostCenters() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const { logAction } = useAuditLog()
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  const [filterOrg, setFilterOrg] = useState<string>('all')
  const [filterTipoLcto, setFilterTipoLcto] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'code',
    direction: 'asc',
  })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isUndoOpen, setIsUndoOpen] = useState(false)

  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [tgaOptions, setTgaOptions] = useState<{ id: string; nome: string }[]>([])
  const [allTgaOptions, setAllTgaOptions] = useState<{ id: string; nome: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [editCC, setEditCC] = useState({
    id: '',
    organization_id: '',
    code: '',
    description: '',
    tipo_lcto: 'none',
    operational: 'none',
    tipo_tga_id: 'none',
    type_tga: '',
    fixed_variable: '',
    contabiliza: 'none',
    observacoes: '',
  })
  const [newCC, setNewCC] = useState({
    organization_id: '',
    code: '',
    description: '',
    tipo_lcto: 'none',
    operational: 'none',
    tipo_tga_id: 'none',
    type_tga: '',
    fixed_variable: '',
    contabiliza: 'none',
    observacoes: '',
  })

  useEffect(() => {
    loadOrgs()
    loadAllTgaOptions()
  }, [])

  const loadOrgs = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
    if (data) setOrgs(data)
  }

  const loadAllTgaOptions = async () => {
    const { data } = await supabase.from('tipo_conta_tga').select('id, nome').is('deleted_at', null)
    if (data) setAllTgaOptions(data)
  }

  useEffect(() => {
    if (newCC.organization_id) {
      supabase
        .from('tipo_conta_tga')
        .select('id, nome')
        .eq('organization_id', newCC.organization_id)
        .is('deleted_at', null)
        .then(({ data }) => setTgaOptions(data || []))
    } else {
      setTgaOptions([])
    }
  }, [newCC.organization_id])

  const fetchCostCenters = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*, organization:organizations(name), tipo_conta_tga(nome)')
      .neq('pending_deletion', true)
      .is('deleted_at', null)
      .order('code', { ascending: true })

    if (!error && data) {
      setCostCenters(data as any)
      setSelectedIds((prev) => prev.filter((id) => data.some((d) => d.id === id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchCostCenters()

    const channel = supabase
      .channel('schema-db-changes-cc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_centers' }, () => {
        fetchCostCenters()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const filteredData = costCenters.filter((cc) => {
    const term = search.toLowerCase()
    const matchesSearch =
      (cc.code && cc.code.toLowerCase().includes(term)) ||
      (cc.description && cc.description.toLowerCase().includes(term)) ||
      (cc.organization?.name && cc.organization.name.toLowerCase().includes(term))

    const matchesOrg = filterOrg === 'all' || cc.organization_id === filterOrg
    const matchesTipo = filterTipoLcto === 'all' || cc.tipo_lcto === filterTipoLcto

    let matchesCategory = true
    if (filterCategory === 'receitas') {
      matchesCategory = cc.code ? cc.code.startsWith('1') : false
    } else if (filterCategory === 'despesas') {
      matchesCategory = cc.code ? cc.code.startsWith('2') : false
    } else if (filterCategory === 'investimentos') {
      matchesCategory = cc.code ? cc.code.startsWith('3') : false
    }

    return matchesSearch && matchesOrg && matchesTipo && matchesCategory
  })

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current && current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData]
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (sortConfig.key === 'organization.name') {
          aVal = a.organization?.name
          bVal = b.organization?.name
        } else if (sortConfig.key === 'tipo_conta_tga.nome') {
          aVal = a.tipo_conta_tga?.nome
          bVal = b.tipo_conta_tga?.nome
        }

        if (aVal === null || aVal === undefined) aVal = ''
        if (bVal === null || bVal === undefined) bVal = ''

        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [filteredData, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage))
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const renderSortableHeader = (label: string, key: string, className?: string) => (
    <TableHead
      className={cn('cursor-pointer hover:bg-slate-100 transition-colors select-none', className)}
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig?.key === key ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-20" />
        )}
      </div>
    </TableHead>
  )

  const metrics = useMemo(() => {
    const relevant =
      filterOrg === 'all' ? costCenters : costCenters.filter((c) => c.organization_id === filterOrg)
    return {
      receitas: relevant.filter((c) => c.code?.startsWith('1')).length,
      despesas: relevant.filter((c) => c.code?.startsWith('2')).length,
      investimentos: relevant.filter((c) => c.code?.startsWith('3')).length,
    }
  }, [costCenters, filterOrg])

  const handleCreate = async () => {
    if (!newCC.organization_id || !newCC.code || !newCC.description) {
      toast({
        title: 'Atenção',
        description: 'Preencha empresa, código e descrição.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    const payload = {
      organization_id: newCC.organization_id,
      code: newCC.code,
      description: newCC.description,
      tipo_lcto: newCC.tipo_lcto !== 'none' ? newCC.tipo_lcto : null,
      operational: newCC.operational !== 'none' ? newCC.operational : null,
      tipo_tga_id: newCC.tipo_tga_id !== 'none' ? newCC.tipo_tga_id : null,
      type_tga: newCC.type_tga || null,
      fixed_variable: newCC.fixed_variable || null,
      contabiliza: newCC.contabiliza !== 'none' ? newCC.contabiliza : null,
      observacoes: newCC.observacoes || null,
    }
    const pendingPayload = {
      entity_type: 'Centros de Custo',
      entity_id: crypto.randomUUID(),
      proposed_changes: payload,
      status: 'pending',
      requested_by: user?.id,
    }

    const { error } = await supabase.from('pending_changes').insert(pendingPayload)
    setSubmitting(false)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      window.dispatchEvent(new Event('refresh-approvals-badge'))
      toast({
        title: 'Enviado para Aprovação',
        description: 'A criação foi solicitada à central de aprovações.',
      })
      setIsCreateOpen(false)
      setNewCC({
        organization_id: '',
        code: '',
        description: '',
        tipo_lcto: 'none',
        operational: 'none',
        tipo_tga_id: 'none',
        type_tga: '',
        fixed_variable: '',
        contabiliza: 'none',
        observacoes: '',
      })
      fetchCostCenters()
    }
  }

  const handleEdit = (cc: CostCenter) => {
    setEditCC({
      id: cc.id,
      organization_id: cc.organization_id || '',
      code: cc.code || '',
      description: cc.description || '',
      tipo_lcto: cc.tipo_lcto || 'none',
      operational: cc.operational || 'none',
      tipo_tga_id: cc.tipo_tga_id || 'none',
      type_tga: cc.type_tga || '',
      fixed_variable: cc.fixed_variable || '',
      contabiliza: cc.contabiliza || 'none',
      observacoes: cc.observacoes || '',
    })
    setIsEditOpen(true)
  }

  const submitEdit = async () => {
    if (!editCC.code || !editCC.description) {
      toast({
        title: 'Atenção',
        description: 'Preencha código e descrição.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    const payload = {
      code: editCC.code,
      description: editCC.description,
      tipo_lcto: editCC.tipo_lcto !== 'none' ? editCC.tipo_lcto : null,
      operational: editCC.operational !== 'none' ? editCC.operational : null,
      tipo_tga_id: editCC.tipo_tga_id !== 'none' ? editCC.tipo_tga_id : null,
      type_tga: editCC.type_tga || null,
      fixed_variable: editCC.fixed_variable || null,
      contabiliza: editCC.contabiliza !== 'none' ? editCC.contabiliza : null,
      observacoes: editCC.observacoes || null,
    }

    const pendingPayload = {
      entity_type: 'Centros de Custo',
      entity_id: editCC.id,
      proposed_changes: payload,
      status: 'pending',
      requested_by: user?.id,
    }

    const { error } = await supabase.from('pending_changes').insert(pendingPayload)
    setSubmitting(false)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      window.dispatchEvent(new Event('refresh-approvals-badge'))
      toast({
        title: 'Enviado para Aprovação',
        description: 'A edição foi solicitada à central de aprovações.',
      })
      setIsEditOpen(false)
      fetchCostCenters()
    }
  }

  const handleBulkEdit = async (changes: any) => {
    setSubmitting(true)
    const pendingChanges = selectedIds.map((id) => ({
      entity_type: 'Centros de Custo',
      entity_id: id,
      proposed_changes: changes,
      status: 'pending',
      requested_by: user?.id,
    }))

    const { error } = await supabase.from('pending_changes').insert(pendingChanges)
    setSubmitting(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      window.dispatchEvent(new Event('refresh-approvals-badge'))
      toast({
        title: 'Enviado para Aprovação',
        description: `${selectedIds.length} edições solicitadas à central.`,
      })
      setIsBulkEditOpen(false)
      setSelectedIds([])
      fetchCostCenters()
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} centro(s) de custo?`)) return

    const checkPromises = selectedIds.map(async (id) => {
      const { data: linkedMovements } = await supabase
        .from('financial_movements')
        .select('id')
        .eq('cost_center_id', id)
        .limit(1)
      const { data: linkedMappings } = await supabase
        .from('account_mapping')
        .select('id')
        .eq('cost_center_id', id)
        .limit(1)
      const { data: linkedChildren } = await supabase
        .from('cost_centers')
        .select('id')
        .eq('parent_id', id)
        .is('deleted_at', null)
        .limit(1)

      const hasRelations =
        (linkedMovements && linkedMovements.length > 0) ||
        (linkedMappings && linkedMappings.length > 0) ||
        (linkedChildren && linkedChildren.length > 0)
      return { id, hasRelations }
    })

    const results = await Promise.all(checkPromises)
    const toDelete = results.filter((r) => !r.hasRelations).map((r) => r.id)
    const blocked = results.filter((r) => r.hasRelations).map((r) => r.id)

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('cost_centers')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .in('id', toDelete)

      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else {
        for (const id of toDelete) {
          await logAction('COST_CENTERS', id, 'SOLICITACAO_EXCLUSAO_EM_LOTE', {
            pending_deletion: { old: false, new: true },
          })
        }
        window.dispatchEvent(new Event('refresh-approvals-badge'))
        toast({
          title: 'Sucesso',
          description: `${toDelete.length} centro(s) de custo enviado(s) para aprovação.`,
        })
      }
    }

    if (blocked.length > 0) {
      toast({
        title: 'Ação Parcialmente Bloqueada',
        description: `${blocked.length} centro(s) de custo possuem vínculos e não puderam ser excluídos.`,
        variant: 'destructive',
      })
    }

    setSelectedIds([])
    fetchCostCenters()
  }

  const handleDelete = async (id: string) => {
    const { data: linkedMovements } = await supabase
      .from('financial_movements')
      .select('id')
      .eq('cost_center_id', id)
      .limit(1)
    const { data: linkedMappings } = await supabase
      .from('account_mapping')
      .select('id')
      .eq('cost_center_id', id)
      .limit(1)
    const { data: linkedChildren } = await supabase
      .from('cost_centers')
      .select('id')
      .eq('parent_id', id)
      .is('deleted_at', null)
      .limit(1)

    if (
      (linkedMovements && linkedMovements.length > 0) ||
      (linkedMappings && linkedMappings.length > 0) ||
      (linkedChildren && linkedChildren.length > 0)
    ) {
      toast({
        title: 'Ação Bloqueada',
        description: 'Este centro de custo possui vínculos e não pode ser excluído.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('Deseja solicitar a exclusão deste centro de custo?')) return

    const { error } = await supabase
      .from('cost_centers')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .eq('id', id)

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      await logAction('COST_CENTERS', id, 'SOLICITACAO_EXCLUSAO', {
        pending_deletion: { old: false, new: true },
      })
      window.dispatchEvent(new Event('refresh-approvals-badge'))
      toast({ title: 'Enviado para Aprovação', description: 'A exclusão foi solicitada.' })
      fetchCostCenters()
    }
  }

  const handleExport = async (format: 'excel' | 'pdf' | 'csv' | 'txt') => {
    try {
      const payload = filteredData.map((cc) => ({
        Empresa: cc.organization?.name || '',
        Código: cc.code || '',
        Descrição: cc.description || '',
        'Tipo Lcto': cc.tipo_lcto || '',
        Operacional: cc.operational || '',
        'Tipo TGA': cc.tipo_conta_tga?.nome || '',
        Tipo: cc.type_tga || '',
        'Fixo/Variável': cc.fixed_variable || '',
        Classificação: cc.classification || '',
        Contabiliza: cc.contabiliza || '',
      }))

      const { data, error } = await supabase.functions.invoke('export-cost-centers', {
        body: { format, data: payload },
      })

      if (error) throw error

      if (format === 'excel') {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excel}`
        link.download = 'Centros_de_Custo.xlsx'
        link.click()
      } else if (format === 'pdf') {
        const link = document.createElement('a')
        link.href = data.pdf
        link.download = 'Centros_de_Custo.pdf'
        link.click()
      } else if (format === 'csv') {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'Centros_de_Custo.csv'
        link.click()
      } else if (format === 'txt') {
        const blob = new Blob([data.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'Centros_de_Custo.txt'
        link.click()
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Custo (TGA)</h1>
          <p className="text-muted-foreground">
            Gerencie a hierarquia de centros de custo das suas empresas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
                <FileText className="h-4 w-4 text-slate-600" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')} className="gap-2">
                <FileText className="h-4 w-4 text-slate-400" /> TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                <FileText className="h-4 w-4 text-red-600" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => setIsUndoOpen(true)} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Desfazer Importação
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
            Importar Planilha
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Centro de Custo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          className={cn(
            'relative overflow-hidden border-0 cursor-pointer group transition-all duration-300',
            'bg-gradient-to-br from-[#003d82] to-[#0099ff] text-white',
            'shadow-lg hover:shadow-xl hover:shadow-[#0099ff]/20',
            filterCategory === 'receitas' && 'ring-4 ring-[#0099ff] ring-offset-2',
          )}
          onClick={() => setFilterCategory((prev) => (prev === 'receitas' ? 'all' : 'receitas'))}
        >
          <CardContent className="p-4 h-full flex flex-col justify-between relative z-10">
            <div>
              <p className="text-white/80 font-medium text-sm">Receitas (1)</p>
              <p className="text-3xl font-bold mt-1">{metrics.receitas}</p>
            </div>
          </CardContent>
          <TrendingUp className="absolute -bottom-2 -right-2 w-20 h-20 text-white/20 group-hover:scale-110 group-hover:text-white/30 transition-all duration-300 z-0" />
        </Card>

        <Card
          className={cn(
            'relative overflow-hidden border-0 cursor-pointer group transition-all duration-300',
            'bg-gradient-to-br from-[#8b4513] to-[#ff8c00] text-white',
            'shadow-lg hover:shadow-xl hover:shadow-[#ff8c00]/20',
            filterCategory === 'despesas' && 'ring-4 ring-[#ff8c00] ring-offset-2',
          )}
          onClick={() => setFilterCategory((prev) => (prev === 'despesas' ? 'all' : 'despesas'))}
        >
          <CardContent className="p-4 h-full flex flex-col justify-between relative z-10">
            <div>
              <p className="text-white/80 font-medium text-sm">Despesas (2)</p>
              <p className="text-3xl font-bold mt-1">{metrics.despesas}</p>
            </div>
          </CardContent>
          <TrendingDown className="absolute -bottom-2 -right-2 w-20 h-20 text-white/20 group-hover:scale-110 group-hover:text-white/30 transition-all duration-300 z-0" />
        </Card>

        <Card
          className={cn(
            'relative overflow-hidden border-0 cursor-pointer group transition-all duration-300',
            'bg-gradient-to-br from-[#6c0572] to-[#ff006e] text-white',
            'shadow-lg hover:shadow-xl hover:shadow-[#ff006e]/20',
            filterCategory === 'investimentos' && 'ring-4 ring-[#ff006e] ring-offset-2',
          )}
          onClick={() =>
            setFilterCategory((prev) => (prev === 'investimentos' ? 'all' : 'investimentos'))
          }
        >
          <CardContent className="p-4 h-full flex flex-col justify-between relative z-10">
            <div>
              <p className="text-white/80 font-medium text-sm">Investimentos (3)</p>
              <p className="text-3xl font-bold mt-1">{metrics.investimentos}</p>
            </div>
          </CardContent>
          <Wallet className="absolute -bottom-2 -right-2 w-20 h-20 text-white/20 group-hover:scale-110 group-hover:text-white/30 transition-all duration-300 z-0" />
        </Card>
      </div>

      <ImportCostCentersModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={fetchCostCenters}
      />
      <UndoImportCostCentersModal
        isOpen={isUndoOpen}
        onClose={() => setIsUndoOpen(false)}
        onSuccess={fetchCostCenters}
        organizations={orgs}
      />

      <CostCenterBulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEdit}
        count={selectedIds.length}
        tgaOptions={allTgaOptions}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Centro de Custo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Empresa</Label>
              <Select value={editCC.organization_id} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={editCC.code}
                onChange={(e) => setEditCC({ ...editCC, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={editCC.description}
                onChange={(e) => setEditCC({ ...editCC, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo Lcto</Label>
              <Select
                value={editCC.tipo_lcto}
                onValueChange={(v) => setEditCC({ ...editCC, tipo_lcto: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operacional</Label>
              <Select
                value={editCC.operational}
                onValueChange={(v) => setEditCC({ ...editCC, operational: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="T">T</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo TGA</Label>
              <Select
                value={editCC.tipo_tga_id}
                onValueChange={(v) => setEditCC({ ...editCC, tipo_tga_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Busque de Tipos de Conta TGA..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {allTgaOptions.map((tga) => (
                    <SelectItem key={tga.id} value={tga.id}>
                      {tga.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input
                value={editCC.type_tga}
                onChange={(e) => setEditCC({ ...editCC, type_tga: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fixo/Variável</Label>
              <Input
                value={editCC.fixed_variable}
                onChange={(e) => setEditCC({ ...editCC, fixed_variable: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contabiliza</Label>
              <Select
                value={editCC.contabiliza}
                onValueChange={(v) => setEditCC({ ...editCC, contabiliza: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NAO">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={editCC.observacoes}
                onChange={(e) => setEditCC({ ...editCC, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEdit} disabled={submitting}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Centro de Custo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Empresa</Label>
              <Select
                value={newCC.organization_id}
                onValueChange={(v) => setNewCC({ ...newCC, organization_id: v })}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={newCC.code}
                onChange={(e) => setNewCC({ ...newCC, code: e.target.value })}
                placeholder="Ex: 1.01.001"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newCC.description}
                onChange={(e) => setNewCC({ ...newCC, description: e.target.value })}
                placeholder="Ex: Diretoria"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo Lcto</Label>
              <Select
                value={newCC.tipo_lcto}
                onValueChange={(v) => setNewCC({ ...newCC, tipo_lcto: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operacional</Label>
              <Select
                value={newCC.operational}
                onValueChange={(v) => setNewCC({ ...newCC, operational: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="T">T</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo TGA</Label>
              <Select
                value={newCC.tipo_tga_id}
                onValueChange={(v) => setNewCC({ ...newCC, tipo_tga_id: v })}
                disabled={!newCC.organization_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Busque de Tipos de Conta TGA..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {tgaOptions.map((tga) => (
                    <SelectItem key={tga.id} value={tga.id}>
                      {tga.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input
                value={newCC.type_tga}
                onChange={(e) => setNewCC({ ...newCC, type_tga: e.target.value })}
                placeholder="Ex: T"
              />
            </div>
            <div className="space-y-2">
              <Label>Fixo/Variável</Label>
              <Input
                value={newCC.fixed_variable}
                onChange={(e) => setNewCC({ ...newCC, fixed_variable: e.target.value })}
                placeholder="Ex: Fixo"
              />
            </div>
            <div className="space-y-2">
              <Label>Contabiliza</Label>
              <Select
                value={newCC.contabiliza}
                onValueChange={(v) => setNewCC({ ...newCC, contabiliza: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NAO">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={newCC.observacoes}
                onChange={(e) => setNewCC({ ...newCC, observacoes: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} item(ns) selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkEditOpen(true)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" /> Editar Selecionados
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="h-4 w-4" /> Excluir Selecionados
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Lista de Centros de Custo</CardTitle>
              <CardDescription>Visualize e filtre sua estrutura hierárquica.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="w-[180px] bg-white">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Empresas</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTipoLcto} onValueChange={setFilterTipoLcto}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="S">Sintético (S)</SelectItem>
                  <SelectItem value="A">Analítico (A)</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8 bg-white"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 whitespace-nowrap">
                <TableRow>
                  <TableHead className="w-12 text-center">
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
                  {renderSortableHeader('Código', 'code', 'w-[180px]')}
                  {renderSortableHeader('Descrição', 'description')}
                  {renderSortableHeader('Empresa', 'organization.name')}
                  {renderSortableHeader('Tipo Lcto', 'tipo_lcto')}
                  {renderSortableHeader('Operacional', 'operational')}
                  {renderSortableHeader('Tipo TGA', 'tipo_conta_tga.nome')}
                  {renderSortableHeader('Tipo', 'type_tga')}
                  {renderSortableHeader('Fixo/Variável', 'fixed_variable')}
                  {renderSortableHeader('Classificação', 'classification')}
                  {renderSortableHeader('Contabiliza', 'contabiliza')}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                      Carregando centros de custo...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((cc) => {
                    const isSynthetic = cc.tipo_lcto === 'S'
                    return (
                      <TableRow
                        key={cc.id}
                        className={cn(
                          'whitespace-nowrap',
                          isSynthetic && 'bg-slate-50/50 font-medium',
                        )}
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedIds.includes(cc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, cc.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== cc.id))
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            isSynthetic
                              ? 'font-semibold text-slate-800'
                              : 'font-medium text-slate-600',
                          )}
                        >
                          <div className="flex items-center">
                            {isSynthetic ? (
                              <Layers className="h-3 w-3 text-indigo-500 mr-2 flex-shrink-0" />
                            ) : (
                              <div className="w-3 mr-2" />
                            )}
                            {cc.code}
                          </div>
                        </TableCell>
                        <TableCell className={cn(isSynthetic && 'text-slate-800')}>
                          {cc.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px] text-xs">
                              {cc.organization?.name || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cc.tipo_lcto ? (
                            <Badge
                              variant={isSynthetic ? 'default' : 'outline'}
                              className={cn(isSynthetic && 'bg-indigo-500 hover:bg-indigo-600')}
                            >
                              {cc.tipo_lcto}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{cc.operational || '-'}</TableCell>
                        <TableCell>{cc.tipo_conta_tga?.nome || '-'}</TableCell>
                        <TableCell>
                          {cc.type_tga ? <Badge variant="outline">{cc.type_tga}</Badge> : '-'}
                        </TableCell>
                        <TableCell>
                          {cc.fixed_variable ? (
                            <Badge variant="secondary">{cc.fixed_variable}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {cc.classification ? (
                            <Badge variant="outline" className="bg-primary/5">
                              {cc.classification}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {cc.contabiliza ? (
                            <Badge variant={cc.contabiliza === 'SIM' ? 'default' : 'secondary'}>
                              {cc.contabiliza}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cc)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 mr-1"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cc.id)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                      Nenhum centro de custo encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4 mt-2 bg-white rounded-b-lg">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length}
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
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
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
