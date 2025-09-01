import { motion } from 'framer-motion'
import { FunnelIcon, Squares2X2Icon, ListBulletIcon, PlusIcon, XMarkIcon, ExclamationTriangleIcon, ShieldExclamationIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import useModStore from '../../store/modStore'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const {
    modpacks,
    currentModpack,
    loadModpack,
    createModpack,
    removeModFromCurrentModpack,
    mods
  } = useModStore()

  const categories = Array.from(new Set(
    Array.from(mods.values()).map(mod => mod.category)
  )).sort()

  // Fonction pour gérer les catégories si nécessaire
  // const handleCategoryToggle = (category: string) => {
  //   const newCategories = filters.categories.includes(category)
  //     ? filters.categories.filter(c => c !== category)
  //     : [...filters.categories, category]
  //   
  //   setFilters({ categories: newCategories })
  // }

  const handleCreateNewModpack = () => {
    const name = prompt('Nom du nouveau modpack:')
    if (name) {
      const description = prompt('Description (optionnelle):') || ''
      createModpack(name, description)
    }
  }

  return (
    <aside className={`glass-secondary overflow-y-auto scrollbar-glass h-full ${className}`}>
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.3 }}
            >
              <FunnelIcon className="w-5 h-5 text-amber-500" />
            </motion.div>
            <h2 className="text-lg font-bold text-primary">Statistiques</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-secondary rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-green-500">
                {Array.from(mods.values()).filter(mod => mod.status === 'installé').length}
              </div>
              <div className="text-xs text-secondary">Installés</div>
            </div>
            <div className="glass-secondary rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-500">
                {Array.from(mods.values()).filter(mod => mod.status === 'non installé').length}
              </div>
              <div className="text-xs text-secondary">Disponibles</div>
            </div>
          </div>
          
          {categories.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-secondary mb-2">
                Catégories disponibles
              </div>
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 6).map(category => (
                  <span 
                    key={category}
                    className="text-xs px-2 py-1 rounded-full glass text-tertiary"
                  >
                    {category}
                  </span>
                ))}
                {categories.length > 6 && (
                  <span className="text-xs px-2 py-1 rounded-full text-tertiary">
                    +{categories.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Modpacks Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Squares2X2Icon className="w-5 h-5 text-amber-500" />
              </motion.div>
              <h2 className="text-lg font-bold text-primary">Modpacks</h2>
            </div>
            <motion.button
              onClick={handleCreateNewModpack}
              className="p-2 text-tertiary hover:text-amber-500 rounded-xl hover:bg-amber-100/20 transition-all"
              title="Créer un nouveau modpack"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <PlusIcon className="w-5 h-5" />
            </motion.button>
          </div>
          
          <div className="space-y-3">
            {modpacks.map((modpack, index) => (
              <motion.button
                key={modpack.id}
                onClick={() => loadModpack(modpack)}
                className={`w-full text-left p-4 rounded-2xl text-sm transition-all group ${
                  currentModpack?.id === modpack.id
                    ? 'bg-amber-500/20 text-amber-700 border border-amber-300/30 shadow-lg'
                    : 'glass-secondary hover:bg-amber-100/10 text-secondary hover:text-primary border border-transparent'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-bold truncate group-hover:text-amber-600 transition-colors">
                  {modpack.name}
                </div>
                <div className="text-xs text-tertiary mt-2 flex justify-between">
                  <span>{modpack.mods.length} mods</span>
                  <span>v{modpack.version}</span>
                </div>
              </motion.button>
            ))}
            
            {modpacks.length === 0 && (
              <motion.div 
                className="text-center py-8 text-secondary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Squares2X2Icon className="w-12 h-12 mx-auto mb-3 text-amber-300" />
                </motion.div>
                <p className="text-sm font-medium">Aucun modpack</p>
                <motion.button
                  onClick={handleCreateNewModpack}
                  className="text-amber-500 hover:text-amber-600 text-sm mt-2 font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Créer le premier
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Current Modpack Info */}
        {currentModpack && (
          <motion.div 
            className="border-t border-amber-200/20 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ duration: 0.2 }}
              >
                <ListBulletIcon className="w-5 h-5 text-amber-500" />
              </motion.div>
              <h3 className="text-lg font-bold text-primary">
                Modpack actuel
              </h3>
            </div>
            <motion.div 
              className="glass rounded-2xl p-4 border border-amber-200/30"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-bold text-primary mb-2">
                {currentModpack.name}
              </div>
              <div className="text-sm text-secondary mb-3 leading-relaxed">
                {currentModpack.description || 'Aucune description'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-tertiary">
                <div className="bg-amber-100/20 rounded-lg p-2 text-center">
                  <div className="font-bold text-amber-600">{currentModpack.mods.length}</div>
                  <div>mods</div>
                </div>
                <div className="bg-amber-100/20 rounded-lg p-2 text-center">
                  <div className="font-bold text-amber-600">v{currentModpack.version}</div>
                  <div>version</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-tertiary mt-3 pt-2 border-t border-amber-200/20">
                <span>VS {currentModpack.gameVersion}</span>
                <span>{new Date(currentModpack.modified).toLocaleDateString()}</span>
              </div>
            </motion.div>
            
            {/* Mods du modpack */}
            {currentModpack.mods.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-secondary mb-3">
                  Mods inclus ({currentModpack.mods.length})
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-glass">
                  {currentModpack.mods.map((mod, index) => {
                    const getStatusIcon = () => {
                      if (mod.status === 'non installé') {
                        return <ShieldExclamationIcon className="w-3 h-3 text-red-500" />
                      }
                      if ((mod as any).forceAdded) {
                        return <ExclamationTriangleIcon className="w-3 h-3 text-yellow-500" />
                      }
                      return <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    }
                    
                    return (
                      <motion.div
                        key={mod.id}
                        className="group flex items-center justify-between p-2 rounded-lg glass-secondary hover:bg-amber-100/10 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon()}
                            <div className="text-xs font-medium text-primary truncate">
                              {mod.name}
                            </div>
                          </div>
                          <div className="text-xs text-tertiary flex items-center gap-2">
                            <span className="truncate">v{(mod as any).version || '1.0.0'}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100/20 text-amber-700">
                              {mod.category}
                            </span>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => removeModFromCurrentModpack(mod.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-100/20 rounded transition-all"
                          title="Retirer du modpack"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </motion.button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  )
}

export { Sidebar }