import { Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';

export function AdminLayout() {
  const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const isRoot = location.pathname === '/admin';
  const pageTitle = location.pathname.includes('wards')
    ? 'Manage Wards'
    : location.pathname.includes('facilities')
    ? 'Manage Facilities'
    : 'Admin Dashboard';

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            {!isRoot && (
              <Link
                to="/admin"
                className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <h1 className="text-base font-bold text-gray-900 flex-1 truncate">{pageTitle}</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
