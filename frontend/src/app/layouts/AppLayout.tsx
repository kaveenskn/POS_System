import type { PropsWithChildren } from 'react';

export function AppLayout({ children }: PropsWithChildren) {
  return <div className="dashboard-shell">{children}</div>;
}
