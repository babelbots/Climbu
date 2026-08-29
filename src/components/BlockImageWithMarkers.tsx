import React, { useState, useRef, useEffect } from 'react';
import { Marker, BoulderGrade } from '../types';
import { Eye, EyeOff, X, Maximize2 } from 'lucide-react';
import { FullscreenBlockViewer } from './FullscreenBlockViewer';

interface BlockImageWithMarkersProps {
  imageUrl: string;
  markers: Marker[];
  aspectRatio?: string; // default 'aspect-[4/3]' or 'aspect-[2/1]'
  className?: string;
  showToggle?: boolean;
  showFullscreen?: boolean;
  blockName?: string;
  blockGrade?: BoulderGrade;
  wallName?: string;
  interactive?: boolean;
  activeMarkerType?: Marker['type'];
  onAddMarker?: (x: number, y: number) => void;
  onMoveMarker?: (id: string, x: number, y: number) => void;
  onDeleteMarker?: (id: string) => void;
  selectedMarkerId?: string | null;
  onSelectMarker?: (markerId: string | null) => void;
  onTypeChange?: (type: Marker['type']) => void;
  onUndoMarker?: () => void;
  currentRadius?: number;
  onRadiusChange?: (radius: number) => void;
  isFullscreenOpen?: boolean;
  onFullscreenChange?: (isOpen: boolean) => void;
}

