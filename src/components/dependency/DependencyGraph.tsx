import React, { useMemo, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  ConnectionMode,
  NodeTypes,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import useModStore from '../../store/modStore'

interface DependencyGraphProps {
  className?: string
}

// Custom node component for mods
const ModNode = ({ data }: { data: any }) => {
  const { mod, isSelected, isInModpack } = data

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md border-2 min-w-[120px] text-center transition-all ${
        isSelected
          ? 'bg-blue-100 border-blue-500 text-blue-900'
          : isInModpack
          ? 'bg-green-100 border-green-500 text-green-900'
          : 'glass border-primary text-primary'
      }`}
    >
      <div className="font-semibold text-sm truncate" title={mod.name}>
        {mod.name}
      </div>
      <div className="text-xs text-gray-600 mt-1">
        {mod.category}
      </div>
      <div className="text-xs mt-1">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
            mod.status === 'installé'
              ? 'bg-green-200 text-green-800'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {mod.status === 'installé' ? 'Installé' : 'Disponible'}
        </span>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  modNode: ModNode,
}

export default function DependencyGraph({ className = '' }: DependencyGraphProps) {
  const { mods, selectedMods, currentModpack } = useModStore()

  // Create nodes and edges from mod data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    const modsArray = Array.from(mods.values())
    const processedMods = new Set<string>()

    // Helper function to get mod position
    const getNodePosition = (index: number, total: number) => {
      const radius = Math.max(300, total * 30)
      const angle = (index * 2 * Math.PI) / total
      return {
        x: Math.cos(angle) * radius + 400,
        y: Math.sin(angle) * radius + 300,
      }
    }

    // First pass: create nodes for all mods
    modsArray.forEach((mod, index) => {
      const position = getNodePosition(index, modsArray.length)
      
      nodes.push({
        id: mod.id,
        type: 'modNode',
        position,
        data: {
          mod,
          isSelected: selectedMods.has(mod.id),
          isInModpack: currentModpack?.mods.some(m => m.id === mod.id) || false,
        },
      })

      processedMods.add(mod.id)
    })

    // Second pass: create edges for dependencies
    modsArray.forEach((mod) => {
      mod.dependencies.forEach((depName) => {
        // Find the dependency mod by name
        const depMod = modsArray.find(m => 
          m.name.toLowerCase().includes(depName.toLowerCase()) ||
          depName.toLowerCase().includes(m.name.toLowerCase())
        )

        if (depMod && depMod.id !== mod.id) {
          edges.push({
            id: `${mod.id}->${depMod.id}`,
            source: mod.id,
            target: depMod.id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#9CA3AF',
            },
            style: {
              stroke: '#9CA3AF',
              strokeWidth: 2,
            },
            label: 'requires',
            labelStyle: {
              fontSize: '10px',
              fill: '#6B7280',
            },
          })
        }
      })
    })

    return { nodes, edges }
  }, [mods, selectedMods, currentModpack])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when store changes
  React.useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onNodeClick = useCallback((_event: React.MouseEvent, _node: Node) => {
    // Node clicked: node.data.mod.name
  }, [])

  if (mods.size === 0) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-medium mb-2">Aucune dépendance à afficher</h3>
          <p className="text-sm">
            Chargez des mods pour voir le graphe de dépendances
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full bg-gray-50 ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background color="#f3f4f6" gap={20} />
        <Controls showInteractive={false} />
        
        {/* Custom legend */}
        <div className="absolute bottom-4 left-4 glass rounded-2xl shadow-lg p-3 text-sm">
          <h4 className="font-semibold mb-2">Légende</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
              <span>Dans le modpack</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
              <span>Sélectionné</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 glass border border-primary/20 rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-gray-400"></div>
              <span>Dépendance</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 glass rounded-2xl shadow-lg p-3 text-sm">
          <div className="space-y-1">
            <div><span className="font-medium">{nodes.length}</span> mods</div>
            <div><span className="font-medium">{edges.length}</span> dépendances</div>
            {selectedMods.size > 0 && (
              <div><span className="font-medium">{selectedMods.size}</span> sélectionnés</div>
            )}
            {currentModpack && (
              <div><span className="font-medium">{currentModpack.mods.length}</span> dans le pack</div>
            )}
          </div>
        </div>
      </ReactFlow>
    </div>
  )
}