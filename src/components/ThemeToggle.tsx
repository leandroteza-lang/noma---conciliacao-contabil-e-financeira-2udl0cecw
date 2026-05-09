import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const themeContext = useTheme() as any

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-700 dark:text-slate-200">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Modo de Exibição</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            if (themeContext.setMode) themeContext.setMode('light')
            else if (themeContext.setTheme) themeContext.setTheme('light')
          }}
        >
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (themeContext.setMode) themeContext.setMode('dark')
            else if (themeContext.setTheme) themeContext.setTheme('dark')
          }}
        >
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (themeContext.setMode) themeContext.setMode('system')
            else if (themeContext.setTheme) themeContext.setTheme('system')
          }}
        >
          Sistema
        </DropdownMenuItem>

        {themeContext.setColorTheme && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Cor do Tema</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => themeContext.setColorTheme('default')}>
              <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-slate-100 mr-2 border border-slate-200 dark:border-slate-800" />{' '}
              Padrão
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => themeContext.setColorTheme('ocean')}>
              <div className="w-4 h-4 rounded-full bg-blue-600 mr-2" /> Ocean
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => themeContext.setColorTheme('emerald')}>
              <div className="w-4 h-4 rounded-full bg-emerald-600 mr-2" /> Emerald
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => themeContext.setColorTheme('midnight')}>
              <div className="w-4 h-4 rounded-full bg-indigo-900 mr-2" /> Midnight
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
