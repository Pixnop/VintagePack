import React from 'react'
import { motion } from 'framer-motion'
import { FunnelIcon, Squares2X2Icon, ListBulletIcon, PlusIcon } from '@heroicons/react/24/outline'
import useModStore from '../../store/modStore'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const {
    filters,
    setFilters,
    modpacks,
    currentModpack,
    loadModpack,
    createModpack,
    mods
  } = useModStore()

  const categories = Array.from(new Set(
    Array.from(mods.values()).map(mod => mod.category)
  )).sort()

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    
    setFilters({ categories: newCategories })
  }

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
        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <FunnelIcon className="w-5 h-5 text-amber-500" />
            </motion.div>
            <h2 className="text-lg font-bold text-primary">Filtres</h2>
          </div>
          
          {/* Side Filter */}
          <motion.div 
            className="mb-6"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-semibold text-secondary mb-2">
              Côté
            </label>
            <select
              value={filters.sides.length > 0 ? filters.sides[0] : 'all'}
              onChange={(e) => {
                const value = e.target.value
                setFilters({ sides: value === 'all' ? [] : [value] })
              }}
              className="input-glass w-full text-sm"
            >
              <option value="all">Tous</option>
              <option value="Client">Client</option>
              <option value="Server">Serveur</option>
              <option value="Both">Les deux</option>
            </select>
          </motion.div>

          {/* Status Filter */}
          <motion.div 
            className="mb-6"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-semibold text-secondary mb-2">
              Statut
            </label>
            <select
              value={filters.status.length > 0 ? filters.status[0] : 'all'}
              onChange={(e) => {
                const value = e.target.value
                setFilters({ status: value === 'all' ? [] : [value] })
              }}
              className="input-glass w-full text-sm"
            >
              <option value="all">Tous</option>
              <option value="installé">Installé</option>
              <option value="non installé">Non installé</option>
            </select>
          </motion.div>

          {/* Version Filter */}
          <motion.div 
            className="mb-6"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <motion.label 
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-amber-100/10 cursor-pointer group"
              whileHover={{ x: 4 }}
            >
              <input
                type="checkbox"
                checked={filters.showAllVersions}
                onChange={(e) => setFilters({ showAllVersions: e.target.checked })}
                className="w-4 h-4 rounded border-2 border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-2 bg-transparent"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-primary group-hover:text-amber-600 transition-colors">
                  Afficher toutes les versions
                </span>
                <p className="text-xs text-tertiary mt-1">
                  Inclure les mods avec des versions plus anciennes mais fonctionnelles
                </p>
              </div>
            </motion.label>
          </motion.div>

          {/* Categories */}
          <motion.div
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-semibold text-secondary mb-3">
              Catégories
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-glass">
              {categories.map((category, index) => (
                <motion.label 
                  key={`category-${category}-${index}`} 
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-amber-100/10 cursor-pointer group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 rounded border-2 border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-2 bg-transparent"
                  />
                  <span className="text-sm text-primary capitalize group-hover:text-amber-600 transition-colors">
                    {category}
                  </span>
                </motion.label>
              ))}
            </div>
          </motion.div>
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
          </motion.div>
        )}
      </div>
    </aside>
  )
}

export { Sidebar }