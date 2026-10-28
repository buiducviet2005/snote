import { extractWikiLinks } from '../utils/smartNoteParser';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { NoteType } from '@snote/shared';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Filter,
  Eye,
  Info,
  Network
} from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type: 'NOTE' | 'SUBJECT' | 'PROJECT';
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPinned?: boolean;
  noteData?: any;
  connectionsCount: number;
  subjectName?: string;
  projectName?: string;
  noteType?: NoteType;
}

export interface GraphLink {
  source: string;
  target: string;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
  color?: string;
}

interface NotesGraphViewProps {
  notes: any[];
  subjects: any[];
  projects: any[];
  onSelectNote: (note: any) => void;
  onEditNote?: (note: any) => void;
}

export const NotesGraphView: React.FC<NotesGraphViewProps> = ({
  notes,
  subjects,
  projects,
  onSelectNote,
  onEditNote
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Transform / Camera State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hover & Selection State
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('ALL');

  // Animation Frame Ref & Graph Elements
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const isSimulatingRef = useRef(true);
  const animFrameIdRef = useRef<number | null>(null);

  // Colors for Nodes
  const TYPE_COLORS: Record<string, string> = {
    [NoteType.LECTURE]: '#38bdf8', // Cyan
    [NoteType.LAB_REPORT]: '#34d399', // Emerald
    [NoteType.EXAM_PREP]: '#fbbf24', // Amber
    [NoteType.PROJECT_LOG]: '#a855f7', // Purple
    [NoteType.MEETING_MINUTES]: '#f43f5e', // Rose
    [NoteType.GENERAL]: '#94a3b8' // Slate
  };

  // Build Graph Data from Notes, Subjects, and Projects
  const { initialNodes, initialLinks } = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawLinks: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // 1. Filter notes based on selected subject
    const activeNotes = notes.filter((n) => {
      if (filterSubjectId === 'ALL') return true;
      if (filterSubjectId === 'FREE') return !n.subjectId && !n.projectId;
      return n.subjectId === filterSubjectId;
    });

    // 2. Create Subject Hub Nodes
    const activeSubjectIds = new Set(activeNotes.map((n) => n.subjectId).filter(Boolean));
    subjects.forEach((sub) => {
      if (activeSubjectIds.has(sub.id)) {
        const subNode: GraphNode = {
          id: `sub_${sub.id}`,
          label: sub.code ? `[${sub.code}] ${sub.name}` : sub.name,
          type: 'SUBJECT',
          color: sub.color || '#6366f1',
          radius: 22,
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
          vx: 0,
          vy: 0,
          connectionsCount: 0
        };
        rawNodes.push(subNode);
        nodeMap.set(subNode.id, subNode);
      }
    });

    // 3. Create Project Hub Nodes
    const activeProjectIds = new Set(activeNotes.map((n) => n.projectId).filter(Boolean));
    projects.forEach((proj) => {
      if (activeProjectIds.has(proj.id)) {
        const projNode: GraphNode = {
          id: `proj_${proj.id}`,
          label: `📁 ${proj.name}`,
          type: 'PROJECT',
          color: '#c084fc',
          radius: 20,
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
          vx: 0,
          vy: 0,
          connectionsCount: 0
        };
        rawNodes.push(projNode);
        nodeMap.set(projNode.id, projNode);
      }
    });

    // 4. Create Note Nodes and Connect to Hubs
    activeNotes.forEach((note) => {
      const noteColor = note.subject?.color || TYPE_COLORS[note.noteType] || '#38bdf8';
      const isPinned = note.isPinned;
      const noteNode: GraphNode = {
        id: note.id,
        label: note.title || 'Ghi chú không tên',
        type: 'NOTE',
        color: noteColor,
        radius: isPinned ? 14 : 10,
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        vx: 0,
        vy: 0,
        isPinned,
        noteData: note,
        connectionsCount: 0,
        subjectName: note.subject?.name,
        projectName: note.project?.name,
        noteType: note.noteType
      };

      rawNodes.push(noteNode);
      nodeMap.set(noteNode.id, noteNode);

      // Link to Subject Hub
      if (note.subjectId && nodeMap.has(`sub_${note.subjectId}`)) {
        rawLinks.push({
          source: note.id,
          target: `sub_${note.subjectId}`,
          color: noteColor
        });
        noteNode.connectionsCount++;
        nodeMap.get(`sub_${note.subjectId}`)!.connectionsCount++;
      }

      // Link to Project Hub
      if (note.projectId && nodeMap.has(`proj_${note.projectId}`)) {
        rawLinks.push({
          source: note.id,
          target: `proj_${note.projectId}`,
          color: '#c084fc'
        });
        noteNode.connectionsCount++;
        nodeMap.get(`proj_${note.projectId}`)!.connectionsCount++;
      }
    });

    // 5. Connect notes that share tags
    const tagMap = new Map<string, string[]>();
    activeNotes.forEach((n) => {
      if (n.tags && Array.isArray(n.tags)) {
        n.tags.forEach((t: any) => {
          const tagName = t.name || t.id;
          if (!tagMap.has(tagName)) tagMap.set(tagName, []);
          tagMap.get(tagName)!.push(n.id);
        });
      }
    });

    tagMap.forEach((noteIds) => {
      if (noteIds.length > 1) {
        for (let i = 0; i < noteIds.length - 1; i++) {
          for (let j = i + 1; j < Math.min(noteIds.length, i + 3); j++) {
            rawLinks.push({
              source: noteIds[i],
              target: noteIds[j],
              color: 'rgba(255, 255, 255, 0.15)'
            });
          }
        }
      }
    });

    // 6. Connect notes directly via Obsidian [[Wiki Links]]
    activeNotes.forEach((n) => {
      const links = extractWikiLinks(n.content || '');
      links.forEach((link) => {
        const targetLower = link.target.toLowerCase();
        const targetNote = activeNotes.find(
          (other) =>
            other.id !== n.id &&
            (other.title?.trim().toLowerCase() === targetLower || other.id === link.target)
        );
        if (targetNote && nodeMap.has(targetNote.id)) {
          rawLinks.push({
            source: n.id,
            target: targetNote.id,
            color: '#38bdf8' // Obsidian electric cyan link
          });
          const sourceNode = nodeMap.get(n.id);
          const destNode = nodeMap.get(targetNote.id);
          if (sourceNode) sourceNode.connectionsCount++;
          if (destNode) destNode.connectionsCount++;
        }
      });
    });

    return { initialNodes: rawNodes, initialLinks: rawLinks };
  }, [notes, subjects, projects, filterSubjectId]);

  // Sync ref data with memoized nodes & links
  useEffect(() => {
    // Preserve existing node positions if they already exist
    const oldPosMap = new Map<string, { x: number; y: number }>();
    nodesRef.current.forEach((n) => oldPosMap.set(n.id, { x: n.x, y: n.y }));

    initialNodes.forEach((n) => {
      if (oldPosMap.has(n.id)) {
        const old = oldPosMap.get(n.id)!;
        n.x = old.x;
        n.y = old.y;
      }
    });

    nodesRef.current = initialNodes;

    // Resolve source & target objects for links
    const nodeLookup = new Map(initialNodes.map((n) => [n.id, n]));
    linksRef.current = initialLinks
      .map((l) => ({
        ...l,
        sourceNode: nodeLookup.get(l.source),
        targetNode: nodeLookup.get(l.target)
      }))
      .filter((l) => l.sourceNode && l.targetNode);

    isSimulatingRef.current = true;
  }, [initialNodes, initialLinks]);

  // Force-Directed Physics Simulation Engine
  const runPhysicsStep = useCallback(() => {
    const nodes = nodesRef.current;
    const links = linksRef.current;
    if (nodes.length === 0) return;

    const repulsionStrength = 1800;
    const springLength = 80;
    const springStrength = 0.045;
    const centerGravity = 0.02;
    const damping = 0.86;

    // 1. Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);

        if (dist < 400) {
          const force = repulsionStrength / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (nodeA !== draggedNode) {
            nodeA.vx -= fx;
            nodeA.vy -= fy;
          }
          if (nodeB !== draggedNode) {
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        }
      }
    }

    // 2. Spring attraction along links
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const source = link.sourceNode!;
      const target = link.targetNode!;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - springLength) * springStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (source !== draggedNode) {
        source.vx += fx;
        source.vy += fy;
      }
      if (target !== draggedNode) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // 3. Center gravity and update position
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node === draggedNode) continue;

      node.vx -= node.x * centerGravity;
      node.vy -= node.y * centerGravity;

      node.vx *= damping;
      node.vy *= damping;

      node.x += node.vx;
      node.y += node.vy;
    }
  }, [draggedNode]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Run physics
      runPhysicsStep();

      // Resize Canvas for High-DPI Retina Displays
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Translate to center + Pan & Zoom
      const centerX = rect.width / 2 + pan.x;
      const centerY = rect.height / 2 + pan.y;

      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // 1. Draw Links
      links.forEach((link) => {
        const source = link.sourceNode;
        const target = link.targetNode;
        if (!source || !target) return;

        const isHighlighted =
          hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.9;
        } else {
          ctx.strokeStyle = link.color || 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          ctx.globalAlpha = hoveredNode ? 0.15 : 0.45;
        }

        ctx.stroke();
      });

      // 2. Draw Nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const isConnectedToHovered =
          hoveredNode &&
          links.some(
            (l) =>
              (l.source === hoveredNode.id && l.target === node.id) ||
              (l.target === hoveredNode.id && l.source === node.id)
          );

        const isDimmed = hoveredNode && !isHovered && !isConnectedToHovered;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.2 : 1;

        // Glow effect on Hubs or Hovered node
        if (isHovered || node.type === 'SUBJECT' || node.type === 'PROJECT') {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = isHovered ? 20 : 12;
        }

        // Draw Outer Ring for Subject Hubs
        if (node.type === 'SUBJECT' || node.type === 'PROJECT') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}55`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // White border for pinned or hovered notes
        if (node.isPinned || isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isHovered ? 2.5 : 1.5;
          ctx.stroke();
        }

        ctx.restore();

        // 3. Draw Node Labels
        if (showLabels || isHovered || node.type === 'SUBJECT' || node.type === 'PROJECT') {
          ctx.save();
          ctx.globalAlpha = isDimmed ? 0.15 : 1;
          ctx.font = `${node.type === 'SUBJECT' ? 'bold 12px' : '11px'} Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const labelText =
            node.label.length > 22 && !isHovered ? `${node.label.substring(0, 20)}...` : node.label;

          // Draw label background pill for readability
          const textWidth = ctx.measureText(labelText).width;
          const textY = node.y + node.radius + 4;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.beginPath();
          ctx.roundRect(node.x - textWidth / 2 - 4, textY - 2, textWidth + 8, 16, 4);
          ctx.fill();

          ctx.fillStyle = isHovered ? '#38bdf8' : '#f1f5f9';
          ctx.fillText(labelText, node.x, textY);
          ctx.restore();
        }
      });

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [pan, zoom, hoveredNode, showLabels, runPhysicsStep]);

  // Convert Screen Coordinates to Graph World Coordinates
  const getGraphCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2 + pan.x;
      const centerY = rect.height / 2 + pan.y;
      return {
        x: (clientX - rect.left - centerX) / zoom,
        y: (clientY - rect.top - centerY) / zoom
      };
    },
    [pan, zoom]
  );

  // Find Node Under Mouse Cursor
  const getNodeAtPos = useCallback(
    (x: number, y: number): GraphNode | null => {
      const nodes = nodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
          return node;
        }
      }
      return null;
    },
    []
  );

  // Canvas Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getGraphCoords(e.clientX, e.clientY);
    const node = getNodeAtPos(coords.x, coords.y);

    if (node) {
      setDraggedNode(node);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getGraphCoords(e.clientX, e.clientY);

    if (draggedNode) {
      draggedNode.x = coords.x;
      draggedNode.y = coords.y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      const node = getNodeAtPos(coords.x, coords.y);
      setHoveredNode(node);
      if (node) {
        setHoverPos({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNode(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getGraphCoords(e.clientX, e.clientY);
    const node = getNodeAtPos(coords.x, coords.y);

    if (node && node.type === 'NOTE' && node.noteData) {
      onSelectNote(node.noteData);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 3));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 210px)',
        minHeight: '520px',
        backgroundColor: '#0a0d14',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* Background Starry Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none'
        }}
      />

      {/* Main Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: draggedNode ? 'grabbing' : isDraggingCanvas ? 'grabbing' : hoveredNode ? 'pointer' : 'grab'
        }}
      />

      {/* Top Floating Controls Bar */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        {/* Left: Info Title + Subject Filter Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
            <Network size={16} />
            <span>Mạng Lưới Tri Thức</span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>

          {/* Subject Filter Dropdown */}
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="snote-select"
            style={{
              height: '28px',
              fontSize: '11.5px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '2px 8px'
            }}
          >
            <option value="ALL">🌐 Tất cả môn học ({notes.length})</option>
            <option value="FREE">📝 Ghi chú tự do</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code ? `[${sub.code}] ` : ''}{sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Zoom & Layout Utility Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ color: '#f8fafc', width: '28px', height: '28px' }}
            title="Phóng to"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ color: '#f8fafc', width: '28px', height: '28px' }}
            title="Thu nhỏ"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetView}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ color: '#f8fafc', width: '28px', height: '28px' }}
            title="Căn giữa màn hình"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => setShowLabels((prev) => !prev)}
            className={`btn btn-sm ${showLabels ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '11px', padding: '2px 8px', height: '28px' }}
            title="Bật/Tắt nhãn văn bản"
          >
            <Layers size={12} />
            <span>{showLabels ? 'Hiện nhãn' : 'Ẩn nhãn'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Left Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '16px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: '#94a3b8',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'inline-block' }} />
          <span>Môn học (Hub)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block' }} />
          <span>Bài giảng</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
          <span>Thực hành</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', display: 'inline-block' }} />
          <span>Ôn thi</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c084fc', display: 'inline-block' }} />
          <span>Đồ án / BTL</span>
        </div>
      </div>

      {/* Floating Hover Card Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverPos.x + 14}px`,
            top: `${hoverPos.y + 14}px`,
            maxWidth: '280px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${hoveredNode.color}`,
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            zIndex: 100,
            transform: 'translateY(-50%)'
          }}
          className="animate-scale-in"
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px', lineHeight: 1.3 }}>
            {hoveredNode.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#94a3b8', marginBottom: '6px' }}>
            <span style={{ color: hoveredNode.color, fontWeight: 600 }}>
              {hoveredNode.type === 'SUBJECT' ? 'Môn học' : hoveredNode.type === 'PROJECT' ? 'Đồ án' : hoveredNode.noteType}
            </span>
            <span>•</span>
            <span>{hoveredNode.connectionsCount} liên kết</span>
          </div>

          {hoveredNode.noteData?.content && (
            <div
              style={{
                fontSize: '11px',
                color: '#cbd5e1',
                maxHeight: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.4,
                opacity: 0.85
              }}
            >
              {hoveredNode.noteData.content.replace(/[#*`_\[\]]/g, '').substring(0, 90)}...
            </div>
          )}

          <div style={{ marginTop: '8px', fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
            👉 Nhấp để mở xem chi tiết bài ghi
          </div>
        </div>
      )}
    </div>
  );
};
