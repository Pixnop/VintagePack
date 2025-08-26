import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useModStore from '../../store/modStore'
import { 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  ClockIcon,
  FireIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { vsModDB, VSModDBMod, VSModDBDetailedMod, ModPack } from '../../services/vsModDBAPI'
import Pagination from '../ui/Pagination'
import LazyImage from '../ui/LazyImage'
import ModDetailsModal from '../modals/ModDetailsModal'

interface ModBrowserProps {
  onCreateModPack?: (modPack: ModPack) => void
}

export default function ModBrowser({ onCreateModPack }: ModBrowserProps) {
  // Get filters from store
  const { filters } = useModStore()
  
  const [allMods, setAllMods] = useState<VSModDBMod[]>([])
  const [selectedMods, setSelectedMods] = useState<Map<number, VSModDBDetailedMod>>(new Map())
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'downloads' | 'trending'>('recent')
  const [gameVersion, setGameVersion] = useState('1.21.0')
  const [modPackName, setModPackName] = useState('')
  const [modPackDescription, setModPackDescription] = useState('')
  const [showModPackDialog, setShowModPackDialog] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number} | null>(null)
  
  // Modal state
  const [selectedModForDetails, setSelectedModForDetails] = useState<VSModDBMod | null>(null)
  const [showModDetailsModal, setShowModDetailsModal] = useState(false)
  
  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalMods, setTotalMods] = useState(0)

  // Load all mods initially
  useEffect(() => {
    loadAllMods()
  }, [])

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
    if (filterTag && filterTag !== 'all') {
      filtered = filtered.filter(mod => 
        mod.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
      )
    }

    // Apply game version filter (unless "show all versions" is enabled)
    if (!filters.showAllVersions && gameVersion) {
      filtered = filtered.filter(mod => 
        mod.tags.some(tag => tag === gameVersion)
      )
    }

    // Apply sorting
    if (sortBy === 'downloads') {
      filtered = [...filtered].sort((a, b) => b.downloads - a.downloads)
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.lastreleased).getTime() - new Date(a.lastreleased).getTime())
    }

    return filtered
  }, [allMods, searchQuery, filterTag, sortBy, filters.showAllVersions, gameVersion])

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
  }, [filteredMods, pageSize])

  const loadAllMods = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading all mods from VSModDB...')
      
      // Get all mods from the API (will be cached)
      const totalCount = await vsModDB.getTotalModsCount()
      const allModsList = await vsModDB.getMods(totalCount, 0)
      
      setAllMods(allModsList)
      
      console.log(`✅ Loaded ${allModsList.length} mods from VSModDB`)
    } catch (error) {
      console.error('Failed to load mods:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, filterTag, sortBy])

  const showModDetails = (mod: VSModDBMod) => {
    setSelectedModForDetails(mod)
    setShowModDetailsModal(true)
  }

  const closeModDetails = () => {
    setShowModDetailsModal(false)
    setSelectedModForDetails(null)
  }

  const addToModpack = (modDetails: VSModDBDetailedMod) => {
    const newSelected = new Map(selectedMods)
    newSelected.set(modDetails.modid, modDetails)
    setSelectedMods(newSelected)
    console.log(`✅ Added ${modDetails.name} to modpack`)
  }

  const removeFromModpack = (modid: number) => {
    const newSelected = new Map(selectedMods)
    newSelected.delete(modid)
    setSelectedMods(newSelected)
    console.log(`❌ Removed mod ${modid} from modpack`)
  }

  const createModPack = async () => {
    if (!modPackName || selectedMods.size === 0) return

    const modIds = Array.from(selectedMods.keys())
    const modPack = await vsModDB.createModPack(
      modPackName,
      modPackDescription,
      modIds,
      gameVersion
    )

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

  const downloadModPack = async () => {
    if (selectedMods.size === 0) return

    const modIds = Array.from(selectedMods.keys())
    const modPack = await vsModDB.createModPack(
      modPackName || 'VintagePack Export',
      modPackDescription || 'Exported from VintagePack',
      modIds,
      gameVersion
    )

    try {
      setDownloadProgress({ current: 0, total: modPack.mods.length })
      
      const zipBlob = await vsModDB.createModPackZip(modPack, (current, total) => {
        setDownloadProgress({ current, total })
      })

      // Download the zip file
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(modPackName || 'VintagePack').replace(/\s+/g, '_')}_mods.zip`
      a.click()
      URL.revokeObjectURL(url)

      setDownloadProgress(null)
    } catch (error) {
      console.error('Failed to download modpack:', error)
      setDownloadProgress(null)
    }
  }

  // Get unique tags from all loaded mods
  const availableTags = useMemo(() => 
    Array.from(new Set(allMods.flatMap(mod => mod.tags))).sort(),
    [allMods]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="glass-secondary px-6 py-4 border-b border-amber-200/20">
        <div className="flex items-center justify-between mb-4">
          <motion.h2 
            className="text-2xl font-bold text-primary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            VSModDB Browser
          </motion.h2>
          
          <div className="flex items-center space-x-4">
            <AnimatePresence>
              {selectedMods.size > 0 && (
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span 
                    className="text-sm glass-secondary px-3 py-1 rounded-xl text-secondary font-semibold"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectedMods.size} mod{selectedMods.size > 1 ? 's' : ''} sélectionné{selectedMods.size > 1 ? 's' : ''}
                  </motion.span>
                  
                  <motion.button
                    onClick={() => setShowModPackDialog(true)}
                    className="btn-secondary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Créer ModPack
                  </motion.button>
                  
                  <motion.button
                    onClick={downloadModPack}
                    className="btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Télécharger ZIP
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des mods..."
              className="input-glass w-full pl-10 pr-3 py-2"
            />
          </div>

          {/* Sort options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input-glass px-3 py-2 min-w-0"
          >
            <option value="recent">Plus récents</option>
            <option value="downloads">Plus téléchargés</option>
            <option value="trending">Tendances</option>
          </select>

          {/* Tag filter */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="input-glass px-3 py-2 min-w-0"
          >
            <option value="">Toutes catégories</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          {/* Game version */}
          <select
            value={gameVersion}
            onChange={(e) => setGameVersion(e.target.value)}
            className="input-glass px-3 py-2 min-w-0"
          >
            <option value="1.21.0">1.21.0</option>
            <option value="1.20.7">1.20.7</option>
            <option value="1.19.8">1.19.8</option>
            <option value="1.18.15">1.18.15</option>
          </select>
        </div>
      </div>

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
                <span className="font-semibold text-primary">{totalMods}+</span> mods
              </div>
              <div className="text-tertiary">
                Page {currentPage} sur {Math.ceil(totalMods / pageSize)}
              </div>
            </div>

            {/* Optimized mod grid with server-side pagination */}
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
                      delay: index * 0.02, // Stagger animation
                      ease: [0.4, 0, 0.2, 1] 
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`card-glass cursor-pointer group relative ${
                      selectedMods.has(mod.modid) 
                        ? 'border-green-400 bg-green-50/20' 
                        : 'border-transparent hover:border-amber-200'
                    }`}
                    onClick={() => showModDetails(mod)}
                  >
                    {/* Add to modpack button */}
                    <div className="absolute top-3 right-3 z-10">
                      {selectedMods.has(mod.modid) ? (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromModpack(mod.modid)
                          }}
                          className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </motion.button>
                      ) : (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            showModDetails(mod)
                          }}
                          className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>

                    {/* Mod header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-12">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mb-3">
                          <span className="text-amber-700 font-bold text-lg">
                            {mod.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-bold text-primary text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">
                          {mod.name}
                        </h3>
                        <p className="text-xs text-tertiary mt-1">par {mod.author}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-secondary mb-4 line-clamp-3 leading-relaxed">
                      {mod.summary}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mod.tags.slice(0, 2).map(tag => (
                        <motion.span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs rounded-lg bg-amber-100/30 text-amber-700 border border-amber-200/30"
                          whileHover={{ scale: 1.05 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-tertiary border-t border-amber-100/30 pt-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center group-hover:text-amber-600 transition-colors">
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          {mod.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center group-hover:text-amber-600 transition-colors">
                          <FireIcon className="h-3 w-3 mr-1" />
                          {mod.trendingpoints}
                        </span>
                        <span className="flex items-center group-hover:text-amber-600 transition-colors">
                          ❤️ {mod.follows}
                        </span>
                      </div>
                      
                      <motion.span 
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          mod.side === 'client' ? 'bg-blue-100/60 text-blue-700 border border-blue-200/40' :
                          mod.side === 'server' ? 'bg-purple-100/60 text-purple-700 border border-purple-200/40' :
                          'bg-green-100/60 text-green-700 border border-green-200/40'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {mod.side}
                      </motion.span>
                    </div>


                    {/* Last updated */}
                    <div className="mt-2 text-xs text-tertiary/70 flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {new Date(mod.lastreleased).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Server-side Pagination */}
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
              onNextPage={() => setCurrentPage(prev => prev + 1)}
              onPrevPage={() => setCurrentPage(prev => prev - 1)}
              onGoToPage={(page) => setCurrentPage(page)}
              pageSize={pageSize}
              onChangePageSize={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1) // Reset to first page when changing size
              }}
              className="mt-8"
            />
          </div>
        )}
      </div>

      {/* ModPack creation dialog */}
      {showModPackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Créer un ModPack
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Nom du ModPack
                </label>
                <input
                  type="text"
                  value={modPackName}
                  onChange={(e) => setModPackName(e.target.value)}
                  className="input-glass w-full px-3 py-2"
                  placeholder="Mon ModPack Survival"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={modPackDescription}
                  onChange={(e) => setModPackDescription(e.target.value)}
                  className="input-glass w-full px-3 py-2"
                  rows={3}
                  placeholder="Un modpack orienté survie avec..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Version du jeu
                </label>
                <select
                  value={gameVersion}
                  onChange={(e) => setGameVersion(e.target.value)}
                  className="input-glass w-full px-3 py-2"
                >
                  <option value="1.21.0">1.21.0</option>
                  <option value="1.20.7">1.20.7</option>
                  <option value="1.19.8">1.19.8</option>
                  <option value="1.18.15">1.18.15</option>
                </select>
              </div>
              
              <div className="text-sm text-secondary">
                {selectedMods.size} mod{selectedMods.size > 1 ? 's' : ''} sélectionné{selectedMods.size > 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModPackDialog(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={createModPack}
                disabled={!modPackName}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer et Exporter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download progress */}
      {downloadProgress && (
        <div className="fixed bottom-4 right-4 glass rounded-2xl shadow-xl p-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">
              Téléchargement en cours...
            </span>
            <button
              onClick={() => setDownloadProgress(null)}
              className="text-tertiary hover:text-secondary"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="w-full bg-tertiary/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
            />
          </div>
          
          <div className="mt-2 text-xs text-secondary">
            {downloadProgress.current} / {downloadProgress.total} mods téléchargés
          </div>
        </div>
      )}

      {/* Mod Details Modal */}
      <ModDetailsModal
        mod={selectedModForDetails}
        isOpen={showModDetailsModal}
        onClose={closeModDetails}
        onAddToModpack={addToModpack}
        isInModpack={selectedModForDetails ? selectedMods.has(selectedModForDetails.modid) : false}
      />
    </div>
  )
}