import React from 'react';
import { BoulderGrade } from '../types';
import { getLevelForGrade, getGradeBadgeStyle } from '../utils/gradeUtils';

interface GradeBadgeProps {
  grade: BoulderGrade;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({ 
  grade, 
  size = 'md',
  className = '' 
}) => {
  const level = getLevelForGrade(grade);
  const style = getGradeBadgeStyle(level);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[11px] rounded font-bold',
    md: 'px-2.5 py-1 text-[13px] rounded-md font-extrabold tracking-tight',
    lg: 'px-3.5 py-1.5 text-[15px] rounded-lg font-extrabold tracking-tight',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-mono leading-none shadow-sm ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {grade}
    </span>
  );
};
