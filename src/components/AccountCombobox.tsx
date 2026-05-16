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

type Node = {
  key: string
  label: string
  value: string | null
  account: Account | null
  children: Record<string, Node>
  allValues: string[]
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

  const tree = useMemo(() => {
    const root: Node = {
      key: 'root',
      label: 'root',
      value: null,
      account: null,
      children: {},
      allValues: [],
    }

    const sorted = [...accounts].sort((a, b) => {
      const classA = a.classification || ''
      const classB = b.classification || ''

      const partsA = classA.split('.')
      const partsB = classB.split('.')

      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i]
        const partB = partsB[i]

        if (partA === undefined) return -1
        if (partB === undefined) return 1

        const numA = parseInt(partA, 10)
        const numB = parseInt(partB, 10)

        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB
        } else {
          const cmp = partA.localeCompare(partB)
          if (cmp !== 0) return cmp
        }
      }
      return 0
    })

    for (const acc of sorted) {
      const classification = acc.classification
      if (!classification) {
        root.children[acc.id] = {
          key: acc.id,
          label: acc.account_name || 'Conta sem nome',
          value: acc.id,
          account: acc,
          children: {},
          allValues: [acc.id],
        }
        continue
      }

      const parts = classification.split('.')
      let current = root
      let currentKey = ''
      for (let i = 0; i < parts.length; i++) {
        currentKey = currentKey ? `${currentKey}.${parts[i]}` : parts[i]
        if (!current.children[currentKey]) {
          const parentAcc = accounts.find((c) => c.classification === currentKey)
          const desc = parentAcc ? parentAcc.account_name : ''
          current.children[currentKey] = {
            key: currentKey,
            label: desc ? `${currentKey} - ${desc}` : currentKey,
            value: parentAcc ? parentAcc.id : null,
            account: parentAcc || null,
            children: {},
            allValues: [],
          }
        }
        current = current.children[currentKey]
        if (acc.id && !current.allValues.includes(acc.id)) {
          current.allValues.push(acc.id)
        }
      }
      current.value = acc.id
      current.account = acc
      current.label = acc.account_name ? `${classification} - ${acc.account_name}` : classification
    }

    return root
  }, [accounts])

  useEffect(() => {
    if (expanded.size === 0 && Object.keys(tree.children).length > 0) {
      const allIds = new Set<string>()
      const traverse = (nodes: Node[]) => {
        nodes.forEach((n) => {
          if (Object.keys(n.children).length > 0) {
            allIds.add(n.key)
            traverse(Object.values(n.children))
          }
        })
      }
      traverse(Object.values(tree.children))
      setExpanded(allIds)
    }
  }, [tree])

  const selected = useMemo(() => accounts.find((a) => a.id === value), [accounts, value])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderNode = (node: Node, depth: number) => {
    const hasSearch = search.trim().length > 0

    const hasMatchingChild = (n: Node): boolean => {
      const searchString =
        `${n.account?.account_code || ''} ${n.account?.classification || ''} ${n.label}`.toLowerCase()
      if (searchString.includes(search.toLowerCase())) return true
      return Object.values(n.children).some(hasMatchingChild)
    }

    if (hasSearch && !hasMatchingChild(node)) {
      return null
    }

    const childrenList = Object.values(node.children)
    const hasChildren = childrenList.length > 0
    const isExpanded = expanded.has(node.key) || hasSearch

    const isSynthetic =
      node.account?.account_level === 'Sintética' || (hasChildren && !node.account?.account_level)
    const isSelectable = node.value && !isSynthetic

    const item = (
      <CommandItem
        key={node.key}
        value={`${node.account?.account_code || ''} ${node.account?.classification || ''} ${node.label}`.toLowerCase()}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onSelect={() => {
          if (isSelectable) {
            onChange(node.value!)
            setOpen(false)
          } else if (hasChildren) {
            toggleExpand(node.key)
          }
        }}
        className={cn(
          'flex items-center justify-between py-1.5 px-2 w-full',
          isSelectable ? 'cursor-pointer' : 'opacity-80 cursor-default',
          !isSelectable && hasChildren && 'cursor-pointer',
        )}
      >
        <div
          className="flex items-center flex-1 min-w-0"
          style={{ paddingLeft: `${depth * 16}px` }}
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
                toggleExpand(node.key)
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
            <span className="text-[13px] flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  'truncate',
                  isSynthetic ? 'font-bold text-slate-800' : 'font-medium text-slate-700',
                )}
                title={node.label}
              >
                {node.label}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {node.account?.account_code && (
            <Badge
              variant="secondary"
              className="bg-indigo-950/10 text-indigo-950 font-bold hover:bg-indigo-950/20 border-0 px-1.5 py-0.5 rounded text-[10px]"
            >
              {node.account.account_code}
            </Badge>
          )}
          <Check
            className={cn(
              'h-4 w-4 shrink-0 transition-opacity',
              value === node.value ? 'opacity-100 text-indigo-600' : 'opacity-0',
            )}
          />
        </div>
      </CommandItem>
    )

    if (isExpanded && hasChildren) {
      return [item, ...childrenList.flatMap((c) => renderNode(c, depth + 1))]
    }
    return [item]
  }

  const renderFlat = () => {
    const searchLower = search.toLowerCase()
    const matches = accounts.filter((account) => {
      const isSynthetic = account.account_level === 'Sintética'
      if (isSynthetic) return false

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
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
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
              <span className="text-[13px] flex items-center gap-1.5 min-w-0">
                {account.classification && (
                  <span className="font-mono text-slate-500 shrink-0">
                    {account.classification}
                  </span>
                )}
                <span
                  className="font-medium text-slate-700 truncate"
                  title={account.account_name || 'Sem nome'}
                >
                  {account.account_name || <span className="italic opacity-50">Sem nome</span>}
                </span>
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
              <span className="text-[13px] flex items-center gap-1.5 min-w-0">
                {selected.classification && (
                  <span className="font-mono text-slate-500 shrink-0">
                    {selected.classification}
                  </span>
                )}
                <span
                  className="font-medium text-slate-700 truncate"
                  title={selected.account_name || 'Sem nome'}
                >
                  {selected.account_name || <span className="italic opacity-50">Sem nome</span>}
                </span>
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
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[400px] max-w-[90vw] p-0 z-[110]"
        align="start"
      >
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
                      const traverse = (nodes: Node[]) => {
                        nodes.forEach((n) => {
                          if (Object.keys(n.children).length > 0) {
                            allIds.add(n.key)
                            traverse(Object.values(n.children))
                          }
                        })
                      }
                      traverse(Object.values(tree.children))
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
            <CommandGroup>
              {search
                ? renderFlat()
                : Object.values(tree.children).flatMap((c) => renderNode(c, 0))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
