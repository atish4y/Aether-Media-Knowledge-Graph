"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ForceGraph } from "@/components/graph/force-graph";
import { getGraph, GraphData, GraphNode, findPath, getAllNodes } from "@/lib/api";
import { GitFork, Filter, Route, Search, X } from "lucide-react";

export default function GraphPage() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [graphHeight, setGraphHeight] = useState(600);
  const router = useRouter();

  // Sidebar modes: "filters" | "path" | null
  const [sidebarMode, setSidebarMode] = useState<"filters" | "path" | null>(null);

  // Filters State
  const [types, setTypes] = useState<string[]>(["Movie", "Actor", "Director", "Genre"]);
  const [minRating, setMinRating] = useState<number>(0);
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Path Finder State
  const [allNodes, setAllNodes] = useState<{ id: string; label: string; type: string }[]>([]);
  const [fromNode, setFromNode] = useState<string>("");
  const [toNode, setToNode] = useState<string>("");
  const [pathLoading, setPathLoading] = useState(false);
  const [pathLength, setPathLength] = useState<number | null>(null);

  useEffect(() => {
    setGraphHeight(window.innerHeight - 200);
    loadGraph();
    loadAllNodes();
  }, []);

  async function loadAllNodes() {
    try {
      const nodes = await getAllNodes();
      setAllNodes(nodes);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadGraph() {
    setLoading(true);
    try {
      const data = await getGraph(types.length < 4 || minRating > 0 ? {
        types, min_rating: minRating > 0 ? minRating : undefined
      } : undefined);
      setGraph(data);
      setPathLength(null);
    } catch (err) {
      console.error("Graph load error:", err);
    } finally {
      setLoading(false);
      setFiltersLoading(false);
    }
  }

  const applyFilters = () => {
    setFiltersLoading(true);
    loadGraph();
  };

  const handleFindPath = async () => {
    if (!fromNode || !toNode) return;
    setPathLoading(true);
    try {
      const pathData = await findPath(fromNode, toNode);
      if (pathData.nodes.length > 0) {
        setGraph({ nodes: pathData.nodes, links: pathData.links });
        setPathLength(pathData.path_length);
      } else {
        alert("No path found between these nodes.");
        setPathLength(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPathLoading(false);
    }
  };

  const handleResetPath = () => {
    setFromNode("");
    setToNode("");
    setPathLength(null);
    loadGraph();
  };

  const toggleType = (t: string) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === "Movie") {
      const id = node.id.replace("movie_", "");
      router.push(`/movie/${id}`);
    } else if (node.type === "Actor") {
      const id = node.id.replace("actor_", "");
      router.push(`/person/actor/${id}`);
    } else if (node.type === "Director") {
      const id = node.id.replace("director_", "");
      router.push(`/person/director/${id}`);
    } else if (node.type === "Genre") {
      router.push(`/movies?genre=${encodeURIComponent(node.label)}`);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <GitFork className="w-5 h-5 text-accent" />
            Interactive Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Explore relationships or find shortest paths</p>
        </div>
        
        <div className="flex bg-secondary p-1 rounded-lg border border-border">
          <button 
            onClick={() => setSidebarMode("filters")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${sidebarMode === "filters" ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button 
            onClick={() => setSidebarMode("path")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${sidebarMode === "path" ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Route className="w-3.5 h-3.5" /> Path Finder
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 h-full relative">
        {/* Main Graph Area */}
        <div className="flex-1 glass rounded-xl relative overflow-hidden mb-6">
          {loading || !graph ? (
            <div className="absolute inset-0 shimmer" />
          ) : (
             <ForceGraph data={graph} height={graphHeight - 40} onNodeClick={handleNodeClick} />
          )}
        </div>

        {/* Sidebar Panel */}
        {sidebarMode && (
          <div className="w-80 shrink-0 glass rounded-xl p-5 flex flex-col h-full animate-fade-up shadow-xl border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                {sidebarMode === "filters" ? <><Filter className="w-4 h-4 text-accent"/> Graph Filters</> : <><Route className="w-4 h-4 text-accent"/> Path Finder</>}
              </h2>
              <button onClick={() => setSidebarMode(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sidebarMode === "filters" && (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Node Types</label>
                  <div className="space-y-2">
                    {["Movie", "Actor", "Director", "Genre"].map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={types.includes(t)}
                          onChange={() => toggleType(t)}
                          className="w-4 h-4 rounded border-border bg-muted text-foreground focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Min Movie Rating: {minRating > 0 ? minRating : 'Any'}</label>
                  <input 
                    type="range" min="0" max="10" step="0.5" 
                    value={minRating} onChange={e => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-foreground"
                  />
                </div>

                <button 
                  onClick={applyFilters}
                  disabled={filtersLoading}
                  className="w-full py-2 bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted border border-border rounded-lg text-sm font-semibold transition-colors mt-auto"
                >
                  {filtersLoading ? "Applying..." : "Apply Filters"}
                </button>
              </div>
            )}

            {sidebarMode === "path" && (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground leading-relaxed">Select two nodes to find the shortest path between them (e.g. Actor to Actor).</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Start Node</label>
                    <select 
                      value={fromNode} onChange={e => setFromNode(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg p-2 text-sm text-foreground focus:border-accent outline-none"
                    >
                      <option value="">Select a node...</option>
                      {allNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">End Node</label>
                    <select 
                      value={toNode} onChange={e => setToNode(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg p-2 text-sm text-foreground focus:border-accent outline-none"
                    >
                      <option value="">Select a node...</option>
                      {allNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleFindPath}
                  disabled={!fromNode || !toNode || pathLoading}
                  className="w-full py-2 bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted border border-border rounded-lg text-sm font-semibold transition-colors"
                >
                  {pathLoading ? "Searching..." : "Find Path"}
                </button>

                {pathLength !== null && (
                  <div className="mt-4 p-4 bg-muted border border-border rounded-lg text-center shadow-inner">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Path Length</p>
                    <p className="text-2xl font-bold text-foreground">{pathLength} degrees</p>
                    <button onClick={handleResetPath} className="text-xs text-accent mt-2 hover:underline font-bold">Reset Graph</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
