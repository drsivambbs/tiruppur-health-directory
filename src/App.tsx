/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ToastProvider } from './context/ToastContext';
import { PublicLayout } from './components/PublicLayout';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { SearchPage } from './pages/SearchPage';
import { FacilityDetail } from './pages/FacilityDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminWards } from './pages/AdminWards';
import { AdminFacilities } from './pages/AdminFacilities';

function AnimatedRoutes() {
  const location = useLocation();
  // Use location.pathname as key on a div wrapper to trigger AnimatePresence transitions
  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          {/* Public Routes with BottomNav */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/facility/:id" element={<FacilityDetail />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="wards" element={<AdminWards />} />
            <Route path="facilities" element={<AdminFacilities />} />
          </Route>
        </Routes>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ToastProvider>
  );
}
