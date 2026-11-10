import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../../features/dashboard/components/Sidebar';
import { DashboardHeader } from '../../features/dashboard/components/DashboardHeader';

export function AppLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products'))
      return 'Inventory & Stock Management';
    if (pathname.startsWith('/sales')) return 'Sales & Billing POS';
    if (pathname.startsWith('/expenses')) return 'Expense Management';
    if (pathname.startsWith('/reports')) return 'Reports & Financial Analytics';
    if (pathname.startsWith('/wholesale') || pathname.startsWith('/customers'))
      return 'Wholesale & B2B Distribution';
    return 'TorqueLine POS';
  };

  return (
    <div className="dashboard-shell min-h-screen bg-[#0d0e10]">
      <div
        className={`dashboard-layout ${
          sidebarExpanded ? 'sidebar-is-expanded' : 'sidebar-is-collapsed'
        }`}
      >
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((prev) => !prev)}
        />
        <div className="dashboard-main min-h-screen bg-[#0d0e10] flex flex-col">
          <DashboardHeader title={getPageTitle(location.pathname)} />
          <main className="dashboard-content flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
