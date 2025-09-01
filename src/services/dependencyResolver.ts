import { ModData, ModConflict, DependencyNode } from '../types/mod';

export class DependencyResolver {
  /**
   * Detect conflicts in a mod collection
   */
  detectConflicts(mods: any[]): Array<{ mod1: string, mod2: string, reason: string }> {
    const conflicts: Array<{ mod1: string, mod2: string, reason: string }> = []
    
    for (let i = 0; i < mods.length; i++) {
      for (let j = i + 1; j < mods.length; j++) {
        const mod1 = mods[i]
        const mod2 = mods[j]
        
        // Check for side conflicts
        if (mod1.side === 'Client' && mod2.side === 'Server') {
          conflicts.push({
            mod1: mod1.name,
            mod2: mod2.name,
            reason: 'Incompatible sides (Client vs Server)'
          })
        }
        
        // Check for same category conflicts (simplified)
        if (mod1.category === mod2.category && 
            (mod1.category === 'generation' || mod1.category === 'armes')) {
          conflicts.push({
            mod1: mod1.name,
            mod2: mod2.name,
            reason: `Multiple ${mod1.category} mods may conflict`
          })
        }
      }
    }
    
    return conflicts
  }
  /**
   * Resolve dependencies for a set of selected mods
   */
  static resolveDependencies(
    selectedMods: string[],
    allMods: ModData[]
  ): { 
    resolved: string[]; 
    conflicts: ModConflict[]; 
    missing: string[] 
  } {
    const modMap = new Map(allMods.map(mod => [mod.id, mod]));
    const resolved = new Set<string>();
    const conflicts: ModConflict[] = [];
    const missing: string[] = [];
    const visiting = new Set<string>();

    const resolveMod = (modId: string, path: string[] = []): void => {
      if (resolved.has(modId)) return;
      
      const mod = modMap.get(modId);
      if (!mod) {
        if (!missing.includes(modId)) {
          missing.push(modId);
        }
        return;
      }

      // Check for circular dependencies
      if (visiting.has(modId)) {
        conflicts.push({
          id: `circular_${Date.now()}`,
          type: 'circular',
          description: `Circular dependency detected: ${[...path, modId].join(' → ')}`,
          mods: [...path, modId],
          severity: 'error'
        });
        return;
      }

      visiting.add(modId);

      // Resolve dependencies first
      for (const depId of mod.dependencies) {
        resolveMod(depId, [...path, modId]);
      }

      visiting.delete(modId);
      resolved.add(modId);
    };

    // Resolve all selected mods
    for (const modId of selectedMods) {
      resolveMod(modId);
    }

    // Check for incompatibilities
    const incompatibilityConflicts = this.checkIncompatibilities(
      Array.from(resolved),
      allMods
    );
    
    conflicts.push(...incompatibilityConflicts);

    return {
      resolved: Array.from(resolved),
      conflicts,
      missing
    };
  }

