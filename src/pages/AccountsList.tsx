import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BankAccountFormModal } from '@/components/BankAccountFormModal'
import { BankAccountBulkEditModal } from '@/components/BankAccountBulkEditModal'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  Upload,
  Download,
  Building2,
  Filter,
  Trash2,
  Sparkles,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Pencil,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  ListTree,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ImportBankAccountsModal } from '@/components/ImportBankAccountsModal'
import { SmartMappingModal } from '@/components/SmartMappingModal'

export default function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const [companies, setCompanies] = useState<any[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)

  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isSmartMappingOpen, setIsSmartMappingOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'classification',
    direction: 'asc',
  })

  const [expandAll, setExpandAll] = useState(true)

  const defaultCols = [
    { id: 'company_name', label: 'Empresa' },
    { id: 'code', label: 'Código' },
    { id: 'account_code', label: 'Conta Contábil' },
    { id: 'description', label: 'Descrição' },
    { id: 'bank_code', label: 'Banco' },
    { id: 'agency', label: 'Agência' },
    { id: 'account_number', label: 'Conta' },
    { id: 'account_type', label: 'Tipo' },
    { id: 'classification', label: 'Classificação' },
  ]

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('bank_accounts_columns')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        /* intentionally ignored */
      }
    }
    return defaultCols
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_columns', JSON.stringify(columns))
  }, [columns])

  const [draggedCol, setDraggedCol] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCol(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedCol === null) return
    const newCols = [...columns]
    const [moved] = newCols.splice(draggedCol, 1)
    newCols.splice(index, 0, moved)
    setColumns(newCols)
    setDraggedCol(null)
  }

  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set())
  const toggleCollapse = (tree_classification: string) => {
    setCollapsedClasses((prev) => {
      const next = new Set(prev)
      if (next.has(tree_classification)) next.delete(tree_classification)
      else next.add(tree_classification)
      return next
    })
  }

  const [tableFontSize, setTableFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('bank_accounts_table_font_size')
    return saved ? parseInt(saved, 10) : 11
  })

  useEffect(() => {
    localStorage.setItem('bank_accounts_table_font_size', tableFontSize.toString())
  }, [tableFontSize])

  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')
      if (orgs) setCompanies(orgs)

      let allAccs: any[] = []
      let fetchHasMore = true
      let fetchPage = 0

      while (fetchHasMore) {
        const { data: accs } = await supabase
          .from('bank_accounts')
          .select('*, organizations(name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

        if (accs && accs.length > 0) {
          allAccs.push(...accs)
          fetchPage++
          if (accs.length < 1000) fetchHasMore = false
        } else {
          fetchHasMore = false
        }
      }

      setAccounts(allAccs)

      let allChartAccs: any[] = []
      let fetchCHasMore = true
      let fetchCPage = 0
      while (fetchCHasMore) {
        const { data: ca } = await supabase
          .from('chart_of_accounts')
          .select('*, organizations(name)')
          .is('deleted_at', null)
          .range(fetchCPage * 1000, (fetchCPage + 1) * 1000 - 1)

        if (ca && ca.length > 0) {
          allChartAccs.push(...ca)
          fetchCPage++
          if (ca.length < 1000) fetchCHasMore = false
        } else {
          fetchCHasMore = false
        }
      }
      setChartAccounts(allChartAccs)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAccount = async (data: any) => {
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(data)
          .eq('id', editingAccount.id)
        if (error) throw error
        toast({ title: 'Conta atualizada com sucesso' })
      } else {
        const { error } = await supabase.from('bank_accounts').insert([data])
        if (error) throw error
        toast({ title: 'Conta criada com sucesso' })
      }
      setIsFormOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar conta', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteAccount = async (acc: any) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', acc.id)
      if (error) throw error
      toast({ title: 'Conta excluída com sucesso' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir conta', description: error.message, variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja realmente excluir as ${selectedAccounts.length} contas selecionadas?`))
      return
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedAccounts)
      if (error) throw error
      toast({ title: `${selectedAccounts.length} contas excluídas com sucesso` })
      setSelectedAccounts([])
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir contas', description: error.message, variant: 'destructive' })
    }
  }

  const handleBulkEdit = async (data: any) => {
    try {
      const { error } = await supabase.from('bank_accounts').update(data).in('id', selectedAccounts)
      if (error) throw error
      toast({ title: `${selectedAccounts.length} contas atualizadas` })
      setIsBulkEditOpen(false)
      setSelectedAccounts([])
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro na edição em lote', description: error.message, variant: 'destructive' })
    }
  }

  const handleSmartMappingApply = async (payload: any[]) => {
    if (payload.length === 0) return
    try {
      toast({ title: 'Aplicando mapeamento inteligente...' })
      const promises = payload.map((p) =>
        supabase
          .from('bank_accounts')
          .update({ organization_id: p.organization_id })
          .eq('id', p.id),
      )
      await Promise.all(promises)
      toast({ title: 'Mapeamento aplicado com sucesso' })
      setIsSmartMappingOpen(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao aplicar mapeamento',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const combinedData = useMemo(() => {
    const usedChartAccs = new Map<string, any>()

    const addChartAcc = (ca: any) => {
      if (!ca || !ca.classification) return
      const key = `${ca.organization_id || 'null'}-${ca.classification}`
      if (usedChartAccs.has(key)) return
      usedChartAccs.set(key, ca)

      let parentClass = ca.classification
      if (parentClass.includes('.')) {
        const parts = parentClass.split('.')
        parts.pop()
        parentClass = parts.join('.')
      } else if (parentClass.includes('-')) {
        const parts = parentClass.split('-')
        parts.pop()
        parentClass = parts.join('-')
      } else {
        return
      }

      const parentCa = chartAccounts.find(
        (c) => c.classification === parentClass && c.organization_id === ca.organization_id,
      )
      if (parentCa) {
        addChartAcc(parentCa)
      }
    }

    const mappedBanks = accounts.map((acc) => {
      const ca = chartAccounts.find(
        (c) => c.account_code === acc.account_code && c.organization_id === acc.organization_id,
      )

      let treeClass = acc.classification || acc.id
      if (ca && ca.classification) {
        addChartAcc(ca)
        treeClass = `${ca.classification}.${acc.id}`
      }

      return {
        ...acc,
        is_bank_account: true,
        tree_classification: treeClass,
      }
    })

    const chartRows = Array.from(usedChartAccs.values()).map((ca) => ({
      id: `ca_${ca.id}`,
      is_chart_account: true,
      tree_classification: ca.classification,
      classification: ca.classification,
      company_name: ca.organizations?.name || '',
      organizations: ca.organizations,
      organization_id: ca.organization_id,
      account_code: ca.account_code,
      description: ca.account_name,
      code: '-',
      bank_code: '-',
      agency: '-',
      account_number: '-',
      account_type: '-',
      account_level: ca.account_level,
    }))

    return [...chartRows, ...mappedBanks]
  }, [accounts, chartAccounts])

  const filteredData = useMemo(() => {
    let result = combinedData

    if (search || companyFilter !== 'ALL' || typeFilter !== 'ALL') {
      const matchedIds = new Set<string>()
      const matchedTreeClasses = new Set<string>()

      result.forEach((acc) => {
        const matchesSearch =
          acc.description?.toLowerCase().includes(search.toLowerCase()) ||
          acc.account_number?.includes(search) ||
          acc.agency?.includes(search) ||
          acc.account_code?.includes(search)
        const matchesCompany = companyFilter === 'ALL' || acc.organization_id === companyFilter

        const isBank = acc.is_bank_account
        const matchesType = typeFilter === 'ALL' || (isBank && acc.account_type === typeFilter)

        if (matchesSearch && matchesCompany && (matchesType || !isBank)) {
          if (isBank) {
            matchedIds.add(acc.id)
            if (acc.tree_classification) {
              const parts = acc.tree_classification.split('.')
              let current = ''
              for (const part of parts) {
                current = current ? `${current}.${part}` : part
                matchedTreeClasses.add(current)
              }
            }
          } else {
            if (matchesSearch && matchesCompany) {
              matchedIds.add(acc.id)
              if (acc.tree_classification) {
                const parts = acc.tree_classification.split('.')
                let current = ''
                for (const part of parts) {
                  current = current ? `${current}.${part}` : part
                  matchedTreeClasses.add(current)
                }
              }
            }
          }
        }
      })

      result = result.filter(
        (acc) =>
          matchedIds.has(acc.id) ||
          (acc.tree_classification && matchedTreeClasses.has(acc.tree_classification)),
      )
    }

    return result
  }, [combinedData, search, companyFilter, typeFilter])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedAccounts = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig

    let valA = a[key]
    let valB = b[key]

    if (key === 'classification') {
      valA = a.tree_classification || ''
      valB = b.tree_classification || ''
    } else if (key === 'company_name') {
      valA = a.organizations?.name || a.company_name || ''
      valB = b.organizations?.name || b.company_name || ''
    }

    valA = valA || ''
    valB = valB || ''

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })

  const handleToggleExpandAll = () => {
    if (expandAll) {
      const allTreeClasses = new Set<string>()
      combinedData.forEach((acc) => {
        if (acc.is_chart_account && acc.tree_classification) {
          allTreeClasses.add(acc.tree_classification)
        }
      })
      setCollapsedClasses(allTreeClasses)
      setExpandAll(false)
    } else {
      setCollapsedClasses(new Set())
      setExpandAll(true)
    }
  }

  const visibleAccounts = sortedAccounts.filter((acc) => {
    if (!acc.tree_classification) return true
    for (const collapsed of collapsedClasses) {
      if (
        acc.tree_classification !== collapsed &&
        (acc.tree_classification.startsWith(collapsed + '.') ||
          acc.tree_classification.startsWith(collapsed + '-'))
      ) {
        return false
      }
    }
    return true
  })

  const paginatedAccounts = visibleAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const totalPages = Math.max(1, Math.ceil(visibleAccounts.length / itemsPerPage))

  const toggleSelect = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    const selectable = paginatedAccounts.filter((a) => !a.is_chart_account)
    if (selectedAccounts.length === selectable.length && selectable.length > 0) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(selectable.map((a) => a.id))
    }
  }

  const isSyntheticAccount = (acc: any) => {
    return acc.is_chart_account === true
  }

  const getRowClassName = (acc: any, isSynth: boolean, index: number) => {
    const code = acc.tree_classification || ''
    const level = (code.match(/\./g) || []).length + 1

    if (isSynth) {
      if (level === 1)
        return 'bg-indigo-950 font-bold text-white hover:bg-indigo-900 border-b border-indigo-900/50'
      if (level === 2)
        return 'bg-blue-800 font-semibold text-white hover:bg-blue-700 border-b border-blue-700/50'
      if (level === 3)
        return 'bg-blue-500 font-medium text-white hover:bg-blue-400 border-b border-blue-400/50'
      if (level === 4)
        return 'bg-blue-200 font-medium text-blue-950 hover:bg-blue-300 border-b border-blue-300/50'
      return 'bg-blue-100 font-medium text-blue-900 hover:bg-blue-200 border-b border-blue-200/50'
    }

    return index % 2 === 0
      ? 'bg-white font-normal text-slate-700 hover:bg-slate-50 border-b border-slate-100'
      : 'bg-blue-50 font-normal text-slate-800 hover:bg-blue-100 border-b border-blue-100'
  }

  const handleExport = async (formatType: 'pdf' | 'excel' | 'browser' | 'csv' | 'txt') => {
    try {
      toast({ title: 'Aguarde', description: 'Gerando exportação...' })

      let win: Window | null = null
      if (formatType === 'browser') {
        win = window.open('', '_blank')
        if (win) {
          win.document.write('Gerando relatório, aguarde...')
        }
      }

      const exportData = sortedAccounts
        .filter((a) => !a.is_chart_account)
        .map((acc) => ({
          Empresa: acc.organizations?.name || acc.company_name || '',
          'Conta Contábil': acc.account_code || '',
          Descrição: acc.description || '',
          Banco: acc.bank_code || '',
          Agência: acc.agency || '',
          Número: `${acc.account_number || ''}${acc.check_digit ? '-' + acc.check_digit : ''}`,
          Tipo: acc.account_type || '',
          Classificação: acc.classification || '',
        }))

      const { data, error } = await supabase.functions.invoke('export-bank-accounts', {
        body: { format: formatType === 'browser' ? 'pdf' : formatType, data: exportData },
      })

      if (error) {
        if (win) win.close()
        throw error
      }

      if (formatType === 'excel' && data?.excel) {
        const byteCharacters = atob(data.excel)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas_bancarias.xlsx'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (formatType === 'csv' && data?.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas_bancarias.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (formatType === 'txt' && data?.txt) {
        const blob = new Blob([data.txt], { type: 'text/plain;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contas_bancarias.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (formatType === 'pdf' && data?.pdf) {
        const a = document.createElement('a')
        a.href = data.pdf
        a.download = 'contas_bancarias.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else if (formatType === 'browser' && data?.pdf) {
        if (win) {
          win.document.open()
          win.document.write(
            `<iframe src="${data.pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:absolute;" allowfullscreen></iframe>`,
          )
          win.document.close()
        }
      } else {
        if (win) win.close()
      }

      toast({ title: 'Sucesso', description: 'Exportação concluída' })
    } catch (error: any) {
      toast({ title: 'Erro ao exportar', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Listagem de Contas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as contas bancárias da sua organização.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm"
            title="Tamanho da Fonte das Tabelas"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-transparent"
              onClick={() => setTableFontSize((p) => Math.max(8, p - 1))}
            >
              A-
            </Button>
            <span className="text-[12px] font-medium text-slate-500 w-5 text-center select-none">
              {tableFontSize}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[14px] font-bold text-slate-600 hover:text-slate-900 bg-transparent"
              onClick={() => setTableFontSize((p) => Math.min(24, p + 1))}
            >
              A+
            </Button>
          </div>
          {selectedAccounts.length > 0 && (
            <>
              <Button variant="secondary" onClick={() => setIsBulkEditOpen(true)}>
                Editar Selecionados ({selectedAccounts.length})
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Selecionados ({selectedAccounts.length})
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExport('txt')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> TXT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('csv')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('excel')}
                className="cursor-pointer gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('browser')}
                className="cursor-pointer gap-2"
              >
                <FileText className="w-4 h-4" /> Abrir no Browser
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleToggleExpandAll}>
            <ListTree className="w-4 h-4 mr-2" />
            {expandAll ? 'Recolher Todos' : 'Expandir Todos'}
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar em Lote
          </Button>
          <Button variant="outline" onClick={() => setIsSmartMappingOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2 text-primary" /> Mapeamento Inteligente
          </Button>
          <Button
            onClick={() => {
              setEditingAccount(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="font-semibold text-lg">Filtros</h2>
          <p className="text-sm text-muted-foreground">Busque por Descrição ou Filtre as contas.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-[220px] bg-background">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todas Empresas" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas Empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[220px] bg-background">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todos Tipos" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos Tipos</SelectItem>
                <SelectItem value="CAIXA">CAIXA</SelectItem>
                <SelectItem value="CORRENTE">CORRENTE</SelectItem>
                <SelectItem value="POUPANÇA">POUPANÇA</SelectItem>
                <SelectItem value="APLICAÇÕES">APLICAÇÕES</SelectItem>
                <SelectItem value="OUTROS">OUTROS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bank-accounts-table-wrapper border-2 border-indigo-950 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table
            style={{ fontSize: `${tableFontSize}px` }}
            className="[&_td]:p-1.5 [&_td]:px-2 [&_th]:p-1.5 [&_th]:px-2"
          >
            <TableHeader className="bg-[#1e1b4b] border-b-0">
              <TableRow disableZebra className="hover:bg-[#1e1b4b]">
                <TableHead className="w-10 text-center border-none">
                  <Checkbox
                    checked={
                      paginatedAccounts.filter((a) => !a.is_chart_account).length > 0 &&
                      selectedAccounts.length ===
                        paginatedAccounts.filter((a) => !a.is_chart_account).length
                    }
                    onCheckedChange={toggleSelectAll}
                    className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#1e1b4b]"
                  />
                </TableHead>
                {columns.map((col, index) => (
                  <TableHead
                    key={col.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className="cursor-grab active:cursor-grabbing font-semibold text-white whitespace-nowrap border-none"
                  >
                    <div className="flex items-center gap-1.5" onClick={() => handleSort(col.id)}>
                      <GripVertical className="h-3.5 w-3.5 opacity-50 shrink-0 cursor-grab hover:opacity-100" />
                      <span className="cursor-pointer hover:underline decoration-white/50 underline-offset-4">
                        {col.label}
                      </span>
                      <ArrowUpDown className="h-3 w-3 opacity-50 shrink-0 cursor-pointer" />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[80px] text-right font-semibold text-white whitespace-nowrap border-none">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow disableZebra>
                  <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                    Carregando contas...
                  </TableCell>
                </TableRow>
              ) : paginatedAccounts.length > 0 ? (
                paginatedAccounts.map((acc, rowIndex) => {
                  const isSynth = isSyntheticAccount(acc)
                  const code = acc.tree_classification || ''
                  const level = (code.match(/\./g) || []).length + 1

                  return (
                    <TableRow
                      key={acc.id}
                      className={getRowClassName(acc, isSynth, rowIndex)}
                      disableZebra
                      style={{ fontSize: `${tableFontSize}px` }}
                    >
                      <TableCell className="text-center">
                        {!isSynth && (
                          <Checkbox
                            checked={selectedAccounts.includes(acc.id)}
                            onCheckedChange={() => toggleSelect(acc.id)}
                            className="border-slate-300 data-[state=checked]:!bg-blue-600 data-[state=checked]:!border-blue-600"
                          />
                        )}
                      </TableCell>

                      {columns.map((col) => {
                        if (col.id === 'company_name') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 opacity-60 shrink-0" />
                                <span className="truncate max-w-[150px]">
                                  {acc.organizations?.name || acc.company_name || '-'}
                                </span>
                              </div>
                            </TableCell>
                          )
                        }
                        if (col.id === 'code') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap font-medium">
                              {acc.code || '-'}
                            </TableCell>
                          )
                        }
                        if (col.id === 'account_code') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap font-medium">
                              {acc.account_code || '-'}
                            </TableCell>
                          )
                        }
                        if (col.id === 'description') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap">
                              <div
                                className="flex items-center"
                                style={{ paddingLeft: `${(level - 1) * 1.5}rem` }}
                              >
                                {isSynth ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleCollapse(acc.tree_classification || '')
                                    }}
                                    className={cn(
                                      'h-5 w-5 mr-1 p-0 rounded-sm shrink-0 transition-colors',
                                      level <= 3
                                        ? 'hover:bg-white/20 text-white hover:text-white'
                                        : 'hover:bg-black/10 text-slate-800',
                                    )}
                                  >
                                    {collapsedClasses.has(acc.tree_classification || '') ? (
                                      <ChevronRight className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <span className="w-6 shrink-0" />
                                )}
                                <span
                                  className={cn(
                                    isSynth ? 'font-bold uppercase tracking-tight' : 'font-medium',
                                  )}
                                >
                                  {acc.description}
                                </span>
                              </div>
                            </TableCell>
                          )
                        }
                        if (col.id === 'bank_code') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap">
                              {acc.bank_code || '-'}
                            </TableCell>
                          )
                        }
                        if (col.id === 'agency') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap">
                              {acc.agency || '-'}
                            </TableCell>
                          )
                        }
                        if (col.id === 'account_number') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap">
                              {acc.account_number
                                ? `${acc.account_number}${acc.check_digit ? '-' + acc.check_digit : ''}`
                                : '-'}
                            </TableCell>
                          )
                        }
                        if (col.id === 'account_type') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap">
                              {acc.account_type || '-'}
                            </TableCell>
                          )
                        }
                        if (col.id === 'classification') {
                          return (
                            <TableCell key={col.id} className="whitespace-nowrap font-bold">
                              {acc.classification || '-'}
                            </TableCell>
                          )
                        }
                        return <TableCell key={col.id}>-</TableCell>
                      })}

                      <TableCell className="text-right whitespace-nowrap">
                        {!isSynth && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingAccount(acc)
                                setIsFormOpen(true)
                              }}
                              className="h-7 w-7 opacity-70 hover:opacity-100 transition-colors hover:bg-black/5 hover:!text-blue-600 !text-slate-500"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAccount(acc)}
                              className="h-7 w-7 opacity-70 hover:opacity-100 transition-colors hover:bg-black/5 hover:!text-red-600 !text-slate-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow disableZebra>
                  <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                    Nenhuma conta encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && visibleAccounts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 gap-4 bg-slate-50">
            <p className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
              {Math.min(currentPage * itemsPerPage, visibleAccounts.length)} de{' '}
              {visibleAccounts.length}
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
                  <SelectTrigger className="h-8 w-[70px] bg-white">
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
                  className="bg-white"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white"
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
                  className="bg-white"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BankAccountFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAccount}
        initialData={editingAccount}
      />

      <BankAccountBulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        onSave={handleBulkEdit}
        count={selectedAccounts.length}
      />

      <ImportBankAccountsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false)
          fetchData()
        }}
      />

      <SmartMappingModal
        isOpen={isSmartMappingOpen}
        onClose={() => setIsSmartMappingOpen(false)}
        onApply={handleSmartMappingApply}
        accounts={accounts}
        companies={companies}
      />
    </div>
  )
}
