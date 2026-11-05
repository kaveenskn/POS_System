import type { FC } from 'react';
import { BrandLogo } from './BrandLogo';

interface LandingNavbarProps {
  onLoginClick?: () => void;
  onBrandClick?: () => void;
}

export const LandingNavbar: FC<LandingNavbarProps> = ({
  onLoginClick,
  onBrandClick,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 w-full px-6 py-6 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo on the left */}
        <BrandLogo onClick={onBrandClick} />

        {/* Login Button on the right */}
        <button
          type="button"
          onClick={onLoginClick}
          className="group inline-flex items-center gap-2 rounded-xl bg-[#eb4826] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 transition-all duration-200 hover:bg-[#ff5534] hover:shadow-lg hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
          aria-label="Staff and Admin Login"
        >
          {/* Arrow-in-door / Sign-in SVG icon */}
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span>Login</span>
        </button>
      </nav>
    </header>
  );
};

