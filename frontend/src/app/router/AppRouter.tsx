import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { ProductsLayoutWrapper } from '../layouts/ProductsLayoutWrapper';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { LandingPage } from '../../features/landing';
import { LoginPage } from '../../features/auth';
import { ProductsPage } from '../../features/products';
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

        {/* Staff & POS Foundation Dashboard */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />

        {/* Products */}
        <Route
          path="/products"
          element={
            <AppLayout>
              <ProductsLayoutWrapper>
                <ProductsPage />
              </ProductsLayoutWrapper>
            </AppLayout>
          }
        />

        {/* Inventory (links to products & stock management) */}
        <Route
          path="/inventory"
          element={
            <AppLayout>
              <ProductsLayoutWrapper>
                <ProductsPage />
              </ProductsLayoutWrapper>
            </AppLayout>
          }
        />

        {/* Sales & Billing */}
        <Route
          path="/sales"
          element={
            <AppLayout>
              <ProductsLayoutWrapper>
                <PlaceholderView
                  title="Sales & Billing"
                  description="Point of Sale billing register, cart checkout, and invoices module."
                />
              </ProductsLayoutWrapper>
            </AppLayout>
          }
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={
            <AppLayout>
              <ProductsLayoutWrapper>
                <PlaceholderView
                  title="Customer Directory"
                  description="Manage customer accounts, purchase history, and contact details."
                />
              </ProductsLayoutWrapper>
            </AppLayout>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <AppLayout>
              <ProductsLayoutWrapper>
                <ReportsPage />
              </ProductsLayoutWrapper>
            </AppLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
