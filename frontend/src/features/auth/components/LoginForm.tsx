import { type FC, type FormEvent, useState } from 'react';
import type { LoginCredentials } from '../types/auth.types';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading?: boolean;
}

export const LoginForm: FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('••••••••');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Username Field */}
      <div>
        <label
          htmlFor="username"
          className="block text-zinc-300 text-xs sm:text-sm font-medium mb-2"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full rounded-xl bg-[#13151b] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#eb4826] focus:bg-[#151821] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
          placeholder="Enter username"
        />
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-zinc-300 text-xs sm:text-sm font-medium mb-2"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-xl bg-[#13151b] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 tracking-widest transition-colors focus:border-[#eb4826] focus:bg-[#151821] focus:outline-none focus:ring-1 focus:ring-[#eb4826]"
          placeholder="••••••••"
        />
      </div>

      {/* Enter POS Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-[#eb4826] py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-red-600/35 transition-all duration-200 hover:bg-[#ff5534] hover:shadow-red-600/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181a20]"
      >
        {isLoading ? 'Entering...' : 'Enter POS'}
      </button>
    </form>
  );
};

