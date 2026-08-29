import React from 'react';
import { BoulderBlock, Wall, UserProfile, UserBlockProgress, Gym } from '../types';
import { BlockCard } from '../components/BlockCard';
import { LEVEL_DEFINITIONS, getLevelForGrade } from '../utils/gradeUtils';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Info,
  Lock,
  Unlock,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface HomeViewProps {
  blocks: BoulderBlock[];
  walls: Wall[];
  currentUser: UserProfile | null;
  activeGym: Gym | null;
  userProgress: Record<string, UserBlockProgress>;
  onNavigate: (tab: string, filter?: { level?: string; wallId?: string }) => void;
  onSelectBlock: (block: BoulderBlock) => void;
  onOpenGraduationsModal: () => void;
  onOpenGymsDirectory: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  blocks,
  walls,
  currentUser,
  activeGym,
  userProgress,
  onNavigate,
  onSelectBlock,
  onOpenGraduationsModal,
  onOpenGymsDirectory,
}) => {
  const isLoggedIn = !!currentUser;
  const activeBlocks = blocks.filter(b => b.status === 'active');
  const recentBlocks = activeBlocks.slice(0, 4);

  // User project blocks
  const projectBlocks = blocks.filter(b => userProgress[b.id]?.status === 'project');

  return (
    <div className="space-y-12 pb-24 md:pb-16 max-w-7xl mx-auto px-4 sm:px-10 pt-4 md:pt-8 animate-in fade-in duration-200">
      {/* Hero Section - Clean Minimalism Split Layout */}
      <section className="bg-white dark:bg-[#20211F] rounded-3xl p-6 sm:p-10 border border-[#DDDAD3] dark:border-[#383A36] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Hero & Intro */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <button
                  onClick={onOpenGymsDirectory}
                  className="bg-[#E8C96A] text-[#292927] hover:bg-[#dfbe59] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{activeGym?.name || 'Rocódromo'}</span>
                </button>

                {activeGym?.type === 'private' ? (
                  <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Privado
                  </span>
                ) : (
                  <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Público
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-[#292927] dark:text-[#F2F0EA] tracking-tight">
                {activeGym?.name || 'Escala tus propios límites.'}
              </h1>

              {activeGym?.subtitle && (
                <p className="text-xs sm:text-sm font-bold text-[#E8C96A] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeGym.subtitle}
                </p>
              )}
            </div>

            <p className="text-[#73716C] dark:text-[#AAA8A1] leading-relaxed mb-8 text-base sm:text-lg max-w-lg">
              {activeGym?.description || 'Explora los bloques equipados, registra tus encadenes en croquis oficiales interactivos y conecta con la comunidad de escaladores.'}
            </p>

            <div className="flex flex-wrap gap-3.5">
              <button
                onClick={() => onNavigate('blocks')}
                id="home-hero-see-blocks-btn"
                className="bg-[#E8C96A] text-[#292927] px-8 py-3.5 rounded-2xl font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Ver Bloques ({activeBlocks.length})
              </button>

              <button
                onClick={onOpenGymsDirectory}
                id="home-hero-change-gym-btn"
                className="bg-white dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-[#292927] dark:text-[#F2F0EA] px-6 py-3.5 rounded-2xl font-bold hover:bg-[#EFEDE7] dark:hover:bg-[#383A36] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cambiar Rocódromo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Featured Cards Preview (Clean Minimal Grid) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#292927] dark:text-[#F2F0EA]">Nuevos Desafíos</h2>
              <button 
                onClick={() => onNavigate('blocks')} 
                className="text-sm font-semibold text-[#87A9D8] hover:underline underline-offset-4 cursor-pointer"
              >
                Ver todos ({activeBlocks.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentBlocks.slice(0, 2).map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  userProgress={userProgress[block.id]}
                  isLoggedIn={isLoggedIn}
                  onClick={() => onSelectBlock(block)}
                />
              ))}

              {recentBlocks.length === 0 && (
                <div className="col-span-2 p-8 text-center bg-[#EFEDE7]/50 dark:bg-[#292A27]/50 rounded-2xl border border-dashed border-[#DDDAD3] dark:border-[#383A36]">
                  <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                    No hay bloques activos en este rocódromo todavía.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sectores / Walls Overview */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
              Sectores de {activeGym?.name || 'la Sala'}
            </h2>
            <p className="text-xs sm:text-sm text-[#73716C] dark:text-[#AAA8A1] mt-0.5">
              Estructuras equipadas y ángulos técnicos disponibles
            </p>
          </div>
          <button
            onClick={() => onNavigate('walls')}
            className="text-xs font-bold text-[#87A9D8] hover:underline underline-offset-4 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Explorar todos los sectores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {walls.map((wall) => {
            const wallBlocksCount = blocks.filter(b => b.wallId === wall.id && b.status === 'active').length;
            return (
              <div
                key={wall.id}
                onClick={() => onNavigate('blocks', { wallId: wall.id })}
                className="group rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] overflow-hidden shadow-sm hover:border-[#E8C96A] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-[#292A27] overflow-hidden">
                  <img
                    src={wall.imageUrl}
                    alt={wall.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Sector {wall.order}
                    </span>
                    <h3 className="text-base font-extrabold tracking-tight truncate">
                      {wall.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] line-clamp-2 leading-relaxed">
                    {wall.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#292927] dark:text-[#F2F0EA] border-t border-[#DDDAD3] dark:border-[#383A36]">
                    <span className="text-[11px] text-[#73716C] dark:text-[#AAA8A1]">Bloques activos</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#EFEDE7] dark:bg-[#292A27] text-xs">
                      {wallBlocksCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Levels / Grades System */}
      <section className="bg-white dark:bg-[#20211F] rounded-3xl p-6 sm:p-8 border border-[#DDDAD3] dark:border-[#383A36] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8C96A]/20 text-[#292927] dark:text-[#E8C96A] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                Escala de Dificultades ClimbU
              </h2>
              <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
                Graduación estándar Font/French adaptada por niveles de color
              </p>
            </div>
          </div>

          <button
            onClick={onOpenGraduationsModal}
            className="text-xs font-bold text-[#87A9D8] hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver tabla completa</span>
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(LEVEL_DEFINITIONS).map(([lvlKey, lvl]) => {
            const countInLevel = blocks.filter(b => b.level === lvlKey && b.status === 'active').length;
            return (
              <button
                key={lvlKey}
                onClick={() => onNavigate('blocks', { level: lvlKey })}
                className="p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between"
                style={{
                  backgroundColor: `${lvl.bgVar}25`,
                  borderColor: `${lvl.colorVar}40`,
                }}
              >
                <div>
                  <div
                    className="w-3 h-3 rounded-full mb-2"
                    style={{ backgroundColor: lvl.colorVar }}
                  />
                  <div className="text-xs font-black capitalize" style={{ color: lvl.colorVar }}>
                    {lvl.name}
                  </div>
                  <div className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] font-mono mt-0.5">
                    {lvl.grades[0]} - {lvl.grades[lvl.grades.length - 1]}
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-extrabold text-[#292927] dark:text-[#F2F0EA]">
                  {countInLevel} {countInLevel === 1 ? 'bloque' : 'bloques'}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
