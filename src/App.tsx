import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { 
  FolderOpenIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import UnifiedFilters from './components/filters/UnifiedFilters'
import ModList from './components/mod/ModList'
import ModBrowser from './components/vsmoddb/ModBrowser'
import CommandPalette from './components/ui/CommandPalette'
import FloatingActionButton from './components/ui/FloatingActionButton'
import CorsRequiredPage from './components/ui/CorsRequiredPage'
import { ToastContainer } from './components/ui/Toast'
import useModStore from './store/modStore'
import { useTheme } from './hooks/useTheme'
import { useCommandPalette } from './hooks/useCommandPalette'
import { useToast } from './hooks/useToast'

function App() {
  const { 
    isLoading, 
    error: storeError, 
    mods,
    currentModpack,
    clearError
  } = useModStore()
  
  const { resolvedTheme } = useTheme()
  const { isOpen: commandPaletteOpen, close: closeCommandPalette, open: openCommandPalette } = useCommandPalette()
  const { toasts, dismissToast, success, error, info } = useToast()
  const [view, setView] = useState<'local' | 'vsmoddb'>('vsmoddb')
  const [fabOpen, setFabOpen] = useState(false)
  
  // Handle navigation events from CommandPalette
  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      const targetView = event.detail as 'local' | 'vsmoddb'
      setView(targetView)
    }

    window.addEventListener('navigate-to-view', handleNavigation as EventListener)
    return () => {
      window.removeEventListener('navigate-to-view', handleNavigation as EventListener)
    }
  }, [])


  // Floating Action Button actions
  const fabActions = [
    {
      id: 'command-palette',
      icon: <CommandLineIcon className="w-5 h-5" />,
      label: 'Palette de commandes',
      action: () => {
        openCommandPalette()
        info('Palette ouverte', 'Utilisez Ctrl+K pour l\'ouvrir rapidement')
      }
    },
    {
      id: 'import',
      icon: <FolderOpenIcon className="w-5 h-5" />,
      label: 'Importer modpack',
      action: () => {
        const importBtn = document.querySelector('[title*="Importer"]') as HTMLButtonElement
        importBtn?.click()
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'export',
      icon: <ArrowDownTrayIcon className="w-5 h-5" />,
      label: 'Exporter modpack',
      action: () => {
        if (currentModpack) {
          const exportBtn = document.querySelector('[title*="Exporter"]') as HTMLButtonElement
          exportBtn?.click()
          success('Export lancé', `Téléchargement de ${currentModpack.name}`)
        } else {
          error('Aucun modpack', 'Sélectionnez un modpack à exporter')
        }
      },
      color: 'bg-green-500 hover:bg-green-600'
    }
  ]

  if (storeError) {
    // Show CORS required page for CORS-related errors
    if (storeError.includes('CORS') || storeError.includes('VSModDB')) {
      return (
        <motion.div 
          style={{ 
            background: resolvedTheme === 'dark' 
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CorsRequiredPage onRetry={() => {
            clearError()
            window.location.reload()
          }} />
        </motion.div>
      )
    }

    // Show generic error for other errors
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: resolvedTheme === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="max-w-md w-full card-glass p-8 text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </motion.div>
          <h3 className="text-xl font-bold text-primary mb-2">
            Erreur de chargement
          </h3>
          <p className="text-secondary mb-6">
            {storeError}
          </p>
          <motion.button
            onClick={() => {
              clearError()
              window.location.reload()
            }}
            className="btn-primary w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Recharger l'application
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  if (isLoading && mods.size === 0) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: resolvedTheme === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div
            className="relative mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 border-4 border-amber-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-amber-600 rounded-full"></div>
          </motion.div>
          <motion.h2 
            className="text-xl font-semibold text-primary mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Chargement des mods
          </motion.h2>
          <p className="text-secondary">Initialisation en cours...</p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col"
      style={{ 
        background: resolvedTheme === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header />
      
      <motion.div 
        className="flex-1 transition-all duration-300"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <PanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Panel */}
          <Panel 
            defaultSize={25} 
            minSize={20} 
            maxSize={35}
            className="min-w-0"
          >
            <motion.div 
              className="h-full pt-6"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Sidebar />
            </motion.div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-2 bg-transparent hover:bg-amber-500/20 transition-colors group relative">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/10 group-hover:bg-amber-500/50 transition-colors transform -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-6 h-12 bg-amber-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-1 h-4 bg-amber-500/60 rounded-full" />
            </div>
          </PanelResizeHandle>

          {/* Main Content Panel */}
          <Panel defaultSize={75} minSize={50} className="min-w-0">
            <main className="h-full overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Header avec titre et onglets */}
                <motion.div 
                  className="flex-shrink-0 glass-secondary px-6 py-4 mx-6 mt-6 rounded-2xl"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex glass rounded-2xl p-1">
                      {(['vsmoddb', 'local'] as const).map((tab) => (
                        <motion.button
                          key={tab}
                          data-view={tab}
                          onClick={() => setView(tab)}
                          className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all relative ${
                            view === tab 
                              ? 'text-white shadow-lg' 
                              : 'text-secondary hover:text-primary'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {view === tab && (
                            <motion.div
                              className="absolute inset-0 rounded-xl"
                              style={{ background: 'var(--gradient-brand)' }}
                              layoutId="activeTab"
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            />
                          )}
                          <span className="relative z-10">
                            {tab === 'vsmoddb' ? 'VSModDB' : 'Local'}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    
                    {view === 'local' && (
                      <motion.div 
                        className="flex items-center space-x-6 text-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.3 }}
                      >
                        <div className="text-center glass-secondary rounded-xl px-4 py-2">
                          <div className="text-xl font-bold text-green-500">
                            {Array.from(mods.values()).filter(mod => mod.status === 'installé').length}
                          </div>
                          <div className="text-xs text-secondary">Installés</div>
                        </div>
                        <div className="text-center glass-secondary rounded-xl px-4 py-2">
                          <div className="text-xl font-bold text-amber-500">
                            {Array.from(mods.values()).filter(mod => mod.status === 'non installé').length}
                          </div>
                          <div className="text-xs text-secondary">Disponibles</div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
                
                {/* Filtres unifiés */}
                <motion.div
                  className="px-6 pb-2"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <UnifiedFilters view={view} />
                </motion.div>
                
                <motion.div 
                  className="flex-1 overflow-hidden px-6 pb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="h-full rounded-2xl overflow-hidden">
                    {view === 'vsmoddb' ? (
                      <ModBrowser />
                    ) : (
                      <ModList />
                    )}
                  </div>
                </motion.div>
              </div>
            </main>
          </Panel>
        </PanelGroup>
      </motion.div>

      {/* UI Overlays */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={closeCommandPalette} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <FloatingActionButton
        actions={fabActions}
        isOpen={fabOpen}
        onToggle={() => setFabOpen(!fabOpen)}
        mainIcon={<PlusIcon className="w-6 h-6" />}
      />
    </motion.div>
  )
}

export default App