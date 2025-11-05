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
const ThreadView = lazy(() => import("./pages/ThreadView"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CreatorPage = lazy(() => import("./pages/creator/CreatorPage").then(m => ({ default: m.CreatorPage })));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const HashtagPage = lazy(() => import("./pages/HashtagPage"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const PagesDirectory = lazy(() => import("./pages/PagesDirectory"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <Skeleton className="h-12 w-48 mx-auto" />
      <Skeleton className="h-8 w-64 mx-auto" />
    </div>
  </div>
);

const queryClient = new QueryClient();

// Error Boundary Component
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
    console.error('[APP_ERROR] Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-destructive">
              Something Went Wrong [APP_001]
            </h1>
            <p className="text-muted-foreground">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-muted p-4 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
                path="/post/:postId" 
                element={
                  <ProtectedRoute>
                    <ThreadView />
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
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/premium" 
                element={
                  <ProtectedRoute>
                    <PremiumPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pages" 
                element={
                  <ProtectedRoute>
                    <PagesDirectory />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
