import { NavLink } from 'react-router-dom';
import { Home, Search, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors",
              isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )
          }
        >
          <Home className="w-6 h-6 mb-1" />
          Home
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors",
              isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )
          }
        >
          <Search className="w-6 h-6 mb-1" />
          Search
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors",
              isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )
          }
        >
          <Settings className="w-6 h-6 mb-1" />
          Admin
        </NavLink>
      </div>
    </nav>
  );
}
