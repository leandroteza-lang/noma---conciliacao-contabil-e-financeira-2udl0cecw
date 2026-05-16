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
  isActive,
}: {
  title: string
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (v: string[]) => void
  isActive?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between min-h-8 h-auto py-1 text-xs font-normal whitespace-normal',
            isActive
              ? 'bg-indigo-100 border-indigo-200 text-indigo-900 hover:bg-indigo-200 hover:text-indigo-900 dark:bg-indigo-900/50 dark:border-indigo-800 dark:text-indigo-100'
              : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:border-slate-800',
          )}
        >
          <div className="flex-1 overflow-hidden flex items-center text-left">
            {selected.length > 0 ? (
              <div className="flex gap-1 flex-wrap items-center py-0.5 w-full">
                {selected.length > 2 ? (
                  <span
                    className={cn(
                      'truncate block w-full text-[11px] leading-tight',
                      isActive
                        ? 'text-indigo-800 font-medium dark:text-indigo-200'
                        : 'text-slate-700 dark:text-slate-300',
                    )}
                    title={selected
                      .map((s) => options.find((o) => o.value === s)?.label || s)
                      .join(', ')}
                  >
                    {selected.map((s) => options.find((o) => o.value === s)?.label || s).join(', ')}
                  </span>
                ) : (
                  selected.map((s) => {
                    const opt = options.find((o) => o.value === s)
                    return (
                      <Badge
                        key={s}
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-auto min-h-[20px] font-medium max-w-full break-words whitespace-normal text-left leading-tight',
                          isActive
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                            : '',
                        )}
                        title={opt?.label || s}
                      >
                        {opt?.label || s}
                      </Badge>
                    )
                  })
                )}
              </div>
            ) : (
              <span
                className={cn(
                  'truncate block w-full',
                  isActive
                    ? 'text-indigo-800 font-medium dark:text-indigo-200'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                {title}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-2 flex-none" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 z-[110]" align="start">
        <Command>
          <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
          <div className="flex items-center gap-1 p-1 border-b border-slate-100 bg-slate-50">
            <Button
              variant="secondary"
              size="sm"
              className="h-6 flex-1 text-[10px]"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.stopPropagation()
                onChange(options.map((o) => o.value))
              }}
            >
              Todos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-6 flex-1 text-[10px]"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
            >
              Nenhum
            </Button>
          </div>
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
                    value={`${option.label} ${option.value}`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
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
