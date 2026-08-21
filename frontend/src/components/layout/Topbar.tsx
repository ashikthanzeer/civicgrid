import React from 'react';
import { Menu, X, Grid3X3, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';

interface TopbarProps {
  onMenuClick: () => void;
  menuOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, menuOpen = false }) => {
  const location = useLocation();
  const isSubmitPage = location.pathname === '/submit';

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b px-3 sm:px-6"
      style={{
        height: 'var(--header-height)',
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-all active:scale-95 focus:outline-none"
          style={{
            borderColor: menuOpen ? 'var(--color-primary)' : 'var(--color-border)',
            color: menuOpen ? 'var(--color-primary)' : 'var(--color-text)',
            backgroundColor: menuOpen
              ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
              : 'var(--color-background)',
          }}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-drawer"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Brand logo & title */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-base sm:text-lg font-bold no-underline transition-opacity hover:opacity-90"
          style={{ color: 'var(--color-text)' }}
        >
          <div
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Grid3X3 className="h-4 w-4" style={{ color: 'var(--color-primary-fg)' }} aria-hidden />
          </div>
          <span className="font-display font-bold">CivicGrid</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick report button on mobile/desktop when not on submit page */}
        {!isSubmitPage && (
          <Link
            to="/submit"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
            }}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Report Issue
          </Link>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
