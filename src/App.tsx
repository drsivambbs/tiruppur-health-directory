/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { SearchPage } from './pages/SearchPage';
import { FacilityDetail } from './pages/FacilityDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminWards } from './pages/AdminWards';
import { AdminFacilities } from './pages/AdminFacilities';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/facility/:id" element={<FacilityDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="wards" element={<AdminWards />} />
            <Route path="facilities" element={<AdminFacilities />} />
          </Route>
        </Routes>
        
        {/* Show BottomNav only on public routes */}
        <Routes>
          <Route path="/" element={<BottomNav />} />
          <Route path="/search" element={<BottomNav />} />
          <Route path="/facility/:id" element={<BottomNav />} />
        </Routes>
      </div>
    </Router>
  );
}
