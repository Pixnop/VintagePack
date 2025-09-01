import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useModStore from '../../store/modStore'
import { 
  ArrowDownTrayIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { vsModDB, VSModDBMod, VSModDBDetailedMod, ModPack, VSModDBRelease } from '../../services/vsModDBAPI'
import Pagination from '../ui/Pagination'
import ModDetailsModal from '../modals/ModDetailsModal'
import ModVersionSelector from '../modals/ModVersionSelector'

interface ModBrowserProps {
  onCreateModPack?: (modPack: ModPack) => void
}

export default function ModBrowser({ onCreateModPack }: ModBrowserProps) {
  const { filters, searchQuery, currentModpack, addModToCurrentModpack, removeModFromCurrentModpack, setError } = useModStore()
  
  const [allMods, setAllMods] = useState<VSModDBMod[]>([])
  const [selectedMods, setSelectedMods] = useState<Map<number, VSModDBDetailedMod>>(new Map())
  
  // Convertir les mods du modpack actuel pour l'affichage
  const currentModpackModIds = useMemo(() => {
    if (!currentModpack) return new Set()
    return new Set(currentModpack.mods.map(mod => {
      // Si c'est un mod VSModDB, extraire l'ID numérique
      const numericId = parseInt(mod.id) 
      return isNaN(numericId) ? mod.id : numericId
    }))
  }, [currentModpack])
  const [loading, setLoading] = useState(false)
  const [modPackName, setModPackName] = useState('')
  const [modPackDescription, setModPackDescription] = useState('')
  const [showModPackDialog, setShowModPackDialog] = useState(false)
  
  // Modal state
  const [selectedModForDetails, setSelectedModForDetails] = useState<VSModDBMod | null>(null)
  const [showModDetailsModal, setShowModDetailsModal] = useState(false)
  const [selectedModForVersion, setSelectedModForVersion] = useState<VSModDBDetailedMod | null>(null)
  const [showVersionSelector, setShowVersionSelector] = useState(false)
  
  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalMods, setTotalMods] = useState(0)

  // Load all mods initially
  useEffect(() => {
    loadAllMods()
  }, [])

  const loadAllMods = async () => {
    setLoading(true)
    try {
      const totalCount = await vsModDB.getTotalModsCount()
      const allModsList = await vsModDB.getMods(totalCount, 0)
      setAllMods(allModsList)
      setTotalMods(totalCount)
    } catch (error) {
      console.error('Failed to load mods:', error)
      // Propager l'erreur au store global pour afficher la page CORS
      setError(`Impossible d'accéder à VSModDB. ${error instanceof Error ? error.message : 'Erreur CORS détectée.'}`)
    } finally {
      setLoading(false)
    }
  }

  // Apply filtering and pagination when search/filter changes
  const filteredMods = useMemo(() => {
    let filtered = allMods

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(mod => 
        mod.name.toLowerCase().includes(query) ||
        mod.summary.toLowerCase().includes(query) ||
        mod.author.toLowerCase().includes(query) ||
        mod.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(mod => 
        filters.tags.some(filterTag => 
          mod.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
        )
      )
    }

    // Apply game version filter with compatibility levels
    if (filters.gameVersions.length > 0) {
      const targetVersion = filters.gameVersions[0]
      
      filtered = filtered.filter(mod => {
        const hasExactMatch = mod.tags.includes(targetVersion)
        const hasPartialMatch = mod.tags.some(tag => 
          tag.startsWith(targetVersion.split('.')[0])
        )
        const hasNoMatch = !hasExactMatch && !hasPartialMatch
        
        // Toujours afficher si "toutes versions" est activé
        if (filters.showAllVersions) return true
        
        // Afficher selon les préférences de compatibilité
        if (hasExactMatch) return true // Toujours afficher les compatibles
        if (hasPartialMatch && filters.showPartiallyCompatible !== false) return true
        if (hasNoMatch && filters.showIncompatible !== false) return true
        
        return false
      })
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'recent'
    if (sortBy === 'downloads') {
      filtered = [...filtered].sort((a, b) => b.downloads - a.downloads)
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.lastreleased).getTime() - new Date(a.lastreleased).getTime())
    } else if (sortBy === 'trending') {
      filtered = [...filtered].sort((a, b) => b.trendingpoints - a.trendingpoints)
    }

    return filtered
  }, [allMods, searchQuery, filters])

  // Apply pagination to filtered results
  const paginatedMods = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredMods.slice(startIndex, startIndex + pageSize)
  }, [filteredMods, currentPage, pageSize])

  // Update total count and reset page when filters change
  useEffect(() => {
    setTotalMods(filteredMods.length)
    if (currentPage > Math.ceil(filteredMods.length / pageSize)) {
      setCurrentPage(1)
    }
  }, [filteredMods, pageSize, currentPage])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, filters])

  const showModDetails = (mod: VSModDBMod) => {
    setSelectedModForDetails(mod)
    setShowModDetailsModal(true)
  }

  const closeModDetails = () => {
    setShowModDetailsModal(false)
    setSelectedModForDetails(null)
  }

  const addToModpack = (modDetails: VSModDBDetailedMod) => {
    // Si le mod a plusieurs releases, ouvrir le sélecteur de version
    if (modDetails.releases.length > 1) {
      setSelectedModForVersion(modDetails)
      setShowVersionSelector(true)
      return
    }

    // Sinon, ajouter directement avec la seule version disponible au modpack actuel
    const release = modDetails.releases[0]
    const modData = convertVSModDBToModData(modDetails, release, false)
    addModToCurrentModpack(modData)
    
    // Garder aussi dans la sélection locale pour l'interface
    const newSelected = new Map(selectedMods)
    newSelected.set(modDetails.modid, modDetails)
    setSelectedMods(newSelected)
  }

  const addSpecificVersion = (modDetails: VSModDBDetailedMod, release: VSModDBRelease, forceAdd: boolean) => {
    // Ajouter au modpack actuel avec la version spécifique
    const modData = convertVSModDBToModData(modDetails, release, forceAdd)
    addModToCurrentModpack(modData)
    
    // Créer une version du mod avec la release sélectionnée pour l'interface locale
    const modWithSelectedRelease = {
      ...modDetails,
      releases: [release],
      selectedRelease: release,
      forceAdded: forceAdd
    } as VSModDBDetailedMod & { selectedRelease: VSModDBRelease, forceAdded: boolean }

    const newSelected = new Map(selectedMods)
    newSelected.set(modDetails.modid, modWithSelectedRelease)
    setSelectedMods(newSelected)
  }

  const removeFromModpack = (modid: number) => {
    // Supprimer du modpack actuel
    removeModFromCurrentModpack(modid.toString())
    
    // Retirer aussi de la sélection locale
    const newSelected = new Map(selectedMods)
    newSelected.delete(modid)
    setSelectedMods(newSelected)
  }
  
  // Fonction utilitaire pour convertir VSModDB en ModData
  const convertVSModDBToModData = (modDetails: VSModDBDetailedMod, release: VSModDBRelease, forceAdded: boolean) => {
    const targetGameVersion = filters.gameVersions[0] || '1.21.0'
    const releaseWithCompat = vsModDB.getReleasesWithCompatibility(modDetails, targetGameVersion)
    const compatibility = releaseWithCompat.find(r => r.releaseid === release.releaseid)
    
    // Convertir le format VSModDB vers le format ModData
    const sideMapping = {
      'client': 'Client',
      'server': 'Server', 
      'both': 'Both'
    } as const
    
    const modSide = sideMapping[modDetails.side as keyof typeof sideMapping] || 'Both'
    
    return {
      id: modDetails.modid.toString(),
      name: modDetails.name,
      author: modDetails.author,
      version: release.modversion,
      description: modDetails.text || '',
      category: 'VSModDB',
      status: (forceAdded && compatibility?.compatibility !== 'compatible') ? 'non installé' as const : 'installé' as const,
      url: release.mainfile.startsWith('http') ? release.mainfile : `https://mods.vintagestory.at${release.mainfile}`,
      dependencies: [],
      side: modSide,
      gameVersion: targetGameVersion,
      tags: release.tags,
      downloads: modDetails.downloads,
      releaseId: release.releaseid,
      forceAdded,
      compatibilityStatus: (compatibility?.compatibility || 'unknown') as 'compatible' | 'partially_compatible' | 'incompatible' | 'unknown'
    }
  }

  const createModPack = async () => {
    if (!modPackName || selectedMods.size === 0) return

    // Créer le modpack avec les versions spécifiques sélectionnées
    const targetGameVersion = filters.gameVersions[0] || '1.21.0'
    const modEntries = Array.from(selectedMods.values()).map(mod => {
      const selectedRelease = (mod as any).selectedRelease || mod.releases[0]
      const releaseWithCompat = vsModDB.getReleasesWithCompatibility(mod, targetGameVersion)
      const compatibility = releaseWithCompat.find(r => r.releaseid === selectedRelease.releaseid)

      return {
        modid: mod.modid,
        modidstr: selectedRelease.modidstr,
        name: mod.name,
        version: selectedRelease.modversion,
        downloadUrl: selectedRelease.mainfile.startsWith('http') 
          ? selectedRelease.mainfile 
          : `https://mods.vintagestory.at${selectedRelease.mainfile}`,
        filename: selectedRelease.filename,
        side: mod.side,
        dependencies: [],
        gameVersions: selectedRelease.tags,
        releaseId: selectedRelease.releaseid,
        forceAdded: (mod as any).forceAdded || false,
        compatibilityStatus: (compatibility?.compatibility || 'unknown') as 'compatible' | 'partially_compatible' | 'incompatible' | 'unknown'
      }
    })

    const modPack = {
      name: modPackName,
      description: modPackDescription,
      version: '1.0.0',
      gameVersion: targetGameVersion,
      author: 'VintagePack User',
      created: new Date().toISOString(),
      mods: modEntries
    }

    if (onCreateModPack) {
      onCreateModPack(modPack)
    }

    // Export as JSON
    const json = vsModDB.exportModPackToJSON(modPack)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${modPackName.replace(/\s+/g, '_')}_modpack.json`
    a.click()
    URL.revokeObjectURL(url)

    setShowModPackDialog(false)
    setModPackName('')
    setModPackDescription('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mod list */}
      <div className="flex-1 overflow-y-auto p-6 optimized-list">
        {loading ? (
          <motion.div 
            className="flex justify-center items-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Results info */}
            <div className="flex items-center justify-between text-sm text-secondary">
              <div>
                Affichage de <span className="font-semibold text-primary">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalMods)}</span> sur{' '}
                <span className="font-semibold text-primary">{totalMods}</span> mods
              </div>
              <div className="text-tertiary">
                Page {currentPage} sur {Math.ceil(totalMods / pageSize)}
              </div>
            </div>

            {/* Mod grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {paginatedMods.map((mod, index) => (
                  <motion.div
                    key={mod.modid}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.02,
                      ease: [0.4, 0, 0.2, 1] 
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`card-glass cursor-pointer group relative ${
                      selectedMods.has(mod.modid) || currentModpackModIds.has(mod.modid)
                        ? 'border-green-400 bg-green-50/20' 
                        : 'border-transparent hover:border-amber-200'
                    }`}
                    onClick={() => showModDetails(mod)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-primary truncate group-hover:text-amber-600 transition-colors">
                            {mod.name}
                          </h3>
                          <p className="text-sm text-secondary truncate">
                            par {mod.author}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const isInModpack = selectedMods.has(mod.modid) || currentModpackModIds.has(mod.modid)
                              if (isInModpack) {
                                removeFromModpack(mod.modid)
                              } else {
                                vsModDB.getModDetails(mod.modid).then(details => {
                                  if (details) addToModpack(details)
                                })
                              }
                            }}
                            className={`p-2 rounded-xl transition-all ${
                              selectedMods.has(mod.modid) || currentModpackModIds.has(mod.modid)
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white'
                            }`}
                          >
                            {(selectedMods.has(mod.modid) || currentModpackModIds.has(mod.modid)) ? (
                              <CheckIcon className="w-4 h-4" />
                            ) : (
                              <PlusIcon className="w-4 h-4" />
                            )}
                          </button>
                          
                          {/* Indicateur de compatibilité */}
                          {(() => {
                            const targetGameVersion = filters.gameVersions[0] || '1.21.0'
                            const hasExactMatch = mod.tags.includes(targetGameVersion)
                            const hasPartialMatch = mod.tags.some(tag => 
                              tag.startsWith(targetGameVersion.split('.')[0])
                            )
                            
                            if (hasExactMatch) {
                              return null // Pas d'indicateur si compatible
                            } else if (hasPartialMatch) {
                              return (
                                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" title="Partiellement compatible" />
                              )
                            } else {
                              return (
                                <ShieldExclamationIcon className="w-4 h-4 text-red-500" title="Incompatible - ajout forcé possible" />
                              )
                            }
                          })()}
                        </div>
                      </div>

                      <p className="text-sm text-tertiary line-clamp-3 mb-4">
                        {mod.summary}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex space-x-2">
                          <span className="bg-amber-100/20 text-amber-700 px-2 py-1 rounded-full">
                            {mod.type}
                          </span>
                          <span className="bg-blue-100/20 text-blue-700 px-2 py-1 rounded-full">
                            {mod.side}
                          </span>
                        </div>
                        <div className="text-tertiary">
                          {mod.downloads.toLocaleString()} téléchargements
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalMods / pageSize)}
              hasNextPage={currentPage < Math.ceil(totalMods / pageSize)}
              hasPrevPage={currentPage > 1}
              totalItems={totalMods}
              pageRange={{
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, totalMods)
              }}
              onNextPage={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalMods / pageSize)))}
              onPrevPage={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              onGoToPage={setCurrentPage}
              pageSize={pageSize}
              onChangePageSize={() => {}} // Non utilisé pour l'instant
            />
          </div>
        )}
      </div>

      {/* Selected mods panel */}
      {selectedMods.size > 0 && (
        <motion.div
          className="border-t border-amber-200/20 bg-glass backdrop-blur-sm"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-primary">
                {selectedMods.size} mod{selectedMods.size > 1 ? 's' : ''} sélectionné{selectedMods.size > 1 ? 's' : ''}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMods(new Map())}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Vider
                </button>
                <button
                  onClick={() => setShowModPackDialog(true)}
                  className="btn-primary text-xs px-3 py-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Créer ModPack
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal states */}
      {selectedModForDetails && (
        <ModDetailsModal
          isOpen={showModDetailsModal}
          onClose={closeModDetails}
          mod={selectedModForDetails}
          onAddToModpack={() => {
            vsModDB.getModDetails(selectedModForDetails.modid).then(details => {
              if (details) addToModpack(details)
            })
          }}
          isInModpack={selectedMods.has(selectedModForDetails.modid) || currentModpackModIds.has(selectedModForDetails.modid)}
        />
      )}

      {/* Sélecteur de version */}
      {selectedModForVersion && (
        <ModVersionSelector
          isOpen={showVersionSelector}
          onClose={() => {
            setShowVersionSelector(false)
            setSelectedModForVersion(null)
          }}
          mod={selectedModForVersion}
          targetGameVersion={filters.gameVersions[0] || '1.21.0'}
          onSelectVersion={(release, forceAdd) => {
            addSpecificVersion(selectedModForVersion, release, forceAdd)
            setShowVersionSelector(false)
            setSelectedModForVersion(null)
          }}
        />
      )}

      {/* Modpack creation dialog */}
      {showModPackDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 max-w-[90vw]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-bold mb-4">Créer un ModPack</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={modPackName}
                onChange={(e) => setModPackName(e.target.value)}
                placeholder="Nom du ModPack"
                className="input-glass w-full text-primary"
              />
              <textarea
                value={modPackDescription}
                onChange={(e) => setModPackDescription(e.target.value)}
                placeholder="Description (optionnelle)"
                className="input-glass w-full h-20 resize-none text-primary"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModPackDialog(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={createModPack}
                  disabled={!modPackName}
                  className="btn-primary disabled:opacity-50"
                >
                  Créer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}