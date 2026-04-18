import { useState, useMemo, useEffect } from 'react'
import { Check, ChevronsUpDown, X, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase/client'

export interface Account {
  id: string
  account_code?: string | null
  classification?: string | null
  account_name?: string | null
  hierarchyPath?: string
  hierarchyArray?: any[]
  organization_id?: string | null
  [key: string]: any
}

interface AccountComboboxProps {
  accounts: Account[]
  value?: string | null
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
}

export function AccountCombobox({
  accounts,
  value,
  onChange,
  onClear,
  placeholder = 'Selecionar conta...',
  disabled = false,
}: AccountComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts)

  useEffect(() => {
    let isMounted = true

    if (accounts.length >= 1000) {
      const orgId = accounts[0]?.organization_id
      if (orgId) {
        const fetchAll = async () => {
          let all: Account[] = []
          let page = 0
          let hasMore = true
          while (hasMore) {
            const { data } = await supabase
              .from('chart_of_accounts')
              .select('*')
              .eq('organization_id', orgId)
              .is('deleted_at', null)
              .range(page * 1000, (page + 1) * 1000 - 1)

            if (data && data.length > 0) {
              all = [...all, ...data]
              page++
              if (data.length < 1000) hasMore = false
            } else {
              hasMore = false
            }
          }
          if (isMounted) {
            setLocalAccounts(all)
          }
        }
        fetchAll()
        return () => {
          isMounted = false
        }
      }
    }

    setLocalAccounts(accounts)
    return () => {
      isMounted = false
    }
  }, [accounts])

  useEffect(() => {
    const allIds = new Set<string>()
    localAccounts.forEach((a) => {
      allIds.add(a.id)
    })
    setExpanded(allIds)
  }, [localAccounts])

  const selected = useMemo(() => localAccounts.find((a) => a.id === value), [localAccounts, value])

  const { roots, childrenMap } = useMemo(() => {
    const cmap = new Map<string, Account[]>()
    const rts: Account[] = []

    const getSortKey = (a: Account) => (a.classification || a.account_code || '').trim()

    const sorted = [...localAccounts].sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)))

    sorted.forEach((node) => {
      let parentId: string | null = null
      let maxLen = -1

      const nClass = getSortKey(node)

      if (nClass) {
        sorted.forEach((p) => {
          if (p.id === node.id) return
          const pClass = getSortKey(p)

          if (!pClass) return

          if (nClass.startsWith(pClass) && nClass !== pClass) {
            const hasSeparator = nClass.includes('.') || nClass.includes('-')
            let isValidPrefix = false

            if (hasSeparator) {
              const nextChar = nClass[pClass.length]
              if (nextChar === '.' || nextChar === '-' || nextChar === undefined) {
                isValidPrefix = true
              }
            } else {
              isValidPrefix = true
            }

            if (isValidPrefix && pClass.length > maxLen) {
              maxLen = pClass.length
              parentId = p.id
            }
          }
        })
      }

      if (parentId) {
        if (!cmap.has(parentId)) cmap.set(parentId, [])
        cmap.get(parentId)!.push(node)
      } else {
        rts.push(node)
      }
    })

    cmap.forEach((children) => {
      children.sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)))
    })

    return { roots: rts, childrenMap: cmap }
  }, [localAccounts])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderTree = (nodes: Account[], level = 0) => {
    return nodes.flatMap((node) => {
      const children = childrenMap.get(node.id) || []
      const hasChildren = children.length > 0
      const isExpanded = expanded.has(node.id)
      const searchString =
        `${node.account_code || ''} ${node.classification || ''} ${node.account_name || ''}`.toLowerCase()

      const item = (
        <CommandItem
          key={node.id}
          value={searchString}
          onSelect={() => {
            onChange(node.id)
            setOpen(false)
          }}
          className={cn('flex items-center justify-between py-1.5 px-2 cursor-pointer w-full')}
        >
          <div
            className="flex items-center flex-1 min-w-0"
            style={{ paddingLeft: `${level * 16}px` }}
          >
            <div
              className={cn(
                'w-6 h-6 flex items-center justify-center shrink-0 mr-1 rounded hover:bg-slate-200 transition-colors',
                hasChildren ? 'cursor-pointer' : 'opacity-40 cursor-default',
              )}
              onPointerDown={(e) => {
                if (hasChildren) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onClick={(e) => {
                if (hasChildren) {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleExpand(node.id)
                }
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-[13px] flex items-center gap-1.5 min-w-0">
                {node.classification && (
                  <span className="font-mono text-slate-500 shrink-0">{node.classification}</span>
                )}
                <span
                  className={cn(
                    'truncate',
                    hasChildren ? 'font-bold text-slate-800' : 'font-medium text-slate-700',
                  )}
                >
                  {node.account_name}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {node.account_code && (
              <Badge
                variant="secondary"
                className="bg-indigo-950/10 text-indigo-950 font-bold hover:bg-indigo-950/20 border-0 px-1.5 py-0.5 rounded text-[10px]"
              >
                {node.account_code}
              </Badge>
            )}
            <Check
              className={cn(
                'h-4 w-4 shrink-0 transition-opacity',
                value === node.id ? 'opacity-100 text-indigo-600' : 'opacity-0',
              )}
            />
          </div>
        </CommandItem>
      )

      if (isExpanded && hasChildren) {
        return [item, ...renderTree(children, level + 1)]
      }
      return [item]
    })
  }

  const renderFlat = () => {
    const searchLower = search.toLowerCase()
    const matches = localAccounts.filter((account) => {
      const searchString =
        `${account.account_code || ''} ${account.classification || ''} ${account.account_name || ''}`.toLowerCase()
      return searchString.includes(searchLower)
    })

    return matches.slice(0, 100).map((account) => {
      const searchString =
        `${account.account_code || ''} ${account.classification || ''} ${account.account_name || ''}`.toLowerCase()
      return (
        <CommandItem
          key={account.id}
          value={searchString}
          onSelect={() => {
            onChange(account.id)
            setOpen(false)
          }}
          className="flex items-center gap-2 py-2 px-3 cursor-pointer"
        >
          <Check
            className={cn(
              'mr-1 h-4 w-4 shrink-0',
              value === account.id ? 'opacity-100 text-indigo-600' : 'opacity-0',
            )}
          />
          <div className="flex items-center gap-2 truncate flex-1">
            {account.account_code && (
              <Badge
                variant="secondary"
                className="bg-indigo-950 text-white font-bold hover:bg-indigo-900 border-0 shrink-0 px-1.5 py-0.5 rounded text-[11px]"
              >
                {account.account_code}
              </Badge>
            )}
            <div className="flex flex-col truncate">
              <span className="truncate text-[13px] flex items-center gap-1.5 min-w-0">
                {account.classification && (
                  <span className="font-mono text-slate-500 shrink-0">
                    {account.classification}
                  </span>
                )}
                <span className="font-medium text-slate-700 truncate">{account.account_name}</span>
              </span>
              {account.hierarchyPath && account.hierarchyPath !== account.account_name && (
                <span className="text-[10px] text-slate-400 truncate mt-0.5">
                  {account.hierarchyPath}
                </span>
              )}
            </div>
          </div>
        </CommandItem>
      )
    })
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-9 bg-white px-3 border-slate-200 shadow-sm hover:bg-slate-50',
            !selected && 'text-slate-500',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-50',
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 truncate w-full min-w-0">
              {selected.account_code && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-950 text-white font-bold hover:bg-indigo-900 border-0 shrink-0 px-1.5 py-0.5 rounded text-[11px]"
                >
                  {selected.account_code}
                </Badge>
              )}
              <span className="truncate text-[13px] flex items-center gap-1.5 min-w-0">
                {selected.classification && (
                  <span className="font-mono text-slate-500 shrink-0">
                    {selected.classification}
                  </span>
                )}
                <span className="font-medium text-slate-700 truncate">{selected.account_name}</span>
              </span>
            </div>
          ) : (
            <span className="truncate min-w-0">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 shrink-0 opacity-50 ml-2">
            {selected && onClear && (
              <div
                role="button"
                tabIndex={0}
                className="h-5 w-5 hover:opacity-100 flex items-center justify-center rounded-sm hover:bg-slate-200 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onClear()
                }}
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar conta..."
            className="h-9 text-sm"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[400px]">
            {!search && (
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                <span className="text-[11px] font-semibold text-slate-500">Árvore Contábil</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = new Set<string>()
                      localAccounts.forEach((a) => {
                        if (childrenMap.has(a.id)) allIds.add(a.id)
                      })
                      setExpanded(allIds)
                    }}
                    className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Expandir Todos
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    type="button"
                    onClick={() => setExpanded(new Set())}
                    className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Recolher Todos
                  </button>
                </div>
              </div>
            )}
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              Nenhuma conta encontrada.
            </CommandEmpty>
            <CommandGroup>{search ? renderFlat() : renderTree(roots, 0)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
