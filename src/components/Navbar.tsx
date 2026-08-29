import React, { useState, useRef, useEffect } from 'react';
import { Gym, UserProfile } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { 
  Plus, 
  ShieldCheck, 
  LogOut, 
  ChevronDown, 
  TrendingUp, 
  Building2, 
  MapPin,
  Lock,
  Unlock,
  Layers
} from 'lucide-react';
import { signInWithGoogle, logOut, isSuperAdminEmail, isUserGymSetter } from '../lib/firebase';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser: UserProfile | null;
  activeGym: Gym | null;
  gyms: Gym[];
  onSelectGym: (gym: Gym) => void;
  onOpenProposeModal: () => void;
  onOpenGymsDirectory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  activeGym,
  gyms,
  onSelectGym,
  onOpenProposeModal,
  onOpenGymsDirectory,
}) => {
  const isLoggedIn = !!currentUser;
  const isSuperAdmin = isSuperAdminEmail(currentUser?.email);
  const isGymSetter = isUserGymSetter(activeGym, currentUser?.email);
  const canAccessAdmin = isSuperAdmin || isGymSetter;

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [gymDropdownOpen, setGymDropdownOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const gymDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (gymDropdownRef.current && !gymDropdownRef.current.contains(event.target as Node)) {
        setGymDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        alert('Error al iniciar sesión con Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setProfileDropdownOpen(false);
      await logOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="hidden md:flex sticky top-0 z-40 w-full bg-white dark:bg-[#20211F] border-b border-[#DDDAD3] dark:border-[#383A36] transition-colors">
      <div className="max-w-7xl mx-auto w-full px-10 h-20 flex items-center justify-between gap-6">
        {/* Brand & Gym Switcher */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onOpenGymsDirectory()}
            className="flex items-center gap-2.5 active:opacity-85 transition-opacity cursor-pointer flex-shrink-0"
          >
            <div className="w-10 h-10 bg-[#E8C96A] text-[#292927] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs font-black text-xl">
              C
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-xl tracking-tight uppercase text-[#292927] dark:text-[#F2F0EA]">
                ClimbU
              </span>
            </div>
          </button>

          {/* Active Gym Selector Dropdown */}
          <div className="relative" ref={gymDropdownRef}>
            <button
              onClick={() => setGymDropdownOpen(!gymDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] hover:border-[#E8C96A] transition-all cursor-pointer text-left max-w-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-[#E8C96A]/20 text-[#292927] dark:text-[#E8C96A] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-black text-[#292927] dark:text-[#F2F0EA] truncate">
                  {activeGym ? activeGym.name : 'Seleccionar Rocódromo'}
                </span>
                <span className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] truncate flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {activeGym?.city || 'Explorar'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#73716C] dark:text-[#AAA8A1] ml-1 flex-shrink-0" />
            </button>

            {/* Gym Selector Menu */}
            {gymDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] shadow-xl p-2 z-50 animate-in fade-in duration-150 space-y-1">
                <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#73716C] dark:text-[#AAA8A1]">
                  Cambiar de Rocódromo
                </div>
                
                {gyms.map((gym) => {
                  const isSelected = activeGym?.id === gym.id;
                  return (
                    <button
                      key={gym.id}
                      onClick={() => {
                        onSelectGym(gym);
                        setGymDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E8C96A]/15 border border-[#E8C96A]/60'
                          : 'hover:bg-[#EFEDE7] dark:hover:bg-[#292A27]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-xl bg-[#292A27] overflow-hidden flex-shrink-0">
                          <img src={gym.imageUrl} alt={gym.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#292927] dark:text-[#F2F0EA] truncate">
                            {gym.name}
                          </p>
                          <p className="text-[10px] text-[#73716C] dark:text-[#AAA8A1] truncate">
                            {gym.city}
                          </p>
                        </div>
                      </div>

                      {gym.type === 'private' ? (
                        <Lock className="w-3 h-3 text-amber-500 flex-shrink-0 ml-2" />
                      ) : (
                        <Unlock className="w-3 h-3 text-emerald-500 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}

                <div className="border-t border-[#DDDAD3] dark:border-[#383A36] pt-1 mt-1">
                  <button
                    onClick={() => {
                      setGymDropdownOpen(false);
                      onOpenGymsDirectory();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-extrabold text-[#292927] dark:text-[#F2F0EA] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#E8C96A]" />
                    <span>Ver todos los Rocódromos</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 font-medium text-sm">
          <button
            onClick={() => onNavigate('gyms')}
            className={`transition-colors pb-1 flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'gyms'
                ? 'text-[#292927] dark:text-[#F2F0EA] border-b-2 border-[#E8C96A] font-bold'
                : 'text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#E8C96A]" />
            <span>Rocódromos</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors pb-1 cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#292927] dark:text-[#F2F0EA] border-b-2 border-[#E8C96A] font-bold'
                : 'text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            {activeGym ? activeGym.name : 'Inicio'}
          </button>

          <button
            onClick={() => onNavigate('blocks')}
            className={`transition-colors pb-1 cursor-pointer ${
              currentTab === 'blocks'
                ? 'text-[#292927] dark:text-[#F2F0EA] border-b-2 border-[#E8C96A] font-bold'
                : 'text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            Bloques
          </button>

          <button
            onClick={() => onNavigate('walls')}
            className={`transition-colors pb-1 cursor-pointer ${
              currentTab === 'walls'
                ? 'text-[#292927] dark:text-[#F2F0EA] border-b-2 border-[#E8C96A] font-bold'
                : 'text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
            }`}
          >
            Sectores
          </button>

          {isLoggedIn && (
            <button
              onClick={() => onNavigate('progress')}
              className={`transition-colors pb-1 cursor-pointer ${
                currentTab === 'progress'
                  ? 'text-[#292927] dark:text-[#F2F0EA] border-b-2 border-[#E8C96A] font-bold'
                  : 'text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
              }`}
            >
              Mi Progreso
            </button>
          )}

          {canAccessAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`transition-colors pb-1 flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'admin'
                  ? 'text-[#292927] dark:text-[#F2F0EA] border-b-2 border-[#E8C96A] font-bold'
                  : 'text-[#73716C] hover:text-[#292927] dark:hover:text-[#F2F0EA]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#E8C96A]" />
              <span>{isSuperAdmin ? 'Super Admin' : 'Equipador'}</span>
            </button>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3.5">
          {isLoggedIn && (
            <button
              onClick={onOpenProposeModal}
              className="bg-[#E8C96A] text-[#292927] px-4 py-2 rounded-2xl text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Proponer bloque</span>
            </button>
          )}

          <ThemeToggle compact={true} />

          {isLoggedIn && currentUser ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-[#EFEDE7] dark:bg-[#292A27] border border-[#DDDAD3] dark:border-[#383A36] hover:border-[#E8C96A] transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover border border-[#DDDAD3] dark:border-[#383A36]"
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold text-[#292927] dark:text-[#F2F0EA] leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-extrabold text-[#73716C] dark:text-[#AAA8A1] uppercase tracking-wider">
                    {isSuperAdmin ? 'Super Admin' : isGymSetter ? 'Equipador' : 'Escalador'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#73716C] dark:text-[#AAA8A1]" />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white dark:bg-[#20211F] border border-[#DDDAD3] dark:border-[#383A36] shadow-xl p-3 z-50 animate-in fade-in duration-150 space-y-2">
                  <div className="px-3 py-2.5 rounded-2xl bg-[#EFEDE7]/80 dark:bg-[#292A27]/80 border border-[#DDDAD3] dark:border-[#383A36]">
                    <p className="text-xs font-extrabold text-[#292927] dark:text-[#F2F0EA] truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-[#73716C] dark:text-[#AAA8A1] truncate mt-0.5">
                      {currentUser.email}
                    </p>
                    <div className="mt-1.5">
                      {isSuperAdmin ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FCF4D7] text-[#574500] border border-[#E8C96A]">
                          SUPER ADMINISTRADOR (CLIMBU)
                        </span>
                      ) : isGymSetter ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FCF4D7] text-[#574500] border border-[#E8C96A]">
                          EQUIPADOR AUTORIZADO
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white dark:bg-[#20211F] text-[#5C5B56] dark:text-[#AAA8A1] border border-[#DDDAD3] dark:border-[#383A36]">
                          ESCALADOR
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigate('progress');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#292927] dark:text-[#F2F0EA] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Mi Progreso</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenGymsDirectory();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#292927] dark:text-[#F2F0EA] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#E8C96A]" />
                      <span>Directorio de Rocódromos</span>
                    </button>

                    {canAccessAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#292927] dark:text-[#F2F0EA] hover:bg-[#EFEDE7] dark:hover:bg-[#292A27] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E8C96A]" />
                        <span>Panel {isSuperAdmin ? 'Super Admin' : 'Equipador'}</span>
                      </button>
                    )}

                    <div className="border-t border-[#DDDAD3] dark:border-[#383A36] pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="px-4 py-2 rounded-2xl bg-[#EFEDE7] hover:bg-[#DDDAD3] dark:bg-[#292A27] dark:hover:bg-[#383A36] text-xs font-bold text-[#292927] dark:text-[#F2F0EA] border border-[#DDDAD3] dark:border-[#383A36] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'Iniciando...' : 'Iniciar sesión'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
