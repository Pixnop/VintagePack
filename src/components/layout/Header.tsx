import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  ShareIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  ArchiveBoxIcon
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
    console.log('🔵 Download button clicked!')
    console.log('🔍 currentModpack:', currentModpack)
    
    if (!currentModpack) {
      console.log('❌ Missing required data for download')
      alert('Erreur: Données de modpack manquantes. Essayez de réimporter le modpack.')
      return
    }
    
    setIsDownloading(true)
    try {
      const api = new VSModDBAPIClient()
      
      // Use the currentModpack data which already has the correct structure
      console.log('🔍 Using currentModpack data for download:', currentModpack.name)
      const modpackData = {
        name: currentModpack.name,
        description: currentModpack.description || '',
        version: currentModpack.version,
        gameVersion: currentModpack.gameVersion,
        author: currentModpack.author || 'VintagePack User',
        created: currentModpack.created || new Date().toISOString(),
        mods: currentModpack.mods.map((mod: any) => {
          console.log(`🔍 Processing mod for download: ${mod.name}, URL: ${mod.downloadUrl}`)
          return {
            modid: mod.modid,
            modidstr: mod.modidstr,
            name: mod.name,
            version: mod.version,
            downloadUrl: mod.downloadUrl,
            filename: mod.filename,
            side: mod.side,
            dependencies: mod.dependencies || []
          }
        })
      }
      
      console.log('🎯 Creating ZIP for imported modpack:', modpackData.name)
      console.log('📋 Modpack data for ZIP creation:', JSON.stringify(modpackData, null, 2))
      const zipBlob = await api.createModPackZip(modpackData)
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentModpack.name}.zip`
      a.click()
      URL.revokeObjectURL(url)
      
      console.log('✅ Modpack ZIP download completed')
    } catch (error) {
      console.error('❌ Failed to download modpack:', error)
      alert('Erreur lors du téléchargement du modpack. Vérifiez la console pour plus de détails.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl"
      initial={{ y: -100, opacity: 0 }}
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

          {/* Center - Search */}
          <motion.div 
            className="flex-1 max-w-2xl mx-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <MagnifyingGlassIcon className="h-5 w-5 text-tertiary group-focus-within:text-amber-600 transition-colors" />
              </div>
              <motion.input
                type="text"
                className="input-glass w-full pl-12 pr-12 py-3 text-sm placeholder:text-tertiary"
                placeholder="Rechercher des mods... (Ctrl+K pour ouvrir la palette)"
                value={searchQuery}
                onChange={(e) => searchMods(e.target.value)}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              {searchQuery && (
                <motion.div 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.button
                    className="text-tertiary hover:text-primary text-xl transition-colors p-1 rounded-lg hover:bg-amber-100/20"
                    onClick={() => searchMods('')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
              <motion.div
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: searchQuery ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-1 text-xs text-tertiary bg-amber-100/20 px-2 py-1 rounded-md">
                  <CommandLineIcon className="w-3 h-3" />
                  <span>Ctrl+K</span>
                </div>
              </motion.div>
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
            className="mt-2 glass-secondary rounded-xl p-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ShareIcon className="h-3 w-3 text-amber-500" />
                </motion.div>
                <span className="text-secondary">
                  <span className="font-semibold text-primary">{currentModpack.name}</span>
                  <span className="text-tertiary ml-1">• {currentModpack.mods.length} mods</span>
                </span>
              </div>
              <div className="text-xs text-tertiary">
                VS {currentModpack.gameVersion}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

export default Header