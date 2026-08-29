import React, { useState } from 'react';
import { Gym, UserProfile } from '../types';
import { isSuperAdminEmail, isUserGymSetter } from '../lib/firebase';
import { 
  Building2, 
  Search, 
  Lock, 
  Unlock, 
  MapPin, 
  Users, 
  Layers, 
  Plus, 
  KeyRound, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';

interface GymsDirectoryViewProps {
  gyms: Gym[];
  currentUser: UserProfile | null;
  activeGym: Gym | null;
  onSelectGym: (gym: Gym) => void;
  onJoinGym: (gymId: string, isUnlockedPrivate?: boolean) => void;
  onLeaveGym?: (gymId: string) => void;
  onCreateGym?: (newGym: Partial<Gym>) => Promise<void>;
  onEditGym?: (updatedGym: Gym) => Promise<void>;
  onDeleteGym?: (gymId: string) => Promise<void>;
}

export const GymsDirectoryView: React.FC<GymsDirectoryViewProps> = ({
  gyms,
  currentUser,
  activeGym,
  onSelectGym,
  onJoinGym,
  onCreateGym,
  onEditGym,
  onDeleteGym,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'joined' | 'public' | 'private'>('all');
  
  // Passcode Modal State
  const [unlockGymTarget, setUnlockGymTarget] = useState<Gym | null>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Create / Edit Gym Modal State
  const [isGymModalOpen, setIsGymModalOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [gymToDelete, setGymToDelete] = useState<Gym | null>(null);

  // Form Fields for Gym Modal
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'public' | 'private'>('public');
  const [formAccessCode, setFormAccessCode] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSetters, setFormSetters] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formOpeningHours, setFormOpeningHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = isSuperAdminEmail(currentUser?.email);

  const userJoinedIds = currentUser?.joinedGymIds || ['boulder-alhama', 'gud-climbing-murcia'];
  const userUnlockedPrivateIds = currentUser?.unlockedPrivateGymIds || [];

  // Filter Gyms
  const filteredGyms = gyms.filter(gym => {
    const isJoined = userJoinedIds.includes(gym.id);
    const matchesSearch = 
      gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gym.subtitle && gym.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      gym.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'joined') return isJoined;
    if (filterType === 'public') return gym.type === 'public';
    if (filterType === 'private') return gym.type === 'private';

    return true;
  });

  const handleOpenUnlockModal = (gym: Gym) => {
    setUnlockGymTarget(gym);
    setEnteredPasscode('');
    setPasscodeError(null);
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockGymTarget) return;

    const normalizedInput = enteredPasscode.trim().toUpperCase();
    const expectedCode = (unlockGymTarget.accessCode || 'ALHAMA2026').trim().toUpperCase();

    if (normalizedInput === expectedCode || isSuperAdmin || isUserGymSetter(unlockGymTarget, currentUser?.email)) {
      onJoinGym(unlockGymTarget.id, true);
      onSelectGym(unlockGymTarget);
      setUnlockGymTarget(null);
    } else {
      setPasscodeError('Clave de acceso incorrecta. Contacta con los equipadores o administradores del rocódromo.');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingGym(null);
    setFormName('');
    setFormSubtitle('');
    setFormCity('');
    setFormLocation('');
    setFormDescription('');
    setFormType('public');
    setFormAccessCode('');
    setFormImageUrl('https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80');
    setFormSetters(currentUser?.email || '');
    setFormFeatures('Boulder, Muros de placa, Desplome, Campus Board');
    setFormOpeningHours('Lunes a Viernes: 09:00 - 22:00 | Sábados: 09:00 - 20:00');
    setIsGymModalOpen(true);
  };

  const handleOpenEditModal = (gym: Gym) => {
    setEditingGym(gym);
    setFormName(gym.name);
    setFormSubtitle(gym.subtitle || '');
    setFormCity(gym.city);
    setFormLocation(gym.location);
    setFormDescription(gym.description);
    setFormType(gym.type);
    setFormAccessCode(gym.accessCode || '');
    setFormImageUrl(gym.imageUrl);
    setFormSetters(gym.setters.join(', '));
    setFormFeatures((gym.features || []).join(', '));
    setFormOpeningHours(gym.openingHours || '');
    setIsGymModalOpen(true);
  };

  const handleSubmitGymForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedSetters = formSetters
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0);

      const parsedFeatures = formFeatures
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      if (editingGym && onEditGym) {
        const updated: Gym = {
          ...editingGym,
          name: formName.trim(),
          subtitle: formSubtitle.trim() || undefined,
          city: formCity.trim(),
          location: formLocation.trim(),
          description: formDescription.trim(),
          type: formType,
          accessCode: formType === 'private' ? formAccessCode.trim() : undefined,
          imageUrl: formImageUrl.trim(),
          setters: Array.from(new Set([...parsedSetters, currentUser?.email?.toLowerCase() || ''])),
          features: parsedFeatures,
          openingHours: formOpeningHours.trim(),
        };
        await onEditGym(updated);
      } else if (onCreateGym) {
        const slug = formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const newGym: Partial<Gym> = {
          id: `gym-${slug}-${Date.now()}`,
          slug,
          name: formName.trim(),
          subtitle: formSubtitle.trim() || undefined,
          city: formCity.trim(),
          location: formLocation.trim(),
          description: formDescription.trim(),
          type: formType,
          accessCode: formType === 'private' ? formAccessCode.trim() : undefined,
          imageUrl: formImageUrl.trim(),
          setters: Array.from(new Set([...parsedSetters, currentUser?.email?.toLowerCase() || ''])),
          features: parsedFeatures,
          openingHours: formOpeningHours.trim(),
          createdBy: currentUser?.email || 'Admin',
          createdAt: new Date().toISOString().split('T')[0],
          activeWallsCount: 0,
          activeBlocksCount: 0,
        };
        await onCreateGym(newGym);
      }
      setIsGymModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-4 md:pt-8 pb-24 md:pb-16 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="bg-white dark:bg-[#20211F] rounded-3xl p-6 sm:p-10 border border-[#DDDAD3] dark:border-[#383A36] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#E8C96A] text-[#292927] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                Directorio Oficial ClimbU
              </span>
              <span className="bg-[#EFEDE7] dark:bg-[#292A27] text-[#5C5B56] dark:text-[#AAA8A1] text-xs font-bold px-3 py-1 rounded-full border border-[#DDDAD3] dark:border-[#383A36]">
                {gyms.length} {gyms.length === 1 ? 'Rocódromo disponible' : 'Rocódromos disponibles'}
              </span>
              {isSuperAdmin && (
                <span className="bg-[#FCF4D7] text-[#574500] dark:bg-[#383A36] dark:text-[#E8C96A] text-xs font-extrabold px-3 py-1 rounded-full border border-[#E8C96A] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Super Administrador
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
              Explora los Rocódromos
            </h1>
            <p className="text-sm sm:text-base text-[#73716C] dark:text-[#AAA8A1] leading-relaxed">
              Elige tu sala de escalada para ver sus muros y bloques actualizados en tiempo real, registrar tus proyectos y encadenes, o proponer nuevas líneas a los equipadores.
            </p>
          </div>

          {isSuperAdmin && onCreateGym && (
            <button
              onClick={handleOpenCreateModal}
              id="create-new-gym-btn"
              className="px-5 py-3.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Crear Nuevo Rocódromo</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716C] dark:text-[#AAA8A1]" />
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] text-xs sm:text-sm text-[#292927] dark:text-[#F2F0EA] placeholder-[#73716C] dark:placeholder-[#AAA8A1] focus:outline-none focus:border-[#E8C96A] shadow-2xs transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EFEDE7] dark:bg-[#292A27] rounded-2xl border border-[#DDDAD3] dark:border-[#383A36] overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] shadow-2xs'
                : 'text-[#73716C] dark:text-[#AAA8A1] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            Todos ({gyms.length})
          </button>
          <button
            onClick={() => setFilterType('joined')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'joined'
                ? 'bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] shadow-2xs'
                : 'text-[#73716C] dark:text-[#AAA8A1] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            Mis Rocódromos
          </button>
          <button
            onClick={() => setFilterType('public')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'public'
                ? 'bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] shadow-2xs'
                : 'text-[#73716C] dark:text-[#AAA8A1] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            Públicos
          </button>
          <button
            onClick={() => setFilterType('private')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'private'
                ? 'bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] shadow-2xs'
                : 'text-[#73716C] dark:text-[#AAA8A1] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            Privados con clave
          </button>
        </div>
      </div>

      {/* Gym Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGyms.map((gym) => {
          const isJoined = userJoinedIds.includes(gym.id);
          const isUnlocked = userUnlockedPrivateIds.includes(gym.id) || gym.type === 'public' || isSuperAdmin;
          const isSetter = isUserGymSetter(gym, currentUser?.email);
          const isActive = activeGym?.id === gym.id;

          return (
            <div
              key={gym.id}
              className={`rounded-3xl bg-white dark:bg-[#20211F] border overflow-hidden shadow-sm transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'border-[#E8C96A] ring-2 ring-[#E8C96A]/20'
                  : 'border-[#DDDAD3] dark:border-[#383A36] hover:border-[#E8C96A]/60'
              }`}
            >
              {/* Image & Header Overlay */}
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#292A27]">
                <img
                  src={gym.imageUrl}
                  alt={gym.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Badges Top Left & Right */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {gym.type === 'private' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/90 backdrop-blur-md text-[#1C1D1A] text-[11px] font-black flex items-center gap-1 shadow-sm">
                        <Lock className="w-3 h-3 stroke-[2.5]" />
                        Privado (con clave)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-black flex items-center gap-1 shadow-sm">
                        <Unlock className="w-3 h-3 stroke-[2.5]" />
                        Público
                      </span>
                    )}

                    {isSetter && (
                      <span className="px-2.5 py-1 rounded-xl bg-[#E8C96A] text-[#292927] text-[11px] font-extrabold flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3" />
                        {isSuperAdmin ? 'Super Admin' : 'Equipador'}
                      </span>
                    )}
                  </div>

                  {/* Super Admin Controls */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/20">
                      <button
                        onClick={() => handleOpenEditModal(gym)}
                        title="Editar Rocódromo"
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteGym && (
                        <button
                          onClick={() => setGymToDelete(gym)}
                          title="Eliminar Rocódromo"
                          className="p-1.5 hover:bg-rose-500/50 rounded-lg text-rose-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Title and location at bottom of image */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{gym.city}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    {gym.name}
                  </h3>
                  {gym.subtitle && (
                    <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                      {gym.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Gym Content */}
              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#73716C] dark:text-[#AAA8A1] line-clamp-3 leading-relaxed">
                    {gym.description}
                  </p>

                  {/* Key Highlights / Features */}
                  {gym.features && gym.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {gym.features.slice(0, 3).map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-[#EFEDE7] dark:bg-[#292A27] text-[#5C5B56] dark:text-[#AAA8A1] text-[11px] font-bold border border-[#DDDAD3] dark:border-[#383A36]"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Info Bar */}
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-[#73716C] dark:text-[#AAA8A1] border-t border-[#DDDAD3] dark:border-[#383A36]">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E8C96A]" />
                      <span>{gym.activeWallsCount || 3} Sectores de pared</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#E8C96A]" />
                      <span className="truncate">{gym.openingHours || 'Abierto hoy'}</span>
                    </div>
                  </div>

                  {/* Equipadores & Passcode info for Authorized Users */}
                  {(isSetter || isSuperAdmin) && (
                    <div className="p-2.5 rounded-2xl bg-[#FCF4D7]/70 dark:bg-[#292A27] border border-[#E8C96A]/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-[#574500] dark:text-[#E8C96A] flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" />
                          Clave de Acceso:
                        </span>
                        <code className="px-2 py-0.5 rounded bg-white dark:bg-[#20211F] font-mono font-bold text-xs text-[#292927] dark:text-[#F2F0EA] border border-[#DDDAD3] dark:border-[#383A36]">
                          {gym.accessCode || 'SIN CLAVE (PÚBLICO)'}
                        </code>
                      </div>
                      <p className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] truncate">
                        Equipadores: {gym.setters.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3">
                  {gym.type === 'private' && !isUnlocked && !isSetter ? (
                    <button
                      onClick={() => handleOpenUnlockModal(gym)}
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-[#1C1D1A] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Desbloquear con Clave</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!isJoined) {
                          onJoinGym(gym.id, true);
                        }
                        onSelectGym(gym);
                      }}
                      className="w-full py-3 rounded-2xl bg-[#E8C96A] hover:bg-[#dfbe59] text-[#292927] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Entrar al Rocódromo</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search State */}
      {filteredGyms.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] space-y-3">
          <Building2 className="w-12 h-12 text-[#73716C] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#292927] dark:text-[#F2F0EA]">
            No se han encontrado rocódromos
          </h3>
          <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
            Prueba a buscar con otro término o limpia los filtros.
          </p>
        </div>
      )}

      {/* Unlock Passcode Modal */}
      {unlockGymTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                    Rocódromo Privado
                  </h3>
                  <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                    {unlockGymTarget.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnlockGymTarget(null)}
                className="p-1.5 rounded-xl text-[#73716C] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5C5B56] dark:text-[#AAA8A1] leading-relaxed">
              Este rocódromo requiere una clave de acceso proporcionada por los equipadores o responsables de la sala para visualizar sus bloques y registrar progresos.
            </p>

            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1.5">
                  Introduce la Clave de Acceso
                </label>
                <input
                  type="text"
                  placeholder="Ej: ALHAMA2026"
                  value={enteredPasscode}
                  onChange={(e) => {
                    setEnteredPasscode(e.target.value);
                    setPasscodeError(null);
                  }}
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-center uppercase tracking-widest font-mono font-black text-base text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                />
                {passcodeError && (
                  <p className="text-xs text-rose-500 font-bold mt-1.5">
                    {passcodeError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockGymTarget(null)}
                  className="flex-1 py-3 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] hover:bg-[#DDDAD3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Desbloquear y Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Gym Modal (Super Admin) */}
      {isGymModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8C96A] text-[#292927] flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                    {editingGym ? 'Editar Rocódromo' : 'Crear Nuevo Rocódromo'}
                  </h3>
                  <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                    Gestión global de salas de escalada en ClimbU
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGymModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73716C] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGymForm} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                    Nombre del Rocódromo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Boulder Alhama"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                    Ciudad / Municipio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Alhama de Murcia / Murcia"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                  Subtítulo / Instalación
                </label>
                <input
                  type="text"
                  placeholder="Ej: Rocódromo Municipal de Alhama de Murcia"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                  Ubicación exacta / Dirección
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pabellón Adolfo Suárez / C.C. Thader"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                    Tipo de Acceso
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'public' | 'private')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                  >
                    <option value="public">Público (Libre acceso)</option>
                    <option value="private">Privado (Requiere Clave)</option>
                  </select>
                </div>

                {formType === 'private' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                      Clave de Acceso *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: ALHAMA2026"
                      value={formAccessCode}
                      onChange={(e) => setFormAccessCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-mono font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                  Correos de Equipadores autorizados (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="victorwars18@gmail.com, equipador@gudclimbing.com"
                  value={formSetters}
                  onChange={(e) => setFormSetters(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-mono text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                />
                <p className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] mt-1">
                  Los correos listados tendrán permisos de Equipador para gestionar las vías de este rocódromo en concreto.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre las instalaciones, muros, tipo de escalada..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                  URL de Imagen de Portada
                </label>
                <input
                  type="text"
                  placeholder="https://... o /walls/Pared2.png"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGymModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] text-xs font-bold text-[#292927] dark:text-[#F2F0EA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-black shadow-xs hover:shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingGym ? 'Guardar Cambios' : 'Crear Rocódromo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {gymToDelete && onDeleteGym && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#20211F] border border-rose-200 dark:border-rose-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
              ¿Eliminar rocódromo?
            </h3>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
              ¿Estás seguro de que deseas eliminar <strong>{gymToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setGymToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] text-xs font-bold text-[#292927] dark:text-[#F2F0EA]"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteGym(gymToDelete.id);
                  setGymToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
