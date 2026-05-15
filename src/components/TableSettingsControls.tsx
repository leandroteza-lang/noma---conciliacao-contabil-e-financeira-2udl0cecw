import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Settings2 } from 'lucide-react'
import { TablePrefs } from '@/hooks/use-table-preferences'

import { cn } from '@/lib/utils'

interface Props {
  prefs: TablePrefs
  updatePrefs: (p: Partial<TablePrefs>) => void
  className?: string
}

export function TableSettingsControls({ prefs, updatePrefs, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-slate-600 hover:text-slate-900 bg-transparent', className)}
          title="Configurações da Tabela"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4 border border-slate-200 shadow-md">
        <div className="space-y-2">
          <h4 className="font-medium leading-none text-slate-900">Visualização da Tabela</h4>
          <p className="text-sm text-slate-500">
            Personalize as linhas de grade para facilitar a leitura.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="gridlines" className="text-sm font-medium">
            Linhas de Grade
          </Label>
          <Switch
            id="gridlines"
            checked={prefs.showGridlines}
            onCheckedChange={(checked) => updatePrefs({ showGridlines: checked })}
          />
        </div>
        {prefs.showGridlines && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Espessura das Linhas</Label>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {prefs.gridlineWidth}px
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[prefs.gridlineWidth]}
                onValueChange={(vals) => updatePrefs({ gridlineWidth: vals[0] })}
              />
            </div>
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium block">Cor das Linhas</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={prefs.gridlineColor}
                  onChange={(e) => updatePrefs({ gridlineColor: e.target.value })}
                  className="h-8 w-14 cursor-pointer rounded border border-slate-200 p-0 shadow-sm"
                />
                <span className="text-xs font-medium text-slate-600 uppercase border border-slate-100 px-2 py-1 rounded bg-slate-50">
                  {prefs.gridlineColor}
                </span>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
