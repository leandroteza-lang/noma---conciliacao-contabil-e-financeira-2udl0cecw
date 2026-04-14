import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
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
  [key: string]: any
}

interface AccountComboboxProps {
  accounts: Account[]
  value?: string | null
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
}

export function AccountCombobox({
  accounts,
  value,
  onChange,
  onClear,
  placeholder = 'Selecionar conta...',
}: AccountComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => accounts.find((a) => a.id === value), [accounts, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal h-9 bg-white px-3 border-slate-200 shadow-sm hover:bg-slate-50',
            !selected && 'text-slate-500',
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 truncate w-full">
              {selected.account_code && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-950 text-white font-bold hover:bg-indigo-900 border-0 shrink-0 px-1.5 py-0.5 rounded text-[11px]"
                >
                  {selected.account_code}
                </Badge>
              )}
              <span className="truncate text-[13px] flex items-center gap-1.5">
                {selected.classification && (
                  <span className="font-mono text-slate-500">{selected.classification}</span>
                )}
                <span className="font-medium text-slate-700">{selected.account_name}</span>
              </span>
            </div>
          ) : (
            <span className="truncate">{placeholder}</span>
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
      <PopoverContent className="w-[400px] lg:w-[500px] p-0" align="start">
        <Command
          filter={(val, search) => {
            if (val.includes(search.toLowerCase())) return 1
            return 0
          }}
        >
          <CommandInput
            placeholder="Buscar conta por código, classif. ou nome..."
            className="h-9 text-sm"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              Nenhuma conta encontrada.
            </CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => {
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
                        value === account.id ? 'opacity-100 text-blue-600' : 'opacity-0',
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
                        <span className="truncate text-[13px] flex items-center gap-1.5">
                          {account.classification && (
                            <span className="font-mono text-slate-500">
                              {account.classification}
                            </span>
                          )}
                          <span className="font-medium text-slate-700">{account.account_name}</span>
                        </span>
                        {account.hierarchyPath &&
                          account.hierarchyPath !== account.account_name && (
                            <span className="text-[10px] text-slate-400 truncate mt-0.5">
                              {account.hierarchyPath}
                            </span>
                          )}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
