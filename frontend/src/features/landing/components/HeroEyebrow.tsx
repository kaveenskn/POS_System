import type { FC } from 'react';

interface HeroEyebrowProps {
  text?: string;
  className?: string;
}

export const HeroEyebrow: FC<HeroEyebrowProps> = ({
  text = 'MOTORCYCLE SPARE PARTS',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[#eb4826] text-xs sm:text-sm font-bold tracking-[0.22em] uppercase select-none">
        {text}
      </span>
    </div>
  );
};