  /**
   * Check for known incompatibilities between mods
   */
  private static checkIncompatibilities(
    modIds: string[],
    allMods: ModData[]
  ): ModConflict[] {
    const conflicts: ModConflict[] = [];
    const modMap = new Map(allMods.map(mod => [mod.id, mod]));

    // Known incompatibility patterns
    const incompatibilityRules = [
      {
        pattern: /combat.*overhaul/i,
        conflictsWith: /weapons?.*mod/i,
        description: 'Combat overhaul mods may conflict with weapon mods'
      },
      {
        pattern: /worldgen|generation/i,
        conflictsWith: /worldgen|generation/i,
        description: 'Multiple world generation mods may conflict'
      }
    ];

    // Check side compatibility (Client vs Server)
    const clientOnlyMods = modIds.filter(id => {
      const mod = modMap.get(id);
      return mod?.side === 'Client';
    });

    const serverOnlyMods = modIds.filter(id => {
      const mod = modMap.get(id);
      return mod?.side === 'Server';
    });

    if (clientOnlyMods.length > 0 && serverOnlyMods.length > 0) {
      conflicts.push({
        id: `side_conflict_${Date.now()}`,
        type: 'incompatible',
        description: 'Client-only and Server-only mods cannot be used together in the same pack',
        mods: [...clientOnlyMods, ...serverOnlyMods],
        severity: 'error'
      });
    }

    // Check pattern-based incompatibilities
    for (let i = 0; i < modIds.length; i++) {
      for (let j = i + 1; j < modIds.length; j++) {
        const mod1 = modMap.get(modIds[i]);
        const mod2 = modMap.get(modIds[j]);
        
        if (!mod1 || !mod2) continue;

        for (const rule of incompatibilityRules) {
          if (
            (rule.pattern.test(mod1.name) && rule.conflictsWith.test(mod2.name)) ||
            (rule.pattern.test(mod2.name) && rule.conflictsWith.test(mod1.name))
          ) {
            conflicts.push({
              id: `incompatible_${mod1.id}_${mod2.id}`,
              type: 'incompatible',
              description: rule.description,
              mods: [mod1.id, mod2.id],
              severity: 'warning'
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Build dependency tree for visualization
   */
  static buildDependencyTree(modIds: string[], allMods: ModData[]): DependencyNode[] {
    const modMap = new Map(allMods.map(mod => [mod.id, mod]));
    const nodes: DependencyNode[] = [];
    const processed = new Set<string>();

    // Calculate dependents (reverse dependencies)
    const dependentMap = new Map<string, string[]>();
    allMods.forEach(mod => {
      mod.dependencies.forEach(dep => {
        if (!dependentMap.has(dep)) {
          dependentMap.set(dep, []);
        }
        dependentMap.get(dep)!.push(mod.id);
      });
    });

    const calculateLevel = (modId: string, visited = new Set()): number => {
      if (visited.has(modId)) return 0; // Circular dependency
      
      const mod = modMap.get(modId);
      if (!mod || mod.dependencies.length === 0) return 0;

      visited.add(modId);
      const maxDepLevel = Math.max(
        ...mod.dependencies.map(dep => calculateLevel(dep, visited))
      );
      visited.delete(modId);
      
      return maxDepLevel + 1;
    };

    // Process each mod
    modIds.forEach(modId => {
      if (processed.has(modId)) return;

      const mod = modMap.get(modId);
      if (!mod) return;

      const level = calculateLevel(modId);
      const dependents = dependentMap.get(modId) || [];

      nodes.push({
        id: modId,
        name: mod.name,
        category: mod.category,
        status: mod.status,
        dependencies: mod.dependencies,
        dependents: dependents.filter(dep => modIds.includes(dep)),
        level,
        position: { x: 0, y: 0 } // Will be calculated by layout algorithm
      });

      processed.add(modId);
    });

    // Calculate positions using a simple hierarchical layout
    this.calculatePositions(nodes);

    return nodes;
  }

  /**
   * Calculate positions for dependency graph visualization
   */
  private static calculatePositions(nodes: DependencyNode[]): void {
    const levelGroups = new Map<number, DependencyNode[]>();
    
    // Group nodes by level
    nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });

    // Position nodes
    const levelWidth = 300;
    const nodeHeight = 80;
    
    Array.from(levelGroups.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([_level, levelNodes], levelIndex) => {
        const totalHeight = levelNodes.length * nodeHeight;
        const startY = -totalHeight / 2;
        
        levelNodes.forEach((node, index) => {
          node.position = {
            x: levelIndex * levelWidth,
            y: startY + (index * nodeHeight)
          };
        });
      });
  }

  /**
   * Generate installation order based on dependencies
   */
  static generateInstallationOrder(modIds: string[], allMods: ModData[]): string[] {
    const modMap = new Map(allMods.map(mod => [mod.id, mod]));
    const ordered: string[] = [];
    const processing = new Set<string>();
    const completed = new Set<string>();

    const processNode = (modId: string): void => {
      if (completed.has(modId)) return;
      if (processing.has(modId)) {
        // Circular dependency - add anyway to avoid infinite loop
        return;
      }

      const mod = modMap.get(modId);
      if (!mod) return;

      processing.add(modId);

      // Process dependencies first
      mod.dependencies.forEach(depId => {
        if (modIds.includes(depId)) {
          processNode(depId);
        }
      });

      processing.delete(modId);
      
      if (!completed.has(modId)) {
        ordered.push(modId);
        completed.add(modId);
      }
    };

    // Process all mods
    modIds.forEach(processNode);

    return ordered;
  }

  /**
   * Validate modpack configuration
   */
  static validateModpack(modIds: string[], allMods: ModData[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const resolution = this.resolveDependencies(modIds, allMods);
    
    // Add missing dependencies as errors
    if (resolution.missing.length > 0) {
      errors.push(`Missing dependencies: ${resolution.missing.join(', ')}`);
    }

    // Add conflicts
    resolution.conflicts.forEach(conflict => {
      const message = `${conflict.type}: ${conflict.description}`;
      if (conflict.severity === 'error') {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}