import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FilePlus2,
  LayoutDashboard,
  BarChart3,
  List,
  Settings,
  Grid3X3,
} from 'lucide-react';

export const navItems = [
  { name: 'Home', path: '/', icon: Home, end: true },
  { name: 'Report an Issue', path: '/submit', icon: FilePlus2, end: false },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: false },
  { name: 'Analytics', path: '/analytics', icon: BarChart3, end: false },
  { name: 'Complaints', path: '/complaints', icon: List, end: false },
  { name: 'Settings', path: '/settings', icon: Settings, end: false },
] as const;

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  return (
    <aside className={`flex h-full w-full flex-col ${className}`} style={{ backgroundColor: 'var(--color-surface)' }}>
      <div
        className="flex items-center gap-3 border-b px-5 py-4"
        style={{ borderColor: 'var(--color-border)', minHeight: 'var(--header-height)' }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Grid3X3 className="h-4 w-4" style={{ color: 'var(--color-primary-fg)' }} aria-hidden />
        </div>
        <div>
          <span className="font-display text-base font-bold" style={{ color: 'var(--color-text)' }}>CivicGrid</span>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Civic Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'nav-link-active' : 'nav-link'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                  : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              })}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
