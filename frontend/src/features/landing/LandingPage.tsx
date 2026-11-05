import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './components/LandingHero';

export const LandingPage: FC = () => {
  const navigate = useNavigate();

  const handleNavigateToStaff = () => {
    navigate('/dashboard');
  };

  const handleShopParts = () => {
    // Navigate to shop catalog or parts collection
    navigate('/dashboard');
  };

  const handleBrandClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050608] text-white selection:bg-[#eb4826] selection:text-white">
      {/* Top Navigation */}
      <LandingNavbar
        onLoginClick={handleNavigateToStaff}
        onBrandClick={handleBrandClick}
      />

      {/* Hero Section */}
      <LandingHero
        onShopPartsClick={handleShopParts}
        onStaffLoginClick={handleNavigateToStaff}
        bgImageUrl="/images/hero-clean-bg.jpg"
      />
    </div>
  );
};

export default LandingPage;

