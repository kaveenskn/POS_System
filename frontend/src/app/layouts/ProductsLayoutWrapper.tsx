import type { ReactNode } from 'react';

export function ProductsLayoutWrapper({
  children,
}: {
  children: ReactNode;
  title?: string;
}) {
  return <>{children}</>;
}
