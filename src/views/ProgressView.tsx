import React, { useState, useMemo } from 'react';
import { BoulderBlock, UserProfile, UserBlockProgress, UserProposal, BoulderGrade } from '../types';
import { GradeBadge } from '../components/GradeBadge';
import { BlockCard } from '../components/BlockCard';
import { BlockImageWithMarkers } from '../components/BlockImageWithMarkers';
import { compareGrades, getLevelForGrade, getLevelInfo } from '../utils/gradeUtils';
import { signInWithGoogle, logOut } from '../lib/firebase';
import { 
  Trophy, 
  Bookmark, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  User as UserIcon,
  Plus, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Trash2,
  Calendar,
  BarChart3,
  Archive,
  Loader2,
  LogOut
} from 'lucide-react';

interface ProgressViewProps {
  currentUser: UserProfile | null;
  blocks: BoulderBlock[];
  userProgress: Record<string, UserBlockProgress>;
  proposals?: UserProposal[];
  onSelectBlock: (block: BoulderBlock) => void;
  onToggleFavorite: (blockId: string) => void;
  onOpenProposeModal?: () => void;
  onDeleteObsoleteProgress?: (blockId: string) => void;
}

interface CompletedItem {
  blockId: string;
  name: string;
  grade: BoulderGrade;
  wallName: string;
  completedAt: string;
  attempts?: number;
  flash?: boolean;
  isObsolete: boolean;
  notes?: string;
  block?: BoulderBlock;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  currentUser,
  blocks,
  userProgress,
  proposals = [],
  onSelectBlock,
  onToggleFavorite,
  onOpenProposeModal,
  onDeleteObsoleteProgress,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'projects' | 'proposals'>('stats');
  const [proposalFilter, setProposalFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [deleteObsoleteTarget, setDeleteObsoleteTarget] = useState<CompletedItem | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-[#E8C96A] text-[#292927] flex items-center justify-center mx-auto shadow-xs">
          <TrendingUp className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">
            Tu Progreso de Escalada
          </h1>
          <p className="text-sm text-[#73716C] dark:text-[#AAA8A1] leading-relaxed">
            Inicia sesión para guardar tus encadenes, organizar tus proyectos por pared y seguir la evolución de tus grados en el rocódromo de Alhama.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] space-y-3 shadow-sm text-left">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
            Beneficios para escaladores
          </h3>
          <ul className="text-xs space-y-2 text-[#292927] dark:text-[#F2F0EA]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#9FC78F]" />
              <span>Registra encadenes en 1 segundo (con intentos y flash opcionales)</span>
            </li>
            <li className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#87A9D8]" />
              <span>Lista rápida de proyectos activos en las paredes</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8C96A]" />
              <span>Propón nuevos bloques y pasos a los equipadores</span>
            </li>
          </ul>
        </div>

