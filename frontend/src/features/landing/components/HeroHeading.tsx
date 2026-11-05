import type { FC } from 'react';

interface HeroHeadingProps {
  line1?: string;
  line2?: string;
  className?: string;
}

export const HeroHeading: FC<HeroHeadingProps> = ({
  line1 = 'Everything Your',
  line2 = 'Ride Needs.',
  className = '',
}) => {
  return (
    <h1
      className={`text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-extrabold tracking-tight leading-[1.05] select-none ${className}`}
    >
      <span className="block text-[#e6e8ec]">{line1}</span>
      <span className="block text-[#eb4826] mt-1 sm:mt-2">{line2}</span>
    </h1>
  );
};

