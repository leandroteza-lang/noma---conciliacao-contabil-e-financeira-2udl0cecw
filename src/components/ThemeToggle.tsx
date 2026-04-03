import { Moon, Sun, Palette, Check, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

export function ThemeToggle() {
  const { mode, setMode, colorTheme, setColorTheme } = useTheme()
  const { user } = useAuth()

  const handleModeChange = async (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode)
    if (user) {
      await supabase
        .from('cadastro_usuarios')
        .update({ theme_mode: newMode })
        .eq('user_id', user.id)
    }
  }

  const handleColorChange = async (newColor: 'default' | 'ocean' | 'emerald' | 'midnight') => {
    setColorTheme(newColor)
    if (user) {
      await supabase
        .from('cadastro_usuarios')
        .update({ color_theme: newColor })
        .eq('user_id', user.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full h-9 w-9 bg-background/50 backdrop-blur-sm border-border hover:bg-accent transition-all"
        >
          <Palette className="h-[1.2rem] w-[1.2rem] text-foreground" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Modo Visual
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleModeChange('light')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Claro</span>
            </div>
            {mode === 'light' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleModeChange('dark')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-400" />
              <span>Escuro</span>
            </div>
            {mode === 'dark' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleModeChange('system')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-slate-500" />
              <span>Sistema</span>
            </div>
            {mode === 'system' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tema de Cores
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleColorChange('default')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-slate-800 dark:bg-slate-200 shadow-sm border border-border" />
              <span>Padrão</span>
            </div>
            {colorTheme === 'default' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleColorChange('ocean')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-[#0284c7] shadow-sm border border-border" />
              <span>Ocean Blue</span>
            </div>
            {colorTheme === 'ocean' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleColorChange('emerald')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-[#10b981] shadow-sm border border-border" />
              <span>Emerald</span>
            </div>
            {colorTheme === 'emerald' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleColorChange('midnight')}
            className="justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-[#7c3aed] shadow-sm border border-border" />
              <span>Midnight</span>
            </div>
            {colorTheme === 'midnight' && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
