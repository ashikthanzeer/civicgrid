import React, { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { NavDrawer } from './NavDrawer';

export const AppShell: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((open) => !open);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      <Topbar onMenuClick={toggleDrawer} menuOpen={drawerOpen} />
      <NavDrawer isOpen={drawerOpen} onClose={closeDrawer} />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
