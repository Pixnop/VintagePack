# VintagePack - Modern Web Interface Design

## 1. UI/UX Design Recommendations & Modern Frameworks

### Framework Selection: **React 18 + Vite**
**Rationale:**
- **Static Site Compatibility**: React with static generation works perfectly with GitHub Pages
- **Performance**: Vite provides fast development and optimized builds
- **Modern Features**: React 18's concurrent rendering for smooth UX with large datasets
- **Ecosystem**: Rich component libraries and accessibility tools

### Architecture Stack:
```
Frontend Framework: React 18 + TypeScript
Build Tool: Vite
Styling: Tailwind CSS + HeadlessUI
State Management: Zustand (lightweight, perfect for static apps)
Data Visualization: D3.js + React Flow (dependency graphs)
Icons: Heroicons + Lucide React
Testing: Vitest + React Testing Library
```

### Design System - Modern Professional Aesthetic:
- **Color Palette**: Vintage Story inspired earth tones with modern contrast ratios
  - Primary: Deep forest green (#1f4e4e)
  - Secondary: Warm amber (#f59e0b)
  - Neutral: Slate grays (#475569, #64748b, #f1f5f9)
  - Status: Semantic colors (success: #10b981, warning: #f59e0b, error: #ef4444)

- **Typography**: Inter font family for excellent readability
- **Spacing**: 4px base unit system (4, 8, 12, 16, 24, 32, 48, 64px)
- **Shadows**: Subtle elevation system for depth without clutter

## 2. Component Architecture & User Flow Design

### Core Components Structure:
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Navigation, search, actions
│   │   ├── Sidebar.tsx         # Category filters, quick actions
│   │   └── Layout.tsx          # Main app container
│   ├── mod/
│   │   ├── ModCard.tsx         # Individual mod display
│   │   ├── ModList.tsx         # Grid/list view container
│   │   ├── ModDetails.tsx      # Expanded mod information
│   │   └── DependencyGraph.tsx # Visual dependency tree
│   ├── modpack/
│   │   ├── ModpackBuilder.tsx  # Drag-drop interface
│   │   ├── ModpackExporter.tsx # Export/import functionality
│   │   └── ModpackPreview.tsx  # Configuration preview
│   ├── ui/
│   │   ├── Button.tsx          # Reusable button variants
│   │   ├── Card.tsx            # Content containers
│   │   ├── Modal.tsx           # Overlays and dialogs
│   │   ├── ProgressBar.tsx     # Batch operation progress
│   │   └── SearchInput.tsx     # Enhanced search component
│   └── features/
│       ├── BatchInstaller.tsx  # Multi-mod operations
│       ├── FilterPanel.tsx     # Advanced filtering
│       └── StatusIndicator.tsx # Installation status
```

### User Flow Design:

#### Primary Flow: "Create Modpack"
1. **Discovery** → Browse/search mods with rich filtering
2. **Selection** → Add mods to pack with dependency validation
3. **Visualization** → View dependency graph, resolve conflicts
4. **Configuration** → Set mod priorities, optional configurations
5. **Export** → Generate shareable modpack file
6. **Validation** → Verify compatibility and completeness

#### Secondary Flow: "Import & Modify"
1. **Import** → Load existing modpack or TSV file
2. **Review** → Visualize current configuration
3. **Modify** → Add/remove/update mods
4. **Validate** → Check for conflicts or missing dependencies
5. **Export** → Save updated configuration

## 3. Accessibility Considerations (WCAG 2.1 AA Compliance)

### Keyboard Navigation:
- **Tab Order**: Logical flow through all interactive elements
- **Focus Management**: Visible focus indicators, skip links
- **Shortcuts**: Common actions (Ctrl+F for search, Esc to close modals)

### Screen Reader Support:
- **Semantic HTML**: Proper heading hierarchy, landmark roles
- **ARIA Labels**: Descriptive labels for complex interactions
- **Status Updates**: Live regions for batch operation progress
- **Table Navigation**: Proper table headers and navigation for mod lists

### Visual Accessibility:
- **Contrast Ratios**: Minimum 4.5:1 for text, 3:1 for UI elements
- **Color Independence**: Never rely on color alone for information
- **Font Scaling**: Responsive typography up to 200% zoom
- **Motion**: Respect prefers-reduced-motion for animations

### Implementation Examples:
```typescript
// Accessible ModCard component
const ModCard = ({ mod }: { mod: Mod }) => {
  return (
    <article
      role="article"
      aria-labelledby={`mod-title-${mod.id}`}
      className="focus-within:ring-2 focus-within:ring-amber-500"
    >
      <h3 id={`mod-title-${mod.id}`}>{mod.name}</h3>
      <button
        aria-describedby={`mod-description-${mod.id}`}
        onClick={() => toggleMod(mod.id)}
      >
        {mod.isInstalled ? 'Remove' : 'Add'} {mod.name}
      </button>
      <p id={`mod-description-${mod.id}`}>{mod.description}</p>
    </article>
  );
};
```

## 4. Performance Optimization for Large Datasets

### Data Management:
- **Virtual Scrolling**: React Window for large mod lists (1000+ items)
- **Pagination**: Server-side style pagination for better UX
- **Lazy Loading**: Load mod details and images on demand
- **Search Optimization**: Debounced search with client-side indexing using Fuse.js

### Bundle Optimization:
```typescript
// Code splitting by route
const ModpackBuilder = lazy(() => import('./components/modpack/ModpackBuilder'));
const DependencyGraph = lazy(() => import('./components/mod/DependencyGraph'));

// Tree shaking for lodash utilities
import { debounce, groupBy } from 'lodash-es';

// Dynamic imports for heavy features
const loadD3 = () => import('d3').then(d3 => d3);
```

### Caching Strategy:
- **Service Worker**: Cache mod data and assets for offline use
- **IndexedDB**: Client-side database for mod metadata and user preferences
- **Memory Caching**: In-memory cache for frequently accessed data
- **Image Optimization**: WebP format with fallbacks, lazy loading

### Performance Metrics Targets:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 5. Interactive Elements for Dependency Visualization

### Dependency Graph Component:
```typescript
interface DependencyGraphProps {
  mods: Mod[];
  selectedMods: string[];
  onModSelect: (modId: string) => void;
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ mods, selectedMods, onModSelect }) => {
  // Use React Flow for interactive node-based visualization
  const nodes = mods.map(mod => ({
    id: mod.id,
    data: { 
      label: mod.name, 
      status: mod.isInstalled ? 'installed' : 'available',
      category: mod.category 
    },
    position: calculatePosition(mod), // Auto-layout algorithm
    className: getNodeClassName(mod)
  }));

  const edges = calculateDependencies(mods);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={(event, node) => onModSelect(node.id)}
      fitView
      attributionPosition="bottom-right"
    >
      <Background variant="dots" />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
```

### Interactive Features:
1. **Node Types**:
   - **Library Mods**: Diamond shape, central positioning
   - **Content Mods**: Circular nodes, grouped by category
   - **Client/Server**: Different border styles
   - **Conflict Indicators**: Red edges, warning icons

2. **Graph Interactions**:
   - **Click to Select**: Add/remove mods from current pack
   - **Hover Details**: Tooltip with mod information
   - **Zoom & Pan**: Navigate large dependency trees
   - **Filter Modes**: Show only selected, show conflicts, show by category

3. **Visual Indicators**:
   - **Status Colors**: Green (installed), blue (selected), gray (available), red (conflict)
   - **Dependency Lines**: Solid (required), dashed (optional), thick (circular dependency)
   - **Grouping**: Visual clusters by mod category or author

### Conflict Resolution Interface:
```typescript
const ConflictResolver = ({ conflicts }: { conflicts: ModConflict[] }) => {
  return (
    <Modal title="Dependency Conflicts Detected">
      {conflicts.map(conflict => (
        <div key={conflict.id} className="border-l-4 border-red-500 pl-4">
          <h4>{conflict.type}: {conflict.description}</h4>
          <div className="mt-2 space-x-2">
            <Button onClick={() => resolveConflict(conflict, 'auto')}>
              Auto-resolve
            </Button>
            <Button variant="outline" onClick={() => showManualOptions(conflict)}>
              Choose manually
            </Button>
          </div>
        </div>
      ))}
    </Modal>
  );
};
```

## 6. Data Integration & API Strategy

### TSV Parser:
```typescript
interface ModData {
  name: string;
  url: string;
  side: 'Both' | 'Client' | 'Server';
  dependencies: string[];
  category: string;
  status: 'installé' | 'non installé';
  config?: string;
}

const parseTSV = (tsvContent: string): ModData[] => {
  const lines = tsvContent.split('\n');
  const headers = lines[0].split('\t');
  
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    return {
      name: values[0],
      url: values[1],
      side: values[2] as ModData['side'],
      dependencies: values[3] ? values[3].split(',').map(dep => dep.trim()) : [],
      category: values[4],
      status: values[5] as ModData['status'],
      config: values[6]
    };
  });
};
```

### API Integration Pattern:
```typescript
class VSModDBClient {
  private baseURL = 'https://mods.vintagestory.at/api';

  async fetchMod(modId: string): Promise<ModDetails> {
    const response = await fetch(`${this.baseURL}/mod/${modId}`);
    return response.json();
  }

  async searchMods(query: string, filters: SearchFilters): Promise<ModSearchResult> {
    const params = new URLSearchParams({
      text: query,
      ...filters
    });
    const response = await fetch(`${this.baseURL}/mods?${params}`);
    return response.json();
  }

  // Batch fetch with rate limiting
  async fetchModsBatch(modIds: string[]): Promise<ModDetails[]> {
    const batches = chunk(modIds, 5); // Rate limiting
    const results: ModDetails[] = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(id => this.fetchMod(id));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
    }
    
    return results;
  }
}
```

This comprehensive design provides a modern, accessible, and performant foundation for your Vintage Story modpack manager. The interface will be intuitive for users while handling the complexity of mod dependencies and large datasets effectively.