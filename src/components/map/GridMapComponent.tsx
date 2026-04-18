import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import NodeConfigPanel from './NodeConfigPanel';
import GraphToolbar, { type ToolMode } from './GraphToolbar';
import AddNodeDialog from './AddNodeDialog';
import AnimatedEdge from './AnimatedEdge';
import SimulationBar from './SimulationBar';
import GridDailyChart from './GridDailyChart';
import GridStatsPanel from './GridStatsPanel';
import { toast } from 'sonner';
import {
  type GraphNode,
  type GraphEdge,
  type InstallationType,
  DEFAULT_NODES,
  DEFAULT_EDGES,
  DEFAULT_CONSUMPTION,
  DEFAULT_GENERATION,
  INSTALLATION_ICONS,
  NODE_RADIUS,
  getNodeStatus,
  getNodeBalance,
  getTotalConsumption as calcConsumption,
  getTotalGeneration as calcGeneration,
  NODE_STATUS_COLORS,
  type NodeStatus,
  generateNodeId,
} from '@/lib/graph-types';

const STATUS_LABELS: Record<NodeStatus, string> = {
  consuming: 'Pobór > Generacja',
  balanced: 'Zbilansowany',
  producing: 'Generacja > Pobór',
};

const GridMapComponent = () => {
  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(DEFAULT_EDGES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragMoved, setDragMoved] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [animFrame, setAnimFrame] = useState(0);

  // Simulation state
  const [simHour, setSimHour] = useState<number>(12);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simEnabled, setSimEnabled] = useState(false);

  const currentHour = simEnabled ? simHour : null;

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => setAnimFrame((f) => f + 1), 40);
    return () => clearInterval(interval);
  }, []);

  // Simulation auto-advance
  useEffect(() => {
    if (!simPlaying || !simEnabled) return;
    const interval = setInterval(() => {
      setSimHour((h) => (h + 0.25 * simSpeed) % 24);
    }, 500);
    return () => clearInterval(interval);
  }, [simPlaying, simSpeed, simEnabled]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const handleNodeUpdate = useCallback((updated: GraphNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedId(null);
    toast.success('Węzeł usunięty');
  }, []);

  const handleAddNode = useCallback((type: InstallationType, name: string) => {
    const id = generateNodeId();
    const newNode: GraphNode = {
      id, type, name,
      x: 200 + Math.random() * 400,
      y: 150 + Math.random() * 250,
      consumption: { ...DEFAULT_CONSUMPTION },
      generation: { ...DEFAULT_GENERATION },
    };
    setNodes((prev) => [...prev, newNode]);
    setShowAddDialog(false);
    setSelectedId(id);
    toast.success(`Dodano: ${name}`);
  }, []);

  // Mouse handling for drag
  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (toolMode !== 'select') return;
    e.stopPropagation();
    setDraggingId(id);
    setDragMoved(false);
  }, [toolMode]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId || !svgRef.current) return;
      setDragMoved(true);
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      setNodes((prev) =>
        prev.map((n) => (n.id === draggingId ? { ...n, x: Math.max(40, Math.min(760, svgPt.x)), y: Math.max(40, Math.min(520, svgPt.y)) } : n))
      );
    },
    [draggingId]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleNodeClick = useCallback(
    (id: string) => {
      if (dragMoved) return;

      if (toolMode === 'delete') {
        handleDeleteNode(id);
        return;
      }

      if (toolMode === 'link') {
        if (!linkSource) {
          setLinkSource(id);
          return;
        }
        if (linkSource === id) {
          setLinkSource(null);
          return;
        }
        // Check if edge already exists
        const exists = edges.some(
          (e) => (e.from === linkSource && e.to === id) || (e.from === id && e.to === linkSource)
        );
        if (exists) {
          toast.error('Te węzły są już połączone');
        } else {
          setEdges((prev) => [...prev, { from: linkSource, to: id, flow_kw: 0 }]);
          toast.success('Połączono węzły');
        }
        setLinkSource(null);
        return;
      }

      if (toolMode === 'unlink') {
        const toRemove = edges.filter((e) => e.from === id || e.to === id);
        if (toRemove.length === 0) {
          toast.error('Brak połączeń do usunięcia');
        } else {
          setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
          toast.success(`Usunięto ${toRemove.length} połączeń`);
        }
        return;
      }

      // select mode
      setSelectedId((prev) => (prev === id ? null : id));
    },
    [toolMode, linkSource, edges, handleDeleteNode, dragMoved]
  );

  const handleReset = useCallback(() => {
    setNodes(DEFAULT_NODES);
    setEdges(DEFAULT_EDGES);
    setSelectedId(null);
    setToolMode('select');
    setLinkSource(null);
    toast.success('Sieć zresetowana');
  }, []);

  const handleImport = useCallback((importedNodes: GraphNode[], importedEdges: GraphEdge[]) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
    setSelectedId(null);
  }, []);

  // Compute edge flows
  const computedEdges = edges.map((edge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return edge;
    const fromBal = getNodeBalance(fromNode, currentHour ?? undefined);
    const toBal = getNodeBalance(toNode, currentHour ?? undefined);
    return { ...edge, flow_kw: fromBal - toBal };
  });

  // Grid summary
  const totalConsumption = nodes.reduce((s, n) => s + calcConsumption(n, currentHour ?? undefined), 0);
  const totalGeneration = nodes.reduce((s, n) => s + calcGeneration(n, currentHour ?? undefined), 0);
  const totalBattery = nodes.reduce((s, n) => s + n.generation.battery_kwh, 0);
  const gridBalance = totalGeneration - totalConsumption;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="text-center space-y-1 mb-2">
        <h2 className="text-2xl font-bold font-display text-foreground">Sieć Smart Grid</h2>
        <p className="text-sm text-muted-foreground">
          Buduj sieć, konfiguruj węzły, uruchom symulację dobową
        </p>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs flex-wrap">
        {(Object.entries(STATUS_LABELS) as [NodeStatus, string][]).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: NODE_STATUS_COLORS[key] }} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Simulation bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setSimEnabled(!simEnabled); if (!simEnabled) setSimPlaying(false); }}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
            simEnabled ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {simEnabled ? '⏱️ Symulacja ON' : '⏱️ Symulacja OFF'}
        </button>
        {simEnabled && (
          <div className="flex-1">
            <SimulationBar
              hour={simHour}
              playing={simPlaying}
              speed={simSpeed}
              onHourChange={setSimHour}
              onTogglePlay={() => setSimPlaying(!simPlaying)}
              onSpeedChange={setSimSpeed}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Graph canvas */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-border bg-card relative min-h-[520px]">
          <GraphToolbar
            mode={toolMode}
            onModeChange={(m) => { setToolMode(m); setLinkSource(null); }}
            onAddNode={() => setShowAddDialog(true)}
            onReset={handleReset}
            linkSource={linkSource}
          />

          <svg
            ref={svgRef}
            viewBox="0 0 800 560"
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => { if (toolMode === 'select') setSelectedId(null); }}
          >
            {/* Grid pattern background */}
            <defs>
              <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="0.5" fill="hsl(220, 15%, 20%)" />
              </pattern>
            </defs>
            <rect width="800" height="560" fill="url(#grid-dots)" />

            {/* Edges */}
            {computedEdges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.from);
              const to = nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const isHighlighted = hoveredId === edge.from || hoveredId === edge.to
                || selectedId === edge.from || selectedId === edge.to;
              return (
                <AnimatedEdge
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  flow_kw={edge.flow_kw}
                  highlighted={isHighlighted}
                  animFrame={animFrame}
                />
              );
            })}

            {/* Link-in-progress line */}
            {linkSource && hoveredId && hoveredId !== linkSource && (() => {
              const from = nodes.find((n) => n.id === linkSource);
              const to = nodes.find((n) => n.id === hoveredId);
              if (!from || !to) return null;
              return (
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="hsl(220, 80%, 60%)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  className="pointer-events-none"
                />
              );
            })()}

            {/* Nodes */}
            {nodes.map((node) => {
              const status = getNodeStatus(node, currentHour ?? undefined);
              const balance = getNodeBalance(node, currentHour ?? undefined);
              const color = NODE_STATUS_COLORS[status];
              const isSelected = selectedId === node.id;
              const isHovered = hoveredId === node.id;
              const isLinkSource = linkSource === node.id;

              const shouldPulse = status !== 'balanced';
              const pulsePhase = animFrame * (status === 'consuming' ? 0.06 : 0.08);
              const pulseScale = shouldPulse ? 1 + 0.08 * Math.abs(Math.sin(pulsePhase)) : 1;
              const pulseOpacity = shouldPulse ? 0.12 + 0.18 * Math.abs(Math.sin(pulsePhase)) : 0;

              const radius = NODE_RADIUS[node.type];

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onMouseUp={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`${toolMode === 'delete' ? 'cursor-crosshair' : toolMode === 'link' ? 'cursor-cell' : 'cursor-pointer'}`}
                >
                  {/* Pulse ring */}
                  {shouldPulse && (
                    <circle r={radius * pulseScale + 8} fill={color} opacity={pulseOpacity} className="pointer-events-none" />
                  )}
                  {/* Link source indicator */}
                  {isLinkSource && (
                    <circle r={radius + 10} fill="none" stroke="hsl(220, 80%, 60%)" strokeWidth={2} strokeDasharray="4 3" opacity={0.8} className="pointer-events-none" />
                  )}
                  {/* Selection ring */}
                  {isSelected && (
                    <circle r={radius + 6} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 3" opacity={0.7} />
                  )}
                  {/* Main circle */}
                  <circle
                    r={radius}
                    fill={`${color}${isHovered || isSelected ? '30' : '18'}`}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all duration-150"
                  />
                  {/* Icon */}
                  <text textAnchor="middle" dominantBaseline="central" fontSize={node.type === 'estate' ? 20 : 18} className="pointer-events-none select-none" y={-2}>
                    {INSTALLATION_ICONS[node.type]}
                  </text>
                  {/* Balance label */}
                  <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill={color} fontWeight={600} fontFamily="monospace" className="pointer-events-none" y={14}>
                    {balance > 0 ? '+' : ''}{balance.toFixed(1)} kW
                  </text>
                  {/* Name label */}
                  <text textAnchor="middle" y={radius + 16} fontSize={10} fill="hsl(220, 10%, 55%)" fontWeight={500} className="pointer-events-none">
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Add node dialog */}
          <AnimatePresence>
            {showAddDialog && (
              <AddNodeDialog onAdd={handleAddNode} onClose={() => setShowAddDialog(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Config panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeConfigPanel
              key={selectedNode.id}
              node={selectedNode}
              simulationHour={currentHour}
              onUpdate={handleNodeUpdate}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 24h Chart */}
      <GridDailyChart nodes={nodes} currentHour={currentHour} />

      {/* Stats panel with export/import */}
      <GridStatsPanel nodes={nodes} edges={edges} currentHour={currentHour} onImport={handleImport} />
    </div>
  );
};

export default GridMapComponent;
