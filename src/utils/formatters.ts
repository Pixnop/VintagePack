/**
 * Utilitaires de formatage pour l'affichage
 */

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export const formatVersionCompatibility = (
  modTags: string[], 
  targetVersion: string
): {
  status: 'compatible' | 'partially_compatible' | 'incompatible'
  description: string
  color: string
} => {
  const hasExactMatch = modTags.includes(targetVersion)
  const majorVersion = targetVersion.split('.')[0]
  const hasPartialMatch = modTags.some(tag => tag.startsWith(majorVersion))
  
  if (hasExactMatch) {
    return {
      status: 'compatible',
      description: 'Compatible',
      color: 'text-green-500'
    }
  } else if (hasPartialMatch) {
    return {
      status: 'partially_compatible',
      description: 'Partiellement compatible',
      color: 'text-yellow-500'
    }
  } else {
    return {
      status: 'incompatible',
      description: 'Incompatible',
      color: 'text-red-500'
    }
  }
}

export const formatGameVersionTags = (tags: string[], _targetVersion?: string): string[] => {
  // Trier les tags par version (plus récente en premier)
  const versionTags = tags
    .filter(tag => /^\d+\.\d+/.test(tag)) // Ne garder que les tags de version
    .sort((a, b) => {
      const parseVersion = (v: string) => 
        v.split('.').map(n => parseInt(n) || 0)
      
      const aVersion = parseVersion(a)
      const bVersion = parseVersion(b)
      
      for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
        const aPart = aVersion[i] || 0
        const bPart = bVersion[i] || 0
        if (aPart !== bPart) return bPart - aPart // Décroissant
      }
      return 0
    })
    
  return versionTags
}