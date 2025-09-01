import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  ArrowDownTrayIcon,
  FireIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  DocumentTextIcon,
  PlusIcon,
  CheckIcon,
  ComputerDesktopIcon,
  ServerIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { VSModDBMod, VSModDBDetailedMod } from '../../services/vsModDBAPI'
import { vsModDB } from '../../services/vsModDBAPI'

interface ModDetailsModalProps {
  mod: VSModDBMod | null
  isOpen: boolean
  onClose: () => void
  onAddToModpack: (mod: VSModDBDetailedMod) => void
  isInModpack: boolean
}

export default function ModDetailsModal({ 
  mod, 
  isOpen, 
  onClose, 
  onAddToModpack, 
  isInModpack 
}: ModDetailsModalProps) {
  const [details, setDetails] = useState<VSModDBDetailedMod | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && mod) {
      loadModDetails()
    }
  }, [isOpen, mod])

  const loadModDetails = async () => {
    if (!mod) return
    
    setLoading(true)
    setError(null)
    
    try {
      const modDetails = await vsModDB.getModDetails(mod.modid)
      setDetails(modDetails)
    } catch (err) {
      console.error('Failed to load mod details:', err)
      setError('Impossible de charger les détails du mod')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToModpack = () => {
    if (details) {
      onAddToModpack(details)
    }
  }

  const getSideIcon = (side: string) => {
    switch (side) {
      case 'client': return <ComputerDesktopIcon className="h-4 w-4" />
      case 'server': return <ServerIcon className="h-4 w-4" />
      case 'both': return <GlobeAltIcon className="h-4 w-4" />
      default: return <GlobeAltIcon className="h-4 w-4" />
    }
  }

  const getSideColor = (side: string) => {
    switch (side) {
      case 'client': return 'bg-blue-100/60 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200/40 dark:border-blue-700/40'
      case 'server': return 'bg-purple-100/60 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200/40 dark:border-purple-700/40'
      case 'both': return 'bg-green-100/60 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200/40 dark:border-green-700/40'
      default: return 'bg-gray-100/60 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200/40 dark:border-gray-700/40'
    }
  }

  if (!mod) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-8 pb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="relative w-full max-w-4xl text-left transform my-8"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="card-glass shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-6 border-b border-primary/10 bg-glass">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    {/* Mod Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-amber-700 dark:text-amber-200 font-bold text-xl sm:text-2xl">
                        {mod.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Title and basic info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-primary mb-1 line-clamp-2 leading-tight">
                        {mod.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-secondary mb-2">
                        <span className="flex items-center text-sm">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {mod.author}
                        </span>
                        <span className={`flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm border ${getSideColor(mod.side)}`}>
                          {getSideIcon(mod.side)}
                          <span className="ml-1 font-medium">{mod.side}</span>
                        </span>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-tertiary">
                        <span className="flex items-center glass-secondary px-2 py-1 rounded-lg">
                          <ArrowDownTrayIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {mod.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center glass-secondary px-2 py-1 rounded-lg">
                          <FireIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {mod.trendingpoints}
                        </span>
                        <span className="flex items-center glass-secondary px-2 py-1 rounded-lg">
                          ❤️ {mod.follows}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-red-100/60 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all flex-shrink-0 ml-2"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 sm:p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <motion.div
                          className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="ml-3 text-secondary">Chargement des détails...</span>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12">
                        <div className="text-red-500 mb-2">❌ {error}</div>
                        <button
                          onClick={loadModDetails}
                          className="btn-secondary"
                        >
                          Réessayer
                        </button>
                      </div>
                    ) : details ? (
                      <div className="space-y-4 sm:space-y-6">
                        {/* Description */}
                        <div>
                          <h3 className="flex items-center text-base sm:text-lg font-semibold text-primary mb-3">
                            <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Description
                          </h3>
                          <div className="glass-secondary rounded-xl p-4 border border-primary/10">
                            <p className="text-secondary leading-relaxed text-sm sm:text-base mb-3">
                              {details.summary || mod.summary}
                            </p>
                            {details.text && (
                              <div className="mt-4 p-4 glass rounded-lg border border-primary/10">
                                <h4 className="text-sm font-medium text-primary mb-2">📜 Détails complets</h4>
                                <div 
                                  className="prose prose-sm max-w-none text-secondary leading-relaxed"
                                  style={{
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5'
                                  }}
                                  dangerouslySetInnerHTML={{ 
                                    __html: details.text
                                      .replace(/\n/g, '<br>')
                                      .replace(/<h4[^>]*>/g, '<h4 style="font-size: 0.9rem; font-weight: 600; color: #1f2937; margin: 0.5rem 0;">')
                                      .replace(/<h3[^>]*>/g, '<h3 style="font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0.75rem 0;">')
                                      .replace(/<p[^>]*>/g, '<p style="margin: 0.5rem 0; line-height: 1.5;">')
                                      .replace(/<strong[^>]*>/g, '<strong style="font-weight: 600;">')
                                      .replace(/<span[^>]*color:[^;]*;[^>]*>/g, (_match) => {
                                        // Simplify color spans to avoid complex styling
                                        return '<span style="font-weight: 500;">'
                                      })
                                  }} 
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Latest Release */}
                        {details.releases && details.releases.length > 0 && (() => {
                          const latestRelease = details.releases.sort((a, b) => 
                            new Date(b.created).getTime() - new Date(a.created).getTime()
                          )[0]
                          
                          return (
                            <div>
                              <h3 className="flex items-center text-base sm:text-lg font-semibold text-primary mb-3">
                                <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Dernière version
                              </h3>
                              <div className="glass-secondary rounded-xl p-4 border border-primary/10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div className="glass rounded-lg p-3 border border-green-200/30 dark:border-green-700/30">
                                    <label className="text-xs font-medium text-secondary block mb-1">Version</label>
                                    <div className="text-primary font-bold text-lg">{latestRelease.modversion}</div>
                                  </div>
                                  <div className="glass rounded-lg p-3 border border-blue-200/30 dark:border-blue-700/30">
                                    <label className="text-xs font-medium text-secondary block mb-1">Téléchargements</label>
                                    <div className="text-primary font-semibold">{latestRelease.downloads.toLocaleString()}</div>
                                  </div>
                                  <div className="sm:col-span-2 glass rounded-lg p-3 border border-purple-200/30 dark:border-purple-700/30">
                                    <label className="text-xs font-medium text-secondary block mb-1">Fichier</label>
                                    <div className="text-primary font-mono text-sm break-all">{latestRelease.filename}</div>
                                  </div>
                                  <div className="glass rounded-lg p-3 border border-orange-200/30 dark:border-orange-700/30">
                                    <label className="text-xs font-medium text-secondary block mb-1">Publié le</label>
                                    <div className="text-primary font-medium">{new Date(latestRelease.created).toLocaleDateString('fr-FR')}</div>
                                  </div>
                                  {latestRelease.tags && latestRelease.tags.length > 0 && (
                                    <div className="glass rounded-lg p-3 border border-indigo-200/30 dark:border-indigo-700/30">
                                      <label className="text-xs font-medium text-secondary block mb-2">Versions supportées</label>
                                      <div className="flex flex-wrap gap-1">
                                        {latestRelease.tags.slice(0, 3).map(tag => (
                                          <span
                                            key={tag}
                                            className="inline-block bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-700/50 font-medium"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {latestRelease.tags.length > 3 && (
                                          <span className="text-xs text-secondary">+{latestRelease.tags.length - 3} autres</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Tags */}
                        {mod.tags && mod.tags.length > 0 && (
                          <div>
                            <h3 className="flex items-center text-base sm:text-lg font-semibold text-primary mb-3">
                              <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Catégories ({mod.tags.length})
                            </h3>
                            <div className="glass-secondary rounded-xl p-4 border border-primary/10">
                              <div className="flex flex-wrap gap-2">
                                {mod.tags.map(tag => (
                                  <motion.span
                                    key={tag}
                                    className="inline-block bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-800 dark:text-amber-200 text-sm px-3 py-2 rounded-full border border-amber-200/50 dark:border-amber-700/50 font-medium shadow-sm"
                                    whileHover={{ scale: 1.05, y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {tag}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Last Updated */}
                        <div className="flex items-center justify-center text-sm text-tertiary pt-4 border-t border-primary/10 glass-secondary rounded-lg p-3">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          Dernière mise à jour: {new Date(mod.lastreleased).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-primary/10 bg-glass gap-3 sm:gap-0">
                  <div className="flex items-center space-x-4 text-xs sm:text-sm text-secondary">
                    <div className="glass-secondary px-3 py-1 rounded-full border border-primary/20">
                      ID: {mod.modid}
                    </div>
                    <div className="glass-secondary px-3 py-1 rounded-full border border-primary/20 capitalize">
                      {mod.type}
                    </div>
                    {mod.side && (
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getSideColor(mod.side)}`}>
                        {getSideIcon(mod.side)}
                        <span className="ml-1">{mod.side}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <button
                      onClick={onClose}
                      className="btn-secondary flex-1 sm:flex-none"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={handleAddToModpack}
                      disabled={loading || !details}
                      className={`btn-primary flex items-center justify-center flex-1 sm:flex-none min-w-[140px] ${
                        isInModpack ? 'bg-green-500 hover:bg-green-600 border-green-400' : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {loading ? (
                        <>
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Chargement...
                        </>
                      ) : isInModpack ? (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Dans le modpack
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Ajouter au modpack
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}