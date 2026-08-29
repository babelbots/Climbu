export type BoulderLevel = 
  | 'principiante'
  | 'intermedio'
  | 'avanzado'
  | 'experto'
  | 'pro'
  | 'elite';

export type BoulderGrade =
  | '3'
  | '4-'
  | '4'
  | '4+'
  | '5'
  | '5+'
  | '6A'
  | '6A+'
  | '6B'
  | '6B+'
  | '6C'
  | '6C+'
  | '7A'
  | '7A+'
  | '7B'
  | '7B+'
  | '7C'
  | '7C+'
  | '8A'
  | '8A+'
  | '8B'
  | '8B+'
  | '8C'
  | '8C+'
  | '9A';

export interface Marker {
  id: string;
  type: 'start' | 'hold' | 'bonus' | 'top';
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
  radius?: number; // radius in pixels (default ~18-22, diameter ~36-44)
  label?: string;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  subtitle?: string;
  description: string;
  location: string;
  city: string;
  address?: string;
  type: 'public' | 'private';
  accessCode?: string; // Access code for private gyms (visible only to admin/setters)
  imageUrl: string;
  coverUrl?: string;
  setters: string[]; // List of authorized equipador emails for this gym
  createdBy: string;
  createdAt: string;
  features?: string[];
  openingHours?: string;
  totalArea?: string;
  activeWallsCount?: number;
  activeBlocksCount?: number;
}

export interface Wall {
  id: string;
  gymId: string;
  name: string;
  description: string;
  imageUrl: string;
  order: number;
  active: boolean;
  activeBlocksCount?: number;
}

export interface BoulderBlock {
  id: string;
  gymId: string;
  name: string;
  grade: BoulderGrade;
  level: BoulderLevel;
  wallId: string;
  wallName: string;
  description: string;
  tags: string[];
  status: 'active' | 'retired';
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  markers: Marker[];
  createdAt: string;
  createdBy: string;
  proposedByUserId?: string;
  proposalId?: string;
  retiredAt?: string;
  favoritesCount?: number;
}

export type BlockProgressStatus = 'untried' | 'project' | 'completed';

export interface UserBlockProgress {
  blockId: string;
  gymId?: string;
  status: BlockProgressStatus;
  favorite: boolean;
  attempts?: number;
  flash?: boolean;
  completedAt?: string;
  updatedAt?: string;
  notes?: string;
  // Snapshot metadata for preserved historical/obsolete blocks
  blockName?: string;
  grade?: BoulderGrade;
  wallName?: string;
  isObsolete?: boolean;
}

export interface UserProposal {
  id: string;
  gymId: string;
  userId: string;
  userName: string;
  userEmail: string;
  name?: string;
  grade: BoulderGrade;
  wallId: string;
  wallName: string;
  tags: string[];
  notes?: string;
  imageUrl: string;
  markers: Marker[];
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  officialBlockId?: string;
  approvedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'visitor' | 'user' | 'admin';
  avatarUrl: string;
  joinedGymIds?: string[];
  unlockedPrivateGymIds?: string[];
}

export interface LevelInfo {
  id: BoulderLevel;
  name: string;
  grades: BoulderGrade[];
  colorVar: string;
  bgVar: string;
  textVar: string;
  description: string;
}
