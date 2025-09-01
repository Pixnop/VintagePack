import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import useModStore from '../../store/modStore'
import { useTheme } from '../../hooks/useTheme'

interface UnifiedFiltersProps {
  view: 'local' | 'vsmoddb'
  onFiltersChange?: () => void
}

export default function UnifiedFilters({ view, onFiltersChange }: UnifiedFiltersProps) {
  const { filters, setFilters, searchQuery, searchMods } = useModStore()
  const { resolvedTheme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Tags disponibles pour VSModDB
  const availableTags = [
    'crafting', 'technology', 'magic', 'worldgen', 
    'utility', 'cosmetic', 'buildingblocks', 'furniture'
  ]
  
  const sortOptions = [
    { value: 'recent', label: 'Plus récents', icon: <ClockIcon className="w-4 h-4" /> },
    { value: 'downloads', label: 'Plus téléchargés', icon: <ArrowDownIcon className="w-4 h-4" /> },
    { value: 'trending', label: 'Tendances', icon: <FireIcon className="w-4 h-4" /> },
    { value: 'name', label: 'Alphabétique', icon: <SparklesIcon className="w-4 h-4" /> }
  ]
  
  const gameVersions = [
    '1.21.0', '1.20.0', '1.19.8', '1.19.0', '1.18.0'
  ]

  const handleReset = () => {
    searchMods('')
    setFilters({
      categories: [],
      sides: [],
      status: [],
      gameVersions: [],
      tags: [],
      text: '',
      showAllVersions: false,
      sortBy: 'recent'
    })
  }

  const activeFiltersCount = 
    filters.categories.length + 
    filters.sides.length + 
    filters.status.length + 
    filters.tags.length +
    (filters.gameVersions.length > 0 ? 1 : 0) +
    (searchQuery ? 1 : 0)

  return (
    <>
      <style>{`
        #search-input-debug {
          font-size: 16px !important;
          font-weight: 500 !important;
          min-height: 48px !important;
          line-height: 1.4 !important;
          padding: 12px 40px !important;
        }
        #search-input-debug:focus {
          color: #000000 !important;
          background-color: #ffffff !important;
        }
        #search-input-debug::placeholder {
          color: rgba(100, 116, 139, 0.8) !important;
        }
      `}</style>
      <div className="space-y-4">
      {/* Barre de recherche et filtres principaux */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Recherche */}
        <div className="flex-1 lg:flex-[2] relative group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary group-focus-within:text-amber-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              console.log('Texte tapé:', e.target.value)
              searchMods(e.target.value)
            }}
            onInput={(e) => {
              console.log('Input event:', e.target.value)
            }}
            placeholder="Rechercher des mods..."
            className="w-full pl-10 pr-10 px-4 py-3 rounded-xl outline-none"
            id="search-input-debug"
            style={{
              color: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a',
              backgroundColor: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #d97706',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: '16px',
              fontWeight: '500',
              minHeight: '48px',
              lineHeight: '1.4'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => searchMods('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Container pour tri et version */}
        <div className="flex gap-3 lg:gap-2 flex-shrink-0">
          {/* Tri */}
          <select
            value={filters.sortBy || 'recent'}
            onChange={(e) => setFilters({ sortBy: e.target.value as any })}
            className="input-glass px-3 min-w-[140px] lg:min-w-[120px] text-primary"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Version du jeu (VSModDB uniquement) */}
          {view === 'vsmoddb' && (
            <div className="relative">
              <select
                value={filters.gameVersions[0] || '1.21.0'}
                onChange={(e) => setFilters({ gameVersions: [e.target.value] })}
                className="input-glass px-3 min-w-[100px] lg:min-w-[90px] pr-6 text-primary"
              >
                {gameVersions.map(version => (
                  <option key={version} value={version}>
                    VS {version}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xs text-tertiary">Cible</span>
              </div>
            </div>
          )}
        </div>

        {/* Bouton filtres avancés */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn-secondary px-4 py-2 flex items-center gap-2 ${
            isExpanded ? 'bg-amber-500/20 border-amber-500' : ''
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} />
        </motion.button>
      </div>

      {/* Panneau de filtres avancés */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass-secondary rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Côté */}
                {view === 'local' && (
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">
                      Côté
                    </label>
                    <div className="space-y-2">
                      {['client', 'server', 'both'].map(side => (
                        <label key={side} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.sides.includes(side)}
                            onChange={(e) => {
                              const newSides = e.target.checked
                                ? [...filters.sides, side]
                                : filters.sides.filter(s => s !== side)
                              setFilters({ sides: newSides })
                            }}
                            className="checkbox"
                          />
                          <span className="text-sm capitalize">{side}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags (VSModDB) */}
                {view === 'vsmoddb' && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-secondary mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            const newTags = filters.tags.includes(tag)
                              ? filters.tags.filter(t => t !== tag)
                              : [...filters.tags, tag]
                            setFilters({ tags: newTags })
                          }}
                          className={`px-3 py-1 rounded-full text-xs transition-all ${
                            filters.tags.includes(tag)
                              ? 'bg-amber-500 text-white'
                              : 'glass hover:bg-amber-500/20'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statut (Local) */}
                {view === 'local' && (
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">
                      Statut
                    </label>
                    <div className="space-y-2">
                      {['installé', 'non installé'].map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={(e) => {
                              const newStatus = e.target.checked
                                ? [...filters.status, status]
                                : filters.status.filter(s => s !== status)
                              setFilters({ status: newStatus })
                            }}
                            className="checkbox"
                          />
                          <span className="text-sm capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Options de compatibilité
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showAllVersions}
                        onChange={(e) => setFilters({ showAllVersions: e.target.checked })}
                        className="checkbox"
                      />
                      <div>
                        <span className="text-sm">Toutes versions</span>
                        <div className="text-xs text-tertiary">
                          Inclure mods avec versions non-compatibles
                        </div>
                      </div>
                    </label>
                    
                    {view === 'vsmoddb' && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showPartiallyCompatible !== false}
                            onChange={(e) => setFilters({ showPartiallyCompatible: e.target.checked })}
                            className="checkbox"
                          />
                          <div>
                            <span className="text-sm">Partiellement compatibles</span>
                            <div className="text-xs text-tertiary">
                              Même version majeure (ex: 1.19.x pour 1.19.8)
                            </div>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showIncompatible !== false}
                            onChange={(e) => setFilters({ showIncompatible: e.target.checked })}
                            className="checkbox"
                          />
                          <div>
                            <span className="text-sm">Incompatibles</span>
                            <div className="text-xs text-tertiary">
                              Permettre l'ajout forcé malgré l'incompatibilité
                            </div>
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton reset */}
              {activeFiltersCount > 0 && (
                <div className="pt-4 border-t border-amber-200/20">
                  <button
                    onClick={handleReset}
                    className="text-sm text-amber-600 hover:text-amber-700 font-semibold"
                  >
                    Réinitialiser tous les filtres ({activeFiltersCount})
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}