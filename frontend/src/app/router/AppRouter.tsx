import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { LandingPage } from '../../features/landing';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Staff & POS Foundation Dashboard */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
