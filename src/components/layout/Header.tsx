import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  ShareIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  ArchiveBoxIcon,
  PlayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import useModStore from '../../store/modStore'
import ThemeToggle from '../ui/ThemeToggle'
import VSModDBAPIClient from '../../services/vsModDBAPI'

function Header() {
  const {
    searchQuery,
    searchMods,
    selectedMods,
    currentModpack,
    exportModpack,
    importModpack
  } = useModStore()
  
  const [isDownloading, setIsDownloading] = useState(false)

  const handleExport = () => {
    if (currentModpack) {
      const data = exportModpack('json')
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentModpack.name}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.tsv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        const format = file.name.endsWith('.tsv') ? 'tsv' : 'json'
        await importModpack(text, format)
      }
    }
    input.click()
  }

  const handleDownloadModpack = async () => {
    
    if (!currentModpack) {
      alert('Erreur: Données de modpack manquantes. Essayez de réimporter le modpack.')
      return
    }
    
    setIsDownloading(true)
    try {
      const api = new VSModDBAPIClient()
      
      // Use the currentModpack data which already has the correct structure
      const modpackData = {
        name: currentModpack.name,
        description: currentModpack.description || '',
        version: currentModpack.version,
        gameVersion: currentModpack.gameVersion,
        author: currentModpack.author || 'VintagePack User',
        created: typeof currentModpack.created === 'string' ? currentModpack.created : currentModpack.created.toISOString(),
        mods: currentModpack.mods.map((mod: any) => {
          return {
            modid: mod.modid,
            modidstr: mod.modidstr,
            name: mod.name,
            version: mod.version,
            downloadUrl: mod.downloadUrl,
            filename: mod.filename,
            side: mod.side,
            dependencies: mod.dependencies || [],
            gameVersions: mod.gameVersions || [currentModpack.gameVersion]
          }
        })
      }
      
      const zipBlob = await api.createModPackZip(modpackData)
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentModpack.name}.zip`
      a.click()
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('❌ Failed to download modpack:', error)
      alert('Erreur lors du téléchargement du modpack. Vérifiez la console pour plus de détails.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <motion.header 
      className="relative w-full glass backdrop-blur-xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center floating animate-glow"
              style={{ background: 'var(--gradient-brand)' }}
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-white font-bold text-lg">V</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-primary bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                VintagePack
              </h1>
              <p className="text-sm text-secondary hidden sm:block">
                Gestionnaire moderne de mods
              </p>
            </div>
          </motion.div>

          {/* Center - Title */}
          <motion.div 
            className="flex-1 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="text-sm text-tertiary">
              Gestionnaire moderne de mods Vintage Story
            </div>
            <div className="text-xs text-tertiary mt-1">
              Ctrl+K pour ouvrir la palette de commandes
            </div>
          </motion.div>

          {/* Right side - Actions */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {/* Selection counter */}
            {selectedMods.size > 0 && (
              <motion.div 
                className="hidden sm:flex items-center text-sm glass-secondary px-4 py-2 rounded-xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="font-bold text-amber-600">{selectedMods.size}</span>
                <span className="ml-1 text-secondary">sélectionnés</span>
              </motion.div>
            )}

            <ThemeToggle />

            {/* Import button */}
            <motion.button
              onClick={handleImport}
              className="btn-secondary"
              title="Importer un modpack"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FolderOpenIcon className="h-5 w-5 mr-2" />
              <span className="hidden lg:inline">Importer</span>
            </motion.button>

            {/* Download ZIP button (for imported modpacks) */}
            {currentModpack && (
              <motion.button
                onClick={handleDownloadModpack}
                disabled={isDownloading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Télécharger ${currentModpack.name} (ZIP avec mods)`}
                whileHover={!isDownloading ? { scale: 1.05 } : {}}
                whileTap={!isDownloading ? { scale: 0.95 } : {}}
              >
                <ArchiveBoxIcon className="h-5 w-5 mr-2" />
                <span className="hidden lg:inline">
                  {isDownloading ? 'Téléchargement...' : 'Télécharger ZIP'}
                </span>
              </motion.button>
            )}

            {/* Export JSON button */}
            <motion.button
              onClick={handleExport}
              disabled={!currentModpack}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              title={currentModpack ? `Exporter ${currentModpack.name} (JSON)` : 'Aucun modpack sélectionné'}
              whileHover={currentModpack ? { scale: 1.05 } : {}}
              whileTap={currentModpack ? { scale: 0.95 } : {}}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              <span className="hidden lg:inline">Exporter JSON</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Current modpack info */}
        {currentModpack && (
          <motion.div 
            className="mt-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/30 rounded-xl p-3 relative overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {/* Background glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            
            <div className="flex items-center justify-between text-xs relative z-10">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <PlayIcon className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </motion.div>
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium text-green-600">ACTIF</span>
                  </div>
                </motion.div>
                
                <div className="h-4 w-px bg-amber-300/40" />
                
                <span className="text-secondary">
                  <span className="font-semibold text-primary">{currentModpack.name}</span>
                  <span className="text-tertiary ml-2">• {currentModpack.mods.length} mods</span>
                  <span className="text-tertiary ml-2">• v{currentModpack.version}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-xs text-tertiary">
                  VS {currentModpack.gameVersion}
                </div>
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        )}
        
        {/* No modpack selected indicator */}
        {!currentModpack && (
          <motion.div 
            className="mt-2 bg-gradient-to-r from-gray-500/5 to-gray-600/5 border border-gray-300/20 rounded-xl p-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="flex items-center justify-center text-xs text-tertiary">
              <span>Aucun modpack sélectionné • Créez ou sélectionnez un modpack pour commencer</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

export default Header