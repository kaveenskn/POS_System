import type { FC } from 'react';

interface HeroActionsProps {
  onShopPartsClick?: () => void;
  onStaffLoginClick?: () => void;
  shopPartsLabel?: string;
  staffLoginLabel?: string;
  className?: string;
}

export const HeroActions: FC<HeroActionsProps> = ({
  onShopPartsClick,
  onStaffLoginClick,
  shopPartsLabel = 'Shop parts',
  staffLoginLabel = 'Staff login',
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {/* Primary CTA: Shop parts */}
      <button
        type="button"
        onClick={onShopPartsClick}
        className="group inline-flex items-center gap-2.5 rounded-xl bg-[#eb4826] px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-red-600/35 transition-all duration-200 hover:bg-[#ff5534] hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
      >
        <span>{shopPartsLabel}</span>
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {/* Secondary CTA: Staff login */}
      <button
        type="button"
        onClick={onStaffLoginClick}
        className="inline-flex items-center justify-center rounded-xl border border-zinc-700/60 bg-[#12141a]/85 px-6 py-3.5 text-sm sm:text-base font-medium text-zinc-300 backdrop-blur-md transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/90 hover:text-white hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
      >
        <span>{staffLoginLabel}</span>
      </button>
    </div>
  );
};

