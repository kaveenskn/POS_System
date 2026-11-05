import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from './components/AuthCard';
import { AuthHeader } from './components/AuthHeader';
import { LoginForm } from './components/LoginForm';
import { AuthFooter } from './components/AuthFooter';
import type { LoginCredentials } from './types/auth.types';

export const LoginPage: FC = () => {
  const navigate = useNavigate();

  const handleLogin = (credentials: LoginCredentials) => {
    // In demo mode, any credentials grant access to POS dashboard
    if (credentials.username) {
      navigate('/dashboard');
    }
  };

  const handleBackToShop = () => {
    navigate('/');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050608] px-4 py-8 overflow-hidden select-none">
      {/* Background Motorcycle Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-no-repeat bg-right sm:bg-[right_center] opacity-80"
        style={{
          backgroundImage: "url('/images/hero-clean-bg.jpg')",
        }}
        aria-hidden="true"
      />

      {/* Dark Dimmer & Vignette Overlay for Login Focus */}
      <div
        className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Atmospheric Red Rim Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#eb4826]/10 blur-[150px] pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Centered Login Card */}
      <div className="relative z-20 w-full flex justify-center">
        <AuthCard>
          <AuthHeader
            title="TorqueLine Moto Parts"
            subtitle="POS management"
          />
          <LoginForm onSubmit={handleLogin} />
          <AuthFooter
            onBackToShop={handleBackToShop}
            note="Demo mode — any credentials work."
            linkLabel="Back to shop"
          />
        </AuthCard>
      </div>
    </div>
  );
};

export default LoginPage;
