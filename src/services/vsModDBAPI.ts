/**
 * VSModDB API Client
 * Complete client for interacting with mods.vintagestory.at API
 */

// No sample data - users must have CORS extension for real VSModDB data

// Types for VSModDB API responses
export interface VSModDBMod {
  modid: number
  assetid: number
  name: string
  summary: string
  text?: string
  modidstrs: string[]
  author: string
  urlalias: string | null
  side: 'client' | 'server' | 'both'
  type: 'mod' | 'theme'
  logo: string | null
  logofile?: string
  tags: string[]
  lastreleased: string
  downloads: number
  follows: number
  trendingpoints: number
  comments: number
  homepageurl?: string | null
  sourcecodeurl?: string | null
  trailervideourl?: string | null
  issuetrackerurl?: string | null
  wikiurl?: string | null
}

export interface VSModDBRelease {
  releaseid: number
  mainfile: string
  filename: string
  fileid: number
  downloads: number
  tags: string[] // Game versions
  modidstr: string
  modversion: string
  created: string
  changelog: string
}

export interface VSModDBDetailedMod extends VSModDBMod {
  releases: VSModDBRelease[]
  screenshots: any[]
}

export interface VSModDBModsResponse {
  statuscode: string
  mods: VSModDBMod[]
}

export interface VSModDBModDetailResponse {
  statuscode: string
  mod: VSModDBDetailedMod
}

export interface VSModDBGameVersion {
  tagid: number
  name: string
  color: string
}

export interface ModPack {
  name: string
  description: string
  version: string
  gameVersion: string
  author: string
  created: string
  mods: ModPackEntry[]
}

export interface ModPackEntry {
  modid: number
  modidstr: string
  name: string
  version: string
  downloadUrl: string
  filename: string
  side: string
  dependencies?: string[]
  gameVersions: string[] // Versions de jeu compatibles
  releaseId?: number // ID de la release spécifique
  forceAdded?: boolean // Ajouté malgré une incompatibilité
  compatibilityStatus?: 'compatible' | 'partially_compatible' | 'incompatible' | 'unknown'
  compatibilityNotes?: string
}

class VSModDBAPIClient {
  private baseURL = 'https://mods.vintagestory.at/api'
  private siteURL = 'https://mods.vintagestory.at'
  private allModsCache: VSModDBMod[] | null = null
  private cacheTimestamp: number = 0
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes
  private modDetailsCache: Map<number, VSModDBDetailedMod> = new Map()
  private detailsCacheTimestamps: Map<number, number> = new Map()
  
  constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Try multiple CORS proxy services for better reliability
      // Start without proxy, fallback if needed
    }
  }

  /**
   * Transform relative image URLs to absolute URLs 
   * For now, return null to use fallback images due to CORS issues
   */
  private transformImageUrl(_url: string | null): string | null {
    // Temporarily disable external images due to CORS issues
    // This will make LazyImage use fallback/placeholder instead
    return null
    
    // Original code kept for future reference:
    // if (!url) return null
    // let absoluteUrl: string
    // if (url.startsWith('http')) {
    //   absoluteUrl = url
    // } else if (url.startsWith('/')) {
    //   absoluteUrl = `${this.siteURL}${url}`
    // } else {
    //   absoluteUrl = `${this.siteURL}/${url}`
    // }
    // return absoluteUrl
  }

  /**
   * Make API request with smart CORS handling
   * Uses extension approach for maximum compatibility at zero cost
   */
  private async makeRequest<T>(endpoint: string, timeout = 8000): Promise<T> {
    // In development, use Vite proxy
    if (import.meta.env.DEV) {
      try {
        const response = await fetch(`/api/vsmoddb${endpoint}`, {
          headers: { 'Accept': 'application/json' }
        })
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.warn('Vite proxy unavailable, using fallback')
      }
    }
    
    // In production, try direct request first (works if user has CORS extension)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(this.baseURL + endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=300' // 5 min cache
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return await response.json()
      }
      
      throw new Error(`API returned ${response.status}`)
    } catch (error) {
      // If CORS fails, inform user and use sample data
      console.warn('🌐 Pour obtenir les données VSModDB officielles, installez une extension CORS comme "CORS Unblock" ou "CORS Everywhere"')
      throw error
    }
  }

  /**
   * Get all mods from the API (cached for performance)
   */
  private async getAllModsFromAPI(): Promise<VSModDBMod[]> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.allModsCache && (now - this.cacheTimestamp) < this.cacheExpiry) {
      return this.allModsCache
    }
    
    try {
      const response = await this.makeRequest<VSModDBModsResponse>('/mods')
      
      if (response.statuscode === '200' && response.mods) {
        const transformedMods = response.mods.map(mod => ({
          ...mod,
          logo: this.transformImageUrl(mod.logo)
        }))
        
        // Cache the results
        this.allModsCache = transformedMods
        this.cacheTimestamp = now
        
        return transformedMods
      }
      
      console.warn('❌ API returned no mods or bad status')
      return []
    } catch (error) {
      console.error('❌ VSModDB API indisponible:', error)
      throw new Error('Impossible d\'accéder à VSModDB. Veuillez installer une extension CORS.')
    }
  }

  /**
   * Get list of mods with client-side pagination
   */
  async getMods(limit = 50, offset = 0): Promise<VSModDBMod[]> {
    const allMods = await this.getAllModsFromAPI()
    
    // Apply client-side pagination
    const paginatedMods = allMods.slice(offset, offset + limit)
    
    
    return paginatedMods
  }

  /**
   * Get total count of mods available
   */
  async getTotalModsCount(): Promise<number> {
    const allMods = await this.getAllModsFromAPI()
    return allMods.length
  }

  /**
   * Get detailed information about a specific mod (cached)
   */
  async getModDetails(modid: number): Promise<VSModDBDetailedMod | null> {
    const now = Date.now()
    
    // Check if we have cached data that's still valid
    const cachedDetails = this.modDetailsCache.get(modid)
    const cacheTime = this.detailsCacheTimestamps.get(modid)
    
    if (cachedDetails && cacheTime && (now - cacheTime) < this.cacheExpiry) {
      return cachedDetails
    }
    
    try {
      const response = await this.makeRequest<VSModDBModDetailResponse>(`/mod/${modid}`)
      
      if (response.statuscode === '200') {
        const details = {
          ...response.mod,
          logo: this.transformImageUrl(response.mod.logo)
        }
        
        // Cache the results
        this.modDetailsCache.set(modid, details)
        this.detailsCacheTimestamps.set(modid, now)
        
        return details
      }
      return null
    } catch (error) {
      console.error(`❌ VSModDB mod details unavailable for ${modid}:`, error)
      throw new Error(`Impossible d'obtenir les détails du mod ${modid}. Veuillez vérifier votre extension CORS.`)
    }
  }

  /**
   * Search mods by query
   */
  async searchMods(query: string, limit = 50): Promise<VSModDBMod[]> {
    try {
      // The API doesn't seem to have a direct search endpoint,
      // so we'll fetch all mods and filter client-side
      const allMods = await this.getMods(200, 0)
      
      const searchLower = query.toLowerCase()
      return allMods.filter(mod => 
        mod.name.toLowerCase().includes(searchLower) ||
        mod.summary.toLowerCase().includes(searchLower) ||
        mod.author.toLowerCase().includes(searchLower) ||
        mod.tags.some(tag => tag.toLowerCase().includes(searchLower))
      ).slice(0, limit)
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  /**
   * Get mods by tag/category
   */
  async getModsByTag(tag: string): Promise<VSModDBMod[]> {
    try {
      const allMods = await this.getMods(200, 0)
      return allMods.filter(mod => 
        mod.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      )
    } catch (error) {
      console.error('Failed to fetch mods by tag:', error)
      return []
    }
  }

  /**
   * Get available game versions
   */
  async getGameVersions(): Promise<VSModDBGameVersion[]> {
    try {
      const response = await this.makeRequest<{statuscode: string, gameversions: VSModDBGameVersion[]}>('/gameversions')
      
      if (response.statuscode === '200') {
        return response.gameversions
      }
      return []
    } catch (error) {
      console.error('Failed to fetch game versions:', error)
      return []
    }
  }

  /**
   * Get latest release for a mod
   */
  getLatestRelease(mod: VSModDBDetailedMod, gameVersion?: string): VSModDBRelease | null {
    if (!mod.releases || mod.releases.length === 0) return null
    
    // Sort releases by date (newest first)
    const sortedReleases = [...mod.releases].sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )

    // If game version specified, try to find compatible release
    if (gameVersion) {
      const compatibleRelease = sortedReleases.find(release =>
        release.tags.includes(gameVersion)
      )
      if (compatibleRelease) return compatibleRelease
    }

    // Return latest release
    return sortedReleases[0]
  }

  /**
   * Get all releases for a mod with compatibility analysis
   */
  getReleasesWithCompatibility(mod: VSModDBDetailedMod, targetGameVersion: string) {
    const sortedReleases = [...mod.releases].sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )

    return sortedReleases.map(release => {
      const isExactMatch = release.tags.includes(targetGameVersion)
      const majorVersion = targetGameVersion.split('.')[0]
      const hasPartialCompatibility = release.tags.some(tag => 
        tag.startsWith(majorVersion)
      )
      
      let compatibility: 'compatible' | 'partially_compatible' | 'incompatible' = 'incompatible'
      if (isExactMatch) {
        compatibility = 'compatible'
      } else if (hasPartialCompatibility) {
        compatibility = 'partially_compatible'
      }

      return {
        ...release,
        compatibility,
        isRecommended: isExactMatch && release === sortedReleases[0]
      }
    })
  }

  /**
   * Get best release for a game version (exact match preferred, then latest)
   */
  getBestRelease(mod: VSModDBDetailedMod, gameVersion: string, allowIncompatible = false): VSModDBRelease | null {
    const releasesWithCompat = this.getReleasesWithCompatibility(mod, gameVersion)
    
    // First, try exact compatibility
    const compatible = releasesWithCompat.filter(r => r.compatibility === 'compatible')
    if (compatible.length > 0) return compatible[0]
    
    // Then, try partial compatibility
    const partiallyCompatible = releasesWithCompat.filter(r => r.compatibility === 'partially_compatible')
    if (partiallyCompatible.length > 0) return partiallyCompatible[0]
    
    // Finally, return latest if allowing incompatible
    if (allowIncompatible && releasesWithCompat.length > 0) {
      return releasesWithCompat[0]
    }
    
    return null
  }

  /**
   * Create a modpack from selected mods
   */
  async createModPack(
    name: string,
    description: string,
    modIds: number[],
    gameVersion: string
  ): Promise<ModPack> {
    const modPackEntries: ModPackEntry[] = []
    
    for (const modId of modIds) {
      const modDetails = await this.getModDetails(modId)
      if (modDetails) {
        const latestRelease = this.getLatestRelease(modDetails, gameVersion)
        
        if (latestRelease) {
          // Construct absolute download URL
          let downloadUrl = latestRelease.mainfile
          if (downloadUrl && !downloadUrl.startsWith('http')) {
            if (downloadUrl.startsWith('/')) {
              downloadUrl = `${this.siteURL}${downloadUrl}`
            } else {
              downloadUrl = `${this.siteURL}/${downloadUrl}`
            }
          }
          
          
          const releaseWithCompat = this.getReleasesWithCompatibility(modDetails, gameVersion)
          const selectedRelease = releaseWithCompat.find(r => r.releaseid === latestRelease.releaseid)

          modPackEntries.push({
            modid: modDetails.modid,
            modidstr: latestRelease.modidstr,
            name: modDetails.name,
            version: latestRelease.modversion,
            downloadUrl: downloadUrl,
            filename: latestRelease.filename,
            side: modDetails.side,
            dependencies: [], // Would need to parse from mod text/description
            gameVersions: latestRelease.tags,
            releaseId: latestRelease.releaseid,
            forceAdded: selectedRelease ? selectedRelease.compatibility === 'incompatible' : false,
            compatibilityStatus: selectedRelease?.compatibility || 'unknown'
          })
        }
      }
    }

    const modPack: ModPack = {
      name,
      description,
      version: '1.0.0',
      gameVersion,
      author: 'VintagePack User',
      created: new Date().toISOString(),
      mods: modPackEntries
    }

    return modPack
  }

  /**
   * Export modpack to JSON
   */
  exportModPackToJSON(modPack: ModPack): string {
    return JSON.stringify(modPack, null, 2)
  }

  /**
   * Import modpack from JSON
   */
  importModPackFromJSON(jsonString: string): ModPack {
    try {
      return JSON.parse(jsonString) as ModPack
    } catch (error) {
      throw new Error('Invalid modpack JSON format')
    }
  }

  /**
   * Download a mod file using the same proxy system as API calls
   */
  async downloadMod(mod: ModPackEntry): Promise<Blob> {
    try {
      
      // For downloads, we'll use CORS proxies directly since file downloads
      // require different handling than API calls
      
      // Fallback to CORS proxies for file downloads
      const proxies = [
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://cors-anywhere.herokuapp.com/',
        'https://corsproxy.io/?',
        'https://proxy.cors.sh/',
      ]
      
      for (const proxy of proxies) {
        try {
          const url = `${proxy}${encodeURIComponent(mod.downloadUrl)}`
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout for downloads
          
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`)
          }

          return await response.blob()
        } catch (error) {
          console.warn(`❌ Failed to download ${mod.name} with ${proxy.split('/')[2]}:`, (error as Error).message)
          if (proxy === proxies[proxies.length - 1]) {
            throw new Error(`All download attempts failed for ${mod.name}. Last error: ${(error as Error).message}`)
          }
        }
      }
      
      throw new Error(`All download attempts failed for ${mod.name}`)
    } catch (error) {
      console.error(`Failed to download mod ${mod.name}:`, error)
      throw error
    }
  }

  /**
   * Download all mods from a modpack
   */
  async downloadModPack(modPack: ModPack, onProgress?: (current: number, total: number) => void): Promise<Map<string, Blob>> {
    const downloads = new Map<string, Blob>()
    const total = modPack.mods.length
    let current = 0

    for (const mod of modPack.mods) {
      try {
        
        if (!mod.downloadUrl) {
          throw new Error('No download URL available')
        }
        
        const blob = await this.downloadMod(mod)
        downloads.set(mod.filename, blob)
        current++
        
        
        if (onProgress) {
          onProgress(current, total)
        }
      } catch (error) {
        console.error(`❌ Failed to download ${mod.name}:`, error)
        current++ // Still increment to show progress even on failures
        
        if (onProgress) {
          onProgress(current, total)
        }
      }
    }

    return downloads
  }

  /**
   * Create a zip file containing all mods from a modpack
   */
  async createModPackZip(modPack: ModPack, onProgress?: (current: number, total: number) => void): Promise<Blob> {
    // We'll need JSZip for this
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // Add modpack info
    zip.file('modpack.json', this.exportModPackToJSON(modPack))

    // Download and add all mods
    const downloads = await this.downloadModPack(modPack, onProgress)
    
    downloads.forEach((blob, filename) => {
      zip.file(`mods/${filename}`, blob)
    })

    // Add installation instructions
    const readme = `
# ${modPack.name}

## Description
${modPack.description}

## Game Version
${modPack.gameVersion}

## Installation
1. Extract all files from the 'mods' folder
2. Copy them to your Vintage Story mods folder:
   - Windows: %AppData%\\VintagestoryData\\Mods\\
   - Linux: ~/.config/VintagestoryData/Mods/
   - Mac: ~/Library/Application Support/VintagestoryData/Mods/

## Included Mods (${modPack.mods.length})
${modPack.mods.map(mod => `- ${mod.name} v${mod.version}`).join('\n')}

## Created
${new Date(modPack.created).toLocaleDateString()}
`
    zip.file('README.txt', readme)

    // Generate zip file
    return await zip.generateAsync({ type: 'blob' })
  }
}

// Create singleton instance
export const vsModDB = new VSModDBAPIClient()

export default VSModDBAPIClient