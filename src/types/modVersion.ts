import { VSModDBDetailedMod, VSModDBRelease } from '../services/vsModDBAPI'

export interface ExtendedVSModDBMod extends VSModDBDetailedMod {
  selectedRelease?: VSModDBRelease
  forceAdded?: boolean
  compatibilityStatus?: 'compatible' | 'partially_compatible' | 'incompatible' | 'unknown'
  compatibilityNotes?: string
}

export interface VersionCompatibility {
  status: 'compatible' | 'partially_compatible' | 'incompatible'
  description: string
  color: string
  icon?: string
}

export interface ModVersionInfo {
  release: VSModDBRelease
  compatibility: VersionCompatibility
  isRecommended: boolean
  downloadCount: number
  releaseDate: Date
}