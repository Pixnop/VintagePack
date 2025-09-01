import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ShieldExclamationIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { VSModDBDetailedMod, VSModDBRelease } from '../../services/vsModDBAPI'
import { formatDate as utilFormatDate } from '../../utils/formatters'

interface ModVersionSelectorProps {
  isOpen: boolean
  onClose: () => void
  mod: VSModDBDetailedMod
  targetGameVersion?: string
  onSelectVersion: (release: VSModDBRelease, forceAdd: boolean) => void
}

export default function ModVersionSelector({
  isOpen,
  onClose,
  mod,
  targetGameVersion = '1.21.0',
  onSelectVersion
}: ModVersionSelectorProps) {
  const [selectedRelease, setSelectedRelease] = useState<VSModDBRelease | null>(null)
  const [forceAdd, setForceAdd] = useState(false)
  const [_showIncompatibleWarning, _setShowIncompatibleWarning] = useState(false)

  // Trier les releases par date (plus récente en premier)
  const sortedReleases = [...mod.releases].sort((a, b) => 
    new Date(b.created).getTime() - new Date(a.created).getTime()
  )

  // Analyser la compatibilité de chaque release
  const releasesWithCompatibility = sortedReleases.map(release => {
    const isCompatible = release.tags.includes(targetGameVersion)
    const hasPartialCompatibility = release.tags.some(tag => 
      tag.startsWith(targetGameVersion.split('.')[0]) // Même version majeure
    )
    
    let status: 'compatible' | 'partially_compatible' | 'incompatible' = 'incompatible'
    let statusText = 'Incompatible'
    let statusColor = 'text-red-500'
    
    if (isCompatible) {
      status = 'compatible'
      statusText = 'Compatible'
      statusColor = 'text-green-500'
    } else if (hasPartialCompatibility) {
      status = 'partially_compatible' 
      statusText = 'Partiellement compatible'
      statusColor = 'text-yellow-500'
    }

    return {
      ...release,
      status,
      statusText,
      statusColor,
      isRecommended: isCompatible && release === sortedReleases[0] // Plus récente + compatible
    }
  })

  const handleSelectVersion = () => {
    if (!selectedRelease) return

    const releaseWithCompat = releasesWithCompatibility.find(r => r.releaseid === selectedRelease.releaseid)!
    
    if (releaseWithCompat.status === 'incompatible' && !forceAdd) {
      // setShowIncompatibleWarning(true)  // Commented out as not used
      return
    }

    onSelectVersion(selectedRelease, forceAdd)
    onClose()
  }

  const getCompatibilityIcon = (status: string) => {
    switch (status) {
      case 'compatible':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'partially_compatible':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      default:
        return <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary">
                  Choisir une version
                </h2>
                <p className="text-sm text-secondary mt-1">
                  {mod.name} • Version cible: VS {targetGameVersion}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-tertiary hover:text-primary rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Release list */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {releasesWithCompatibility.map((release) => (
                  <motion.div
                    key={release.releaseid}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRelease?.releaseid === release.releaseid
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-amber-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    } ${release.isRecommended ? 'ring-2 ring-green-500/20' : ''}`}
                    onClick={() => setSelectedRelease(release)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {getCompatibilityIcon(release.status)}
                            <span className={`font-semibold ${release.statusColor}`}>
                              v{release.modversion}
                            </span>
                            {release.isRecommended && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                Recommandée
                              </span>
                            )}
                          </div>
                          <span className={`text-sm ${release.statusColor}`}>
                            {release.statusText}
                          </span>
                        </div>

                        <div className="text-sm text-secondary mb-2">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {utilFormatDate(new Date(release.created))}
                            </span>
                            <span className="flex items-center gap-1">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                              {release.downloads.toLocaleString()} téléchargements
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {release.tags.map(tag => (
                            <span 
                              key={tag}
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                tag === targetGameVersion 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : tag.startsWith(targetGameVersion.split('.')[0])
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              VS {tag}
                            </span>
                          ))}
                        </div>

                        {release.changelog && (
                          <div className="text-xs text-tertiary mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="font-medium mb-1">Changelog :</div>
                            <div className="line-clamp-3">{release.changelog}</div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-right text-sm text-tertiary">
                        <div>{release.filename}</div>
                        <div className="text-xs mt-1">ID: {release.releaseid}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Incompatible warning */}
            {selectedRelease && releasesWithCompatibility.find(r => r.releaseid === selectedRelease.releaseid)?.status === 'incompatible' && (
              <div className="px-6 pb-4">
                <motion.div
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-800 dark:text-red-400 mb-1">
                        Version incompatible
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Cette version n'est pas officiellement compatible avec VS {targetGameVersion}. 
                        Le mod pourrait ne pas fonctionner correctement ou causer des problèmes.
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={forceAdd}
                          onChange={(e) => setForceAdd(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-red-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-red-800 dark:text-red-400 font-medium">
                          Ajouter quand même (à vos risques et périls)
                        </span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-tertiary">
                <InformationCircleIcon className="w-4 h-4" />
                {releasesWithCompatibility.length} version{releasesWithCompatibility.length > 1 ? 's' : ''} disponible{releasesWithCompatibility.length > 1 ? 's' : ''}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSelectVersion}
                  disabled={!selectedRelease}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter cette version
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

