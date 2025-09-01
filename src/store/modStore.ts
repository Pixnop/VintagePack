import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ModData, ModpackConfiguration, SearchFilters } from '../types/mod'
import { TSVParser } from '../services/tsvParser'
import { DependencyResolver } from '../services/dependencyResolver'

interface ModStore {
  // State
  mods: Map<string, ModData>
  modpacks: ModpackConfiguration[]
  currentModpack: ModpackConfiguration | null
  originalModpackData: any | null // Store original JSON for downloads
  selectedMods: Set<string>
  searchQuery: string
  filters: SearchFilters
  isLoading: boolean
  error: string | null
  
  // Actions
  setMods: (mods: ModData[]) => void
  loadModsFromTSV: (tsvData: string) => Promise<void>
  loadModsFromJSON: (jsonData: any) => Promise<void>
  loadSampleData: () => Promise<void>
  searchMods: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  selectMod: (modId: string) => void
  deselectMod: (modId: string) => void
  toggleModSelection: (modId: string) => void
  clearSelection: () => void
  
  // Modpack actions
  createModpack: (name: string, description?: string) => void
  addToModpack: (modIds: string[]) => void
  removeFromModpack: (modId: string) => void
  saveModpack: () => void
  loadModpack: (modpack: ModpackConfiguration) => void
  exportModpack: (format: 'json' | 'tsv') => string
  importModpack: (data: string, format: 'json' | 'tsv') => Promise<void>
  
  // Computed getters
  getFilteredMods: () => ModData[]
  getDependencies: (modId: string) => string[]
  getConflicts: () => Array<{ mod1: string, mod2: string, reason: string }>
  addModToCurrentModpack: (mod: ModData) => void
  removeModFromCurrentModpack: (modId: string) => void
  clearError: () => void
  setError: (error: string) => void
}

