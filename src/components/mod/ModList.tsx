import React, { useMemo, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import { 
  CheckIcon, 
  PlusIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import useModStore from '../../store/modStore'
import { ModCard } from './ModCard'
import { ModData } from '../../types/mod'

interface ModListProps {
  className?: string
}

interface ModListItemProps {
  index: number
  style: React.CSSProperties
  data: {
    mods: ModData[]
    selectedMods: Set<string>
    currentModpack: any
    onToggleSelect: (modId: string) => void
    onAddToModpack: (modId: string) => void
    onRemoveFromModpack: (modId: string) => void
  }
}

function ModListItem({ index, style, data }: ModListItemProps) {
  const mod = data.mods[index]
  const isSelected = data.selectedMods.has(mod.id)
  const isInModpack = data.currentModpack?.mods.some((modEntry: ModData) => modEntry.id === mod.id)
  
  return (
    <div style={style} className="px-4 py-2">
      <ModCard
        mod={mod}
        isSelected={isSelected}
        hasConflicts={false}
        onToggle={() => data.onToggleSelect(mod.id)}
        onViewDetails={() => {}}
      />
    </div>
  )
}

export default function ModList({ className = '' }: ModListProps) {
  const {
    getFilteredMods,
    selectedMods,
    currentModpack,
    toggleModSelection,
    addToModpack,
    removeFromModpack,
    clearSelection,
    getConflicts
  } = useModStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  const filteredMods = useMemo(() => getFilteredMods(), [getFilteredMods])
  const conflicts = useMemo(() => getConflicts(), [getConflicts])
  const selectedCount = selectedMods.size

  const handleBatchAddToModpack = () => {
    if (selectedCount > 0 && currentModpack) {
      addToModpack(Array.from(selectedMods))
      clearSelection()
    }
  }

  const handleBatchRemoveFromModpack = () => {
    if (selectedCount > 0 && currentModpack) {
      Array.from(selectedMods).forEach(modId => removeFromModpack(modId))
      clearSelection()
    }
  }

  const listData = {
    mods: filteredMods,
    selectedMods,
    currentModpack,
    onToggleSelect: toggleModSelection,
    onAddToModpack: (modId: string) => {
      if (currentModpack) addToModpack([modId])
    },
    onRemoveFromModpack: removeFromModpack
  }

  return (
    <div className={`flex flex-col h-full glass ${className}`}>
      {/* Header with stats and actions */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-secondary">
              <span className="font-medium">{filteredMods.length}</span> mods
              {selectedCount > 0 && (
                <span className="ml-2 text-amber-600">
                  • <span className="font-medium">{selectedCount}</span> sélectionnés
                </span>
              )}
            </div>
            
            {conflicts.length > 0 && (
              <div className="flex items-center space-x-1 text-amber-600">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{conflicts.length} conflit(s)</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Batch actions */}
            {selectedCount > 0 && currentModpack && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleBatchAddToModpack}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <PlusIcon className="w-3 h-3 mr-1" />
                  Ajouter ({selectedCount})
                </button>
                <button
                  onClick={handleBatchRemoveFromModpack}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Retirer ({selectedCount})
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-xs rounded-l-md ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 text-xs rounded-r-md border-l border-gray-300 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grille
              </button>
            </div>
          </div>
        </div>

        {/* Modpack status */}
        {currentModpack && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-900">
                  Modpack: <span className="font-medium">{currentModpack.name}</span>
                </span>
              </div>
              <span className="text-xs text-blue-600">
                {currentModpack.mods.length} mods inclus
              </span>
            </div>
          </div>
        )}

        {/* Conflicts warning */}
        {conflicts.length > 0 && (
          <div className="mt-2 p-2 bg-amber-50 rounded-md">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-900">
                <div className="font-medium">Conflits détectés:</div>
                <ul className="mt-1 text-xs space-y-1">
                  {conflicts.slice(0, 3).map((conflict, index) => (
                    <li key={index}>
                      {conflict.mod1} ↔ {conflict.mod2}: {conflict.reason}
                    </li>
                  ))}
                  {conflicts.length > 3 && (
                    <li className="text-amber-600">
                      ... et {conflicts.length - 3} autres
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mod list content */}
      <div className="flex-1 overflow-hidden">
        {filteredMods.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <InformationCircleIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Aucun mod trouvé</h3>
              <p className="text-sm">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          </div>
        ) : (
          <List
            height={600} // This will be dynamically set by parent container
            itemCount={filteredMods.length}
            itemSize={viewMode === 'grid' ? 200 : 120}
            itemData={listData}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {ModListItem}
          </List>
        )}
      </div>

      {/* Selection summary */}
      {selectedCount > 0 && (
        <div className="flex-shrink-0 px-4 py-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-900">
              <CheckIcon className="w-4 h-4 inline mr-1" />
              {selectedCount} mod{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-blue-700">
              Utilisez les boutons ci-dessus pour des actions groupées
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { ModList }