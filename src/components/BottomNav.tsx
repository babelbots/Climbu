import React from 'react';
import { Home, Layers, Plus, TrendingUp, Building2, ShieldCheck } from 'lucide-react';
import { UserProfile, Gym } from '../types';
import { isSuperAdminEmail, isUserGymSetter } from '../lib/firebase';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser: UserProfile | null;
  activeGym: Gym | null;
  onOpenProposeModal: () => void;
  onOpenGymsDirectory: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  activeGym,
  onOpenProposeModal,
  onOpenGymsDirectory,
}) => {
  const isLoggedIn = !!currentUser;
  const isSuperAdmin = isSuperAdminEmail(currentUser?.email);
  const isGymSetter = isUserGymSetter(activeGym, currentUser?.email);
  const canAccessAdmin = isSuperAdmin || isGymSetter;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#20211F] border-t border-[#DDDAD3] dark:border-[#383A36] pb-safe transition-colors">
      <div className="h-20 flex items-center justify-around px-2">
        {/* Rocódromos / Gyms Directory */}
        <button
          onClick={() => onOpenGymsDirectory()}
          className={`flex flex-col items-center justify-center gap-1 w-14 py-1 transition-all ${
            currentTab === 'gyms'
              ? 'text-[#E8C96A]'
              : 'text-[#73716C]'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tight">Rocódromos</span>
        </button>

        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-1 w-12 py-1 transition-all ${
            currentTab === 'home'
              ? 'text-[#E8C96A]'
              : 'text-[#73716C]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tight">Inicio</span>
        </button>

        {/* Central Action: Proponer Bloque */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => {
              if (!isLoggedIn) {
                alert('Debes iniciar sesión con Google para proponer un bloque.');
              } else {
                onOpenProposeModal();
              }
            }}
            className="w-14 h-14 bg-[#E8C96A] text-[#1C1D1A] rounded-full flex items-center justify-center shadow-lg border-4 border-[#F7F6F2] dark:border-[#141514] active:scale-95 transition-transform"
            title="Proponer nuevo bloque"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Blocks */}
        <button
          onClick={() => onNavigate('blocks')}
          className={`flex flex-col items-center justify-center gap-1 w-12 py-1 transition-all ${
            currentTab === 'blocks'
              ? 'text-[#E8C96A]'
              : 'text-[#73716C]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-tight">Bloques</span>
        </button>

        {/* Progress / Admin */}
        {canAccessAdmin ? (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center gap-1 w-12 py-1 transition-all ${
              currentTab === 'admin'
                ? 'text-[#E8C96A]'
                : 'text-[#73716C]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tight">{isSuperAdmin ? 'Admin' : 'Equipar'}</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('progress')}
            className={`flex flex-col items-center justify-center gap-1 w-12 py-1 transition-all ${
              currentTab === 'progress'
                ? 'text-[#E8C96A]'
                : 'text-[#73716C]'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Progreso</span>
          </button>
        )}
      </div>
    </nav>
  );
};
