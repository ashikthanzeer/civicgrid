import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import { ThemeProvider } from './theme/ThemeProvider';
import { useTheme } from './theme/useTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTokens, darkTokens, radius } from './theme/tokens';

import { AppShell } from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient();

function AppContent() {
  const { isDark } = useTheme();
  const palette = isDark ? darkTokens : lightTokens;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: palette.primary,
          colorBgBase: palette.background,
          colorBgContainer: palette.surface,
          colorBgElevated: palette.elevated,
          colorBorder: palette.border,
          colorBorderSecondary: palette.border,
          colorTextBase: palette.text,
          colorTextSecondary: palette.muted,
          fontFamily: "'IBM Plex Sans', sans-serif",
          borderRadius: radius,
          wireframe: false,
        },
        components: {
          Table: {
            colorBgContainer: palette.surface,
            headerBg: palette.elevated,
            headerColor: palette.muted,
            borderColor: palette.border,
            rowHoverBg: palette.background,
          },
          Select: {
            colorBgContainer: palette.surface,
            colorBorder: palette.border,
            optionSelectedBg: palette.background,
          },
          Card: {
            colorBgContainer: palette.surface,
            colorBorderSecondary: palette.border,
          },
          Modal: {
            contentBg: palette.elevated,
            headerBg: palette.elevated,
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
              <Route path="/submit" element={<SubmitComplaintPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
