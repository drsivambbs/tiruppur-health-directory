import { NavLink } from 'react-router-dom';
import { Home, Search, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const tabs = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/search', icon: Search, label: 'Search', end: false },
  { to: '/admin', icon: Settings, label: 'Admin', end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] z-50">
      <div className="flex justify-around items-center h-16 pb-safe">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="relative flex flex-col items-center justify-center w-full h-full"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-3 inset-y-1.5 bg-blue-600 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                )}
                <Icon
                  className={cn('w-5 h-5 mb-1', isActive ? 'text-white' : 'text-gray-400')}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-white' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
