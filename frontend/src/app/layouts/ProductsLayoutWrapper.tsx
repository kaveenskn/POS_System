import { useState } from 'react';
import { Sidebar } from '../../features/dashboard/components/Sidebar';
import { DashboardHeader } from '../../features/dashboard/components/DashboardHeader';

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
      <div className="dashboard-main min-h-screen bg-[#0d0e10]">
        <DashboardHeader title="Products & Inventory" />
        <main className="p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
