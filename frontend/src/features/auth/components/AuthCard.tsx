import type { FC, ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
}

export const AuthCard: FC<AuthCardProps> = ({ children }) => {
  return (
    <div className="relative w-full max-w-[440px] rounded-3xl bg-[#181a20]/95 border border-zinc-800/80 p-8 sm:p-10 shadow-2xl shadow-black/90 backdrop-blur-xl">
      {children}
    </div>
  );
};

