import type { FC } from 'react';

interface AuthFooterProps {
  onBackToShop: () => void;
  note?: string;
  linkLabel?: string;
}

export const AuthFooter: FC<AuthFooterProps> = ({
  onBackToShop,
  note = 'Demo mode — any credentials work.',
  linkLabel = 'Back to shop',
}) => {
  return (
    <div className="mt-6 text-center text-xs sm:text-sm text-zinc-400">
      <span>{note} </span>
      <button
        type="button"
        onClick={onBackToShop}
        className="text-[#eb4826] hover:text-[#ff5c3b] font-medium transition-colors hover:underline underline-offset-2 ml-1"
      >
        {linkLabel}
      </button>
    </div>
  );
};
