import React from 'react';
import { BoulderBlock, UserBlockProgress } from '../types';
import { GradeBadge } from './GradeBadge';
import { getLevelForGrade, getLevelInfo } from '../utils/gradeUtils';
import { MapPin, CheckCircle2, Bookmark, Circle, Archive, Heart, Flame } from 'lucide-react';

interface BlockCardProps {
  block: BoulderBlock;
  userProgress?: UserBlockProgress;
  isLoggedIn?: boolean;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  userProgress,
  isLoggedIn = false,
  onClick,
  onToggleFavorite,
}) => {
  const level = getLevelForGrade(block.grade);
  const levelInfo = getLevelInfo(level);
  const status = userProgress?.status || 'untried';
  const isFavorite = !!userProgress?.favorite;
  const isRetired = block.status === 'retired';

  return (
    <article
      onClick={onClick}
      id={`block-card-${block.id}`}
      className="bg-white dark:bg-[#20211F] rounded-3xl p-4 shadow-sm border border-[#DDDAD3] dark:border-[#383A36] flex flex-col group cursor-pointer hover:shadow-md transition-all duration-200"
    >
      {/* Visual Image Container */}
      <div className="relative h-48 w-full bg-[#EFEDE7] dark:bg-[#292A27] rounded-2xl overflow-hidden mb-4 flex-shrink-0">
        <img
          src={block.imageUrl}
          alt={block.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Level & Grade Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span 
            className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-xs tracking-wider border border-black/10 dark:border-white/20"
            style={{ 
              backgroundColor: levelInfo.colorVar, 
              color: level === 'pro' ? '#FFFFFF' : (level === 'elite' ? '#1C1D1A' : levelInfo.textVar)
            }}
          >
            {block.grade} {levelInfo.name}
          </span>
        </div>

        {/* Retired Status Indicator */}
        {isRetired && (
          <div className="absolute top-3 right-3 z-10 bg-[#292927]/90 text-white backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Archive className="w-3 h-3 text-[#E8C96A]" />
            <span>Retirada</span>
          </div>
        )}

        {/* Favorite Heart for Logged In User */}
        {isLoggedIn && onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-[#20211F]/90 backdrop-blur-xs flex items-center justify-center text-[#73716C] hover:text-[#D98278] active:scale-90 transition-all border border-[#DDDAD3] dark:border-[#383A36] shadow-xs"
            title={isFavorite ? 'Quitar de favoritos' : 'Guardar favorito'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#D98278] text-[#D98278]' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-[#73716C] uppercase tracking-tighter truncate">
              {block.wallName}
            </span>

            {/* User Status Indicator */}
            {isLoggedIn && (
              <div className="flex-shrink-0">
                {status === 'completed' && (
                  userProgress?.flash ? (
                    <span 
                      className="w-6 h-6 rounded-full bg-[#FFF3EB] dark:bg-[#3D1E10] text-[#EA580C] dark:text-[#FB923C] flex items-center justify-center shadow-2xs border border-orange-200 dark:border-orange-800" 
                      title="¡Encadenado al Flash (1er pegue)!"
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                    </span>
                  ) : (
                    <span 
                      className="w-6 h-6 rounded-full bg-[#EAF4E5] text-[#244419] flex items-center justify-center shadow-2xs" 
                      title="Encadenado"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )
                )}
                {status === 'project' && (
                  <span className="w-6 h-6 rounded-full bg-[#E5EFFB] text-[#1B3F70] flex items-center justify-center shadow-2xs" title="Proyecto">
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </span>
                )}
                {status === 'untried' && (
                  <span className="w-6 h-6 rounded-full bg-[#EFEDE7] dark:bg-[#292A27] text-[#9E9C95] flex items-center justify-center" title="Sin probar">
                    <Circle className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}
          </div>

          <h3 className="font-bold text-lg text-[#292927] dark:text-[#F2F0EA] group-hover:text-[#B59124] dark:group-hover:text-[#E8C96A] transition-colors line-clamp-1 mb-2">
            {block.name}
          </h3>
        </div>

        {/* Tags */}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {block.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-1 bg-[#F7F6F2] dark:bg-[#292A27] rounded-md text-[#73716C] dark:text-[#AAA8A1] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
