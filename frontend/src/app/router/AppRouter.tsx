import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { LandingPage } from '../../features/landing';
import { LoginPage } from '../../features/auth';
import { ProductsPage } from '../../features/products';
import { SalesPage } from '../../features/sales';
import { ExpensesPage } from '../../features/expenses';
import { EmployeesPage } from '../../features/employees';
import { ReportsPage } from '../../features/reports';
import { PlaceholderView } from '../../components/common/PlaceholderView';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Staff / Admin Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Unified Dashboard Layout for all internal tabs */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route
            path="/customers"
            element={
              <PlaceholderView
                title="Customer Directory"
                description="Manage customer accounts, purchase history, and contact details."
              />
            }
          />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
