import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazy, Suspense, Component, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Feed = lazy(() => import("./pages/Feed"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const HashtagPage = lazy(() => import("./pages/HashtagPage"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Error boundary for lazy-loaded components
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground">Failed to load this page. Please try refreshing.</p>
            {this.state.error && (
              <details className="text-left text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <Skeleton className="h-12 w-48 mx-auto" />
      <Skeleton className="h-8 w-64 mx-auto" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/verify" element={<EmailVerification />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/feed" 
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/search" 
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/friends" 
                element={
                  <ProtectedRoute>
                    <FriendsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups" 
                element={
                  <ProtectedRoute>
                    <GroupsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/events" 
                element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/:userId" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bookmarks" 
                element={
                  <ProtectedRoute>
                    <BookmarksPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/explore" 
                element={
                  <ProtectedRoute>
                    <ExplorePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/verification" 
                element={
                  <ProtectedRoute>
                    <VerificationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hashtag/:tag" 
                element={
                  <ProtectedRoute>
                    <HashtagPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-setup" 
                element={
                  <ProtectedRoute>
                    <AdminSetup />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
