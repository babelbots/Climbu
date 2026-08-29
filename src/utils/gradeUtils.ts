import { BoulderGrade, BoulderLevel, LevelInfo } from '../types';

export const LEVEL_DEFINITIONS: Record<BoulderLevel, LevelInfo> = {
  principiante: {
    id: 'principiante',
    name: 'Principiante',
    grades: ['3', '4-', '4', '4+', '5', '5+'],
    colorVar: 'var(--level-principiante)',
    bgVar: 'var(--level-principiante-bg)',
    textVar: 'var(--level-principiante-text)',
    description: 'Vías idóneas para iniciarse en la escalada en bloque, con buenos agarres y movimientos naturales.'
  },
  intermedio: {
    id: 'intermedio',
    name: 'Intermedio',
    grades: ['6A', '6A+', '6B', '6B+'],
    colorVar: 'var(--level-intermedio)',
    bgVar: 'var(--level-intermedio-bg)',
    textVar: 'var(--level-intermedio-text)',
    description: 'Bloques con secuencias técnicas, regletas intermedias y pasos de colocación y equilibrio.'
  },
  avanzado: {
    id: 'avanzado',
    name: 'Avanzado',
    grades: ['6C', '6C+', '7A'],
    colorVar: 'var(--level-avanzado)',
    bgVar: 'var(--level-avanzado-bg)',
    textVar: 'var(--level-avanzado-text)',
    description: 'Movimientos exigentes que demandan fuerza de dedos, tensión corporal y precisión en pies.'
  },
  experto: {
    id: 'experto',
    name: 'Experto',
    grades: ['7A+', '7B', '7B+', '7C'],
    colorVar: 'var(--level-experto)',
    bgVar: 'var(--level-experto-bg)',
    textVar: 'var(--level-experto-text)',
    description: 'Retos de alta intensidad física y técnica en desplomes pronunciados y agarres mínimos.'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    grades: ['7C+', '8A', '8A+', '8B'],
    colorVar: 'var(--level-pro)',
    bgVar: 'var(--level-pro-bg)',
    textVar: 'var(--level-pro-text)',
    description: 'Grados para escaladores altamente experimentados con gran potencia y dominio gestual.'
  },
  elite: {
    id: 'elite',
    name: 'Élite',
    grades: ['8B+', '8C', '8C+', '9A'],
    colorVar: 'var(--level-elite)',
    bgVar: 'var(--level-elite-bg)',
    textVar: 'var(--level-elite-text)',
    description: 'Los problemas más duros del rocódromo, proyectos de nivel internacional.'
  }
};

export const ALL_GRADES: BoulderGrade[] = [
  '3', '4-', '4', '4+', '5', '5+',
  '6A', '6A+', '6B', '6B+',
  '6C', '6C+', '7A',
  '7A+', '7B', '7B+', '7C',
  '7C+', '8A', '8A+', '8B',
  '8B+', '8C', '8C+', '9A'
];

export function getLevelForGrade(grade: BoulderGrade): BoulderLevel {
  for (const [levelKey, info] of Object.entries(LEVEL_DEFINITIONS)) {
    if (info.grades.includes(grade)) {
      return levelKey as BoulderLevel;
    }
  }
  return 'intermedio';
}

export function getLevelInfo(level: BoulderLevel): LevelInfo {
  return LEVEL_DEFINITIONS[level] || LEVEL_DEFINITIONS.intermedio;
}

export function getGradeRank(grade: BoulderGrade): number {
  const index = ALL_GRADES.indexOf(grade);
  return index >= 0 ? index : 0;
}

export function compareGrades(a: BoulderGrade, b: BoulderGrade): number {
  return getGradeRank(a) - getGradeRank(b);
}

export function getMaxGrade(grades: BoulderGrade[]): BoulderGrade | null {
  if (grades.length === 0) return null;
  return [...grades].sort((a, b) => compareGrades(b, a))[0];
}

export function getGradeBadgeStyle(level: BoulderLevel) {
  const info = getLevelInfo(level);
  return {
    backgroundColor: info.colorVar,
    color: level === 'pro' ? '#FFFFFF' : (level === 'elite' ? '#1C1D1A' : info.textVar),
    border: level === 'elite' ? '1px solid rgba(0, 0, 0, 0.15)' : undefined,
  };
}
