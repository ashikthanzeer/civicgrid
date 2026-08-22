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
  MapPinned,
} from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';

export interface NavItemDef {
  key: 'home' | 'submit' | 'dashboard' | 'analytics' | 'complaints' | 'map' | 'settings';
  path: string;
  icon: typeof Home;
  end: boolean;
}

export const navItemDefs: NavItemDef[] = [
  { key: 'home', path: '/', icon: Home, end: true },
  { key: 'submit', path: '/submit', icon: FilePlus2, end: false },
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, end: false },
  { key: 'analytics', path: '/analytics', icon: BarChart3, end: false },
  { key: 'complaints', path: '/complaints', icon: List, end: false },
  { key: 'map', path: '/map', icon: MapPinned, end: false },
  { key: 'settings', path: '/settings', icon: Settings, end: false },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const { t } = useI18n();

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
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            {t.nav.brandSubtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Primary">
        {navItemDefs.map((item) => {
          const Icon = item.icon;
          const label = t.nav[item.key];
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
              {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