const useModStore = create<ModStore>()(devtools(persist(
  (set, get) => ({
    // Initial state
    mods: new Map(),
    modpacks: [],
    currentModpack: null,
    originalModpackData: null,
    selectedMods: new Set(),
    searchQuery: '',
    filters: {
      categories: [],
      sides: [],
      status: [],
      gameVersions: [],
      tags: [],
      text: '',
      showAllVersions: false,
      sortBy: 'recent'
    },
    isLoading: false,
    error: null,

    // Actions
    setMods: (mods) => set(() => {
      const modMap = new Map()
      mods.forEach(mod => modMap.set(mod.id, mod))
      return { mods: modMap }
    }),

    loadModsFromTSV: async (tsvData) => {
      set({ isLoading: true, error: null })
      try {
        const mods = TSVParser.parse(tsvData)
        const validation = TSVParser.validate(mods)
        
        if (!validation.valid) {
          console.warn('TSV validation warnings:', validation.errors)
        }
        
        get().setMods(mods)
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to parse TSV data' })
      } finally {
        set({ isLoading: false })
      }
    },

    loadModsFromJSON: async (jsonData) => {
      set({ isLoading: true, error: null })
      try {
        // Convert JSON modpack format to ModData format
        const mods: ModData[] = jsonData.mods.map((mod: any) => ({
          id: mod.modidstr || mod.modid.toString(),
          name: mod.name,
          author: jsonData.author || 'Unknown',
          version: mod.version || '1.0.0',
          description: jsonData.description || '',
          category: 'Modpack',
          status: 'installé' as const,
          url: mod.downloadUrl || '',
          dependencies: mod.dependencies || [],
          side: mod.side || 'both',
          gameVersion: jsonData.gameVersion || '1.21.0'
        }))
        
        get().setMods(mods)
        
        // Set the current modpack
        const modpack: ModpackConfiguration = {
          id: jsonData.id || crypto.randomUUID(),
          name: jsonData.name,
          description: jsonData.description,
          version: jsonData.version,
          gameVersion: jsonData.gameVersion,
          mods: mods,
          created: new Date(jsonData.created || Date.now()),
          modified: new Date(),
          author: jsonData.author
        }
        
        set({ currentModpack: modpack, originalModpackData: jsonData })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to parse JSON data' })
      } finally {
        set({ isLoading: false })
      }
    },

    loadSampleData: async () => {
      set({ isLoading: true, error: null })
      try {
        // Try to load sample modpack
        const response = await fetch('/data/sample-modpack.json')
        if (response.ok) {
          const jsonData = await response.json()
          await get().loadModsFromJSON(jsonData)
        } else {
          // If no sample data available, create empty state
          console.warn('No sample data available, starting with empty state')
          get().setMods([])
        }
      } catch (error) {
        console.warn('Failed to load sample data, starting with empty state:', error)
        get().setMods([])
      } finally {
        set({ isLoading: false })
      }
    },

    searchMods: (query) => set({ searchQuery: query }),
    
    setFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),

    selectMod: (modId) => set((state) => {
      const newSelected = new Set(state.selectedMods)
      newSelected.add(modId)
      return { selectedMods: newSelected }
    }),

    deselectMod: (modId) => set((state) => {
      const newSelected = new Set(state.selectedMods)
      newSelected.delete(modId)
      return { selectedMods: newSelected }
    }),

    toggleModSelection: (modId) => {
      const state = get()
      if (state.selectedMods.has(modId)) {
        state.deselectMod(modId)
      } else {
        state.selectMod(modId)
      }
    },

    clearSelection: () => set({ selectedMods: new Set() }),

    createModpack: (name, description = '') => {
      const newModpack: ModpackConfiguration = {
        id: crypto.randomUUID(),
        name,
        description,
        version: '1.0.0',
        author: 'Local User',
        mods: [],
        gameVersion: '1.19.8',
        created: new Date(),
        modified: new Date()
      }
      set((state) => ({
        modpacks: [...state.modpacks, newModpack],
        currentModpack: newModpack
      }))
    },

    addToModpack: (modIds) => {
      const state = get()
      if (!state.currentModpack) return
      
      const newMods = modIds
        .map(modId => state.mods.get(modId))
        .filter((mod): mod is ModData => mod !== undefined)

      const updatedModpack = {
        ...state.currentModpack,
        mods: [...state.currentModpack.mods, ...newMods],
        modified: new Date()
      }

      set((state) => ({
        currentModpack: updatedModpack,
        modpacks: state.modpacks.map(mp => 
          mp.id === updatedModpack.id ? updatedModpack : mp
        )
      }))
    },

    removeFromModpack: (modId) => {
      const state = get()
      if (!state.currentModpack) return

      const updatedModpack = {
        ...state.currentModpack,
        mods: state.currentModpack.mods.filter(mod => mod.id !== modId),
        modified: new Date()
      }

      set((state) => ({
        currentModpack: updatedModpack,
        modpacks: state.modpacks.map(mp => 
          mp.id === updatedModpack.id ? updatedModpack : mp
        )
      }))
    },

    saveModpack: () => {
      const state = get()
      if (state.currentModpack) {
        const updated = { ...state.currentModpack, modified: new Date() }
        set({ currentModpack: updated })
      }
    },

    loadModpack: (modpack) => {
      // Charger les données du modpack et les mods associés
      const modMap = new Map()
      modpack.mods.forEach(mod => modMap.set(mod.id, mod))
      
      set({ 
        currentModpack: modpack,
        mods: modMap,
        originalModpackData: null // Reset original data when loading a different modpack
      })
    },

    exportModpack: (format) => {
      const state = get()
      if (!state.currentModpack) return ''
      
      if (format === 'json') {
        return JSON.stringify(state.currentModpack, null, 2)
      } else {
        // TSV format
        return TSVParser.serialize(state.currentModpack.mods)
      }
    },

    importModpack: async (data, format) => {
      set({ isLoading: true, error: null })
      try {
        let modpack: ModpackConfiguration
        
        if (format === 'json') {
          modpack = JSON.parse(data)
        } else {
          // TSV format - convert to modpack
          const mods = TSVParser.parse(data)
          modpack = {
            id: crypto.randomUUID(),
            name: 'Imported Modpack',
            description: 'Imported from TSV',
            version: '1.0.0',
            author: 'Imported',
            mods: mods,
            gameVersion: '1.19.8',
            created: new Date(),
            modified: new Date()
          }
          get().setMods(mods)
        }
        
        set((state) => ({
          modpacks: [...state.modpacks, modpack],
          currentModpack: modpack
        }))
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to import modpack' })
      } finally {
        set({ isLoading: false })
      }
    },

    getFilteredMods: () => {
      const state = get()
      const mods = Array.from(state.mods.values())
      
      return mods.filter(mod => {
        // Text search
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase()
          if (!mod.name.toLowerCase().includes(query) && 
              !mod.category.toLowerCase().includes(query)) {
            return false
          }
        }

        // Category filter
        if (state.filters.categories.length > 0) {
          if (!state.filters.categories.includes(mod.category)) {
            return false
          }
        }

        // Side filter  
        if (state.filters.sides.length > 0) {
          if (!state.filters.sides.includes(mod.side)) {
            return false
          }
        }

        // Status filter
        if (state.filters.status.length > 0) {
          if (!state.filters.status.includes(mod.status)) {
            return false
          }
        }

        return true
      })
    },

    getDependencies: (modId) => {
      const state = get()
      const mod = state.mods.get(modId)
      return mod?.dependencies || []
    },

    getConflicts: () => {
      const state = get()
      const resolver = new DependencyResolver()
      return resolver.detectConflicts(Array.from(state.mods.values()))
    },

    addModToCurrentModpack: (mod) => {
      const state = get()
      if (!state.currentModpack) {
        // Si aucun modpack n'est sélectionné, créer un modpack temporaire
        const tempModpack: ModpackConfiguration = {
          id: 'temp_' + crypto.randomUUID(),
          name: 'Nouveau Modpack',
          description: 'Modpack créé automatiquement',
          version: '1.0.0',
          author: 'Local User',
          mods: [mod],
          gameVersion: '1.21.0',
          created: new Date(),
          modified: new Date()
        }
        
        set({
          currentModpack: tempModpack,
          modpacks: [...state.modpacks, tempModpack]
        })
      } else {
        // Ajouter le mod au modpack existant s'il n'y est pas déjà
        const existingMod = state.currentModpack.mods.find(m => m.id === mod.id)
        if (!existingMod) {
          const updatedModpack = {
            ...state.currentModpack,
            mods: [...state.currentModpack.mods, mod],
            modified: new Date()
          }
          
          set({
            currentModpack: updatedModpack,
            modpacks: state.modpacks.map(mp => 
              mp.id === updatedModpack.id ? updatedModpack : mp
            )
          })
        }
      }
      
      // Ajouter le mod à la collection globale aussi
      const newMods = new Map(state.mods)
      newMods.set(mod.id, mod)
      set({ mods: newMods })
    },

    removeModFromCurrentModpack: (modId) => {
      const state = get()
      if (!state.currentModpack) return
      
      const updatedModpack = {
        ...state.currentModpack,
        mods: state.currentModpack.mods.filter(mod => mod.id !== modId),
        modified: new Date()
      }
      
      set({
        currentModpack: updatedModpack,
        modpacks: state.modpacks.map(mp => 
          mp.id === updatedModpack.id ? updatedModpack : mp
        )
      })
    },

    clearError: () => {
      set({ error: null })
    },

    setError: (error: string) => {
      set({ error })
    }
  }),
  {
    name: 'vintage-pack-store',
    partialize: (state) => ({
      modpacks: state.modpacks,
      filters: state.filters
    })
  }
)))

export default useModStore