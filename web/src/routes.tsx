/**
 * Routing — React Router 7, createBrowserRouter (docs/02_TRD.md §3).
 *
 * Sitemap per docs/03_App_Flow.md A1. Screens land in Phase 11; this file
 * establishes the shape so the shell renders and every route resolves.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ComponentGallery } from '@/pages/ComponentGallery';
import { Placeholder } from '@/pages/Placeholder';
import { LoginPage } from '@/pages/LoginPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <LoginPage signup /> },

  // The component gallery is a development route and is deliberately public:
  // it renders no data, only the library.
  { path: '/dev/components', element: <ComponentGallery /> },

  {
    path: '/',
    element: <RequireAuth><Shell /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Placeholder title="Dashboard" phase={12} /> },
      { path: 'run', element: <Placeholder title="Test Runner" phase={11} /> },
      { path: 'run/:id', element: <Placeholder title="Run detail" phase={11} /> },
      { path: 'security', element: <Placeholder title="Security" phase={11} /> },
      { path: 'specs', element: <Placeholder title="Specs" phase={11} /> },
      { path: 'client', element: <Placeholder title="API Client" phase={11} /> },
      { path: 'history', element: <Placeholder title="History" phase={11} /> },
      { path: 'deploy', element: <Placeholder title="Deploy" phase={13} /> },
      { path: 'tools', element: <Placeholder title="Tool Registry" phase={11} /> },
      { path: 'audit', element: <Placeholder title="Audit Log" phase={11} /> },
      { path: 'about', element: <Placeholder title="About" phase={11} /> },
    ],
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
