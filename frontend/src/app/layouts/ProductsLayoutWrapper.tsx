import { useState } from 'react';
import { Sidebar } from '../../features/dashboard/components/Sidebar';

export function ProductsLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div
      className={`dashboard-layout ${
        sidebarExpanded ? 'sidebar-is-expanded' : 'sidebar-is-collapsed'
      }`}
    >
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((prev) => !prev)}
      />
      <div className="dashboard-main p-6 sm:p-10 w-full min-h-screen bg-[#050608]">
        {children}
      </div>
    </div>
  );
}
