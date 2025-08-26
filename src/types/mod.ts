/**
 * Core type definitions for Vintage Story mod management
 */

export interface ModData {
  id: string;
  name: string;
  url: string;
  side: 'Both' | 'Client' | 'Server';
  dependencies: string[];
  category: string;
  status: 'installé' | 'non installé';
  config?: string;
}

export interface ModDetails extends ModData {
  description: string;
  author: string;
  version: string;
  downloadUrl: string;
  imageUrl?: string;
  tags: string[];
  gameVersions: string[];
  downloads: number;
  rating: number;
  lastUpdated: Date;
}

export interface ModConflict {
  id: string;
  type: 'dependency' | 'incompatible' | 'version' | 'circular';
  description: string;
  mods: string[];
  severity: 'error' | 'warning' | 'info';
  resolution?: string;
}

export interface ModpackConfiguration {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  mods: ModData[];
  gameVersion: string;
  created: Date;
  modified: Date;
}

export interface SearchFilters {
  categories: string[];
  sides: string[];
  status: string[];
  gameVersions: string[];
  tags: string[];
  text: string;
  showAllVersions: boolean;
}

export interface DependencyNode {
  id: string;
  name: string;
  category: string;
  status: ModData['status'];
  dependencies: string[];
  dependents: string[];
  level: number; // Depth in dependency tree
  position: { x: number; y: number };
}

export interface BatchOperation {
  id: string;
  type: 'install' | 'uninstall' | 'update';
  mods: string[];
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  errors: string[];
}

export interface UIState {
  currentView: 'grid' | 'list' | 'graph';
  sidebarOpen: boolean;
  selectedMods: Set<string>;
  filters: SearchFilters;
  searchQuery: string;
  sortBy: 'name' | 'category' | 'status' | 'downloads' | 'rating';
  sortOrder: 'asc' | 'desc';
}