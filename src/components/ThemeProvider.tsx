import { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'dark' | 'light' | 'system'
type ColorTheme = 'default' | 'ocean' | 'emerald' | 'midnight'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultMode?: ThemeMode
  defaultColorTheme?: ColorTheme
  storageKey?: string
}

type ThemeProviderState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const initialState: ThemeProviderState = {
  mode: 'system',
  setMode: () => null,
  colorTheme: 'default',
  setColorTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultMode = 'system',
  defaultColorTheme = 'default',
  storageKey = 'gc-theme',
  ...props
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(`${storageKey}-mode`) as ThemeMode) || defaultMode,
  )
  const [colorTheme, setColorTheme] = useState<ColorTheme>(
    () => (localStorage.getItem(`${storageKey}-color`) as ColorTheme) || defaultColorTheme,
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.remove('theme-default', 'theme-ocean', 'theme-emerald', 'theme-midnight')

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(mode)
    }

    root.classList.add(`theme-${colorTheme}`)
  }, [mode, colorTheme])

  const value = {
    mode,
    setMode: (newMode: ThemeMode) => {
      localStorage.setItem(`${storageKey}-mode`, newMode)
      setMode(newMode)
    },
    colorTheme,
    setColorTheme: (newTheme: ColorTheme) => {
      localStorage.setItem(`${storageKey}-color`, newTheme)
      setColorTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
