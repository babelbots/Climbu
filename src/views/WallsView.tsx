import React from 'react';
import { Wall, BoulderBlock, Gym } from '../types';
import { ArrowRight, Building2 } from 'lucide-react';

interface WallsViewProps {
  walls: Wall[];
  blocks: BoulderBlock[];
  activeGym?: Gym | null;
  onSelectWall: (wallId: string) => void;
}

export const WallsView: React.FC<WallsViewProps> = ({ walls, blocks, activeGym, onSelectWall }) => {
  return (
    <div className="space-y-8 pb-24 md:pb-16 max-w-7xl mx-auto px-4 sm:px-10 pt-4 md:pt-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-[#E8C96A]/20 text-[#292927] dark:text-[#E8C96A] text-xs font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {activeGym?.name || 'Rocódromo'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292927] dark:text-[#F2F0EA] tracking-tight">
          Sectores y Muros
        </h1>
        <p className="text-xs text-[#73716C] dark:text-[#AAA8A1]">
          Descubre los diferentes sectores, perfiles e inclinaciones equipadas en {activeGym?.location || 'la sala'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {walls.map((wall) => {
          const wallBlocks = blocks.filter((b) => b.wallId === wall.id && b.status === 'active');
          const retiredCount = blocks.filter((b) => b.wallId === wall.id && b.status === 'retired').length;

          return (
            <article
              key={wall.id}
              onClick={() => onSelectWall(wall.id)}
              className="group bg-white dark:bg-[#20211F] rounded-3xl p-4 sm:p-5 shadow-sm border border-[#DDDAD3] dark:border-[#383A36] hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              {/* Wall Image */}
              <div className="relative w-full aspect-[16/9] bg-[#EFEDE7] dark:bg-[#292A27] rounded-2xl overflow-hidden mb-4">
                <img
                  src={wall.imageUrl}
                  alt={wall.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#292927]/85 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#9FC78F]" />
                  <span>{wallBlocks.length} vías activas</span>
                </div>
              </div>

              {/* Wall Content */}
              <div className="flex-1 flex flex-col justify-between space-y-4 px-1">
                <div>
                  <h2 className="text-xl font-bold text-[#292927] dark:text-[#F2F0EA] group-hover:text-[#B59124] dark:group-hover:text-[#E8C96A] transition-colors">
                    {wall.name}
                  </h2>
                  <p className="text-xs text-[#73716C] dark:text-[#AAA8A1] leading-relaxed mt-1.5">
                    {wall.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DDDAD3] dark:border-[#383A36] flex items-center justify-between">
                  <span className="text-[11px] text-[#73716C] dark:text-[#AAA8A1] font-medium">
                    {retiredCount > 0 ? `${retiredCount} en histórico` : 'Todo activo'}
                  </span>
                  <div className="text-xs font-bold text-[#E8C96A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver vías</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
