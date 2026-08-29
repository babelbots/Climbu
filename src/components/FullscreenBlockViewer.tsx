import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Marker, BoulderGrade } from '../types';
import { GradeBadge } from './GradeBadge';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Minimize2,
  Move,
  Plus,
  Undo,
  Trash2,
  Sliders,
  Check
} from 'lucide-react';

interface FullscreenBlockViewerProps {
  imageUrl: string;
  markers: Marker[];
  blockName?: string;
  blockGrade?: BoulderGrade;
  wallName?: string;
  isOpen: boolean;
  onClose: () => void;
  // Editor mode props
  interactive?: boolean;
  activeMarkerType?: Marker['type'];
  onAddMarker?: (x: number, y: number) => void;
  onMoveMarker?: (id: string, x: number, y: number) => void;
  onDeleteMarker?: (id: string) => void;
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string | null) => void;
  onTypeChange?: (type: Marker['type']) => void;
  onUndoMarker?: () => void;
  currentRadius?: number;
  onRadiusChange?: (radius: number) => void;
}

export const FullscreenBlockViewer: React.FC<FullscreenBlockViewerProps> = ({
  imageUrl,
  markers,
  blockName,
  blockGrade,
  wallName,
  isOpen,
  onClose,
  interactive = false,
  activeMarkerType = 'start',
  onAddMarker,
  onMoveMarker,
  onDeleteMarker,
  selectedMarkerId,
  onSelectMarker,
  onTypeChange,
  onUndoMarker,
  currentRadius = 20,
  onRadiusChange,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMarkers, setShowMarkers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Tool Mode in interactive zoom: 'draw' (click to place/drag presas) vs 'pan' (drag to move around zoomed view)
  const [activeTool, setActiveTool] = useState<'draw' | 'pan'>('draw');

  // Dragging individual marker state inside fullscreen
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [hasMovedMarker, setHasMovedMarker] = useState(false);
  const isDraggingMarkerRef = useRef(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);

  // Extract true image aspect ratio when loaded
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset zoom & pan whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1.2); // Start with a slight comfortable zoom in fullscreen
      setPosition({ x: 0, y: 0 });
      setShowMarkers(true);
      setIsDragging(false);
      setActiveTool('draw');
    }
  }, [isOpen]);

  const clampPosition = useCallback((newX: number, newY: number, currentScale: number) => {
    if (currentScale <= 1 || !imageWrapperRef.current || !stageRef.current) {
      return { x: 0, y: 0 };
    }
    const stageRect = stageRef.current.getBoundingClientRect();
    const imgRect = imageWrapperRef.current.getBoundingClientRect();
    
    // Bounds for panning
    const maxPanX = Math.max(0, (imgRect.width - stageRect.width) / 2 + 120);
    const maxPanY = Math.max(0, (imgRect.height - stageRect.height) / 2 + 120);

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
    };
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => {
      const next = Math.min(4, Math.round((prev + 0.4) * 10) / 10);
      return next;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Math.round((prev - 0.4) * 10) / 10);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((pos) => clampPosition(pos.x, pos.y, next));
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (interactive && activeTool === 'draw') {
      // In draw mode, double click doesn't reset zoom to prevent accidental loss of position
      return;
    }
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0015;
    setScale((prev) => {
      const next = Math.max(1, Math.min(4, Math.round((prev + zoomDelta) * 100) / 100));
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((pos) => clampPosition(pos.x, pos.y, next));
      }
      return next;
    });
  }, [clampPosition]);

  // Global pointer move and up handlers when dragging an individual marker inside zoomed view
  useEffect(() => {
    if (!draggingMarkerId || !interactive || !onMoveMarker) return;

    const handleMarkerPointerMove = (e: PointerEvent) => {
      if (!imageWrapperRef.current) return;
      const rect = imageWrapperRef.current.getBoundingClientRect();
      const x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

      setHasMovedMarker(true);
      isDraggingMarkerRef.current = true;
      onMoveMarker(draggingMarkerId, x, y);
    };

    const handleMarkerPointerUp = () => {
      setDraggingMarkerId(null);
      setTimeout(() => {
        isDraggingMarkerRef.current = false;
        setHasMovedMarker(false);
      }, 60);
    };

    window.addEventListener('pointermove', handleMarkerPointerMove);
    window.addEventListener('pointerup', handleMarkerPointerUp);
    window.addEventListener('pointercancel', handleMarkerPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleMarkerPointerMove);
      window.removeEventListener('pointerup', handleMarkerPointerUp);
      window.removeEventListener('pointercancel', handleMarkerPointerUp);
    };
  }, [draggingMarkerId, interactive, onMoveMarker]);

  // Pointer drag to pan (works on mouse & touch)
  const handleStagePointerDown = (e: React.PointerEvent) => {
    // If we're clicking on a marker or button, ignore stage pan
    if (draggingMarkerId) return;

    // Check if middle click or pan mode or scale > 1 with pan tool
    const isMiddleClick = e.button === 1;
    const isSpaceOrPanTool = activeTool === 'pan' || isMiddleClick;

    if (isSpaceOrPanTool) {
      if (scale <= 1 && !isMiddleClick) return;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    // In 'draw' mode: placing a new marker directly on the zoomed image
    if (interactive && onAddMarker && imageWrapperRef.current) {
      const rect = imageWrapperRef.current.getBoundingClientRect();
      // Check if click was within the image bounds
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));
        onAddMarker(x, y);
      }
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || scale <= 1) return;
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;
    setPosition(clampPosition(rawX, rawY, scale));
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Touch Pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - lastTouchDistanceRef.current;
      lastTouchDistanceRef.current = dist;

      setScale((prev) => {
        const next = Math.max(1, Math.min(4, Math.round((prev + diff * 0.008) * 100) / 100));
        if (next === 1) {
          setPosition({ x: 0, y: 0 });
        } else {
          setPosition((pos) => clampPosition(pos.x, pos.y, next));
        }
        return next;
      });
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null;
  };

  const getMarkerColor = (type: Marker['type']) => {
    switch (type) {
      case 'start':
        return '#22C55E';
      case 'bonus':
        return '#A855F7';
      case 'top':
        return '#EF4444';
      case 'hold':
      default:
        return '#EAB308';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col select-none touch-none animate-in fade-in duration-200"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/80 backdrop-blur-md border-b border-white/10 text-white z-20 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {blockGrade && <GradeBadge grade={blockGrade} size="sm" />}
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-[180px] sm:max-w-md">
              {blockName || (interactive ? 'Editor en Modo Zoom' : 'Visualizador de Bloque')}
            </h3>
            {wallName && (
              <p className="text-[11px] text-stone-400 font-medium truncate">{wallName}</p>
            )}
          </div>
        </div>

        {/* Top Center: Editor Quick Presas Bar (If interactive) */}
        {interactive && onTypeChange && (
          <div className="hidden md:flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-2xl border border-white/15 shadow-md">
            {/* Salida */}
            <button
              type="button"
              onClick={() => onTypeChange('start')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeMarkerType === 'start'
                  ? 'bg-[#22C55E] text-black font-extrabold border-[#22C55E] shadow-sm'
                  : 'bg-stone-800/80 text-stone-300 border-transparent hover:bg-stone-700'
              }`}
              title="Salida (Aro verde)"
            >
              <span className="w-3 h-3 rounded-full border-2 border-current bg-transparent" />
              <span>Salida</span>
            </button>

            {/* Presa */}
            <button
              type="button"
              onClick={() => onTypeChange('hold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeMarkerType === 'hold'
                  ? 'bg-[#EAB308] text-black font-extrabold border-[#EAB308] shadow-sm'
                  : 'bg-stone-800/80 text-stone-300 border-transparent hover:bg-stone-700'
              }`}
              title="Presa intermedia (Aro amarillo)"
            >
              <span className="w-3 h-3 rounded-full border-2 border-current bg-transparent" />
              <span>Presa</span>
            </button>

            {/* Bonus */}
            <button
              type="button"
              onClick={() => onTypeChange('bonus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeMarkerType === 'bonus'
                  ? 'bg-[#A855F7] text-white font-extrabold border-[#A855F7] shadow-sm'
                  : 'bg-stone-800/80 text-stone-300 border-transparent hover:bg-stone-700'
              }`}
              title="Presa de bonus / zona (Aro morado)"
            >
              <span className="w-3 h-3 rounded-full border-2 border-current bg-transparent" />
              <span>Bonus</span>
            </button>

            {/* Top */}
            <button
              type="button"
              onClick={() => onTypeChange('top')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeMarkerType === 'top'
                  ? 'bg-[#EF4444] text-white font-extrabold border-[#EF4444] shadow-sm'
                  : 'bg-stone-800/80 text-stone-300 border-transparent hover:bg-stone-700'
              }`}
              title="TOP / Final (Aro rojo)"
            >
              <span className="w-3 h-3 rounded-full border-2 border-current bg-transparent" />
              <span>Top</span>
            </button>

            {onUndoMarker && (
              <button
                type="button"
                onClick={onUndoMarker}
                disabled={markers.length === 0}
                className="p-1.5 ml-1 rounded-xl bg-stone-800 text-stone-300 hover:text-white disabled:opacity-30 transition-colors"
                title="Deshacer última presa"
              >
                <Undo className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Exit / Done Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-[#E8C96A] hover:bg-[#deb94f] active:scale-95 transition-all text-[#1C1D1A] text-xs font-black flex items-center gap-1.5 shadow-md border border-[#E8C96A]"
            title="Guardar cambios y volver"
          >
            {interactive ? <Check className="w-4 h-4 stroke-[3]" /> : <Minimize2 className="w-4 h-4" />}
            <span>{interactive ? 'Listo / Volver' : 'Volver'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center border border-white/10"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main 
        ref={stageRef}
        className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-2 sm:p-6"
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{ 
          cursor: activeTool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : (interactive ? 'crosshair' : (scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'))
        }}
      >
        <div
          ref={imageWrapperRef}
          className={`relative shrink-0 origin-center select-none overflow-visible ${
            isDragging ? '' : 'transition-transform duration-100 ease-out'
          }`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            width: aspectRatio ? `min(94vw, calc(80vh * ${aspectRatio}))` : 'min(94vw, calc(80vh * 1.95))',
            aspectRatio: aspectRatio ? `${aspectRatio}` : '2000 / 1024',
          }}
        >
          {/* Boulder Wall Image */}
          <img
            src={imageUrl}
            alt={blockName || 'Bloque'}
            onLoad={handleImageLoad}
            className="w-full h-full object-cover rounded-2xl shadow-2xl pointer-events-none select-none block"
            draggable={false}
          />

          {/* Markers Overlay */}
          {showMarkers && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {markers.map((marker) => {
                const isSelected = selectedMarkerId === marker.id;
                const isMarkerBeingDragged = draggingMarkerId === marker.id;
                const color = getMarkerColor(marker.type);
                const r = marker.radius || 20;
                // Diameter in px (scaled with parent wrapper)
                const diameter = Math.round(r * 1.6);

                return (
                  <div
                    key={marker.id}
                    onPointerDown={(e) => {
                      if (!interactive) return;
                      e.stopPropagation();
                      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                      setDraggingMarkerId(marker.id);
                      setHasMovedMarker(false);
                      if (onSelectMarker) {
                        onSelectMarker(marker.id);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (interactive && onSelectMarker && !hasMovedMarker) {
                        onSelectMarker(marker.id);
                      }
                    }}
                    style={{
                      left: `${marker.x * 100}%`,
                      top: `${marker.y * 100}%`,
                      width: `${diameter}px`,
                      height: `${diameter}px`,
                      borderColor: color,
                      cursor: interactive ? (isMarkerBeingDragged ? 'grabbing' : 'grab') : 'default',
                      boxShadow: isSelected
                        ? `0 0 0 2.5px #FFFFFF, 0 0 0 5px ${color}, 0 6px 16px rgba(0,0,0,0.85)`
                        : `0 0 0 1.5px rgba(0,0,0,0.85), 0 3px 10px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.3)`,
                    }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-transparent flex items-center justify-center pointer-events-auto transition-transform duration-75 group ${
                      isSelected ? 'scale-115 z-30 ring-2 ring-white' : isMarkerBeingDragged ? 'scale-120 z-40' : 'hover:scale-105 z-20'
                    }`}
                    title={`${marker.type.toUpperCase()}${interactive ? ' (Arrastra para mover o pulsa la cruz para borrar)' : ''}`}
                  >
                    {marker.type === 'top' && (
                      <div className="absolute inset-1 rounded-full border border-dashed border-red-300 pointer-events-none opacity-90" />
                    )}
                    {marker.type === 'bonus' && (
                      <span className="text-[11px] font-black text-purple-100 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none">
                        B
                      </span>
                    )}
                    {marker.type === 'start' && (
                      <span className="text-[10px] font-black text-green-100 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none">
                        S
                      </span>
                    )}

                    {/* Delete Cross (X) in Interactive Mode */}
                    {interactive && onDeleteMarker && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMarker(marker.id);
                        }}
                        className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-90 z-40 ${
                          isSelected ? 'opacity-100 scale-100' : 'opacity-80 hover:opacity-100 group-hover:scale-105'
                        }`}
                        title="Eliminar esta presa"
                      >
                        <X className="w-3 h-3 stroke-[3]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Control Bar with Presa Selector, Tools and Zoom Controls */}
      <footer className="z-20 p-3 sm:p-4 pb-6 flex flex-col items-center justify-between gap-3 bg-gradient-to-t from-black via-black/80 to-transparent shrink-0">
        
        {/* Interactive Editor Mobile/Universal Bar */}
        {interactive && onTypeChange && (
          <div className="flex md:hidden flex-wrap items-center justify-center gap-1.5 bg-stone-900/90 px-3 py-2 rounded-2xl backdrop-blur-md border border-white/15 w-full max-w-lg">
            <button
              type="button"
              onClick={() => onTypeChange('start')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                activeMarkerType === 'start' ? 'bg-[#22C55E] text-black font-extrabold' : 'bg-stone-800 text-stone-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-current" />
              <span>Salida</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('hold')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                activeMarkerType === 'hold' ? 'bg-[#EAB308] text-black font-extrabold' : 'bg-stone-800 text-stone-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-current" />
              <span>Presa</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('bonus')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                activeMarkerType === 'bonus' ? 'bg-[#A855F7] text-white font-extrabold' : 'bg-stone-800 text-stone-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-current" />
              <span>Bonus</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange('top')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                activeMarkerType === 'top' ? 'bg-[#EF4444] text-white font-extrabold' : 'bg-stone-800 text-stone-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-current" />
              <span>Top</span>
            </button>

            {onUndoMarker && (
              <button
                type="button"
                onClick={onUndoMarker}
                disabled={markers.length === 0}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-300 disabled:opacity-30 ml-auto"
                title="Deshacer"
              >
                <Undo className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-4xl px-2">
          {/* Mode Switcher: Colocar Presas vs Desplazar Muro (Pan) */}
          {interactive ? (
            <div className="flex items-center gap-1.5 bg-stone-900/90 p-1 rounded-2xl backdrop-blur-md border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTool('draw')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'draw'
                    ? 'bg-[#E8C96A] text-[#1C1D1A] font-extrabold shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Modo Colocar: Haz clic en la pared con zoom para poner presas"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Colocar Presas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('pan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'pan'
                    ? 'bg-[#E8C96A] text-[#1C1D1A] font-extrabold shadow-sm'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Modo Desplazar: Arrastra la pantalla para mover la pared con zoom"
              >
                <Move className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Desplazar Muro</span>
              </button>
            </div>
          ) : (
            /* Standard Legend */
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-stone-300 bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#22C55E] bg-transparent inline-block shadow-xs" />
                <span>Salida</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#EAB308] bg-transparent inline-block shadow-xs" />
                <span>Presa</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#A855F7] bg-transparent inline-block shadow-xs" />
                <span>Bonus</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#EF4444] bg-transparent inline-block shadow-xs" />
                <span>Top</span>
              </span>
            </div>
          )}

          {/* Radius control in interactive mode */}
          {interactive && onRadiusChange && (
            <div className="hidden sm:flex items-center gap-2 bg-stone-900/90 px-3 py-1.5 rounded-2xl border border-white/15 text-white">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-stone-300">Tamaño:</span>
              <input
                type="range"
                min={12}
                max={42}
                step={1}
                value={currentRadius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#E8C96A]"
              />
              <span className="text-[11px] font-mono text-amber-400 font-bold">{currentRadius}px</span>
            </div>
          )}

          {/* Zoom & Visibility Action Pill Controls */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/15 text-white ml-auto">
            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 active:scale-95 flex items-center justify-center transition-all"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Level Indicator */}
            <span className="text-xs font-mono font-bold min-w-[45px] text-center text-amber-400">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom In Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 active:scale-95 flex items-center justify-center transition-all"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Reset Zoom */}
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center gap-1 text-[10px] font-bold transition-all ml-0.5"
              title="Restablecer vista a 100%"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">100%</span>
            </button>

            <div className="w-px h-4 bg-white/20 mx-1" />

            {/* Toggle Markers */}
            <button
              type="button"
              onClick={() => setShowMarkers(!showMarkers)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center gap-1 text-xs font-bold transition-all"
              title={showMarkers ? 'Ocultar marcadores' : 'Mostrar marcadores'}
            >
              {showMarkers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showMarkers ? 'Ocultar' : 'Ver'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};