        <button
          onClick={async () => {
            try {
              setIsLoggingIn(true);
              await signInWithGoogle();
            } catch (err: any) {
              if (err?.code !== 'auth/popup-closed-by-user') {
                alert('Error al iniciar sesión con Google.');
              }
            } finally {
              setIsLoggingIn(false);
            }
          }}
          disabled={isLoggingIn}
          className="w-full py-3.5 rounded-2xl bg-[#E8C96A] text-[#292927] text-sm font-extrabold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isLoggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isLoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}</span>
        </button>
      </div>
    );
  }

  // Calculate user proposals
  const userProposals = proposals.filter(p => p.userId === currentUser.id || p.userName === currentUser.name);
  const pendingUserProposals = userProposals.filter(p => p.status === 'pending');
  const approvedUserProposals = userProposals.filter(p => p.status === 'approved');

  const filteredUserProposals = userProposals.filter(p => {
    if (proposalFilter === 'pending') return p.status === 'pending';
    if (proposalFilter === 'approved') return p.status === 'approved';
    return true;
  });

  // Calculate REAL dynamic completed items from userProgress + blocks
  const completedItems: CompletedItem[] = useMemo(() => {
    const list: CompletedItem[] = [];

    for (const [blockId, rawProg] of Object.entries(userProgress)) {
      const prog = rawProg as UserBlockProgress;
      if (prog.status !== 'completed') continue;

      const block = blocks.find(b => b.id === blockId);
      if (block) {
        list.push({
          blockId,
          name: block.name,
          grade: block.grade,
          wallName: block.wallName,
          completedAt: prog.completedAt || 'Reciente',
          attempts: prog.attempts || 1,
          flash: !!prog.flash,
          isObsolete: block.status === 'retired' || !!prog.isObsolete,
          notes: prog.notes,
          block,
        });
      } else if (prog.isObsolete || prog.blockName || prog.grade) {
        list.push({
          blockId,
          name: prog.blockName || 'Bloque Histórico',
          grade: prog.grade || '6A',
          wallName: prog.wallName || 'Sector anterior',
          completedAt: prog.completedAt || 'Histórico',
          attempts: prog.attempts || 1,
          flash: !!prog.flash,
          isObsolete: true,
          notes: prog.notes,
        });
      }
    }

    // Sort by date descending (newest first)
    return list.sort((a, b) => {
      if (a.completedAt === 'Reciente') return -1;
      if (b.completedAt === 'Reciente') return 1;
      return b.completedAt.localeCompare(a.completedAt);
    });
  }, [userProgress, blocks]);

  // Active projects in gym walls
  const projectsList = blocks.filter(b => b.status === 'active' && userProgress[b.id]?.status === 'project');

  // Flash count
  const flashCount = completedItems.filter(item => item.flash).length;

  // Maximum grade achieved (dynamic calculation)
  const maxGradeItem = useMemo(() => {
    if (completedItems.length === 0) return null;
    return [...completedItems].sort((a, b) => compareGrades(b.grade, a.grade))[0];
  }, [completedItems]);

  const maxGrade = maxGradeItem ? maxGradeItem.grade : '—';
  const maxGradeWall = maxGradeItem ? maxGradeItem.wallName : 'Sin encadenes';

  // Dynamic Grade Distribution calculation
  const gradeDistribution = useMemo(() => {
    if (completedItems.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const item of completedItems) {
      counts[item.grade] = (counts[item.grade] || 0) + 1;
    }

    const presentGrades = Object.keys(counts) as BoulderGrade[];
    presentGrades.sort(compareGrades);

    return presentGrades.map(grade => ({
      grade,
      count: counts[grade],
      level: getLevelForGrade(grade),
    }));
  }, [completedItems]);

  const maxGradeDistCount = Math.max(...gradeDistribution.map(d => d.count), 1);

  // Dynamic Monthly Evolution calculation
  const monthlyStats = useMemo(() => {
    if (completedItems.length === 0) return [];

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const map: Record<string, { count: number; maxGrade: BoulderGrade; monthLabel: string; year: string }> = {};

    for (const item of completedItems) {
      let yyyyMm = '2026-08';
      let monthLabel = 'Agosto';
      let year = '2026';

      if (item.completedAt && item.completedAt.includes('-')) {
        const parts = item.completedAt.split('-');
        if (parts.length >= 2) {
          const y = parts[0];
          const m = parseInt(parts[1], 10);
          if (!isNaN(m) && m >= 1 && m <= 12) {
            yyyyMm = `${y}-${parts[1].padStart(2, '0')}`;
            monthLabel = monthNames[m - 1];
            year = y;
          }
        }
      }

      if (!map[yyyyMm]) {
        map[yyyyMm] = { count: 0, maxGrade: item.grade, monthLabel, year };
      }

      map[yyyyMm].count += 1;
      if (compareGrades(item.grade, map[yyyyMm].maxGrade) > 0) {
        map[yyyyMm].maxGrade = item.grade;
      }
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        key,
        month: data.monthLabel,
        year: data.year,
        count: data.count,
        maxGrade: data.maxGrade,
      }));
  }, [completedItems]);

  return (
    <div className="space-y-8 pb-24 md:pb-16 max-w-7xl mx-auto px-4 sm:px-10 pt-4 md:pt-6 animate-in fade-in duration-200">
      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#20211F] p-6 sm:p-8 rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E8C96A]"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                {currentUser.name}
              </h1>
              {currentUser.role === 'admin' ? (
                <span className="px-3 py-1 rounded-full bg-[#FCF4D7] text-[#574500] dark:bg-[#E8C96A] dark:text-[#1C1D1A] text-[10px] font-extrabold uppercase tracking-wider border border-[#E8C96A]">
                  Admin / Equipador
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-[#E8C96A] text-[#292927] text-[10px] font-extrabold uppercase tracking-wider">
                  Escalador
                </span>
              )}
              {userProposals.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#EAF4E5] text-[#244419] dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold border border-[#9FC78F] dark:border-emerald-800">
                  {userProposals.length} {userProposals.length === 1 ? 'Propuesta propia' : 'Propuestas propias'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-4 py-2 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-xs flex items-center gap-1.5">
            <span className="text-[#73716C] dark:text-[#AAA8A1]">Máximo Grado:</span>
            <strong className="text-[#292927] dark:text-[#F2F0EA] font-mono font-bold text-sm">
              {maxGrade}
            </strong>
          </div>

          {onOpenProposeModal && (
            <button
              onClick={onOpenProposeModal}
              className="px-4 py-2 rounded-2xl bg-[#E8C96A] text-[#1C1D1A] text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Proponer Vía</span>
            </button>
          )}

          <button
            onClick={async () => {
              try {
                await logOut();
              } catch (err) {
                console.error('Error logging out:', err);
              }
            }}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#292A27] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-[#DDDAD3] dark:border-[#383A36] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Cerrar sesión de la cuenta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Estadísticas / Proyectos / Mis Propuestas */}
      <div className="flex items-center gap-2 border-b border-[#DDDAD3] dark:border-[#383A36] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-4 py-2.5 rounded-2xl transition-all border cursor-pointer ${
            activeSubTab === 'stats'
              ? 'bg-[#E8C96A] text-[#1C1D1A] dark:bg-[#E8C96A] dark:text-[#1C1D1A] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] hover:text-[#1C1D1A] dark:hover:text-[#F4F2EC] border-[#DCD9D1] dark:border-[#383A36]'
          }`}
        >
          Resumen & Estadísticas
        </button>

        <button
          onClick={() => setActiveSubTab('projects')}
          className={`px-4 py-2.5 rounded-2xl transition-all border cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-[#E8C96A] text-[#1C1D1A] dark:bg-[#E8C96A] dark:text-[#1C1D1A] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] hover:text-[#1C1D1A] dark:hover:text-[#F4F2EC] border-[#DCD9D1] dark:border-[#383A36]'
          }`}
        >
          Proyectos en Pared ({projectsList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('proposals')}
          className={`px-4 py-2.5 rounded-2xl transition-all relative border cursor-pointer ${
            activeSubTab === 'proposals'
              ? 'bg-[#E8C96A] text-[#1C1D1A] dark:bg-[#E8C96A] dark:text-[#1C1D1A] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] hover:text-[#1C1D1A] dark:hover:text-[#F4F2EC] border-[#DCD9D1] dark:border-[#383A36]'
          }`}
        >
          Vías Propuestas por Mí ({userProposals.length})
          {pendingUserProposals.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-[#FCF4D7] text-[#574500] text-[10px] font-bold border border-[#E8C96A]">
              {pendingUserProposals.length} pend.
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: STATS & PROGRESS */}
      {activeSubTab === 'stats' && (
        <div className="space-y-8">
          {/* 4 Hero Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Encadenados */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
                  Encadenados
                </span>
                <div className="w-8 h-8 rounded-full bg-[#EAF4E5] text-[#244419] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                {completedItems.length}
              </div>
              <div className="text-[11px] text-[#73716C] dark:text-[#AAA8A1] flex items-center gap-1 font-medium">
                {flashCount > 0 ? (
                  <>
                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                      {flashCount} {flashCount === 1 ? 'al flash 🔥' : 'al flash 🔥'}
                    </span>
                  </>
                ) : (
                  <span>0 al flash</span>
                )}
              </div>
            </div>

            {/* Stat 2: Proyectos Activos */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
                  Proyectos
                </span>
                <div className="w-8 h-8 rounded-full bg-[#E5EFFB] text-[#1B3F70] flex items-center justify-center">
                  <Bookmark className="w-4 h-4 fill-current" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                {projectsList.length}
              </div>
              <div className="text-[11px] text-[#73716C] dark:text-[#AAA8A1]">
                En pared actualmente
              </div>
            </div>

            {/* Stat 3: Grado Máximo */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
                  Máx. Grado
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FCF4D7] text-[#574500] flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA] font-mono">
                {maxGrade}
              </div>
              <div className="text-[11px] text-[#73716C] dark:text-[#AAA8A1] truncate">
                {maxGradeWall}
              </div>
            </div>

            {/* Stat 4: Propuestas Creadas */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
                  Propuestas
                </span>
                <div className="w-8 h-8 rounded-full bg-[#EFEDE7] dark:bg-[#292A27] text-[#292927] dark:text-[#F2F0EA] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#E8C96A]" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                {userProposals.length}
              </div>
              <div className="text-[11px] text-[#73716C] dark:text-[#AAA8A1]">
                {approvedUserProposals.length} oficiales validadas
              </div>
            </div>
          </div>

          {/* Distribution by Grade & Monthly Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Bar Chart */}
            <div className="bg-white dark:bg-[#20211F] p-6 sm:p-8 rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#292927] dark:text-[#F2F0EA] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#E8C96A]" />
                    <span>Distribución por Grado</span>
                  </h2>
                  <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-0.5">
                    Bloques reales que has encadenado en la escala Fontainebleau
                  </p>
                </div>
                {gradeDistribution.length > 0 && (
                  <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-xl bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] dark:text-[#AAA8A1]">
                    {completedItems.length} total
                  </span>
                )}
              </div>

              {gradeDistribution.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {gradeDistribution.map((item) => {
                    const percent = (item.count / maxGradeDistCount) * 100;
                    const levelInfo = getLevelInfo(item.level);

                    return (
                      <div key={item.grade} className="flex items-center gap-3 text-xs">
                        <span className="w-10 font-mono font-extrabold text-[#292927] dark:text-[#F2F0EA] text-right">
                          {item.grade}
                        </span>
                        <div className="flex-1 h-7 bg-[#EFEDE7] dark:bg-[#292A27] rounded-xl overflow-hidden relative">
                          <div
                            className="h-full rounded-xl transition-all duration-700 ease-out flex items-center justify-between px-3"
                            style={{ 
                              width: `${Math.max(percent, 18)}%`,
                              backgroundColor: levelInfo.colorVar,
                            }}
                          >
                            <span 
                              className="text-[10px] font-extrabold uppercase tracking-wider"
                              style={{ 
                                color: item.level === 'pro' ? '#FFFFFF' : (item.level === 'elite' ? '#1C1D1A' : levelInfo.textVar) 
                              }}
                            >
                              {levelInfo.name}
                            </span>
                            <span 
                              className="text-xs font-mono font-black"
                              style={{ 
                                color: item.level === 'pro' ? '#FFFFFF' : (item.level === 'elite' ? '#1C1D1A' : levelInfo.textVar) 
                              }}
                            >
                              {item.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#73716C] dark:text-[#AAA8A1] bg-[#EFEDE7]/50 dark:bg-[#292A27]/50 rounded-2xl border border-dashed border-[#DDDAD3] dark:border-[#383A36]">
                  Aún no has registrado ningún encadene. Marca vías como "Encadenado" para ver tu gráfico de distribución.
                </div>
              )}
            </div>

            {/* Evolución mensual dinámica */}
            <div className="bg-white dark:bg-[#20211F] p-6 sm:p-8 rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#292927] dark:text-[#F2F0EA] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E8C96A]" />
                  <span>Evolución Mensual</span>
                </h2>
                <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] mt-0.5">
                  Ritmo y grados de tus encadenes en el rocódromo de Alhama
                </p>
              </div>

              {monthlyStats.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-center">
                  {monthlyStats.map((item) => (
                    <div 
                      key={item.key} 
                      className="p-3.5 rounded-2xl bg-[#FCF4D7] dark:bg-[#332A13] border border-[#E8C96A] shadow-xs flex flex-col justify-center"
                    >
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#574500] dark:text-[#FDE8A5]">
                        {item.month} {item.year}
                      </div>
                      <div className="text-2xl font-black text-[#574500] dark:text-[#FDE8A5] mt-1">
                        {item.count}
                      </div>
                      <div className="text-[10px] font-bold text-[#574500] dark:text-[#FDE8A5] mt-0.5">
                        Máx {item.maxGrade} 🏆
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#73716C] dark:text-[#AAA8A1] bg-[#EFEDE7]/50 dark:bg-[#292A27]/50 rounded-2xl border border-dashed border-[#DDDAD3] dark:border-[#383A36]">
                  Sin datos mensuales todavía.
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] flex items-center justify-between text-xs">
                <span className="text-[#73716C] dark:text-[#AAA8A1]">Total encadenes en tu cuenta:</span>
                <strong className="text-[#292927] dark:text-[#F2F0EA] font-bold">
                  {completedItems.length} {completedItems.length === 1 ? 'bloque' : 'bloques'}
                </strong>
              </div>
            </div>
          </div>

          {/* Historial Reciente con soporte de bloques obsoletos */}
          <div className="bg-white dark:bg-[#20211F] rounded-3xl p-6 sm:p-8 border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                  Actividad y Encadenes Recientes
                </h2>
                <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                  Tus bloques completados. Los bloques eliminados de las paredes se conservan en tu historial como obsoletos.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#73716C] dark:text-[#AAA8A1]">
                {completedItems.length} registros
              </span>
            </div>

            {completedItems.length > 0 ? (
              <div className="divide-y divide-[#DDDAD3] dark:divide-[#383A36]">
                {completedItems.map((item) => (
                  <div
                    key={item.blockId}
                    onClick={() => {
                      if (item.block) {
                        onSelectBlock(item.block);
                      }
                    }}
                    className={`py-3.5 flex items-center justify-between px-3 rounded-2xl transition-colors ${
                      item.block ? 'cursor-pointer hover:bg-[#EFEDE7] dark:hover:bg-[#292A27]' : 'bg-[#EFEDE7]/30 dark:bg-[#292A27]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#EAF4E5] text-[#244419] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#292927] dark:text-[#F2F0EA] flex items-center gap-2 flex-wrap">
                          <span className="truncate">{item.name}</span>
                          <GradeBadge grade={item.grade} size="sm" />
                          {item.isObsolete && (
                            <span className="px-2 py-0.5 rounded-md bg-[#EFEDE7] dark:bg-[#383A36] text-[#73716C] dark:text-[#AAA8A1] text-[9px] font-bold border border-[#DDDAD3] dark:border-[#4B4E49] flex items-center gap-1">
                              <Archive className="w-2.5 h-2.5" />
                              <span>Obsoleto / Retirado</span>
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-[#73716C] dark:text-[#AAA8A1] flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{item.wallName}</span>
                          <span>•</span>
                          <span>{item.completedAt}</span>
                          {item.attempts && (
                            <span>• {item.attempts} {item.attempts === 1 ? 'intento' : 'intentos'}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {item.flash && (
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/15 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-extrabold flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>FLASH</span>
                        </span>
                      )}

                      {/* Obsolete record deletion button (only allowed for obsolete records, official active blocks are protected) */}
                      {item.isObsolete && onDeleteObsoleteProgress && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteObsoleteTarget(item);
                          }}
                          className="p-1.5 rounded-xl text-[#8E8C85] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                          title="Eliminar este registro de bloque obsoleto de mi historial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#73716C] dark:text-[#AAA8A1] bg-[#EFEDE7]/50 dark:bg-[#292A27]/50 rounded-2xl">
                No tienes encadenes registrados en tu cuenta todavía.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MIS PROYECTOS EN PARED */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
              Mis Proyectos en Curso ({projectsList.length})
            </h2>
            <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
              Vías que estás trabajando actualmente para encadenar en el rocódromo
            </p>
          </div>

          {projectsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsList.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  userProgress={userProgress[block.id]}
                  isLoggedIn={true}
                  onClick={() => onSelectBlock(block)}
                  onToggleFavorite={() => onToggleFavorite(block.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] text-center text-xs text-[#73716C] dark:text-[#AAA8A1] shadow-sm">
              No tienes proyectos guardados en este momento. Explora los bloques y pulsa "Proyecto" para guardarlos aquí.
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: MIS VÍAS PROPUESTAS / PROYECTOS DE EQUIPACIÓN */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
                Vías Propuestas y Proyectos Propios ({userProposals.length})
              </h2>
              <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                Bloques y pasos diseñados por ti. Cuando un equipador/admin los valida, se convierten en vías oficiales del rocódromo.
              </p>
            </div>

            {/* Filter tags for user proposals */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setProposalFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  proposalFilter === 'all'
                    ? 'bg-[#E8C96A] text-[#1C1D1A] border-[#E8C96A] font-extrabold'
                    : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
                }`}
              >
                Todas ({userProposals.length})
              </button>
              <button
                onClick={() => setProposalFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  proposalFilter === 'pending'
                    ? 'bg-[#FCF4D7] text-[#574500] border-[#E8C96A] font-extrabold'
                    : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
                }`}
              >
                Pendientes ({pendingUserProposals.length})
              </button>
              <button
                onClick={() => setProposalFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  proposalFilter === 'approved'
                    ? 'bg-[#EAF4E5] text-[#244419] border-[#9FC78F] font-extrabold'
                    : 'bg-white dark:bg-[#20211F] text-[#73716C] dark:text-[#AAA8A1] border-[#DDDAD3] dark:border-[#383A36]'
                }`}
              >
                Oficiales / Validadas ({approvedUserProposals.length})
              </button>
            </div>
          </div>

          {filteredUserProposals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredUserProposals.map((prop) => {
                const officialBlock = prop.officialBlockId ? blocks.find(b => b.id === prop.officialBlockId) : null;

                return (
                  <div
                    key={prop.id}
                    className="bg-white dark:bg-[#20211F] rounded-3xl p-5 border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Image with markers preview */}
                      <div className="space-y-2">
                        <BlockImageWithMarkers
                          imageUrl={prop.imageUrl}
                          markers={prop.markers}
                          aspectRatio="aspect-[16/9] sm:aspect-[2/1]"
                          showToggle={true}
                        />
                      </div>

                      {/* Header Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-base text-[#1C1D1A] dark:text-[#F4F2EC]">
                            {prop.name || 'Propuesta de vía'}
                          </h3>
                          <div className="flex items-center gap-2">
                            <GradeBadge grade={prop.grade} size="sm" />
                            {prop.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#FCF4D7] text-[#574500] border border-[#E8C96A] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>En Revisión</span>
                              </span>
                            )}
                            {prop.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#EAF4E5] text-[#244419] border border-[#9FC78F] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Vía Oficial</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                          Sector: <strong className="text-[#1C1D1A] dark:text-[#F4F2EC]">{prop.wallName}</strong> • {prop.markers.length} presas marcadas
                        </p>

                        {prop.notes && (
                          <p className="text-xs text-[#5C5B56] dark:text-[#AAA8A1] italic p-3 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36]">
                            "{prop.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Official Block Card or Pending status banner */}
                    <div className="pt-2">
                      {prop.status === 'approved' && officialBlock ? (
                        <div className="p-3.5 rounded-2xl bg-[#EAF4E5] dark:bg-[#1E3316]/50 border border-[#9FC78F] flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#244419] dark:text-[#A7D49B]">
                              <ShieldCheck className="w-4 h-4" />
                              <span>Validada como Vía Oficial</span>
                            </div>
                            <p className="text-xs text-[#244419] dark:text-[#D5EAD0] truncate">
                              Nombre oficial: <strong>{officialBlock.name}</strong> ({officialBlock.grade})
                            </p>
                          </div>

                          <button
                            onClick={() => onSelectBlock(officialBlock)}
                            className="px-3.5 py-2 rounded-xl bg-[#244419] hover:bg-[#1b3413] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Ver Bloque Oficial</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : prop.status === 'pending' ? (
                        <div className="p-3 rounded-2xl bg-[#FCF4D7]/70 dark:bg-[#332A13]/50 border border-[#E8C96A]/60 flex items-center gap-2 text-xs text-[#574500] dark:text-[#FDE8A5]">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Tu propuesta está registrada y pendiente de validación por los equipadores.</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] space-y-4 shadow-sm">
              <Sparkles className="w-10 h-10 text-[#E8C96A] mx-auto" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-[#1C1D1A] dark:text-[#F4F2EC]">
                  No tienes propuestas en esta categoría
                </h3>
                <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] max-w-md mx-auto">
                  Puedes equipar o diseñar tus propios pasos en las fotos de los sectores y enviarlos para que los equipadores los validen.
                </p>
              </div>

              {onOpenProposeModal && (
                <button
                  onClick={onOpenProposeModal}
                  className="px-5 py-2.5 rounded-2xl bg-[#E8C96A] text-[#1C1D1A] text-xs font-bold inline-flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Proponer mi primera vía</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal for deleting obsolete records */}
      {deleteObsoleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                ¿Eliminar registro de bloque obsoleto?
              </h3>
              <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] leading-relaxed">
                Estás a punto de borrar el registro de encadene de <strong>"{deleteObsoleteTarget.name}" ({deleteObsoleteTarget.grade})</strong> de tu historial personal. Tus estadísticas y gráfico de distribución se actualizarán.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteObsoleteTarget(null)}
                className="px-4 py-2.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] text-[#292927] dark:text-[#F2F0EA] text-xs font-bold hover:bg-[#E3E0D8] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onDeleteObsoleteProgress) {
                    onDeleteObsoleteProgress(deleteObsoleteTarget.blockId);
                  }
                  setDeleteObsoleteTarget(null);
                }}
                className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Eliminar de mi historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
