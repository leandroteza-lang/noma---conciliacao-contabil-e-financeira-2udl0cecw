import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  account_code: string | null
  classification: string | null
  account_name: string | null
  hierarchyPath?: string
  hierarchyArray?: Account[]
}

interface AccountComboboxProps {
  accounts: Account[]
  value?: string
  onChange: (accountId: string) => void
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
  disabled,
}: AccountComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = accounts.find((a) => a.id === value)

  const filtered = search
    ? accounts
        .filter((a) => {
          const q = search.toLowerCase()
          return (
            a.account_code?.toLowerCase().includes(q) ||
            a.classification?.toLowerCase().includes(q) ||
            a.account_name?.toLowerCase().includes(q) ||
            a.hierarchyPath?.toLowerCase().includes(q)
          )
        })
        .slice(0, 50)
    : accounts.slice(0, 50)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal text-left overflow-hidden relative group',
            selected ? 'h-auto min-h-8 py-1' : 'h-8 py-1',
          )}
        >
          {selected ? (
            <div className="flex flex-col overflow-hidden text-left w-full pr-6">
              <span className="flex items-center gap-2 truncate">
                {selected.account_code && (
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                    {selected.account_code}
                  </span>
                )}
                {selected.classification && (
                  <span className="font-mono text-[10px] text-slate-500">
                    {selected.classification}
                  </span>
                )}
                <span className="text-xs truncate font-medium">{selected.account_name}</span>
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 truncate">{placeholder}</span>
          )}

          <div className="absolute right-2 flex items-center bg-white pl-1">
            {selected && onClear && (
              <span
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-md cursor-pointer transition-opacity mr-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
              >
                <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por código, classificação ou nome..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
            <CommandGroup>
              {filtered.map((account) => (
                <CommandItem
                  key={account.id}
                  value={account.id}
                  onSelect={() => {
                    onChange(account.id)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === account.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="font-mono text-[10px] text-slate-500 flex gap-1">
                      {account.account_code && (
                        <span className="bg-slate-100 px-1 rounded">{account.account_code}</span>
                      )}
                      {account.classification && <span>{account.classification}</span>}
                    </span>
                    <span className="text-xs truncate font-medium mt-0.5">
                      {account.account_name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
