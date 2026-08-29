import React from 'react';

interface BoulderLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const BoulderLogo: React.FC<BoulderLogoProps> = ({ 
  className = '', 
  size = 36,
  showText = false
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA2Y26_Vv2V6jr1AVif7FsNOT4f9nryP1NkI4MWl_4Stu7UpZWUn3kRQyM05gVP7mv4P9LUy3LiQ5K8Iq6AgHvJMm-t5BerRhzsuxZZUNuLW1Kl3pcR68yCOq2E5zR_qsFy3Xy0xYubebDEPCFSfeqb7Ktsx3ODHqfH5-3FSAkVbGKJduryoJybx4w5C289vy_7mRIb2QrKkmPpQlm4cpIPhDX4oaGvDUJSr56KiF4N71zC_8N33N2zg"
          alt="Boulder Alhama Logo"
          className="w-full h-full object-cover"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-tight text-[18px] text-[var(--text-primary)]">
            Boulder Alhama
          </span>
          <span className="text-[11px] font-medium text-[var(--text-secondary)] mt-0.5">
            Rocódromo Municipal
          </span>
        </div>
      )}
    </div>
  );
};
