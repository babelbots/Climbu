import React, { useState } from 'react';
import { Wall, BoulderGrade, Marker, UserProposal, UserProfile } from '../types';
import { ALL_GRADES } from '../utils/gradeUtils';
import { BlockImageWithMarkers } from '../components/BlockImageWithMarkers';
import { GradeBadge } from '../components/GradeBadge';
import { optimizeImageFile } from '../utils/imageUtils';
import { 
  X, 
  Upload, 
  Undo, 
  Trash2, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sliders,
  Sparkles,
  Move,
  Loader2
} from 'lucide-react';

interface ProposeBlockModalProps {
  walls: Wall[];
  currentUser: UserProfile;
  gymId: string;
  onClose: () => void;
  onSubmitProposal: (proposal: UserProposal) => void;
}

const SAMPLE_PHOTOS = [
  {
    name: 'Sector Campus & Techo',
    url: '/walls/Pared1.png',
    wallId: 'wall-campus-techo',
  },
  {
    name: 'El Gran Diamante',
    url: '/walls/Pared2.png',
    wallId: 'wall-gran-diamante',
  },
  {
    name: 'La Diagonal (Desplome Z)',
    url: '/walls/Pared3.png',
    wallId: 'wall-la-diagonal',
  }
];

export const ProposeBlockModal: React.FC<ProposeBlockModalProps> = ({
  walls,
  currentUser,
  gymId,
  onClose,
  onSubmitProposal,
}) => {
  const dynamicPhotos = walls.length > 0
    ? walls.map(w => ({ name: w.name, url: w.imageUrl, wallId: w.id }))
    : SAMPLE_PHOTOS;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [imageUrl, setImageUrl] = useState<string>(dynamicPhotos[0]?.url || '/walls/Pared1.png');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeMarkerType, setActiveMarkerType] = useState<Marker['type']>('start');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [defaultRadius, setDefaultRadius] = useState<number>(20);

  // Form Details - Auto initialize with wall matching initial photo
  const initialWall = walls.find(w => w.id === dynamicPhotos[0]?.wallId || w.imageUrl === dynamicPhotos[0]?.url) || walls[0];
  const [proposalName, setProposalName] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<BoulderGrade>('6B');
  const [selectedWallId, setSelectedWallId] = useState<string>(initialWall?.id || walls[0]?.id || 'wall-1');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Técnico']);
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const availableTags = ['Técnico', 'Fuerza', 'Dinámico', 'Regletas', 'Equilibrio', 'Compresión', 'Techo', 'Iniciación'];

  const handleSelectSample = (sample: { name: string; url: string; wallId: string }) => {
    setImageUrl(sample.url);
    const matched = walls.find(w => w.id === sample.wallId || w.imageUrl === sample.url || w.name.toLowerCase() === sample.name.toLowerCase());
    if (matched) {
      setSelectedWallId(matched.id);
    }
  };

  const selectedMarker = markers.find(m => m.id === selectedMarkerId);
  const currentRadius = selectedMarker?.radius || defaultRadius;

  const handleAddMarker = (x: number, y: number) => {
    const newMarker: Marker = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: activeMarkerType,
      x,
      y,
      radius: defaultRadius,
      label: activeMarkerType === 'start' ? 'Salida' : (activeMarkerType === 'top' ? 'TOP' : (activeMarkerType === 'bonus' ? 'Bonus' : 'Presa')),
    };
    setMarkers(prev => [...prev, newMarker]);
    setSelectedMarkerId(newMarker.id);

    // Auto advance marker type convenience
    if (activeMarkerType === 'start' && markers.filter(m => m.type === 'start').length >= 1) {
      setActiveMarkerType('hold');
    }
  };

  const handleMoveMarker = (id: string, x: number, y: number) => {
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null);
    }
  };

  const handleUndoMarker = () => {
    if (markers.length === 0) return;
    setMarkers(prev => prev.slice(0, -1));
    setSelectedMarkerId(null);
  };

  const handleRadiusChange = (newRadius: number) => {
    setDefaultRadius(newRadius);
    if (selectedMarkerId) {
      setMarkers(prev => prev.map(m => m.id === selectedMarkerId ? { ...m, radius: newRadius } : m));
    }
  };

  const handleTypeChangeForSelected = (type: Marker['type']) => {
    setActiveMarkerType(type);
    if (selectedMarkerId) {
      setMarkers(prev => prev.map(m => m.id === selectedMarkerId ? { ...m, type } : m));
    }
  };

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingImage(true);
        const dataUrl = await optimizeImageFile(file, 1200, 0.82);
        setImageUrl(dataUrl);
      } catch (err) {
        console.error('Error optimizing image:', err);
        const fallbackUrl = URL.createObjectURL(file);
        setImageUrl(fallbackUrl);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSubmit = () => {
    const selectedWall = walls.find(w => w.id === selectedWallId);
    const newProposal: UserProposal = {
      id: `prop-${Date.now()}`,
      gymId: gymId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      name: proposalName.trim() || `Propuesta ${selectedGrade} en ${selectedWall?.name || 'Muro'}`,
      grade: selectedGrade,
      wallId: selectedWallId,
      wallName: selectedWall?.name || 'Muro Principal',
      tags: selectedTags,
      notes: notes.trim(),
      imageUrl,
      markers,
      createdAt: 'Ahora mismo',
      status: 'pending',
    };

    onSubmitProposal(newProposal);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#20211F] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#DCD9D1] dark:border-[#383A36] animate-in slide-in-from-bottom-4 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCD9D1] dark:border-[#383A36] bg-white/90 dark:bg-[#20211F]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8C96A] text-[#1C1D1A] flex items-center justify-center font-extrabold text-xs shadow-xs">
              {step}
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#1C1D1A] dark:text-[#F4F2EC]">
                Proponer Nuevo Bloque
              </h2>
              <p className="text-[11px] text-[#5C5B56] dark:text-[#AAA8A1]">
                {step === 1 && 'Paso 1: Selecciona o sube la fotografía'}
                {step === 2 && 'Paso 2: Marca las presas de la vía'}
                {step === 3 && 'Paso 3: Grado, pared y características'}
                {step === 4 && 'Paso 4: Confirmación y envío'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#EFEDE7] dark:bg-[#292A27] hover:bg-[#E5E2DA] dark:hover:bg-[#333531] text-[#5C5B56] dark:text-[#AAA8A1] border border-[#DCD9D1] dark:border-[#383A36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content by Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#EAF4E5] text-[#244419] flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1D1A] dark:text-[#F4F2EC]">
                ¡Propuesta Enviada!
              </h3>
              <p className="text-xs text-[#5C5B56] dark:text-[#AAA8A1] max-w-sm mx-auto">
                Los equipadores del Rocódromo de Alhama revisarán el trazado y la dificultad para aprobarla e incluirla en la lista oficial de bloques.
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: Select or Upload Photo */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-2 border-dashed border-[#DCD9D1] dark:border-[#383A36] rounded-3xl p-6 text-center hover:border-[#E8C96A] transition-colors bg-[#EFEDE7]/50 dark:bg-[#292A27]/50">
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-wall-photo"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessingImage}
                    />
                    <label htmlFor="upload-wall-photo" className={`space-y-2.5 block ${isProcessingImage ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#20211F] text-[#E8C96A] flex items-center justify-center mx-auto shadow-xs border border-[#DCD9D1] dark:border-[#383A36]">
                        {isProcessingImage ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#1C1D1A] dark:text-[#F4F2EC]">
                        {isProcessingImage ? 'Optimizando imagen para la nube...' : 'Subir foto desde tu dispositivo o cámara'}
                      </p>
                      <p className="text-[11px] text-[#5C5B56] dark:text-[#AAA8A1]">
                        Haz una foto de frente al sector donde has equipado el problema
                      </p>
                    </label>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5C5B56] dark:text-[#AAA8A1] block mb-2.5">
                      O selecciona una pared de referencia del rocódromo:
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      {SAMPLE_PHOTOS.map((sample) => {
                        const isSelected = imageUrl === sample.url;
                        return (
                          <div
                            key={sample.name}
                            onClick={() => handleSelectSample(sample)}
                            className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all shadow-xs flex flex-col bg-[#EFEDE7] dark:bg-[#292A27] ${
                              isSelected ? 'border-[#E8C96A] ring-2 ring-[#E8C96A]/40' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                              <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#E8C96A] text-[#1C1D1A] flex items-center justify-center shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <div className={`p-1.5 text-center text-[10px] sm:text-[11px] font-bold leading-tight ${
                              isSelected ? 'bg-[#E8C96A] text-[#1C1D1A]' : 'text-[#5C5B56] dark:text-[#AAA8A1]'
                            }`}>
                              {sample.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Interactive Marker Editor with transparent circles, radius slider, drag and cross delete */}
              {step === 2 && (
                <div className="space-y-3.5 animate-in fade-in">
                  {/* Marker Type Selector Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#EFEDE7] dark:bg-[#292A27] p-2 rounded-2xl border border-[#DCD9D1] dark:border-[#383A36]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Salida */}
                      <button
                        type="button"
                        onClick={() => handleTypeChangeForSelected('start')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          activeMarkerType === 'start'
                            ? 'bg-[#EAF4E5] text-[#166534] border-[#22C55E] shadow-xs font-extrabold'
                            : 'bg-white/60 dark:bg-[#20211F]/60 text-[#5C5B56] dark:text-[#AAA8A1] border-transparent hover:bg-white dark:hover:bg-[#20211F]'
                        }`}
                        title="Marca el inicio del bloque (aro verde)"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#22C55E] bg-transparent" />
                        <span>Salida (Start)</span>
                      </button>

                      {/* Presa */}
                      <button
                        type="button"
                        onClick={() => handleTypeChangeForSelected('hold')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          activeMarkerType === 'hold'
                            ? 'bg-[#FCF4D7] text-[#854D0E] border-[#EAB308] shadow-xs font-extrabold'
                            : 'bg-white/60 dark:bg-[#20211F]/60 text-[#5C5B56] dark:text-[#AAA8A1] border-transparent hover:bg-white dark:hover:bg-[#20211F]'
                        }`}
                        title="Presas intermedias de la vía (aro amarillo)"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#EAB308] bg-transparent" />
                        <span>Presa (Hold)</span>
                      </button>

                      {/* Bonus */}
                      <button
                        type="button"
                        onClick={() => handleTypeChangeForSelected('bonus')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          activeMarkerType === 'bonus'
                            ? 'bg-[#F3E8FF] text-[#6B21A8] border-[#A855F7] shadow-xs font-extrabold'
                            : 'bg-white/60 dark:bg-[#20211F]/60 text-[#5C5B56] dark:text-[#AAA8A1] border-transparent hover:bg-white dark:hover:bg-[#20211F]'
                        }`}
                        title="Presa de Bonus / Zona (aro morado)"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#A855F7] bg-transparent" />
                        <span>Bonus</span>
                      </button>

                      {/* Top */}
                      <button
                        type="button"
                        onClick={() => handleTypeChangeForSelected('top')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          activeMarkerType === 'top'
                            ? 'bg-[#FEE2E2] text-[#991B1B] border-[#EF4444] shadow-xs font-extrabold'
                            : 'bg-white/60 dark:bg-[#20211F]/60 text-[#5C5B56] dark:text-[#AAA8A1] border-transparent hover:bg-white dark:hover:bg-[#20211F]'
                        }`}
                        title="Presa final / TOP del bloque (aro rojo)"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#EF4444] bg-transparent" />
                        <span>Top</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={handleUndoMarker}
                        disabled={markers.length === 0}
                        className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] disabled:opacity-30 transition-colors"
                        title="Deshacer último punto"
                      >
                        <Undo className="w-4 h-4" />
                      </button>

                      {selectedMarkerId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMarker(selectedMarkerId)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                          title="Eliminar punto seleccionado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Radius Slider Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#EFEDE7]/70 dark:bg-[#292A27]/70 px-3.5 py-2.5 rounded-2xl border border-[#DCD9D1] dark:border-[#383A36]">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#5C5B56] dark:text-[#AAA8A1]" />
                      <span className="text-xs font-bold text-[#1C1D1A] dark:text-[#F4F2EC]">
                        {selectedMarkerId ? 'Radio de presa seleccionada:' : 'Radio de círculos:'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-[#E8C96A] bg-[#1C1D1A] dark:bg-[#141514] px-2 py-0.5 rounded-md">
                        {currentRadius} px
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
                      <span className="text-[10px] font-bold text-[#5C5B56] dark:text-[#AAA8A1]">12px</span>
                      <input
                        type="range"
                        min={12}
                        max={42}
                        step={1}
                        value={currentRadius}
                        onChange={(e) => handleRadiusChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#DCD9D1] dark:bg-[#383A36] rounded-lg appearance-none cursor-pointer accent-[#E8C96A]"
                      />
                      <span className="text-[10px] font-bold text-[#5C5B56] dark:text-[#AAA8A1]">42px</span>
                    </div>
                  </div>

                  {/* Interactive Canvas View */}
                  <div className="space-y-2">
                    <BlockImageWithMarkers
                      imageUrl={imageUrl}
                      markers={markers}
                      aspectRatio="aspect-[16/9] sm:aspect-[2/1]"
                      interactive={true}
                      activeMarkerType={activeMarkerType}
                      onAddMarker={handleAddMarker}
                      onMoveMarker={handleMoveMarker}
                      onDeleteMarker={handleDeleteMarker}
                      selectedMarkerId={selectedMarkerId}
                      onSelectMarker={setSelectedMarkerId}
                      onTypeChange={handleTypeChangeForSelected}
                      onUndoMarker={handleUndoMarker}
                      currentRadius={currentRadius}
                      onRadiusChange={handleRadiusChange}
                    />

                    {/* Helper Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[#5C5B56] dark:text-[#AAA8A1]">
                      <div className="flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-[#E8C96A]" />
                        <span>Haz clic para añadir • <strong>Arrastra</strong> para mover presas • Pulsa <strong>Editar con Zoom</strong> para ver de cerca</span>
                      </div>
                      <div className="font-bold">
                        Presas: <span className="text-[#1C1D1A] dark:text-[#F4F2EC]">{markers.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Route Information */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5B56] dark:text-[#AAA8A1] mb-1">
                      Nombre del bloque (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: El Vuelo del Pájaro"
                      value={proposalName}
                      onChange={(e) => setProposalName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DCD9D1] dark:border-[#383A36] text-[#1C1D1A] dark:text-[#F4F2EC] focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5B56] dark:text-[#AAA8A1] mb-1">
                        Grado Propuesto
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value as BoulderGrade)}
                        className="w-full px-3 py-2.5 text-xs rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DCD9D1] dark:border-[#383A36] text-[#1C1D1A] dark:text-[#F4F2EC] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
                      >
                        {ALL_GRADES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5B56] dark:text-[#AAA8A1]">
                          Pared / Sector
                        </label>
                        {SAMPLE_PHOTOS.some(s => s.url === imageUrl) && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Asignada auto
                          </span>
                        )}
                      </div>
                      <select
                        value={selectedWallId}
                        onChange={(e) => setSelectedWallId(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DCD9D1] dark:border-[#383A36] text-[#1C1D1A] dark:text-[#F4F2EC] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
                      >
                        {walls.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5B56] dark:text-[#AAA8A1] mb-2">
                      Estilo / Etiquetas
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                              isSelected
                                ? 'bg-[#E8C96A] text-[#1C1D1A] border-[#E8C96A] font-bold shadow-xs'
                                : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36]'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5B56] dark:text-[#AAA8A1] mb-1">
                      Descripción o instrucciones del paso
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Indica si hay pies obligatorios, si se usan volúmenes o cualquier detalle para el equipador..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DCD9D1] dark:border-[#383A36] text-[#1C1D1A] dark:text-[#F4F2EC] focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Review and Confirm */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-2">
                    <BlockImageWithMarkers
                      imageUrl={imageUrl}
                      markers={markers}
                      aspectRatio="aspect-[16/9] sm:aspect-[2/1]"
                    />
                  </div>

                  <div className="p-5 rounded-3xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DCD9D1] dark:border-[#383A36] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[#1C1D1A] dark:text-[#F4F2EC]">
                        {proposalName || 'Sin título'}
                      </h4>
                      <GradeBadge grade={selectedGrade} size="sm" />
                    </div>

                    <p className="text-xs text-[#5C5B56] dark:text-[#AAA8A1]">
                      Pared: <strong className="text-[#1C1D1A] dark:text-[#F4F2EC]">{walls.find(w => w.id === selectedWallId)?.name}</strong> • {markers.length} presas marcadas
                    </p>

                    {notes && (
                      <p className="text-xs text-[#1C1D1A] dark:text-[#F4F2EC] italic pt-2 border-t border-[#DCD9D1] dark:border-[#383A36]">
                        "{notes}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Controls */}
        {!isSuccess && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#DCD9D1] dark:border-[#383A36] bg-white/90 dark:bg-[#20211F]/90 backdrop-blur-md">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] text-xs font-bold text-[#5C5B56] dark:text-[#AAA8A1] hover:text-[#1C1D1A] dark:hover:text-[#F4F2EC] flex items-center gap-1.5 border border-[#DCD9D1] dark:border-[#383A36]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2.5 rounded-2xl bg-[#E8C96A] text-[#1C1D1A] text-xs font-extrabold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-2xl bg-[#E8C96A] text-[#1C1D1A] text-xs flex items-center gap-2 font-extrabold uppercase tracking-wider shadow-xs hover:shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Enviar Propuesta</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
