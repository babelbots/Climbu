import React, { useState, useMemo } from 'react';
import { BoulderBlock, Wall, UserProfile, UserBlockProgress, BoulderLevel } from '../types';
import { BlockCard } from '../components/BlockCard';
import { LEVEL_DEFINITIONS, ALL_GRADES, getLevelForGrade } from '../utils/gradeUtils';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Archive, 
  Bookmark, 
  CheckCircle2, 
  Heart,
  Sparkles
} from 'lucide-react';

interface BlocksViewProps {
  blocks: BoulderBlock[];
  walls: Wall[];
  currentUser: UserProfile | null;
  userProgress: Record<string, UserBlockProgress>;
  initialLevel?: string;
  initialWallId?: string;
  onSelectBlock: (block: BoulderBlock) => void;
  onToggleFavorite: (blockId: string) => void;
}

export const BlocksView: React.FC<BlocksViewProps> = ({
  blocks,
  walls,
  currentUser,
  userProgress,
  initialLevel,
  initialWallId,
  onSelectBlock,
  onToggleFavorite,
}) => {
  const isLoggedIn = !!currentUser;
  
  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel || 'all');
  const [selectedWallId, setSelectedWallId] = useState<string>(initialWallId || 'all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [includeRetired, setIncludeRetired] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedLevel !== 'all') count++;
    if (selectedWallId !== 'all') count++;
    if (selectedGrade !== 'all') count++;
    if (selectedStatusFilter !== 'all') count++;
    if (includeRetired) count++;
    return count;
  }, [selectedLevel, selectedWallId, selectedGrade, selectedStatusFilter, includeRetired]);

  // Filtered blocks logic
  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) => {
      // 1. Status retired vs active
      if (!includeRetired && block.status === 'retired') {
        return false;
      }

      // 2. Level filter
      if (selectedLevel !== 'all') {
        const blockLevel = getLevelForGrade(block.grade);
        if (blockLevel !== selectedLevel) {
          return false;
        }
      }

      // 3. Wall filter
      if (selectedWallId !== 'all' && block.wallId !== selectedWallId) {
        return false;
      }

      // 4. Grade filter
      if (selectedGrade !== 'all' && block.grade !== selectedGrade) {
        return false;
      }

      // 5. User progress status filter
      if (isLoggedIn && selectedStatusFilter !== 'all') {
        const prog = userProgress[block.id];
        if (selectedStatusFilter === 'favorite') {
          if (!prog?.favorite) return false;
        } else if (selectedStatusFilter === 'completed') {
          if (prog?.status !== 'completed') return false;
        } else if (selectedStatusFilter === 'project') {
          if (prog?.status !== 'project') return false;
        } else if (selectedStatusFilter === 'untried') {
          if (prog && prog.status !== 'untried') return false;
        } else if (selectedStatusFilter === 'my_proposals') {
          if (block.proposedByUserId !== currentUser?.id && block.createdBy !== currentUser?.name) return false;
        }
      }

      // 6. Search query (name, tags, wall name, grade)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = block.name.toLowerCase().includes(query);
        const matchesWall = block.wallName.toLowerCase().includes(query);
        const matchesGrade = block.grade.toLowerCase().includes(query);
        const matchesTags = block.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesWall && !matchesGrade && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [blocks, selectedLevel, selectedWallId, selectedGrade, selectedStatusFilter, includeRetired, searchQuery, isLoggedIn, userProgress]);

  const resetAllFilters = () => {
    setSelectedLevel('all');
    setSelectedWallId('all');
    setSelectedGrade('all');
    setSelectedStatusFilter('all');
    setIncludeRetired(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-16 max-w-7xl mx-auto px-4 sm:px-10 pt-4 md:pt-6 animate-in fade-in duration-200">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
            Bloques del Rocódromo
          </h1>
          <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
            Mostrando {filteredBlocks.length} de {blocks.length} vías disponibles
          </p>
        </div>

        {/* Search & Filter Trigger Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73716C] dark:text-[#AAA8A1]" />
            <input
              type="text"
              placeholder="Buscar bloque, pared, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs rounded-2xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] text-[#292927] dark:text-[#F2F0EA] placeholder:text-[#9E9C95] focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9C95] hover:text-[#292927] dark:hover:text-[#F2F0EA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFiltersModal(true)}
            id="open-filters-btn"
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
              activeFiltersCount > 0
                ? 'bg-[#E8C96A] text-[#292927] border-[#E8C96A] shadow-xs'
                : 'bg-white dark:bg-[#20211F] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] text-[#292927] dark:text-[#F2F0EA] border-[#DDDAD3] dark:border-[#383A36]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E8C96A] text-[#1C1D1A] text-[10px] flex items-center justify-center font-extrabold shadow-2xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Level Scroll Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSelectedLevel('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 border ${
            selectedLevel === 'all'
              ? 'bg-[#E8C96A] text-[#1C1D1A] dark:bg-[#E8C96A] dark:text-[#1C1D1A] font-extrabold border-[#E8C96A] shadow-xs'
              : 'bg-white dark:bg-[#20211F] text-[#5C5B56] hover:text-[#1C1D1A] dark:text-[#AAA8A1] dark:hover:text-[#F4F2EC] border-[#DCD9D1] dark:border-[#383A36]'
          }`}
        >
          Todos ({blocks.filter(b => includeRetired ? true : b.status === 'active').length})
        </button>

        {Object.entries(LEVEL_DEFINITIONS).map(([lvlKey, info]) => {
          const isSelected = selectedLevel === lvlKey;
          const count = blocks.filter(b => getLevelForGrade(b.grade) === lvlKey && (includeRetired ? true : b.status === 'active')).length;

          return (
            <button
              key={lvlKey}
              onClick={() => setSelectedLevel(isSelected ? 'all' : lvlKey)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 border ${
                isSelected
                  ? 'ring-2 ring-[#E8C96A] font-extrabold shadow-xs'
                  : 'bg-white dark:bg-[#20211F] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36]'
              }`}
              style={{
                backgroundColor: isSelected ? info.bgVar : undefined,
                color: isSelected ? info.textVar : undefined,
                borderColor: isSelected ? info.colorVar : undefined,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/40 inline-block shrink-0"
                style={{ backgroundColor: info.colorVar }}
              />
              <span>{info.name}</span>
              <span className="opacity-75 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filter summary chips if active */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#73716C] dark:text-[#AAA8A1] font-semibold text-[11px]">Filtros activos:</span>

          {selectedLevel !== 'all' && (
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] font-bold flex items-center gap-1.5 border border-[#DDDAD3] dark:border-[#383A36]">
              <span>Nivel: {LEVEL_DEFINITIONS[selectedLevel as BoulderLevel]?.name}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLevel('all')} />
            </span>
          )}

          {selectedWallId !== 'all' && (
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] font-bold flex items-center gap-1.5 border border-[#DDDAD3] dark:border-[#383A36]">
              <span>Pared: {walls.find(w => w.id === selectedWallId)?.name}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedWallId('all')} />
            </span>
          )}

          {selectedGrade !== 'all' && (
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] font-bold flex items-center gap-1.5 border border-[#DDDAD3] dark:border-[#383A36]">
              <span>Grado: {selectedGrade}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGrade('all')} />
            </span>
          )}

          {selectedStatusFilter !== 'all' && (
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] font-bold flex items-center gap-1.5 border border-[#DDDAD3] dark:border-[#383A36]">
              <span>
                Filtro: {selectedStatusFilter === 'my_proposals' ? 'Propuestas por mí' : selectedStatusFilter === 'completed' ? 'Encadenados' : selectedStatusFilter === 'project' ? 'Proyectos' : selectedStatusFilter === 'favorite' ? 'Favoritos' : selectedStatusFilter}
              </span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedStatusFilter('all')} />
            </span>
          )}

          {includeRetired && (
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] font-bold flex items-center gap-1.5 border border-[#DDDAD3] dark:border-[#383A36]">
              <span>Incluye retiradas</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setIncludeRetired(false)} />
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-[11px] font-bold text-[#87A9D8] hover:underline flex items-center gap-1 ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar todos</span>
          </button>
        </div>
      )}

      {/* Blocks Grid */}
      {filteredBlocks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              userProgress={userProgress[block.id]}
              isLoggedIn={isLoggedIn}
              onClick={() => onSelectBlock(block)}
              onToggleFavorite={() => onToggleFavorite(block.id)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-white dark:bg-[#20211F] rounded-3xl border border-[#DDDAD3] dark:border-[#383A36] p-8 space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-[#292927] dark:text-[#F2F0EA]">
            No se han encontrado bloques
          </h3>
          <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
            Prueba a cambiar o reiniciar los filtros de búsqueda para ver más vías del rocódromo.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-6 py-3 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-bold inline-flex items-center gap-2 shadow-xs hover:shadow-md transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar todos los filtros</span>
          </button>
        </div>
      )}

      {/* Filters Modal / Bottom Sheet */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-[#20211F] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5 border border-[#DDDAD3] dark:border-[#383A36] animate-in slide-in-from-bottom-4 duration-250 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DDDAD3] dark:border-[#383A36] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#E8C96A]" />
                <h3 className="font-extrabold text-base text-[#292927] dark:text-[#F2F0EA]">Filtros de Bloques</h3>
              </div>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] text-[#73716C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pared Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1] mb-2">
                Pared / Sector
              </label>
              <select
                value={selectedWallId}
                onChange={(e) => setSelectedWallId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-[#292927] dark:text-[#F2F0EA] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8C96A]"
              >
                <option value="all">Todas las paredes</option>
                {walls.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grado Exacto Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1] mb-2">
                Grado Exacto (Fontainebleau)
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] text-[#292927] dark:text-[#F2F0EA] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8C96A] font-mono"
              >
                <option value="all">Cualquier grado</option>
                {ALL_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Logged in User Status Filter */}
            {isLoggedIn && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1] mb-2">
                  Tu Estado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('all')}
                    className={`p-2.5 rounded-2xl text-xs font-bold border ${
                      selectedStatusFilter === 'all'
                        ? 'bg-[#E8C96A] text-[#1C1D1A] dark:bg-[#E8C96A] dark:text-[#1C1D1A] border-[#E8C96A] shadow-xs'
                        : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#5C5B56] dark:text-[#AAA8A1] border-[#DCD9D1] dark:border-[#383A36]'
                    }`}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('project')}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      selectedStatusFilter === 'project'
                        ? 'bg-[#87A9D8] text-[#1B3F70] border-[#87A9D8]'
                        : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] border-[#DDDAD3] dark:border-[#383A36]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>Proyectos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('completed')}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      selectedStatusFilter === 'completed'
                        ? 'bg-[#E8C96A] text-[#292927] border-[#E8C96A]'
                        : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] border-[#DDDAD3] dark:border-[#383A36]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Encadenados</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('favorite')}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      selectedStatusFilter === 'favorite'
                        ? 'bg-[#D98278] text-white border-[#D98278]'
                        : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] border-[#DDDAD3] dark:border-[#383A36]'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>Favoritos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('my_proposals')}
                    className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      selectedStatusFilter === 'my_proposals'
                        ? 'bg-[#E8C96A] text-[#1C1D1A] border-[#E8C96A] font-extrabold'
                        : 'bg-[#EFEDE7] dark:bg-[#292A27] text-[#73716C] border-[#DDDAD3] dark:border-[#383A36]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E8C96A]" />
                    <span>Propuestas por Mí</span>
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Vías Retiradas */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36]">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-[#73716C]" />
                <div>
                  <p className="text-xs font-bold text-[#292927] dark:text-[#F2F0EA]">Incluir vías retiradas</p>
                  <p className="text-[10px] text-[#73716C] dark:text-[#AAA8A1]">Historial de bloques desequipados</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeRetired}
                onChange={(e) => setIncludeRetired(e.target.checked)}
                className="w-4 h-4 rounded text-[#E8C96A] accent-[#E8C96A] cursor-pointer"
              >
              </input>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-3 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] text-xs font-bold text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA] border border-[#DDDAD3] dark:border-[#383A36]"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 py-3 rounded-2xl bg-[#E8C96A] text-[#292927] text-xs font-bold shadow-xs hover:shadow-md transition-all"
              >
                Aplicar ({filteredBlocks.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
