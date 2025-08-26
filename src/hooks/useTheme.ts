import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as Theme) || 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = () => {
      let resolved: 'light' | 'dark'
      
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light'
      } else {
        resolved = theme
      }
      
      setResolvedTheme(resolved)
      root.setAttribute('data-theme', resolved)
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff')
      }
    }

    updateTheme()
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => {
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme])

  const setThemeWithStorage = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setThemeWithStorage('dark')
    } else if (theme === 'dark') {
      setThemeWithStorage('system')
    } else {
      setThemeWithStorage('light')
    }
  }

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeWithStorage,
    toggleTheme,
    isSystemTheme: theme === 'system'
  }
}