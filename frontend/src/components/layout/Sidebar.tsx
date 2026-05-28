import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard, Sprout, CloudSun, TrendingUp, Bug, Droplets,
  Wallet, Users, X, Leaf,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farms', icon: Sprout, label: 'My Farms' },
  { to: '/weather', icon: CloudSun, label: 'Weather' },
  { to: '/market', icon: TrendingUp, label: 'Market Prices' },
  { to: '/pest', icon: Bug, label: 'Pest & Disease' },
  { to: '/resources', icon: Droplets, label: 'Resources' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/community', icon: Users, label: 'Community' },
];

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-600 rounded-lg">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">AgricSec</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100 text-gray-500">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: version */}
      <div className="px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">AgricSec v1.0</p>
      </div>
    </aside>
  );
}
