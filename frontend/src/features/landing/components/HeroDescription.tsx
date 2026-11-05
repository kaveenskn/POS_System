import type { FC } from 'react';

interface HeroDescriptionProps {
  text?: string;
  className?: string;
}

export const HeroDescription: FC<HeroDescriptionProps> = ({
  text = 'Quality Motorcycle Spare Parts. Reliable Performance.',
  className = '',
}) => {
  return (
    <p
      className={`text-zinc-400 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-xl ${className}`}
    >
      {text}
    </p>
  );
};

