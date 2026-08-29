import React, { useState, useEffect } from 'react';
import { BoulderBlock, Wall, UserProposal, UserProfile, Gym } from '../types';
import { GradeBadge } from '../components/GradeBadge';
import { BlockImageWithMarkers } from '../components/BlockImageWithMarkers';
import { 
  fetchAdminEmails, 
  addAdminEmail, 
  removeAdminEmail, 
  AdminRecord, 
  INITIAL_ADMIN_EMAILS,
  isSuperAdminEmail,
  isUserGymSetter
} from '../lib/firebase';
import { 
  ShieldCheck, 
  Layers, 
  Archive, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  CheckCircle2, 
  FileText, 
  Trash2, 
  AlertTriangle, 
  RotateCcw,
  Users,
  Mail,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  Building2,
  Settings,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminViewProps {
  blocks: BoulderBlock[];
  walls: Wall[];
  proposals: UserProposal[];
  currentUser: UserProfile | null;
  activeGym: Gym | null;
  gyms: Gym[];
  onSelectGym: (gym: Gym) => void;
  onUpdateGym?: (gym: Gym) => Promise<void>;
  onToggleBlockStatus: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
  onReopenProposal?: (proposalId: string) => void;
  onDeleteProposal?: (proposalId: string) => void;
  onOpenCreateBlock: () => void;
  onSelectBlock?: (block: BoulderBlock) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  blocks,
  walls,
  proposals,
  currentUser,
  activeGym,
  gyms,
  onSelectGym,
  onUpdateGym,
  onToggleBlockStatus,
  onDeleteBlock,
  onApproveProposal,
  onRejectProposal,
  onReopenProposal,
  onDeleteProposal,
  onOpenCreateBlock,
  onSelectBlock,
}) => {
  const isSuperAdmin = isSuperAdminEmail(currentUser?.email);
  const isSetter = isUserGymSetter(activeGym, currentUser?.email);

  const [activeTab, setActiveTab] = useState<'blocks' | 'proposals' | 'setters' | 'gym_settings' | 'super_admins'>('blocks');
  const [blockToDelete, setBlockToDelete] = useState<BoulderBlock | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<UserProposal | null>(null);
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Setter Management State
  const [newSetterEmail, setNewSetterEmail] = useState('');
  const [setterFeedback, setSetterFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingSetter, setIsSavingSetter] = useState(false);

  // Gym Settings State
  const [gymAccessCode, setGymAccessCode] = useState(activeGym?.accessCode || '');
  const [gymType, setGymType] = useState<'public' | 'private'>(activeGym?.type || 'public');
  const [gymOpeningHours, setGymOpeningHours] = useState(activeGym?.openingHours || '');
  const [gymDescription, setGymDescription] = useState(activeGym?.description || '');
  const [showCodePlain, setShowCodePlain] = useState(false);
  const [gymSettingsFeedback, setGymSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingGymSettings, setIsSavingGymSettings] = useState(false);

  // Super Admin Management state
  const [adminList, setAdminList] = useState<AdminRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (activeGym) {
      setGymAccessCode(activeGym.accessCode || '');
      setGymType(activeGym.type);
      setGymOpeningHours(activeGym.openingHours || '');
      setGymDescription(activeGym.description || '');
    }
  }, [activeGym]);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const list = await fetchAdminEmails();
      setAdminList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGym || !onUpdateGym) return;
    const email = newSetterEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setSetterFeedback({ type: 'error', message: 'Introduce un correo electrónico válido.' });
      return;
    }

    if (activeGym.setters.some(s => s.toLowerCase() === email)) {
      setSetterFeedback({ type: 'error', message: 'Este correo ya es Equipador de este rocódromo.' });
      return;
    }

    try {
      setIsSavingSetter(true);
      const updatedGym: Gym = {
        ...activeGym,
        setters: [...activeGym.setters, email],
      };
      await onUpdateGym(updatedGym);
      setNewSetterEmail('');
      setSetterFeedback({ type: 'success', message: `${email} añadido como Equipador de ${activeGym.name}.` });
    } catch (err: any) {
      setSetterFeedback({ type: 'error', message: err.message || 'Error al guardar equipador.' });
    } finally {
      setIsSavingSetter(false);
    }
  };

  const handleRemoveSetter = async (emailToRemove: string) => {
    if (!activeGym || !onUpdateGym) return;
    if (INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === emailToRemove.toLowerCase())) {
      setSetterFeedback({ type: 'error', message: 'No se puede revocar al Super Administrador principal.' });
      return;
    }

    try {
      setIsSavingSetter(true);
      const updatedGym: Gym = {
        ...activeGym,
        setters: activeGym.setters.filter(s => s.toLowerCase() !== emailToRemove.toLowerCase()),
      };
      await onUpdateGym(updatedGym);
      setSetterFeedback({ type: 'success', message: `Equipador ${emailToRemove} eliminado de ${activeGym.name}.` });
    } catch (err: any) {
      setSetterFeedback({ type: 'error', message: err.message || 'Error al eliminar equipador.' });
    } finally {
      setIsSavingSetter(false);
    }
  };

  const handleSaveGymSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGym || !onUpdateGym) return;

    try {
      setIsSavingGymSettings(true);
      const updatedGym: Gym = {
        ...activeGym,
        type: gymType,
        accessCode: gymType === 'private' ? gymAccessCode.trim().toUpperCase() : undefined,
        openingHours: gymOpeningHours.trim(),
        description: gymDescription.trim(),
      };
      await onUpdateGym(updatedGym);
      setGymSettingsFeedback({ type: 'success', message: 'Configuración y clave del rocódromo actualizadas.' });
    } catch (err: any) {
      setGymSettingsFeedback({ type: 'error', message: err.message || 'Error al actualizar rocódromo.' });
    } finally {
      setIsSavingGymSettings(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setAdminFeedback({ type: 'error', message: 'Introduce un correo electrónico válido.' });
      return;
    }

    try {
      setAdminLoading(true);
      await addAdminEmail(newAdminEmail.trim().toLowerCase(), currentUser?.email || 'Super Admin');
      setNewAdminEmail('');
      setAdminFeedback({ type: 'success', message: `El correo ${newAdminEmail.trim()} ha sido registrado como Super Admin.` });
      await loadAdmins();
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Error al registrar administrador.' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase())) {
      setAdminFeedback({ type: 'error', message: 'No se puede eliminar al Super Administrador principal (victorb.belchi18720@gmail.com).' });
      return;
    }

    try {
      setAdminLoading(true);
      await removeAdminEmail(email);
      setAdminFeedback({ type: 'success', message: `Permisos de Super Admin revocados para ${email}.` });
      await loadAdmins();
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Error al eliminar administrador.' });
    } finally {
      setAdminLoading(false);
    }
  };

  const activeBlocks = blocks.filter(b => b.status === 'active');
  const retiredBlocks = blocks.filter(b => b.status === 'retired');
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const approvedProposals = proposals.filter(p => p.status === 'approved');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  const displayedProposals = proposals.filter(p => {
    if (proposalStatusFilter === 'all') return true;
    return p.status === proposalStatusFilter;
  });

  const confirmDelete = () => {
    if (blockToDelete) {
      onDeleteBlock(blockToDelete.id);
      setBlockToDelete(null);
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-16 max-w-7xl mx-auto px-4 sm:px-10 pt-4 md:pt-6 animate-in fade-in duration-200">
      {/* Header & Active Gym Selector */}
      <div className="bg-white dark:bg-[#20211F] rounded-3xl p-6 sm:p-8 border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8C96A] text-[#292927] flex items-center justify-center shadow-xs font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
                  Panel de Equipamiento & Gestión
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FCF4D7] text-[#574500] border border-[#E8C96A]">
                  {isSuperAdmin ? 'Super Admin' : 'Equipador'}
                </span>
              </div>
              <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-0.5">
                Gestionando: <strong>{activeGym?.name || 'Rocódromo'}</strong> ({activeGym?.city})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Gym Selector in Admin Panel */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36]">
              <span className="text-[11px] font-bold text-[#73716C] dark:text-[#AAA8A1] pl-2 hidden sm:inline">
                Sala activa:
              </span>
              <select
                value={activeGym?.id || ''}
                onChange={(e) => {
                  const found = gyms.find(g => g.id === e.target.value);
                  if (found) onSelectGym(found);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#20211F] text-xs font-black text-[#292927] dark:text-[#F2F0EA] border border-[#DDDAD3] dark:border-[#383A36] focus:outline-none focus:border-[#E8C96A]"
              >
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.city})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenCreateBlock}
              className="px-5 py-2.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs flex items-center gap-2 font-black shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Equipar Nuevo Bloque</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-[#EFEDE7]/60 dark:bg-[#292A27]/60 border border-[#DDDAD3] dark:border-[#383A36] flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">{activeBlocks.length}</div>
              <div className="text-[10px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1]">Bloques Activos</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#EAF4E5] text-[#244419] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EFEDE7]/60 dark:bg-[#292A27]/60 border border-[#DDDAD3] dark:border-[#383A36] flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">{retiredBlocks.length}</div>
              <div className="text-[10px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1]">En Histórico</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#EFEDE7] dark:bg-[#383A36] text-[#292927] dark:text-[#F2F0EA] flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EFEDE7]/60 dark:bg-[#292A27]/60 border border-[#DDDAD3] dark:border-[#383A36] flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">{pendingProposals.length}</div>
              <div className="text-[10px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1]">Propuestas Pend.</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FCF4D7] text-[#574500] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EFEDE7]/60 dark:bg-[#292A27]/60 border border-[#DDDAD3] dark:border-[#383A36] flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">{activeGym?.setters.length || 0}</div>
              <div className="text-[10px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1]">Equipadores</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#E8C96A]/20 text-[#292927] dark:text-[#E8C96A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#DDDAD3] dark:border-[#383A36] pb-3 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-4 py-2.5 rounded-2xl transition-all border whitespace-nowrap cursor-pointer ${
            activeTab === 'blocks'
              ? 'bg-[#E8C96A] text-[#292927] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
          }`}
        >
          Bloques de {activeGym?.name || 'la Sala'} ({blocks.length})
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2.5 rounded-2xl transition-all relative border whitespace-nowrap cursor-pointer ${
            activeTab === 'proposals'
              ? 'bg-[#E8C96A] text-[#292927] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
          }`}
        >
          Propuestas ({proposals.length})
          {pendingProposals.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {pendingProposals.length} pend.
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('setters')}
          className={`px-4 py-2.5 rounded-2xl transition-all border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'setters'
              ? 'bg-[#E8C96A] text-[#292927] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Equipadores de la Sala ({activeGym?.setters.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('gym_settings')}
          className={`px-4 py-2.5 rounded-2xl transition-all border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'gym_settings'
              ? 'bg-[#E8C96A] text-[#292927] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Clave y Configuración</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('super_admins')}
            className={`px-4 py-2.5 rounded-2xl transition-all border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'super_admins'
                ? 'bg-[#E8C96A] text-[#292927] font-extrabold border-[#E8C96A] shadow-xs'
                : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admins ClimbU</span>
          </button>
        )}
      </div>

      {/* TAB 1: Blocks Management */}
      {activeTab === 'blocks' && (
        <div className="bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#DDDAD3] dark:border-[#383A36] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-[#292927] dark:text-[#F2F0EA]">
                Listado de Bloques de {activeGym?.name} ({blocks.length})
              </h3>
              <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                Puedes archivar una vía (Retirar/Reactivar) o borrarla definitivamente.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#DDDAD3] dark:divide-[#383A36]">
            {blocks.map((block) => (
              <div key={block.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#EFEDE7]/50 dark:hover:bg-[#292A27]/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={block.imageUrl}
                    alt={block.name}
                    className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#292927] dark:text-[#F2F0EA] truncate">
                        {block.name}
                      </h4>
                      <GradeBadge grade={block.grade} size="sm" />
                      {block.status === 'retired' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#292927] text-[#F2F0EA]">
                          RETIRADA
                        </span>
                      )}
                      {block.createdBy && (
                        <span className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] bg-[#EFEDE7] dark:bg-[#292A27] px-2 py-0.5 rounded-md">
                          Por: {block.createdBy}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-0.5 truncate">
                      {block.wallName} • {block.markers.length} presas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onToggleBlockStatus(block.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      block.status === 'active'
                        ? 'bg-[#EFEDE7] hover:bg-[#DDDAD3] dark:bg-[#292A27] dark:hover:bg-[#383A36] text-[#73716C] dark:text-[#AAA8A1]'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{block.status === 'active' ? 'Retirar' : 'Reactivar'}</span>
                  </button>

                  <button
                    onClick={() => setBlockToDelete(block)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Eliminar bloque permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="p-12 text-center text-xs text-[#73716C] dark:text-[#AAA8A1]">
                No hay bloques registrados en {activeGym?.name}. ¡Usa el botón superior para equipar el primero!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Proposals Management */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProposalStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                proposalStatusFilter === 'pending'
                  ? 'bg-[#E8C96A] text-[#292927]'
                  : 'bg-white dark:bg-[#20211F] text-[#73716C]'
              }`}
            >
              Pendientes ({pendingProposals.length})
            </button>
            <button
              onClick={() => setProposalStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                proposalStatusFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#20211F] text-[#73716C]'
              }`}
            >
              Aprobadas ({approvedProposals.length})
            </button>
            <button
              onClick={() => setProposalStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                proposalStatusFilter === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-[#20211F] text-[#73716C]'
              }`}
            >
              Rechazadas ({rejectedProposals.length})
            </button>
            <button
              onClick={() => setProposalStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                proposalStatusFilter === 'all'
                  ? 'bg-[#292927] text-white'
                  : 'bg-white dark:bg-[#20211F] text-[#73716C]'
              }`}
            >
              Todas ({proposals.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedProposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#292927] dark:text-[#F2F0EA]">
                        {prop.name || 'Propuesta sin título'}
                      </h4>
                      <GradeBadge grade={prop.grade} size="sm" />
                    </div>
                    <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-0.5">
                      Propuesto por <strong>{prop.userName}</strong> ({prop.userEmail}) en {prop.wallName}
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    prop.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : prop.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {prop.status === 'pending' ? 'Pendiente' : prop.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>

                <BlockImageWithMarkers
                  imageUrl={prop.imageUrl}
                  markers={prop.markers}
                  aspectRatio="aspect-[16/9]"
                />

                {prop.notes && (
                  <p className="text-xs text-[#5C5B56] dark:text-[#AAA8A1] italic bg-[#EFEDE7]/50 dark:bg-[#292A27]/50 p-2.5 rounded-xl">
                    "{prop.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#DDDAD3] dark:border-[#383A36]">
                  <span className="text-[11px] text-[#73716C] dark:text-[#AAA8A1]">
                    {prop.markers.length} presas marcadas
                  </span>

                  <div className="flex items-center gap-2">
                    {prop.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onRejectProposal(prop.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                        <button
                          onClick={() => onApproveProposal(prop.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar a Oficial</span>
                        </button>
                      </>
                    )}

                    {prop.status !== 'pending' && onReopenProposal && (
                      <button
                        onClick={() => onReopenProposal(prop.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] text-xs font-bold text-[#73716C]"
                      >
                        Reabrir a pendiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {displayedProposals.length === 0 && (
              <div className="col-span-2 p-12 text-center bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] text-xs text-[#73716C] dark:text-[#AAA8A1]">
                No hay propuestas en esta categoría para {activeGym?.name}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Setters (Equipadores de la sala) */}
      {activeTab === 'setters' && activeGym && (
        <div className="bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-[#292927] dark:text-[#F2F0EA] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E8C96A]" />
              <span>Equipadores de {activeGym.name}</span>
            </h3>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-1 leading-relaxed">
              Los usuarios con estos correos tienen permisos para equipar nuevos bloques, retirar vías, y moderar propuestas exclusivamente para <strong>{activeGym.name}</strong>.
            </p>
          </div>

          {/* Add setter form */}
          <form onSubmit={handleAddSetter} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716C]" />
              <input
                type="email"
                required
                placeholder="ej: victorwars18@gmail.com"
                value={newSetterEmail}
                onChange={(e) => setNewSetterEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingSetter}
              className="px-5 py-2.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSavingSetter ? 'Guardando...' : 'Añadir Equipador'}</span>
            </button>
          </form>

          {setterFeedback && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              setterFeedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
            }`}>
              {setterFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              <span>{setterFeedback.message}</span>
            </div>
          )}

          {/* Setters List */}
          <div className="divide-y divide-[#DDDAD3] dark:divide-[#383A36] border border-[#DDDAD3] dark:border-[#383A36] rounded-2xl overflow-hidden">
            {activeGym.setters.map((email) => {
              const isMaster = INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
              return (
                <div key={email} className="p-4 flex items-center justify-between gap-3 bg-white dark:bg-[#20211F]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E8C96A]/20 text-[#292927] dark:text-[#E8C96A] flex items-center justify-center font-black text-xs">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-[#292927] dark:text-[#F2F0EA]">
                        {email}
                      </span>
                      {isMaster && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black bg-[#FCF4D7] text-[#574500] border border-[#E8C96A]">
                          SUPER ADMIN GLOBAL
                        </span>
                      )}
                    </div>
                  </div>

                  {!isMaster && (
                    <button
                      onClick={() => handleRemoveSetter(email)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar permiso de equipador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Gym Settings (Clave y Ajustes del Rocódromo) */}
      {activeTab === 'gym_settings' && activeGym && (
        <div className="bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-[#292927] dark:text-[#F2F0EA] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#E8C96A]" />
              <span>Clave de Acceso y Configuración de {activeGym.name}</span>
            </h3>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-1">
              Configura si este rocódromo es público o privado con contraseña de acceso para escaladores.
            </p>
          </div>

          <form onSubmit={handleSaveGymSettings} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                Tipo de Acceso
              </label>
              <select
                value={gymType}
                onChange={(e) => setGymType(e.target.value as 'public' | 'private')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA]"
              >
                <option value="public">Público (Cualquier usuario puede ver y registrar)</option>
                <option value="private">Privado (Requiere Clave de Acceso)</option>
              </select>
            </div>

            {gymType === 'private' && (
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                  Clave de Acceso de la Sala
                </label>
                <div className="relative">
                  <input
                    type={showCodePlain ? 'text' : 'password'}
                    required
                    placeholder="Ej: ALHAMA2026"
                    value={gymAccessCode}
                    onChange={(e) => setGymAccessCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-mono font-black text-[#292927] dark:text-[#F2F0EA] tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCodePlain(!showCodePlain)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]"
                  >
                    {showCodePlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] mt-1">
                  Esta clave solo es visible para los Equipadores y Super Admins. Los escaladores la necesitan para desbloquear este rocódromo.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                Horario de Apertura
              </label>
              <input
                type="text"
                value={gymOpeningHours}
                onChange={(e) => setGymOpeningHours(e.target.value)}
                placeholder="Lunes a Viernes: 16:00 - 22:00..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-medium text-[#292927] dark:text-[#F2F0EA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#73716C] dark:text-[#AAA8A1] mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={gymDescription}
                onChange={(e) => setGymDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs text-[#292927] dark:text-[#F2F0EA]"
              />
            </div>

            {gymSettingsFeedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                gymSettingsFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                {gymSettingsFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span>{gymSettingsFeedback.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingGymSettings}
              className="px-6 py-2.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-black shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingGymSettings ? 'Guardando...' : 'Guardar Ajustes del Rocódromo'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: Super Admins Globales (Super Admin only) */}
      {activeTab === 'super_admins' && isSuperAdmin && (
        <div className="bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-[#292927] dark:text-[#F2F0EA] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#E8C96A]" />
              <span>Super Administradores de la App ClimbU</span>
            </h3>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-1 leading-relaxed">
              Los Super Administradores tienen control total sobre todos los rocódromos, creación de nuevas salas, equipamiento y bases de datos en Firebase.
            </p>
          </div>

          <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716C]" />
              <input
                type="email"
                required
                placeholder="ej: victorb.belchi18720@gmail.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] focus:outline-none focus:border-[#E8C96A]"
              />
            </div>
            <button
              type="submit"
              disabled={adminLoading}
              className="px-5 py-2.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{adminLoading ? 'Registrando...' : 'Añadir Super Admin'}</span>
            </button>
          </form>

          {adminFeedback && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              adminFeedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
            }`}>
              {adminFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              <span>{adminFeedback.message}</span>
            </div>
          )}

          <div className="divide-y divide-[#DDDAD3] dark:divide-[#383A36] border border-[#DDDAD3] dark:border-[#383A36] rounded-2xl overflow-hidden">
            {adminList.map((admin) => {
              const isMaster = INITIAL_ADMIN_EMAILS.some(e => e.toLowerCase() === admin.email.toLowerCase());
              return (
                <div key={admin.email} className="p-4 flex items-center justify-between gap-3 bg-white dark:bg-[#20211F]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E8C96A] text-[#292927] flex items-center justify-center font-black text-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-[#292927] dark:text-[#F2F0EA]">
                        {admin.email}
                      </span>
                      {isMaster && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black bg-[#FCF4D7] text-[#574500] border border-[#E8C96A]">
                          MASTER ADMIN
                        </span>
                      )}
                    </div>
                  </div>

                  {!isMaster && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Revocar Super Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Block Confirmation Modal */}
      {blockToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#20211F] rounded-3xl p-6 max-w-md w-full border border-[#DDDAD3] dark:border-[#383A36] space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-rose-600">
              ¿Eliminar bloque "{blockToDelete.name}"?
            </h3>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
              Esta acción eliminará el bloque de la base de datos de {activeGym?.name}.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setBlockToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#73716C] bg-[#EFEDE7] dark:bg-[#292A27]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
