import React from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';

interface TopbarProps {
  onMenuClick: () => void;
  menuOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, menuOpen = false }) => {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b px-4 lg:px-6"
      style={{
        height: 'var(--header-height)',
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-background)',
          }}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          to="/"
          className="font-display text-lg font-bold no-underline"
          style={{ color: 'var(--color-text)' }}
        >
          CivicGrid
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};
