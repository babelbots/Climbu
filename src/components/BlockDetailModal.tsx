import React, { useState } from 'react';
import { BoulderBlock, UserBlockProgress } from '../types';
import { BlockImageWithMarkers } from './BlockImageWithMarkers';
import { GradeBadge } from './GradeBadge';
import { getLevelForGrade, getLevelInfo } from '../utils/gradeUtils';
import { 
  X, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle2, 
  Bookmark, 
  Circle, 
  Zap, 
  Plus, 
  Minus, 
  Heart, 
  Archive,
  Share2,
  Check,
  Flame
} from 'lucide-react';

interface BlockDetailModalProps {
  block: BoulderBlock | null;
  userProgress?: UserBlockProgress;
  isLoggedIn: boolean;
  onClose: () => void;
  onUpdateProgress?: (progress: Partial<UserBlockProgress>) => void;
  onToggleFavorite?: () => void;
}

export const BlockDetailModal: React.FC<BlockDetailModalProps> = ({
  block,
  userProgress,
  isLoggedIn,
  onClose,
  onUpdateProgress,
  onToggleFavorite,
}) => {
  if (!block) return null;

  const level = getLevelForGrade(block.grade);
  const levelInfo = getLevelInfo(level);
  const [selectedStatus, setSelectedStatus] = useState<'untried' | 'project' | 'completed'>(
    userProgress?.status || 'untried'
  );
  const [attempts, setAttempts] = useState<number>(userProgress?.attempts || 1);
  const [isFlash, setIsFlash] = useState<boolean>(userProgress?.flash || false);
  const [completionDate, setCompletionDate] = useState<string>(
    userProgress?.completedAt || new Date().toISOString().split('T')[0]
  );
  const [personalNotes, setPersonalNotes] = useState<string>(userProgress?.notes || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isRetired = block.status === 'retired';
  const isFavorite = !!userProgress?.favorite;

  const handleStatusChange = (status: 'untried' | 'project' | 'completed') => {
    setSelectedStatus(status);
    if (onUpdateProgress) {
      onUpdateProgress({
        blockId: block.id,
        status,
        attempts: status === 'completed' ? attempts : undefined,
        flash: status === 'completed' ? isFlash : undefined,
        completedAt: status === 'completed' ? completionDate : undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleSaveFullDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProgress) {
      onUpdateProgress({
        blockId: block.id,
        status: selectedStatus,
        attempts,
        flash: isFlash,
        completedAt: selectedStatus === 'completed' ? completionDate : undefined,
        notes: personalNotes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] bg-white dark:bg-[#20211F] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#DDDAD3] dark:border-[#383A36] animate-in slide-in-from-bottom-4 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-[#20211F]/90 backdrop-blur-md border-b border-[#DDDAD3] dark:border-[#383A36]">
          <div className="flex items-center gap-2.5">
            <GradeBadge grade={block.grade} size="md" />
            <span className="font-extrabold text-sm text-[#292927] dark:text-[#F2F0EA]">{block.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#EFEDE7] dark:bg-[#292A27] hover:bg-[#E5E2DA] dark:hover:bg-[#333531] text-[#73716C] dark:text-[#AAA8A1] transition-all active:scale-95 border border-[#DDDAD3] dark:border-[#383A36]"
                title="Favorito"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#D98278] text-[#D98278]' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#EFEDE7] dark:bg-[#292A27] hover:bg-[#E5E2DA] dark:hover:bg-[#333531] text-[#73716C] dark:text-[#AAA8A1] transition-all active:scale-95 border border-[#DDDAD3] dark:border-[#383A36]"
              title="Compartir vía"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#EFEDE7] dark:bg-[#292A27] hover:bg-[#E5E2DA] dark:hover:bg-[#333531] text-[#292927] dark:text-[#F2F0EA] transition-all active:scale-95 border border-[#DDDAD3] dark:border-[#383A36] ml-1"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Main Visual Image with Markers */}
          <div className="space-y-2.5">
            <BlockImageWithMarkers
              imageUrl={block.imageUrl}
              markers={block.markers}
              aspectRatio="aspect-[16/9] sm:aspect-[2/1]"
              showToggle={true}
              showFullscreen={true}
              blockName={block.name}
              blockGrade={block.grade}
              wallName={block.wallName}
            />

            {/* Marker Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-[#5C5B56] dark:text-[#AAA8A1] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#22C55E] bg-transparent inline-block shadow-xs" />
                <span>Salida (Start)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#EAB308] bg-transparent inline-block shadow-xs" />
                <span>Presa (Hold)</span>
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
          </div>

          {/* Retired Status Notice if applicable */}
          {isRetired && (
            <div className="p-4 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#292927] text-[#E8C96A] flex items-center justify-center flex-shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#292927] dark:text-[#F2F0EA]">Vía física retirada del rocódromo</p>
                <p className="text-[#73716C] dark:text-[#AAA8A1] text-[11px]">
                  {block.retiredAt ? `Retirada el ${block.retiredAt}. ` : ''}
                  Permanece activa en tu historial y estadísticas.
                </p>
              </div>
            </div>
          )}

          {/* Details Block */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
                  {block.name}
                </h1>
                <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E8C96A]" />
                  <span className="font-bold text-[#292927] dark:text-[#F2F0EA]">{block.wallName}</span>
                </p>
              </div>

              <span 
                className="px-3 py-1 rounded-full text-xs font-extrabold shadow-xs"
                style={{
                  backgroundColor: levelInfo.bgVar,
                  color: levelInfo.textVar,
                }}
              >
                {levelInfo.name}
              </span>
            </div>

            {/* Tags */}
            {block.tags && block.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {block.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] dark:text-[#AAA8A1] text-xs font-semibold border border-[#DDDAD3] dark:border-[#383A36]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="pt-2">
              <p className="text-sm text-[#292927] dark:text-[#F2F0EA] leading-relaxed font-normal">
                {block.description}
              </p>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center gap-4 text-[11px] text-[#73716C] dark:text-[#AAA8A1] pt-2 border-t border-[#DDDAD3] dark:border-[#383A36]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Equipado: {block.createdAt}</span>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{block.createdBy}</span>
              </span>
            </div>
          </div>

          {/* User Progress Section */}
          <div className="bg-[#EFEDE7] dark:bg-[#292A27] rounded-3xl p-5 border border-[#DDDAD3] dark:border-[#383A36] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
                Tu Progreso en esta Vía
              </h2>
              {savedSuccess && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> ¡Guardado!
                </span>
              )}
            </div>

            {isLoggedIn ? (
              <div className="space-y-4">
                {/* 3 Status Buttons (Instant 1-tap change) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlash(false);
                      handleStatusChange('untried');
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      selectedStatus === 'untried'
                        ? 'bg-[#E5E2DA] text-[#1C1D1A] dark:bg-[#333531] dark:text-[#F4F2EC] border-[#CFCBC1] dark:border-[#444641] shadow-xs font-extrabold'
                        : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36] hover:bg-[#EFEDE7]'
                    }`}
                  >
                    <Circle className="w-4 h-4" />
                    <span>Sin probar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFlash(false);
                      handleStatusChange('project');
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      selectedStatus === 'project'
                        ? 'bg-[#87A9D8] text-[#1B3F70] border-[#87A9D8] shadow-xs font-extrabold'
                        : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36] hover:bg-[#EFEDE7]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${selectedStatus === 'project' ? 'fill-current' : ''}`} />
                    <span>Proyecto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('completed')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border ${
                      selectedStatus === 'completed'
                        ? 'bg-[#E8C96A] text-[#1C1D1A] border-[#E8C96A] shadow-xs font-extrabold'
                        : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36] hover:bg-[#EFEDE7]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Encadenado</span>
                  </button>
                </div>

                {/* Flash Quick Button with Fire Icon (Directly underneath the 3 buttons) */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStatus !== 'completed') {
                      setSelectedStatus('completed');
                      setIsFlash(true);
                      setAttempts(1);
                      if (onUpdateProgress) {
                        onUpdateProgress({
                          blockId: block.id,
                          status: 'completed',
                          flash: true,
                          attempts: 1,
                          completedAt: completionDate,
                        });
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2000);
                      }
                    } else {
                      const nextFlash = !isFlash;
                      setIsFlash(nextFlash);
                      const nextAttempts = nextFlash ? 1 : Math.max(2, attempts);
                      setAttempts(nextAttempts);
                      if (onUpdateProgress) {
                        onUpdateProgress({
                          blockId: block.id,
                          status: 'completed',
                          flash: nextFlash,
                          attempts: nextAttempts,
                          completedAt: completionDate,
                        });
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2000);
                      }
                    }
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border active:scale-[0.99] ${
                    selectedStatus === 'completed' && isFlash
                      ? 'bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold shadow-xs ring-1 ring-orange-500/30'
                      : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      selectedStatus === 'completed' && isFlash
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-[#EFEDE7] dark:bg-[#292A27] text-orange-500'
                    }`}>
                      <Flame className={`w-4 h-4 ${selectedStatus === 'completed' && isFlash ? 'fill-current' : 'fill-orange-500/40 text-orange-500'}`} />
                    </div>
                    <div className="text-left">
                      <span className="block font-extrabold text-xs text-[#292927] dark:text-[#F2F0EA]">
                        {selectedStatus === 'completed' && isFlash ? '¡Encadenado al Flash (1er pegue)!' : 'Encadene al Flash (1er pegue)'}
                      </span>
                      <span className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] font-normal">
                        Completado al primer intento sin caídas
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    selectedStatus === 'completed' && isFlash
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] dark:text-[#AAA8A1]'
                  }`}>
                    <Flame className="w-3 h-3 fill-current" />
                    <span>{selectedStatus === 'completed' && isFlash ? 'FLASH ACTIVO' : 'FLASH'}</span>
                  </span>
                </button>

                {/* Optional Expanded Form when marked Encadenado */}
                {selectedStatus === 'completed' && (
                  <form onSubmit={handleSaveFullDetails} className="space-y-3.5 pt-3 border-t border-[#DDDAD3] dark:border-[#383A36] animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1] mb-1">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={completionDate}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs rounded-2xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1] mb-1">
                          Intentos
                        </label>
                        <div className="flex items-center bg-white dark:bg-[#20211F] rounded-2xl border border-[#DDDAD3] dark:border-[#383A36] px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(1, attempts - 1);
                              setAttempts(next);
                              if (next > 1 && isFlash) setIsFlash(false);
                            }}
                            className="p-2 text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA] active:scale-90"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="flex-1 text-center font-bold text-xs text-[#292927] dark:text-[#F2F0EA]">
                            {attempts}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = attempts + 1;
                              setAttempts(next);
                              if (next > 1 && isFlash) setIsFlash(false);
                            }}
                            className="p-2 text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA] active:scale-90"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Flash toggle */}
                    <div 
                      onClick={() => {
                        const next = !isFlash;
                        setIsFlash(next);
                        if (next) setAttempts(1);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isFlash 
                          ? 'bg-orange-500/10 dark:bg-orange-950/30 border-orange-500/50' 
                          : 'bg-white dark:bg-[#20211F] border-[#DDDAD3] dark:border-[#383A36]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Flame className={`w-4 h-4 ${isFlash ? 'text-orange-500 fill-orange-500' : 'text-[#73716C]'}`} />
                        <div>
                          <p className="text-xs font-bold text-[#292927] dark:text-[#F2F0EA]">¿Fue al primer pegue (Flash)?</p>
                          <p className="text-[10px] text-[#73716C] dark:text-[#AAA8A1]">Encadene sin caídas previas</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isFlash}
                        onChange={(e) => {
                          setIsFlash(e.target.checked);
                          if (e.target.checked) setAttempts(1);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                      />
                    </div>

                    {/* Personal Notes */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1] mb-1">
                        Tus notas (beta, sensaciones)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Salir con talón derecho y buscar la regleta invertida"
                        value={personalNotes}
                        onChange={(e) => setPersonalNotes(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs rounded-2xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:ring-2 focus:ring-[#E8C96A] placeholder:text-[#9E9C95]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Registro</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#20211F] text-center space-y-2 border border-[#DDDAD3] dark:border-[#383A36]">
                <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                  Inicia sesión para registrar tus encadenes, añadir a proyectos y consultar estadísticas personales.
                </p>
                <button
                  type="button"
                  onClick={() => alert('En Fase 2 se conectará con Google Sign-In / Firebase Auth. Cambia a "Escalador" arriba para probar esta funcionalidad.')}
                  className="px-5 py-2.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-bold inline-flex items-center gap-2 shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Iniciar sesión con Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
