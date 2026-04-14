"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { GraphData, GraphNode } from "@/lib/api";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface ForceGraphProps {
  data: GraphData;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  compact?: boolean;
}

const NODE_COLORS: Record<string, string> = {
  Movie:    "#DC2626",
  Actor:    "#16A34A",
  Director: "#2563EB",
  Genre:    "#CA8A04",
};

const NODE_GLOW: Record<string, string> = {
  Movie:    "rgba(239,68,68,0.5)",
  Actor:    "rgba(34,197,94,0.5)",
  Director: "rgba(59,130,246,0.5)",
  Genre:    "rgba(234,179,8,0.5)",
};

const NODE_BG: Record<string, string> = {
  Movie:    "#FEE2E2",
  Actor:    "#DCFCE7",
  Director: "#DBEAFE",
  Genre:    "#FEF9C3",
};

export function ForceGraph({ data, height = 500, onNodeClick, compact = false }: ForceGraphProps) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    setMounted(true);
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const adjacency = useMemo(() => {
    const adj = new Map<string, Set<string>>();
    data.links.forEach(l => {
      const sId = typeof l.source === "string" ? l.source : l.source.id;
      const tId = typeof l.target === "string" ? l.target : l.target.id;
      if (!adj.has(sId)) adj.set(sId, new Set());
      if (!adj.has(tId)) adj.set(tId, new Set());
      adj.get(sId)!.add(tId);
      adj.get(tId)!.add(sId);
    });
    return adj;
  }, [data]);

  const graphData = useMemo(() => {
    if (!isolatedNodeId) return data;
    const neighbors = adjacency.get(isolatedNodeId) || new Set();
    const allowed = new Set([isolatedNodeId, ...neighbors]);
    return {
      nodes: data.nodes.filter(n => allowed.has(n.id)),
      links: data.links.filter(l => {
        const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
        const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
        return allowed.has(sId) && allowed.has(tId);
      }),
    };
  }, [data, isolatedNodeId, adjacency]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const label = node.label?.length > 24 ? node.label.slice(0, 22) + "…" : node.label || "";
    const type = node.type || "Movie";
    const color = NODE_COLORS[type] || "#9CA3AF";
    const bg = NODE_BG[type] || "#F3F4F6";
    const isHovered = hoveredNode === node.id;
    const fontSize = compact ? 3.2 : 3.8;

    ctx.font = `bold ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const padX = 3, padY = 2;
    const nodeW = textWidth + padX * 2;
    const nodeH = fontSize + padY * 2;
    const r = 2;
    const x = node.x - nodeW / 2;
    const y = node.y - nodeH / 2;

    node.__bWidth = nodeW;
    node.__bHeight = nodeH;

    if (isHovered) {
      ctx.shadowColor = NODE_GLOW[type] || "rgba(255,255,255,0.3)";
      ctx.shadowBlur = 14;
    }

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(ctx, x + 0.6, y + 0.6, nodeW, nodeH, r); ctx.fill();

    ctx.fillStyle = bg;
    roundRect(ctx, x, y, nodeW, nodeH, r); ctx.fill();

    ctx.fillStyle = color;
    roundRectLeft(ctx, x, y, 1.5, nodeH, r); ctx.fill();

    ctx.strokeStyle = isHovered ? "#ffffff" : color;
    ctx.lineWidth = isHovered ? 0.8 : 0.3;
    roundRect(ctx, x, y, nodeW, nodeH, r); ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#1A1A2E";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, node.x, node.y + 0.3);
  }, [hoveredNode, compact]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const s = link.source, t = link.target;
    if (!s || !t || typeof s.x === "undefined") return;

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = "rgba(150, 150, 150, 0.4)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    const showLabel = compact ? globalScale > 0.6 : globalScale > 1.2;
    if (showLabel) {
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      const text = (link.type || "").replace(/_/g, " ").toLowerCase();
      const fs = compact ? 2 : 2.2;
      ctx.font = `500 ${fs}px "Space Grotesk", system-ui, sans-serif`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(40, 40, 40, 0.85)";
      roundRect(ctx, mx - tw / 2 - 1.2, my - fs / 2 - 0.8, tw + 2.4, fs + 1.6, 1); ctx.fill();
      ctx.fillStyle = "rgba(200, 200, 200, 0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, mx, my);
    }
  }, [compact]);

  const handleClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node as GraphNode);
    } else {
      setIsolatedNodeId(prev => prev === node.id ? null : node.id);
    }
  }, [onNodeClick]);

  const handleBgClick = useCallback(() => {
    if (isolatedNodeId) setIsolatedNodeId(null);
  }, [isolatedNodeId]);

  const pointerArea = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const w = node.__bWidth || 20;
    const h = node.__bHeight || 10;
    ctx.fillStyle = color;
    ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
  }, []);

  const handleExport = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.download = "movie-knowledge-graph.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, []);

  if (!mounted) return <div ref={containerRef} style={{ height }} className="w-full shimmer rounded-lg" />;

  return (
    <div ref={containerRef} className="relative group bg-card rounded-lg">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={containerWidth}
        height={height}
        backgroundColor="transparent"
        nodeId="id"
        nodeLabel=""
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={pointerArea}
        linkCanvasObject={paintLink}
        linkCanvasObjectMode={() => "replace"}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.2}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleColor={() => "var(--foreground)"}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleWidth={1.2}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={300}
        warmupTicks={200}
        onNodeHover={(node: any) => setHoveredNode(node?.id || null)}
        onNodeClick={handleClick}
        onBackgroundClick={handleBgClick}
        onNodeDragEnd={(node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        d3Force={(name: string, force: any) => {
          if (name === "charge") {
            force.strength(compact ? -120 : -400);
            force.distanceMax(compact ? 300 : 800);
          }
          if (name === "link") { force.distance(compact ? 50 : 100); }
          if (name === "center") { force.strength(0.03); }
        }}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        minZoom={0.2}
        maxZoom={8}
      />

      {/* Reorganize Graph button overlay */}
      {!compact && (
        <button 
          onClick={() => {
            if (graphRef.current) {
              graphRef.current.d3ReheatSimulation();
              graphRef.current.zoomToFit(400, 20);
            }
          }}
          className="absolute top-4 left-4 glass hover:bg-muted text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
          Reorganize Graph
        </button>
      )}

      {/* Export button overlay (only shows on hover in non-compact mode) */}
      {!compact && (
        <button 
          onClick={handleExport}
          className="absolute top-4 right-4 glass hover:bg-muted text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export PNG
        </button>
      )}

      {/* Legend bar below graph — NOT overlaying the canvas */}
      <div className={`${compact ? 'pt-2 pb-2 px-1' : 'pt-3 pb-3 px-1'} flex items-center justify-between`}>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div
              key={type}
              className={`flex items-center gap-1.5 ${compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'} glass rounded-md`}
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className={`${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-sm`} style={{ background: color }} />
              <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} uppercase font-bold tracking-widest text-foreground`}>{type}</span>
            </div>
          ))}
        </div>
        {!compact && (
          <span className="text-[9px] text-muted-foreground font-medium">
            Scroll: Zoom · Drag: Pan · Click: Navigate
          </span>
        )}
      </div>
    </div>
  );
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r); c.closePath();
}

function roundRectLeft(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w, y);
  c.lineTo(x + w, y + h); c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r); c.closePath();
}
