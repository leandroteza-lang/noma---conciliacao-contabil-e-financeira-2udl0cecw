import { useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MultiSelect({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-8 text-xs font-normal bg-white"
        >
          {selected.length > 0 ? (
            <div className="flex gap-1 flex-wrap truncate items-center h-full py-1">
              {selected.length > 2 ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                  {selected.length} selecionados
                </Badge>
              ) : (
                selected.map((s) => {
                  const opt = options.find((o) => o.value === s)
                  return (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5 font-medium truncate max-w-[100px]"
                    >
                      {opt?.label || s}
                    </Badge>
                  )
                })
              )}
            </div>
          ) : (
            <span className="text-slate-500 truncate">{title}</span>
          )}
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty className="py-2 text-xs text-center text-slate-500">
              Nenhum encontrado.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        onChange(selected.filter((s) => s !== option.value))
                      } else {
                        onChange([...selected, option.value])
                      }
                    }}
                    className="text-xs cursor-pointer"
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className={cn('h-2 w-2')} />
                    </div>
                    <span>{option.label}</span>
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
