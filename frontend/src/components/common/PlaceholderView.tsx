import type { FC } from 'react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  iconName?: string;
}

export const PlaceholderView: FC<PlaceholderViewProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 rounded-2xl bg-[#14161d] border border-zinc-800">
      <div className="w-16 h-16 rounded-2xl bg-[#eb4826]/10 text-[#eb4826] border border-[#eb4826]/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 max-w-md">{description}</p>
    </div>
  );
};

