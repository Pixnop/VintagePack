import { ModData } from '../types/mod';

/**
 * Parse TSV data from the Vintage Story mod list format
 * Based on the structure: NOM	LIEN	side	Dépendance	ajout	étas	Colonne 1
 */
export class TSVParser {
  /**
   * Parse TSV content into ModData array
   */
  static parse(content: string): ModData[] {
    const lines = content.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    return dataLines
      .map((line, index) => {
        try {
          return this.parseLine(line, index);
        } catch (error) {
          console.warn(`Failed to parse line ${index + 2}:`, error);
          return null;
        }
      })
      .filter((mod): mod is ModData => mod !== null);
  }

  /**
   * Parse individual TSV line
   */
  private static parseLine(line: string, index: number): ModData | null {
    const columns = line.split('\t');
    
    // Skip empty lines
    if (columns.length < 6 || !columns[0]?.trim()) {
      return null;
    }

    const [name, url, side, dependencies, category, status] = columns.map(col => col.trim());

    // Extract mod ID from URL
    const modId = this.extractModId(url, name, index);
    
    // Parse dependencies
    const parsedDependencies = this.parseDependencies(dependencies);
    
    // Validate and normalize side
    const normalizedSide = this.normalizeSide(side);
    
    // Normalize status
    const normalizedStatus = this.normalizeStatus(status);

    return {
      id: modId,
      name: name || `Unknown Mod ${index + 1}`,
      url: url || '',
      side: normalizedSide,
      dependencies: parsedDependencies,
      category: category || 'other',
      status: normalizedStatus,
      config: columns[6] // Optional configuration
    };
  }

  /**
   * Extract mod ID from URL or generate from name
   */
  private static extractModId(url: string, name: string, index: number): string {
    if (!url) {
      return this.generateIdFromName(name, index);
    }

    // Try to extract from various URL patterns
    const patterns = [
      /\/show\/mod\/(\d+)/,     // https://mods.vintagestory.at/show/mod/4151
      /\/([^/]+)$/,             // https://mods.vintagestory.at/sortablestorage
      /modid=([^&]+)/,          // Query parameter
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback to generating from name
    return this.generateIdFromName(name, index);
  }

  /**
   * Generate consistent ID from mod name
   */
  private static generateIdFromName(name: string, index: number): string {
    if (!name?.trim()) {
      return `mod_${index + 1}`;
    }

    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 50) || `mod_${index + 1}`;
  }

  /**
   * Parse dependencies string into array
   */
  private static parseDependencies(dependencies: string): string[] {
    if (!dependencies?.trim()) {
      return [];
    }

    return dependencies
      .split(/[,;]/)
      .map(dep => dep.trim())
      .filter(dep => dep.length > 0);
  }

  /**
   * Normalize side values
   */
  private static normalizeSide(side: string): 'Both' | 'Client' | 'Server' {
    const normalized = side?.toLowerCase().trim();
    
    switch (normalized) {
      case 'client':
        return 'Client';
      case 'server':
        return 'Server';
      case 'both':
      case '':
      case undefined:
      default:
        return 'Both';
    }
  }

  /**
   * Normalize status values
   */
  private static normalizeStatus(status: string): 'installé' | 'non installé' {
    const normalized = status?.toLowerCase().trim();
    
    if (normalized === 'installé' || normalized === 'installed') {
      return 'installé';
    }
    
    return 'non installé';
  }

  /**
   * Generate TSV content from ModData array
   */
  static serialize(mods: ModData[]): string {
    const headers = ['NOM', 'LIEN', 'side', 'Dépendance', 'ajout', 'étas', 'Colonne 1'];
    
    const rows = mods.map(mod => [
      mod.name,
      mod.url,
      mod.side,
      mod.dependencies.join(', '),
      mod.category,
      mod.status,
      mod.config || ''
    ]);

    return [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n');
  }

  /**
   * Validate parsed data
   */
  static validate(mods: ModData[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for duplicate IDs
    const ids = new Set();
    const duplicateIds = new Set();
    
    mods.forEach(mod => {
      if (ids.has(mod.id)) {
        duplicateIds.add(mod.id);
      }
      ids.add(mod.id);
    });
    
    if (duplicateIds.size > 0) {
      errors.push(`Duplicate mod IDs found: ${Array.from(duplicateIds).join(', ')}`);
    }

    // Check for missing required fields
    mods.forEach((mod, index) => {
      if (!mod.name?.trim()) {
        errors.push(`Mod at line ${index + 2} missing name`);
      }
      if (!mod.category?.trim()) {
        errors.push(`Mod "${mod.name}" missing category`);
      }
    });

    // Check for broken dependency references
    const modIds = new Set(mods.map(mod => mod.id));
    mods.forEach(mod => {
      mod.dependencies.forEach(dep => {
        if (!modIds.has(dep) && !this.isExternalDependency(dep)) {
          errors.push(`Mod "${mod.name}" references unknown dependency: ${dep}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if dependency is external (not in current mod list)
   */
  private static isExternalDependency(dependency: string): boolean {
    // Common library mods that might not be in the list
    const commonLibraries = [
      'Common Lib',
      'XLib',
      'ShearLib',
      'Herbarium',
      'Combat Overhaul',
      'Overhaul lib'
    ];
    
    return commonLibraries.some(lib => 
      dependency.toLowerCase().includes(lib.toLowerCase())
    );
  }
}