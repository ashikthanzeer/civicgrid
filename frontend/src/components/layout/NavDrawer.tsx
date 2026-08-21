import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50"
      aria-hidden={!isOpen}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          transitionDuration: 'var(--transition-drawer)',
        }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel — slides from left */}
      <div
        id="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute inset-y-0 left-0 flex flex-col shadow-lg"
        style={{
          width: 'var(--drawer-width)',
          maxWidth: '85vw',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform var(--transition-drawer)`,
        }}
      >
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-muted)',
              backgroundColor: 'var(--color-surface)',
            }}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
};
