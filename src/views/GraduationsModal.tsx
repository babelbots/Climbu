import React from 'react';
import { LEVEL_DEFINITIONS } from '../utils/gradeUtils';
import { X, Award } from 'lucide-react';

interface GraduationsModalProps {
  onClose: () => void;
  onSelectLevel?: (level: string) => void;
}

export const GraduationsModal: React.FC<GraduationsModalProps> = ({ onClose, onSelectLevel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#20211F] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#DDDAD3] dark:border-[#383A36] animate-in slide-in-from-bottom-4 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDAD3] dark:border-[#383A36] bg-white/90 dark:bg-[#20211F]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8C96A] text-[#292927] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-[#292927] dark:text-[#F2F0EA]">
              Escala de Graduación Fontainebleau
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center bg-[#EFEDE7] dark:bg-[#292A27] hover:bg-[#E5E2DA] dark:hover:bg-[#333531] text-[#73716C] dark:text-[#AAA8A1] border border-[#DDDAD3] dark:border-[#383A36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-[#73716C] dark:text-[#AAA8A1] leading-relaxed">
            En el Rocódromo de Alhama de Murcia agrupamos la escala internacional de Fontainebleau en <strong className="text-[#292927] dark:text-[#F2F0EA]">6 niveles de dificultad cromáticos</strong> para facilitar la identificación visual en la pared y en la aplicación.
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(LEVEL_DEFINITIONS).map(([lvlKey, info]) => (
              <div
                key={lvlKey}
                onClick={() => {
                  if (onSelectLevel) {
                    onSelectLevel(lvlKey);
                    onClose();
                  }
                }}
                className="p-4 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] hover:border-[#E8C96A] dark:hover:border-[#E8C96A] transition-all cursor-pointer space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/40 inline-block shadow-xs shrink-0"
                      style={{ backgroundColor: info.colorVar }}
                    />
                    <h4 className="font-extrabold text-sm text-[#292927] dark:text-[#F2F0EA]">
                      {info.name}
                    </h4>
                  </div>
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-xl bg-white dark:bg-[#20211F] text-[#292927] dark:text-[#F2F0EA] border border-[#DDDAD3] dark:border-[#383A36] shadow-xs">
                    {info.grades.join(' · ')}
                  </span>
                </div>

                <p className="text-[11px] text-[#73716C] dark:text-[#AAA8A1] leading-relaxed">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
