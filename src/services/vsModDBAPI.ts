/**
 * VSModDB API Client
 * Complete client for interacting with mods.vintagestory.at API
 */

import { sampleVSModDBMods } from '../data/sampleMods'

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
}

class VSModDBAPIClient {
  private baseURL = 'https://mods.vintagestory.at/api'
  private siteURL = 'https://mods.vintagestory.at'
  private proxyURL = '' // Will use a CORS proxy for browser requests
  private allModsCache: VSModDBMod[] | null = null
  private cacheTimestamp: number = 0
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes
  private modDetailsCache: Map<number, VSModDBDetailedMod> = new Map()
  private detailsCacheTimestamps: Map<number, number> = new Map()
  
  constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Try multiple CORS proxy services for better reliability
      this.proxyURL = '' // Start without proxy, fallback if needed
    }
  }

  /**
   * Transform relative image URLs to absolute URLs 
   * For now, return null to use fallback images due to CORS issues
   */
  private transformImageUrl(url: string | null): string | null {
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
   * Make API request with proper headers and CORS handling
   */
  private async makeRequest<T>(endpoint: string, timeout = 8000): Promise<T> {
    // Check if we're in development mode (Vite proxy available)
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    
    if (isDevelopment) {
      // Use Vite proxy in development
      try {
        const url = `/api/vsmoddb${endpoint}`
        console.log(`🔄 Making request via Vite proxy: ${endpoint}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        console.log(`✅ Successfully fetched data via Vite proxy`)
        return data
      } catch (error) {
        console.warn(`❌ Vite proxy failed, falling back to CORS proxy:`, error.message)
      }
    }
    
    // Fallback to multiple CORS proxy services for production
    const proxies = [
      'https://api.codetabs.com/v1/proxy?quest=', // Nouveau proxy plus fiable
      'https://cors-anywhere.herokuapp.com/', 
      'https://corsproxy.io/?', // Garder comme fallback
      'https://proxy.cors.sh/', // Autre alternative
    ]
    
    for (const proxy of proxies) {
      try {
        const url = `${proxy}${encodeURIComponent(this.baseURL + endpoint)}`
        console.log(`🔄 Trying ${proxy.split('/')[2]} proxy...`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout / proxies.length) // Timeout plus court par proxy
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        console.log(`✅ Successfully fetched data via ${proxy.split('/')[2]}`)
        return data
      } catch (error) {
        console.warn(`❌ Failed with ${proxy.split('/')[2]} proxy:`, error.message)
        if (proxy === proxies[proxies.length - 1]) {
          throw new Error(`All proxy attempts failed. Last error: ${error.message}`)
        }
        // Continue to next proxy
      }
    }
    
    throw new Error('All proxy attempts failed')
  }

  /**
   * Get all mods from the API (cached for performance)
   */
  private async getAllModsFromAPI(): Promise<VSModDBMod[]> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.allModsCache && (now - this.cacheTimestamp) < this.cacheExpiry) {
      console.log(`📋 Using cached data (${this.allModsCache.length} mods)`)
      return this.allModsCache
    }
    
    try {
      console.log('🔍 API Request: /mods (fetching all mods for client-side pagination)')
      const response = await this.makeRequest<VSModDBModsResponse>('/mods')
      
      if (response.statuscode === '200' && response.mods) {
        const transformedMods = response.mods.map(mod => ({
          ...mod,
          logo: this.transformImageUrl(mod.logo)
        }))
        
        // Cache the results
        this.allModsCache = transformedMods
        this.cacheTimestamp = now
        
        console.log(`✅ Fetched and cached ${transformedMods.length} mods from API`)
        return transformedMods
      }
      
      console.warn('❌ API returned no mods or bad status')
      return []
    } catch (error) {
      console.warn('VSModDB API unavailable, using sample data:', error)
      return sampleVSModDBMods
    }
  }

  /**
   * Get list of mods with client-side pagination
   */
  async getMods(limit = 50, offset = 0): Promise<VSModDBMod[]> {
    const allMods = await this.getAllModsFromAPI()
    
    // Apply client-side pagination
    const paginatedMods = allMods.slice(offset, offset + limit)
    
    console.log(`📊 Client-side pagination: offset=${offset}, limit=${limit}`)
    console.log(`✅ Returning ${paginatedMods.length} mods (page ${Math.floor(offset/limit) + 1})`)
    
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
      console.log(`📋 Using cached details for mod ${modid}`)
      return cachedDetails
    }
    
    try {
      console.log(`🔍 Fetching details for mod ${modid}`)
      const response = await this.makeRequest<VSModDBModDetailResponse>(`/mod/${modid}`)
      
      if (response.statuscode === '200') {
        const details = {
          ...response.mod,
          logo: this.transformImageUrl(response.mod.logo)
        }
        
        // Cache the results
        this.modDetailsCache.set(modid, details)
        this.detailsCacheTimestamps.set(modid, now)
        
        console.log(`✅ Cached details for mod ${modid}`)
        return details
      }
      return null
    } catch (error) {
      console.warn(`VSModDB mod details unavailable for ${modid}, using fallback:`, error)
      // Return fallback data based on sample mods
      const sampleMod = sampleVSModDBMods.find(mod => mod.modid === modid)
      if (sampleMod) {
        const fallbackDetails = {
          ...sampleMod,
          releases: [],
          screenshots: []
        }
        
        // Cache the fallback too
        this.modDetailsCache.set(modid, fallbackDetails)
        this.detailsCacheTimestamps.set(modid, now)
        
        return fallbackDetails
      }
      return null
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
          
          console.log(`📦 Adding mod to pack: ${modDetails.name} v${latestRelease.modversion}`)
          console.log(`🔗 Download URL: ${downloadUrl}`)
          
          modPackEntries.push({
            modid: modDetails.modid,
            modidstr: latestRelease.modidstr,
            name: modDetails.name,
            version: latestRelease.modversion,
            downloadUrl: downloadUrl,
            filename: latestRelease.filename,
            side: modDetails.side,
            dependencies: [] // Would need to parse from mod text/description
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
      console.log(`🔄 Downloading mod file: ${mod.name} (${mod.filename})`)
      
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
          console.log(`🔄 Trying ${proxy.split('/')[2]} for download: ${mod.name}`)
          
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

          console.log(`✅ Downloaded ${mod.name} via ${proxy.split('/')[2]}`)
          return await response.blob()
        } catch (error) {
          console.warn(`❌ Failed to download ${mod.name} with ${proxy.split('/')[2]}:`, error.message)
          if (proxy === proxies[proxies.length - 1]) {
            throw new Error(`All download attempts failed for ${mod.name}. Last error: ${error.message}`)
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

    console.log(`🚀 Starting download of ${total} mods...`)

    for (const mod of modPack.mods) {
      try {
        console.log(`⏳ Downloading ${current + 1}/${total}: ${mod.name}`)
        
        if (!mod.downloadUrl) {
          throw new Error('No download URL available')
        }
        
        const blob = await this.downloadMod(mod)
        downloads.set(mod.filename, blob)
        current++
        
        console.log(`✅ Downloaded ${current}/${total}: ${mod.name} (${blob.size} bytes)`)
        
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

    console.log(`🎯 Download complete: ${downloads.size}/${total} mods successfully downloaded`)
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