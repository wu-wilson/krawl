import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';

import { useCrawlStore } from '../store/crawlStore';

import { NODE_STATUS_COLORS, getNodeRadius as calcNodeRadius } from '../components/Graph/GraphNode';

import type { CrawlNode, CrawlEdge, NodeStatus } from '../engine/types';

const CANVAS_COLORS = {
  bg: '#111114',
  grid: 'rgba(255, 255, 255, 0.12)',
  edgeHighlight: 'rgba(212, 160, 23, 0.4)',
  brand: '#d4a017',
  glow: 0.35,
};

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  crawlNode: CrawlNode;
  radius: number;
  enterTime: number;
  enterProgress: number;
}

interface SimEdge {
  source: SimNode;
  target: SimNode;
  edge: CrawlEdge;
  drawProgress: number;
  enterTime: number;
}

interface UseGraphReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hoveredNodeId: string | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleTouchCancel: (e: React.TouchEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
}

/**
 * Hook to manage D3 force layout and Canvas rendering
 * @returns Canvas ref and interaction handlers
 */
export const useGraph = (): UseGraphReturn => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const simEdgesRef = useRef<SimEdge[]>([]);
  const simEdgeIndexRef = useRef<Map<string, SimEdge>>(new Map());
  const animFrameRef = useRef<number>(0);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; lastX: number; lastY: number; velX: number; velY: number }>({
    active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, velX: 0, velY: 0,
  });
  const pinchRef = useRef<{ active: boolean; wasActive: boolean; initialDist: number; initialK: number }>({
    active: false, wasActive: false, initialDist: 0, initialK: 1,
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const needsRedrawRef = useRef(true);
  const filteredIdsRef = useRef<Set<string>>(new Set());

  const selectedNodeId = useCrawlStore((s) => s.selectedNodeId);
  const selectNode = useCrawlStore((s) => s.selectNode);

  const getNodeRadius = useCallback((node: CrawlNode): number => {
    return calcNodeRadius(node.inbound.length);
  }, []);

  const getStatusColor = useCallback((status: NodeStatus): string => {
    return NODE_STATUS_COLORS[status] || NODE_STATUS_COLORS.queued;
  }, []);

  // Subscribe to store changes outside of React render cycle to avoid re-renders
  useEffect(() => {
    const unsub = useCrawlStore.subscribe((state, prev) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;

      // Initialize simulation if needed
      if (!simRef.current) {
        simRef.current = d3.forceSimulation<SimNode>()
          .force('link', d3.forceLink<SimNode, d3.SimulationLinkDatum<SimNode>>().id((d) => d.id).distance(80))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(cx, cy))
          .force('collide', d3.forceCollide<SimNode>().radius((d) => d.radius + 4))
          .force('x', d3.forceX(cx).strength(0.02))
          .force('y', d3.forceY(cy).strength(0.02))
          .alphaDecay(0.01)
          .velocityDecay(0.3);
      }

      const sim = simRef.current;
      const simNodes = simNodesRef.current;
      const now = Date.now();
      let structureChanged = false;

      // Sync nodes
      if (state.nodes !== prev.nodes) {
        state.nodes.forEach((crawlNode, id) => {
          const existing = simNodes.get(id);
          if (!existing) {
            const parent = crawlNode.parentId ? simNodes.get(crawlNode.parentId) : null;
            simNodes.set(id, {
              id,
              crawlNode,
              radius: getNodeRadius(crawlNode),
              enterTime: now,
              enterProgress: 0,
              x: parent ? (parent.x || cx) + (Math.random() - 0.5) * 30 : cx,
              y: parent ? (parent.y || cy) + (Math.random() - 0.5) * 30 : cy,
            });
            structureChanged = true;
          } else {
            existing.crawlNode = crawlNode;
            existing.radius = getNodeRadius(crawlNode);
          }
        });
      }

      // Sync edges
      if (state.edges !== prev.edges) {
        const edgeIndex = simEdgeIndexRef.current;
        const newEdges: SimEdge[] = [];

        for (const edge of state.edges) {
          const key = `${edge.source}->${edge.target}`;
          const existing = edgeIndex.get(key);
          if (existing) {
            // Update source/target refs in case they changed
            const source = simNodes.get(edge.source);
            const target = simNodes.get(edge.target);
            if (source && target) {
              existing.source = source;
              existing.target = target;
              newEdges.push(existing);
            }
          } else {
            const source = simNodes.get(edge.source);
            const target = simNodes.get(edge.target);
            if (source && target) {
              const simEdge: SimEdge = { source, target, edge, drawProgress: 0, enterTime: now };
              edgeIndex.set(key, simEdge);
              newEdges.push(simEdge);
              structureChanged = true;
            }
          }
        }

        simEdgesRef.current = newEdges;
      }

      // Update filtered IDs cache
      if (state.nodes !== prev.nodes || state.filter !== prev.filter) {
        const filtered = state.getFilteredNodes();
        filteredIdsRef.current = new Set(filtered.map((n) => n.id));
      }

      // Update simulation topology when structure changed
      if (structureChanged) {
        const nodeArray = Array.from(simNodes.values());
        sim.nodes(nodeArray);

        const linkForce = sim.force('link') as d3.ForceLink<SimNode, d3.SimulationLinkDatum<SimNode>>;
        if (linkForce) {
          linkForce.links(simEdgesRef.current.map((se) => ({ source: se.source, target: se.target })));
        }

        sim.alpha(Math.max(sim.alpha(), 0.3)).restart();
      }

      needsRedrawRef.current = true;
    });

    return unsub;
  }, [getNodeRadius]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parentW = canvas.parentElement!.clientWidth;
      const parentH = canvas.parentElement!.clientHeight;
      canvas.width = parentW * dpr;
      canvas.height = parentH * dpr;
      canvas.style.width = `${parentW}px`;
      canvas.style.height = `${parentH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (simRef.current) {
        simRef.current
          .force('center', d3.forceCenter(parentW / 2, parentH / 2))
          .force('x', d3.forceX(parentW / 2).strength(0.02))
          .force('y', d3.forceY(parentH / 2).strength(0.02))
          .alpha(0.3)
          .restart();
      }
      needsRedrawRef.current = true;
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      // Check if simulation is still active or we have pending animations
      const sim = simRef.current;
      const isSimActive = sim ? sim.alpha() > 0.001 : false;
      const hasMomentum = Math.abs(dragRef.current.velX) > 0.1 || Math.abs(dragRef.current.velY) > 0.1;
      const hasAnimatingNodes = simNodesRef.current.size > 0 &&
        Array.from(simNodesRef.current.values()).some((n) => n.enterProgress < 1);
      const hasAnimatingEdges = simEdgesRef.current.some((e) => e.drawProgress < 1);
      const hasPendingNodes = Array.from(simNodesRef.current.values()).some(
        (n) => n.crawlNode.status === 'pending' && filteredIdsRef.current.has(n.id)
      );

      if (!needsRedrawRef.current && !isSimActive && !hasMomentum &&
          !hasAnimatingNodes && !hasAnimatingEdges && !hasPendingNodes) {
        return;
      }
      needsRedrawRef.current = false;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const now = Date.now();
      const transform = transformRef.current;
      const filteredIds = filteredIdsRef.current;

      // Apply momentum
      if (!dragRef.current.active && hasMomentum) {
        transform.x += dragRef.current.velX;
        transform.y += dragRef.current.velY;
        dragRef.current.velX *= 0.95;
        dragRef.current.velY *= 0.95;
        needsRedrawRef.current = true;
      }

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = CANVAS_COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      const gridSize = 30;
      const gridOffsetX = transform.x % gridSize;
      const gridOffsetY = transform.y % gridSize;
      ctx.fillStyle = CANVAS_COLORS.grid;
      for (let x = gridOffsetX; x < w; x += gridSize) {
        for (let y = gridOffsetY; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Apply transform
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      const simEdges = simEdgesRef.current;
      const simNodes = simNodesRef.current;
      const hovered = hoveredRef.current;
      const selected = selectedNodeId;

      // Build connected set for highlighting
      const connectedIds = new Set<string>();
      if (hovered) {
        connectedIds.add(hovered);
        for (const se of simEdges) {
          if (se.source.id === hovered || se.target.id === hovered) {
            connectedIds.add(se.source.id);
            connectedIds.add(se.target.id);
          }
        }
      }

      // Draw edges
      const arrowSize = 5;
      for (const se of simEdges) {
        if (!filteredIds.has(se.source.id) || !filteredIds.has(se.target.id)) continue;

        const elapsed = now - se.enterTime;
        se.drawProgress = Math.min(1, elapsed / 400);
        const progress = 1 - Math.pow(1 - se.drawProgress, 3);

        if (progress <= 0) continue;

        const sx = se.source.x || 0;
        const sy = se.source.y || 0;
        const tx = se.target.x || 0;
        const ty = se.target.y || 0;

        const isConnected = !hovered || (connectedIds.has(se.source.id) && connectedIds.has(se.target.id));
        const alpha = isConnected ? 0.2 : 0.03;

        // Bezier curve
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) continue;

        const offset = dist * 0.1;
        const cpx = mx - dy * offset / dist * 0.5;
        const cpy = my + dx * offset / dist * 0.5;

        const edgeColor = isConnected && hovered
          ? CANVAS_COLORS.edgeHighlight
          : `rgba(255, 255, 255, ${alpha})`;

        // Shorten edge to stop at target node's radius
        const targetR = se.target.radius + 2;
        const stopT = dist > targetR ? Math.max(0, 1 - targetR / dist) : 0.5;
        const drawT = progress * stopT;

        // Point on quadratic bezier at parameter t
        const bx = (t: number) => (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cpx + t * t * tx;
        const by = (t: number) => (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cpy + t * t * ty;

        const endX = bx(drawT);
        const endY = by(drawT);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        // Split the bezier up to drawT
        const cp1x = sx + (cpx - sx) * drawT;
        const cp1y = sy + (cpy - sy) * drawT;
        ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Arrowhead — tangent direction at the end of the curve
        if (progress >= 1) {
          const tangentX = 2 * (1 - drawT) * (cpx - sx) + 2 * drawT * (tx - cpx);
          const tangentY = 2 * (1 - drawT) * (cpy - sy) + 2 * drawT * (ty - cpy);
          const tLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
          if (tLen > 0) {
            const ux = tangentX / tLen;
            const uy = tangentY / tLen;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - ux * arrowSize + uy * arrowSize * 0.5, endY - uy * arrowSize - ux * arrowSize * 0.5);
            ctx.lineTo(endX - ux * arrowSize - uy * arrowSize * 0.5, endY - uy * arrowSize + ux * arrowSize * 0.5);
            ctx.closePath();
            ctx.fillStyle = edgeColor;
            ctx.fill();
          }
        }

        // Traveling dot for pending nodes
        if (se.target.crawlNode.status === 'pending') {
          const dotT = (now % 1000) / 1000;
          const dotX = sx + (tx - sx) * dotT;
          const dotY = sy + (ty - sy) * dotT;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
          ctx.fillStyle = CANVAS_COLORS.brand;
          ctx.fill();
        }
      }

      // Draw nodes
      simNodes.forEach((simNode) => {
        if (!filteredIds.has(simNode.id)) return;

        const elapsed = now - simNode.enterTime;
        simNode.enterProgress = Math.min(1, elapsed / 400);
        const scale = simNode.enterProgress < 1
          ? easeSpring(simNode.enterProgress)
          : 1;

        if (scale <= 0) return;

        const x = simNode.x || 0;
        const y = simNode.y || 0;
        const r = simNode.radius * scale;
        const nodeStatus = simNode.crawlNode.status;
        const color = getStatusColor(nodeStatus);

        const isConnected = !hovered || connectedIds.has(simNode.id);
        const isHovered = hovered === simNode.id;
        const isSelected = selected === simNode.id;

        const nodeAlpha = isConnected ? 1 : 0.08;
        const drawRadius = isHovered ? r * 1.2 : r;

        // Glow
        if (nodeAlpha > 0.5 && (nodeStatus === 'pending' || isSelected)) {
          const glowRadius = drawRadius * 3;
          const gradient = ctx.createRadialGradient(x, y, drawRadius, x, y, glowRadius);
          gradient.addColorStop(0, `${color}${Math.round(CANVAS_COLORS.glow * 40).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, `${color}00`);
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.globalAlpha = nodeAlpha;

        // All nodes are circles
        ctx.beginPath();
        ctx.arc(x, y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Selection ring
        if (isSelected || simNode.crawlNode.depth === 0) {
          ctx.beginPath();
          ctx.arc(x, y, drawRadius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = CANVAS_COLORS.brand;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      });

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [getStatusColor, selectedNodeId]);

  // Wheel attached non-passively — React's onWheel is passive, so preventDefault would silently fail.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scaleFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newK = Math.max(0.1, Math.min(5, transformRef.current.k * scaleFactor));
      const ratio = newK / transformRef.current.k;
      transformRef.current.x = mx - ratio * (mx - transformRef.current.x);
      transformRef.current.y = my - ratio * (my - transformRef.current.y);
      transformRef.current.k = newK;
      needsRedrawRef.current = true;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Hit test
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - transformRef.current.x) / transformRef.current.k;
    const y = (clientY - rect.top - transformRef.current.y) / transformRef.current.k;
    const filteredIds = filteredIdsRef.current;

    let closest: SimNode | null = null;
    let closestDist = Infinity;

    simNodesRef.current.forEach((node) => {
      if (!filteredIds.has(node.id)) return;
      const dx = (node.x || 0) - x;
      const dy = (node.y || 0) - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 8 && dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    });

    return closest;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      velX: 0,
      velY: 0,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      dragRef.current.velX = dx;
      dragRef.current.velY = dy;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      needsRedrawRef.current = true;
    } else {
      const node = getNodeAtPosition(e.clientX, e.clientY);
      const nodeId = node?.id || null;
      if (nodeId !== hoveredRef.current) {
        hoveredRef.current = nodeId;
        setHoveredNodeId(nodeId);
        needsRedrawRef.current = true;
      }
    }
  }, [getNodeAtPosition]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    const moved = Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY);
    if (moved > 5) return;

    const node = getNodeAtPosition(e.clientX, e.clientY);
    selectNode(node?.id || null);
    needsRedrawRef.current = true;
  }, [getNodeAtPosition, selectNode]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragRef.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        velX: 0,
        velY: 0,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        active: true,
        wasActive: true,
        initialDist: Math.sqrt(dx * dx + dy * dy),
        initialK: transformRef.current.k,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current.active) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.lastX;
      const dy = touch.clientY - dragRef.current.lastY;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      dragRef.current.velX = dx;
      dragRef.current.velY = dy;
      dragRef.current.lastX = touch.clientX;
      dragRef.current.lastY = touch.clientY;
      needsRedrawRef.current = true;
    } else if (e.touches.length === 2 && pinchRef.current.active) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t0x = e.touches[0].clientX - rect.left;
      const t0y = e.touches[0].clientY - rect.top;
      const t1x = e.touches[1].clientX - rect.left;
      const t1y = e.touches[1].clientY - rect.top;
      const dx = t0x - t1x;
      const dy = t0y - t1y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mx = (t0x + t1x) / 2;
      const my = (t0y + t1y) / 2;

      const newK = Math.max(0.1, Math.min(5, pinchRef.current.initialK * (dist / pinchRef.current.initialDist)));
      const ratio = newK / transformRef.current.k;
      transformRef.current.x = mx - ratio * (mx - transformRef.current.x);
      transformRef.current.y = my - ratio * (my - transformRef.current.y);
      transformRef.current.k = newK;
      needsRedrawRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // Skip tap if this gesture pinched — pinch leaves dragRef coords stale, causing a false select.
      if (dragRef.current.active && !pinchRef.current.wasActive) {
        const moved = Math.abs(dragRef.current.lastX - dragRef.current.startX) +
          Math.abs(dragRef.current.lastY - dragRef.current.startY);
        if (moved < 10) {
          const node = getNodeAtPosition(dragRef.current.startX, dragRef.current.startY);
          selectNode(node?.id || null);
          needsRedrawRef.current = true;
        }
      }
      dragRef.current.active = false;
      pinchRef.current.active = false;
      pinchRef.current.wasActive = false;
    } else if (e.touches.length === 1 && pinchRef.current.active) {
      // On 2→1 finger lift: re-seat dragRef to the remaining finger so the next pan doesn't jump from stale coords.
      const touch = e.touches[0];
      dragRef.current.startX = touch.clientX;
      dragRef.current.startY = touch.clientY;
      dragRef.current.lastX = touch.clientX;
      dragRef.current.lastY = touch.clientY;
      pinchRef.current.active = false;
    }
  }, [getNodeAtPosition, selectNode]);

  // Reset gesture state when the browser preempts the touch (iOS system gesture, low-power interrupt, etc.).
  const handleTouchCancel = useCallback(() => {
    dragRef.current.active = false;
    pinchRef.current.active = false;
    pinchRef.current.wasActive = false;
  }, []);

  return {
    canvasRef,
    hoveredNodeId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleClick,
  };
};

/** Spring easing with ~15% overshoot */
const easeSpring = (t: number): number =>
  1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.5) * (1 - t);
