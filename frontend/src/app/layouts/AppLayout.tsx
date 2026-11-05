import type { PropsWithChildren } from 'react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="app-brand">POS System</span>
          <span className="app-status px-3 py-1">Foundation</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
