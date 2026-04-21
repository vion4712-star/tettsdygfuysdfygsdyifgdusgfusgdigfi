import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AdminDashboard from './pages/AdminDashboard';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import AdminTokenPage from './pages/AdminTokenPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useAuth } from './hooks/useAuth';
import { useState, useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function RootComponent() {
  const { isAuthenticated, profileLoading } = useAuth();
  const { data: userProfile, isLoading: userProfileLoading, isFetched } = useGetCallerUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    // Show profile setup dialog if user is authenticated but has no profile
    if (isAuthenticated && !userProfileLoading && isFetched && userProfile === null) {
      setShowProfileSetup(true);
    } else if (userProfile !== null) {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, userProfileLoading, isFetched, userProfile]);

  return (
    <>
      <Layout />
      <ProfileSetupDialog open={showProfileSetup} onOpenChange={setShowProfileSetup} />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shop',
  component: ShopPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

const paymentHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-history',
  component: () => (
    <ProtectedRoute>
      <PaymentHistoryPage />
    </ProtectedRoute>
  ),
});

const adminTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-token/$token',
  component: AdminTokenPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  shopRoute,
  adminRoute,
  paymentHistoryRoute,
  adminTokenRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
