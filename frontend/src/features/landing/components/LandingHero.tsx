import type { FC } from 'react';
import { HeroEyebrow } from './HeroEyebrow';
import { HeroHeading } from './HeroHeading';
import { HeroDescription } from './HeroDescription';
import { HeroActions } from './HeroActions';

interface LandingHeroProps {
  onShopPartsClick?: () => void;
  onStaffLoginClick?: () => void;
  bgImageUrl?: string;
}

export const LandingHero: FC<LandingHeroProps> = ({
  onShopPartsClick,
  onStaffLoginClick,
  bgImageUrl = '/images/hero-clean-bg.jpg',
}) => {
  return (
    <section className="relative min-h-screen w-full flex items-center bg-[#050608] overflow-hidden select-none">
      {/* Background Motorcycle Image Layer */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-right sm:bg-[right_center] transition-opacity duration-700"
        style={{
          backgroundImage: `url('${bgImageUrl}')`,
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Vignette & Red Rim Light Gradients */}
      {/* 1. Deep gradient overlay from pure left dark to transparent over motorcycle */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, #050608 0%, rgba(5, 6, 8, 0.98) 32%, rgba(5, 6, 8, 0.82) 48%, rgba(5, 6, 8, 0.25) 70%, rgba(5, 6, 8, 0.45) 100%)',
        }}
      />

      {/* 2. Top and bottom shadow fade for cinematic depth */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050608]/90 via-[#050608]/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#050608] via-[#050608]/70 to-transparent z-10 pointer-events-none" />

      {/* 3. Subtle ambient red glow behind text (matching garage neon accent) */}
      <div
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#eb4826]/10 blur-[130px] pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Foreground Content Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20 sm:pt-36 sm:pb-24 lg:py-40">
        <div className="max-w-xl lg:max-w-2xl flex flex-col items-start">
          {/* Eyebrow */}
          <HeroEyebrow text="MOTORCYCLE SPARE PARTS" className="mb-4 sm:mb-6" />

          {/* Display Heading */}
          <HeroHeading
            line1="Everything Your"
            line2="Ride Needs."
            className="mb-6 sm:mb-8"
          />

          {/* Subtitle / Tagline */}
          <HeroDescription
            text="Quality Motorcycle Spare Parts. Reliable Performance."
            className="mb-8 sm:mb-10"
          />

          {/* CTA Buttons */}
          <HeroActions
            shopPartsLabel="Shop parts"
            staffLoginLabel="Staff login"
            onShopPartsClick={onShopPartsClick}
            onStaffLoginClick={onStaffLoginClick}
          />
        </div>
      </div>
    </section>
  );
};

