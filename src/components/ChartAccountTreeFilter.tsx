import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Props {
  orgId: string
  selectedClassifications: string[]
  onChange: (classifications: string[]) => void
}

interface SyntheticAccount {
  id: string
  classification: string
  account_name: string
  account_code: string
}

interface TreeNode extends SyntheticAccount {
  children: TreeNode[]
}

export function ChartAccountTreeFilter({ orgId, selectedClassifications, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<SyntheticAccount[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && accounts.length === 0) {
      fetchAccounts()
    }
  }, [open, accounts.length, orgId])

  useEffect(() => {
    setAccounts([])
  }, [orgId])

  const fetchAccounts = async () => {
    setLoading(true)
    let query = supabase
      .from('chart_of_accounts')
      .select('id, classification, account_name, account_code')
      .eq('account_level', 'Sintética')
      .neq('pending_deletion', true)
      .is('deleted_at', null)
      .order('classification', { ascending: true })

    if (orgId !== 'all') {
      query = query.eq('organization_id', orgId)
    }

    const { data } = await query
    if (data) {
      setAccounts(data as SyntheticAccount[])

      const level1 = new Set<string>()
      data.forEach((a) => {
        const level = (a.classification.match(/\./g) || []).length + 1
        if (level === 1) level1.add(a.classification)
      })
      setExpanded(level1)
    }
    setLoading(false)
  }

  const tree = useMemo(() => {
    const root: TreeNode[] = []
    const map = new Map<string, TreeNode>()

    accounts.forEach((acc) => {
      const node: TreeNode = { ...acc, children: [] }
      map.set(acc.classification, node)

      const parts = acc.classification.split('.')
      if (parts.length === 1) {
        root.push(node)
      } else {
        parts.pop()
        const parentClass = parts.join('.')
        const parent = map.get(parentClass)
        if (parent) {
          parent.children.push(node)
        } else {
          root.push(node)
        }
      }
    })

    return root
  }, [accounts])

  const toggleExpand = (classification: string) => {
    const next = new Set(expanded)
    if (next.has(classification)) {
      next.delete(classification)
    } else {
      next.add(classification)
    }
    setExpanded(next)
  }

  const toggleSelect = (classification: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedClassifications, classification])
    } else {
      onChange(selectedClassifications.filter((c) => c !== classification))
    }
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expanded.has(node.classification)
    const isSelected = selectedClassifications.includes(node.classification)
    const hasChildren = node.children.length > 0

    return (
      <div key={node.classification} className="flex flex-col">
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-md group transition-colors',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div
            className={cn(
              'w-4 h-4 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-700 transition-colors',
              !hasChildren && 'opacity-0',
            )}
            onClick={() => hasChildren && toggleExpand(node.classification)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>

          <Checkbox
            checked={isSelected}
            onCheckedChange={(c) => toggleSelect(node.classification, !!c)}
            className="w-4 h-4 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
          />

          <span
            className={cn(
              'text-sm cursor-pointer select-none truncate flex-1',
              depth === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-600',
              isSelected && 'text-indigo-700 font-bold',
            )}
            onClick={() => toggleSelect(node.classification, !isSelected)}
            title={`${node.classification} - ${node.account_name}`}
          >
            {node.classification} - {node.account_name}
          </span>
        </div>

        {isExpanded && hasChildren && (
          <div className="flex flex-col">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedClassifications.length > 0 ? 'default' : 'outline'}
          className={cn(
            'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 gap-2 h-10 px-3 shadow-sm w-full sm:w-auto',
            selectedClassifications.length > 0 &&
              'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">Hierarquia</span>
          {selectedClassifications.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 ml-1 text-[11px] font-bold text-white bg-indigo-600 rounded-full shadow-sm">
              {selectedClassifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[350px] sm:w-[400px] p-0 rounded-xl shadow-lg border-slate-200"
        align="start"
      >
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-xl">
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Filtrar por Hierarquia</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione as contas sintéticas para visualizar
            </p>
          </div>
          {selectedClassifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-8 px-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            >
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px] p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Carregando estrutura...</p>
            </div>
          ) : tree.length > 0 ? (
            <div className="flex flex-col gap-0.5 pb-2">
              {tree.map((node) => renderNode(node, 0))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm font-medium text-slate-500 bg-slate-50/50 rounded-lg m-2 border border-dashed border-slate-200">
              Nenhuma conta sintética encontrada.
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-slate-100 bg-white rounded-b-xl flex justify-end">
          <Button size="sm" onClick={() => setOpen(false)} className="px-6 font-medium shadow-sm">
            Pronto
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