export const BlockImageWithMarkers: React.FC<BlockImageWithMarkersProps> = ({
  imageUrl,
  markers,
  aspectRatio = 'aspect-[16/9] sm:aspect-[2/1]',
  className = '',
  showToggle = false,
  showFullscreen = true,
  blockName,
  blockGrade,
  wallName,
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
  isFullscreenOpen: controlledFullscreen,
  onFullscreenChange,
}) => {
  const [showMarkers, setShowMarkers] = useState(true);
  const [internalFullscreenOpen, setInternalFullscreenOpen] = useState(false);
  const isFullscreenOpen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreenOpen;

  const setFullscreenState = (open: boolean) => {
    if (onFullscreenChange) {
      onFullscreenChange(open);
    } else {
      setInternalFullscreenOpen(open);
    }
  };

  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setImageAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // Dragging state
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);
  const isDraggingRef = useRef(false);

  const getMarkerColor = (type: Marker['type']) => {
    switch (type) {
      case 'start':
        return '#22C55E'; // Verde
      case 'bonus':
        return '#A855F7'; // Morado
      case 'top':
        return '#EF4444'; // Rojo
      case 'hold':
      default:
        return '#EAB308'; // Amarillo Dorado
    }
  };

  const getMarkerTypeName = (type: Marker['type']) => {
    switch (type) {
      case 'start':
        return 'Salida';
      case 'bonus':
        return 'Bonus';
      case 'top':
        return 'Top';
      case 'hold':
      default:
        return 'Presa';
    }
  };

  // Global pointer move and up handlers during dragging
  useEffect(() => {
    if (!draggingMarkerId || !interactive || !onMoveMarker) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));

      setHasMovedDuringDrag(true);
      isDraggingRef.current = true;
      onMoveMarker(draggingMarkerId, x, y);
    };

    const handlePointerUp = () => {
      setDraggingMarkerId(null);
      setTimeout(() => {
        isDraggingRef.current = false;
        setHasMovedDuringDrag(false);
      }, 50);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggingMarkerId, interactive, onMoveMarker]);

  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onAddMarker) return;
    // If we clicked directly on the container (and not on a marker or button)
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      const rect = containerRef.current!.getBoundingClientRect();
      const x = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));
      onAddMarker(x, y);
    }
  };

  return (
    <>
      <div 
        ref={containerRef}
        onPointerDown={handleContainerPointerDown}
        style={{
          aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : undefined,
        }}
        className={`relative w-full ${imageAspectRatio ? '' : aspectRatio} bg-[var(--bg-surface)] overflow-hidden rounded-2xl select-none touch-none @container ${
          interactive ? 'cursor-crosshair' : ''
        } ${className}`}
      >
        <img
          src={imageUrl}
          alt={blockName || 'Vía de escalada en bloque'}
          onLoad={handleImageLoad}
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Markers Layer */}
        {showMarkers && (
          <div className="absolute inset-0 pointer-events-none">
            {markers.map((marker) => {
              const isSelected = selectedMarkerId === marker.id;
              const isDragging = draggingMarkerId === marker.id;
              const color = getMarkerColor(marker.type);
              const r = marker.radius || 20;
              const diameter = Math.round(r * 1.6);

              const leftPercent = `${marker.x * 100}%`;
              const topPercent = `${marker.y * 100}%`;

              return (
                <div
                  key={marker.id}
                  onPointerDown={(e) => {
                    if (!interactive) return;
                    e.stopPropagation();
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    setDraggingMarkerId(marker.id);
                    setHasMovedDuringDrag(false);
                    if (onSelectMarker) {
                      onSelectMarker(marker.id);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (interactive && onSelectMarker && !hasMovedDuringDrag) {
                      onSelectMarker(marker.id);
                    }
                  }}
                  style={{
                    left: leftPercent,
                    top: topPercent,
                    width: `${diameter}px`,
                    height: `${diameter}px`,
                    minWidth: `${diameter}px`,
                    minHeight: `${diameter}px`,
                    maxWidth: `${diameter}px`,
                    maxHeight: `${diameter}px`,
                    borderColor: color,
                    cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    boxShadow: isSelected
                      ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${color}, 0 4px 12px rgba(0,0,0,0.65)`
                      : `0 0 0 1.5px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.45)`,
                  }}
                  className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-transparent transition-transform duration-75 flex items-center justify-center group ${
                    isSelected ? 'scale-110 z-30 ring-2 ring-white/80' : isDragging ? 'scale-115 z-40' : 'hover:scale-105 z-20'
                  }`}
                  title={`${getMarkerTypeName(marker.type)}${interactive ? ' (Arrastra para mover o pulsa la cruz para borrar)' : ''}`}
                >
                  {/* Visual Type Indicator / Mini Badge inside the transparent ring */}
                  {marker.type === 'top' && (
                    <div className="absolute inset-1 rounded-full border border-dashed border-red-300 pointer-events-none opacity-85" />
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

                  {/* Editor Mode: Delete Cross Button (X) */}
                  {interactive && onDeleteMarker && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMarker(marker.id);
                      }}
                      className={`absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-90 z-40 ${
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

        {/* Action Overlay Buttons (Ocultar vía & Pantalla Completa / Zoom) */}
        {(showToggle || showFullscreen) && (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
            {showFullscreen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenState(true);
                }}
                className={`px-3 py-1.5 rounded-full backdrop-blur-md shadow-md border transition-all active:scale-95 text-xs flex items-center gap-1.5 ${
                  interactive
                    ? 'bg-[#E8C96A] text-[#1C1D1A] border-[#E8C96A] font-extrabold hover:bg-[#deb94f]'
                    : 'bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] font-bold'
                }`}
                title={interactive ? "Abrir editor con zoom y pantalla completa" : "Ver en pantalla completa con zoom"}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">
                  {interactive ? 'Editar con Zoom' : 'Pantalla completa'}
                </span>
              </button>
            )}

            {showToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMarkers(!showMarkers);
                }}
                className="px-3 py-1.5 rounded-full bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] text-[var(--text-primary)] backdrop-blur-md shadow-md border border-[var(--border-color)] transition-all active:scale-95 text-xs flex items-center gap-1.5"
                title={showMarkers ? 'Ocultar marcadores' : 'Mostrar marcadores'}
              >
                {showMarkers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-bold">{showMarkers ? 'Ocultar vía' : 'Ver vía'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Overlay Viewer with Zoom & Pan & Full Interactive Editing */}
      <FullscreenBlockViewer
        isOpen={isFullscreenOpen}
        onClose={() => setFullscreenState(false)}
        imageUrl={imageUrl}
        markers={markers}
        blockName={blockName}
        blockGrade={blockGrade}
        wallName={wallName}
        interactive={interactive}
        activeMarkerType={activeMarkerType}
        onAddMarker={onAddMarker}
        onMoveMarker={onMoveMarker}
        onDeleteMarker={onDeleteMarker}
        selectedMarkerId={selectedMarkerId}
        onSelectMarker={onSelectMarker}
        onTypeChange={onTypeChange}
        onUndoMarker={onUndoMarker}
        currentRadius={currentRadius}
        onRadiusChange={onRadiusChange}
      />
    </>
  );
};
