import React from 'react';
import { BoulderLevel } from '../types';
import { getLevelInfo } from '../utils/gradeUtils';

interface LevelBadgeProps {
  level: BoulderLevel;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  className = '',
  onClick,
  selected = false,
}) => {
  const info = getLevelInfo(level);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 border ${
        selected
          ? 'ring-2 ring-[var(--primary)] text-[var(--text-primary)] font-extrabold shadow-sm'
          : 'hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)]'
      } ${className}`}
      style={{
        backgroundColor: selected ? info.colorVar : undefined,
        color: selected ? (level === 'pro' ? '#FFFFFF' : (level === 'elite' ? '#1C1D1A' : info.textVar)) : undefined,
        borderColor: selected ? info.colorVar : 'var(--border-color)',
      }}
    >
      {info.name}
    </button>
  );
};
