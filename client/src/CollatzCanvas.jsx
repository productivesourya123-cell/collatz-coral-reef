import React, { useRef, useEffect, useCallback } from 'react';

const CollatzCanvas = ({ sequences }) => {
  const canvasRef = useRef(null);
  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
    targetX: 0,
    targetY: 0,
    targetZoom: 1
  });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const nodePositionsRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const hoveredNodeRef = useRef(null);
  const hoveredSequenceRef = useRef(null);
  const hoveredNodeInfoRef = useRef(null);

  // Linear interpolation helper
  const lerp = (a, b, t) => a + (b - a) * t;

  // Helper function to calculate distance from point to line segment
  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  // Hardcoded structural constants for upward tree branching
  const EVEN_ANGLE = 0.20; // Even numbers branch slightly right
  const ODD_ANGLE = -0.35; // Odd numbers branch sharply left
  const BASE_BRANCH_LENGTH = 12; // Base pixels per step

  // Calculate sequence path with strict node caching and dynamic branching
  const calculateSequencePath = useCallback((sequence, canvasWidth, canvasHeight) => {
    const path = [];
    
    // Initialize root node (1) if not in registry
    const rootX = canvasWidth / 2;
    const rootY = canvasHeight * 0.85;
    
    if (!nodePositionsRef.current.has(1)) {
      nodePositionsRef.current.set(1, { x: rootX, y: rootY });
    }
    
    let x = rootX;
    let y = rootY;
    let currentAngle = -Math.PI / 2; // Pointing straight up

    path.push({ x, y, value: sequence[0] });

    for (let i = 1; i < sequence.length; i++) {
      const num = sequence[i];
      const isEven = num % 2 === 0;
      
      // Dynamic branch length based on distance from root
      const currentBranchLength = Math.max(4, 25 - (i * 0.2));
      
      // Branch based on parity
      if (isEven) {
        currentAngle += EVEN_ANGLE;
      } else {
        currentAngle += ODD_ANGLE;
      }

      // Dampen angle to prevent backward twisting
      if (currentAngle > 0) currentAngle = -0.1;
      if (currentAngle < -Math.PI) currentAngle = -Math.PI + 0.1;

      // Check if node already exists in registry (strict caching)
      if (nodePositionsRef.current.has(num)) {
        const existingPos = nodePositionsRef.current.get(num);
        x = existingPos.x;
        y = existingPos.y;
      } else {
        // Calculate new position
        x += Math.cos(currentAngle) * currentBranchLength;
        y += Math.sin(currentAngle) * currentBranchLength;
        
        // Save to registry
        nodePositionsRef.current.set(num, { x, y });
      }

      path.push({ x, y, value: num });
    }

    return path;
  }, []);

  // Calculate bounding box for recentering
  const calculateBoundingBox = useCallback((canvasWidth, canvasHeight) => {
    if (sequences.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    sequences.forEach((seqData) => {
      const path = calculateSequencePath(seqData.sequence, canvasWidth, canvasHeight);
      path.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return {
      minX, minY, maxX, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [sequences, calculateSequencePath]);

  // Recenter camera to density center
  const recenterCamera = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bbox = calculateBoundingBox(canvas.width, canvas.height);
    if (!bbox) return;

    // Calculate appropriate zoom to fit the bounding box
    const padding = 100;
    const scaleX = (canvas.width - padding * 2) / bbox.width;
    const scaleY = (canvas.height - padding * 2) / bbox.height;
    const newZoom = Math.min(scaleX, scaleY, 2); // Cap at 2x zoom

    cameraRef.current.targetX = -bbox.centerX * newZoom + canvas.width / 2;
    cameraRef.current.targetY = -bbox.centerY * newZoom + canvas.height / 2;
    cameraRef.current.targetZoom = newZoom;
  }, [calculateBoundingBox]);

  // Handle recenter event
  useEffect(() => {
    const handleRecenter = () => recenterCamera();
    window.addEventListener('recenterCamera', handleRecenter);
    return () => window.removeEventListener('recenterCamera', handleRecenter);
  }, [recenterCamera]);

  // Auto-recenter when new sequences arrive
  useEffect(() => {
    if (sequences.length > 0) {
      recenterCamera();
    }
  }, [sequences.length, recenterCamera]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const camera = cameraRef.current;

    // Smooth camera movement
    camera.x = lerp(camera.x, camera.targetX, 0.05);
    camera.y = lerp(camera.y, camera.targetY, 0.05);
    camera.zoom = lerp(camera.zoom, camera.targetZoom, 0.05);

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw grid (subtle)
    ctx.strokeStyle = '#12121a';
    ctx.lineWidth = 0.5 / camera.zoom;
    const gridSize = 100;
    const startX = Math.floor(-camera.x / camera.zoom / gridSize) * gridSize;
    const startY = Math.floor(-camera.y / camera.zoom / gridSize) * gridSize;
    const endX = startX + canvas.width / camera.zoom + gridSize * 2;
    const endY = startY + canvas.height / camera.zoom + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw all sequences
    sequences.forEach((seqData, index) => {
      const path = calculateSequencePath(seqData.sequence, canvas.width, canvas.height);
      
      // Create unique color for each sequence using golden angle for better distribution
      const hue = (index * 137.508) % 360;
      const saturation = 65 + (index % 20);
      const lightness = 55 + (index % 15);
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      // Check if this sequence is hovered
      const isHovered = hoveredSequenceRef.current === seqData.number;
      
      // Draw path with highlighting if hovered
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 3 / camera.zoom : 1.5 / camera.zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = isHovered ? 1 : 0.7;

      path.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ONLY draw circles when zoomed in (LOD logic)
      if (camera.zoom >= 1.5) {
        // Draw nodes with sequence color
        path.forEach((point, i) => {
          const nodeSize = 8;

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(point.x, point.y, nodeSize / camera.zoom, 0, Math.PI * 2);
          ctx.fill();

          // Draw glow effect for important nodes
          if (point.value === 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#00ccff';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.arc(point.x, point.y, (nodeSize + 2) / camera.zoom, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }
    });

    ctx.restore();

    // Draw hover tooltip for sequence or node
    if (hoveredNodeInfoRef.current !== null) {
      const mouseX = lastMouseRef.current.x;
      const mouseY = lastMouseRef.current.y;
      const nodeInfo = hoveredNodeInfoRef.current;
      
      // Get the color of the hovered sequence
      const index = sequences.findIndex(s => s.number === nodeInfo.sequenceNumber);
      const hue = (index * 137.508) % 360;
      const saturation = 65 + (index % 20);
      const lightness = 55 + (index % 15);
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      ctx.save();
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = '#00FFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Draw tooltip background
      const isEven = nodeInfo.value % 2 === 0;
      const operation = isEven ? `${nodeInfo.value} ÷ 2 = ${nodeInfo.value / 2}` : `${nodeInfo.value} × 3 + 1 = ${nodeInfo.value * 3 + 1}`;
      const type = isEven ? 'EVEN' : 'ODD';
      const text1 = `Number: ${nodeInfo.value.toLocaleString()}`;
      const text2 = `${type}: ${operation}`;
      
      const textWidth1 = ctx.measureText(text1).width;
      const textWidth2 = ctx.measureText(text2).width;
      const maxTextWidth = Math.max(textWidth1, textWidth2);
      const padding = 12;
      const lineHeight = 18;
      
      ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      const tooltipHeight = 50;
      ctx.beginPath();
      ctx.roundRect(
        mouseX - maxTextWidth / 2 - padding,
        mouseY - tooltipHeight,
        maxTextWidth + padding * 2,
        tooltipHeight,
        8
      );
      ctx.fill();
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = isEven ? '#00FF00' : '#FF6600';
      ctx.textAlign = 'center';
      ctx.fillText(text1, mouseX, mouseY - 28);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text2, mouseX, mouseY - 8);
      ctx.restore();
    } else if (hoveredSequenceRef.current !== null) {
      const hoveredSeq = sequences.find(s => s.number === hoveredSequenceRef.current);
      if (hoveredSeq) {
        const mouseX = lastMouseRef.current.x;
        const mouseY = lastMouseRef.current.y;
        
        // Get the color of the hovered sequence
        const index = sequences.findIndex(s => s.number === hoveredSequenceRef.current);
        const hue = (index * 137.508) % 360;
        const saturation = 65 + (index % 20);
        const lightness = 55 + (index % 15);
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        ctx.save();
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#00FFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Draw tooltip background
        const text = `Origin Seed: ${hoveredSeq.number.toLocaleString()}`;
        const textWidth = ctx.measureText(text).width;
        const padding = 10;
        
        ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(
          mouseX - textWidth / 2 - padding,
          mouseY - 40,
          textWidth + padding * 2,
          28,
          6
        );
        ctx.fill();
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(text, mouseX, mouseY - 18);
        ctx.restore();
      }
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [sequences, calculateSequencePath]);

  // Setup canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse wheel zoom
    const handleWheel = (e) => {
      e.preventDefault();
      const camera = cameraRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Zoom towards mouse position
      const worldX = (mouseX - camera.x) / camera.zoom;
      const worldY = (mouseY - camera.y) / camera.zoom;
      
      camera.targetZoom = Math.max(0.1, Math.min(10, camera.targetZoom * zoomFactor));
      camera.targetX = mouseX - worldX * camera.targetZoom;
      camera.targetY = mouseY - worldY * camera.targetZoom;
    };

    // Mouse drag pan
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      // Update last mouse position for tooltip
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      
      if (!isDraggingRef.current) {
        // Check for sequence hover when not dragging
        const canvas = canvasRef.current;
        const camera = cameraRef.current;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Convert screen coordinates to world coordinates
        const worldX = (mouseX - camera.x) / camera.zoom;
        const worldY = (mouseY - camera.y) / camera.zoom;
        
        // Find if mouse is over any sequence (nodes or line segments)
        let foundSequence = null;
        let foundNode = null;
        let minDistance = Infinity;
        const hoverThreshold = 30 / camera.zoom;
        
        sequences.forEach((seqData) => {
          const path = calculateSequencePath(seqData.sequence, canvas.width, canvas.height);
          
          // Check nodes
          path.forEach((point) => {
            const dx = point.x - worldX;
            const dy = point.y - worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hoverThreshold && distance < minDistance) {
              minDistance = distance;
              foundSequence = seqData.number;
              foundNode = point;
            }
          });
          
          // Check line segments
          for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            
            // Distance from point to line segment
            const distance = pointToLineDistance(worldX, worldY, p1.x, p1.y, p2.x, p2.y);
            
            if (distance < hoverThreshold && distance < minDistance) {
              minDistance = distance;
              foundSequence = seqData.number;
              foundNode = null; // Clear node when hovering line
            }
          }
        });
        
        hoveredSequenceRef.current = foundSequence;
        
        // Store node information if hovering over a node
        if (foundNode) {
          hoveredNodeInfoRef.current = {
            value: foundNode.value,
            sequenceNumber: foundSequence
          };
        } else {
          hoveredNodeInfoRef.current = null;
        }
      } else {
        // Handle dragging
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        
        cameraRef.current.targetX += dx;
        cameraRef.current.targetY += dy;
        
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Start render loop
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);


  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ display: 'block' }}
    />
  );
};

export default CollatzCanvas;
