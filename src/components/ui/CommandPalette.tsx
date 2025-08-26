import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  CommandLineIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  HomeIcon,
  ServerIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../../hooks/useTheme'
import useModStore from '../../store/modStore'

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'actions' | 'settings'
  keywords: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toggleTheme, theme } = useTheme()
  const { searchMods, exportModpack, currentModpack } = useModStore()

  const commands: Command[] = [
    {
      id: 'search',
      title: 'Rechercher des mods',
      subtitle: 'Chercher dans la base de données',
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      action: () => {
        onClose()
        // Focus on main search bar
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement
          searchInput?.focus()
        }, 100)
      },
      category: 'navigation',
      keywords: ['search', 'chercher', 'mods', 'find']
    },
    {
      id: 'vsmoddb',
      title: 'Aller à VSModDB',
      subtitle: 'Explorer les mods officiels',
      icon: <ServerIcon className="w-5 h-5" />,
      action: () => {
        onClose()
        // Navigate to VSModDB view
        window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: 'vsmoddb' }))
      },
      category: 'navigation',
      keywords: ['vsmoddb', 'database', 'explore', 'official']
    },
    {
      id: 'local',
      title: 'Aller à Local',
      subtitle: 'Voir les mods locaux',
      icon: <HomeIcon className="w-5 h-5" />,
      action: () => {
        onClose()
        window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: 'local' }))
      },
      category: 'navigation',
      keywords: ['local', 'home', 'collection', 'mods']
    },
    {
      id: 'export',
      title: 'Exporter le modpack',
      subtitle: currentModpack ? `Exporter ${currentModpack.name}` : 'Aucun modpack sélectionné',
      icon: <ArrowDownTrayIcon className="w-5 h-5" />,
      action: () => {
        if (currentModpack) {
          onClose()
          setTimeout(() => {
            const exportBtn = document.querySelector('[title*="Exporter"]') as HTMLButtonElement
            exportBtn?.click()
          }, 100)
        }
      },
      category: 'actions',
      keywords: ['export', 'exporter', 'modpack', 'download', 'save']
    },
    {
      id: 'import',
      title: 'Importer un modpack',
      subtitle: 'Charger depuis un fichier',
      icon: <FolderOpenIcon className="w-5 h-5" />,
      action: () => {
        onClose()
        setTimeout(() => {
          const importBtn = document.querySelector('[title*="Importer"]') as HTMLButtonElement
          importBtn?.click()
        }, 100)
      },
      category: 'actions',
      keywords: ['import', 'importer', 'modpack', 'load', 'file']
    },
    {
      id: 'theme',
      title: 'Changer de thème',
      subtitle: `Actuel: ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Système'}`,
      icon: theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />,
      action: () => {
        toggleTheme()
        onClose()
      },
      category: 'settings',
      keywords: ['theme', 'thème', 'dark', 'light', 'sombre', 'clair']
    }
  ]

  const filteredCommands = commands.filter(command => {
    if (!query) return true
    
    const searchTerms = query.toLowerCase().split(' ')
    return searchTerms.every(term =>
      command.title.toLowerCase().includes(term) ||
      command.subtitle?.toLowerCase().includes(term) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(term))
    )
  })

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, Command[]>)

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    settings: 'Paramètres'
  }

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Command Palette */}
          <motion.div
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-auto px-4"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="glass rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center px-6 py-4 border-b border-white/10">
                <MagnifyingGlassIcon className="w-6 h-6 text-tertiary mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent text-primary text-lg placeholder:text-tertiary outline-none"
                  placeholder="Rechercher une commande..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center space-x-1 text-xs text-tertiary bg-white/5 px-2 py-1 rounded-md">
                  <span>ESC</span>
                </div>
              </div>

              {/* Commands */}
              <div className="max-h-96 overflow-y-auto scrollbar-glass">
                {Object.entries(groupedCommands).length > 0 ? (
                  <div className="py-2">
                    {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                      <div key={category} className="mb-2">
                        <div className="px-6 py-2 text-xs font-semibold text-tertiary uppercase tracking-wider">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </div>
                        {categoryCommands.map((command, index) => {
                          const globalIndex = filteredCommands.indexOf(command)
                          const isSelected = globalIndex === selectedIndex
                          
                          return (
                            <motion.div
                              key={command.id}
                              className={`px-6 py-3 cursor-pointer transition-all relative ${
                                isSelected 
                                  ? 'bg-amber-500/20 text-primary' 
                                  : 'text-secondary hover:bg-white/5 hover:text-primary'
                              }`}
                              onClick={command.action}
                              whileHover={{ x: 4 }}
                              transition={{ duration: 0.1 }}
                            >
                              {isSelected && (
                                <motion.div
                                  className="absolute left-0 top-0 w-1 h-full bg-amber-500 rounded-r"
                                  layoutId="selectedCommand"
                                  transition={{ duration: 0.15 }}
                                />
                              )}
                              <div className="flex items-center">
                                <div className={`mr-4 ${isSelected ? 'text-amber-500' : 'text-tertiary'}`}>
                                  {command.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{command.title}</div>
                                  {command.subtitle && (
                                    <div className="text-sm text-tertiary mt-0.5">
                                      {command.subtitle}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-xs text-tertiary bg-white/5 px-2 py-1 rounded-md">
                                    ENTER
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <CommandLineIcon className="w-12 h-12 text-tertiary mx-auto mb-3 opacity-50" />
                    <p className="text-secondary">Aucune commande trouvée</p>
                    <p className="text-tertiary text-sm mt-1">Essayez un autre terme de recherche</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}