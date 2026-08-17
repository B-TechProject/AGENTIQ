/**
 * Routing — React Router 7, createBrowserRouter (docs/02_TRD.md §3).
 * Sitemap per docs/03_App_Flow.md A1.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ComponentGallery } from '@/pages/ComponentGallery';
import { Placeholder } from '@/pages/Placeholder';
import { LoginPage } from '@/pages/LoginPage';
import { TestRunnerPage } from '@/pages/TestRunnerPage';
import { RunDetailPage } from '@/pages/RunDetailPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SpecsPage } from '@/pages/SpecsPage';
import { ToolRegistryPage } from '@/pages/ToolRegistryPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { AboutPage } from '@/pages/AboutPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <LoginPage signup /> },

  // Development route: renders the component library, no data.
  { path: '/dev/components', element: <ComponentGallery /> },

  {
    path: '/',
    element: <RequireAuth><Shell /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Placeholder title="Dashboard" phase={12} /> },
      { path: 'run', element: <TestRunnerPage /> },
      { path: 'run/:id', element: <RunDetailPage /> },
      { path: 'security', element: <Placeholder title="Security" phase={11} /> },
      { path: 'specs', element: <SpecsPage /> },
      { path: 'client', element: <Placeholder title="API Client" phase={11} /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'deploy', element: <Placeholder title="Deploy" phase={13} /> },
      { path: 'tools', element: <ToolRegistryPage /> },
      { path: 'audit', element: <AuditLogPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
