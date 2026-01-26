import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutShell } from "@/components/layout-shell";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Client Pages
import ClientHome from "@/pages/client/client-home";
import ClientProfile from "@/pages/client/client-profile";
import ClientAppointments from "@/pages/client/client-appointments";

// Admin Pages
import AdminHome from "@/pages/admin/admin-home";
import AdminAvailability from "@/pages/admin/admin-availability";
import AdminAppointmentDetails from "@/pages/admin/admin-appointment-details";
import AdminAppointments from "@/pages/admin/admin-appointments";
import AdminClients from "@/pages/admin/admin-clients";
import AdminClientDetails from "@/pages/admin/admin-client-details";

// Protected Route Wrapper
function ProtectedRoute({
  component: Component,
  role,
}: {
  component: React.ComponentType;
  role?: "admin" | "client";
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (role && user.role !== role) {
    return (
      <Redirect to={user.role === "admin" ? "/admin/home" : "/client/home"} />
    );
  }

  return (
    <LayoutShell>
      <Component />
    </LayoutShell>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Client Routes */}
      <Route path="/client/home">
        <ProtectedRoute component={ClientHome} role="client" />
      </Route>
      <Route path="/client/profile">
        <ProtectedRoute component={ClientProfile} role="client" />
      </Route>
      <Route path="/client/appointments">
        <ProtectedRoute component={ClientAppointments} role="client" />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/home">
        <ProtectedRoute component={AdminHome} role="admin" />
      </Route>
      <Route path="/admin/availability">
        <ProtectedRoute component={AdminAvailability} role="admin" />
      </Route>
      <Route path="/admin/appointments/:id">
        <ProtectedRoute component={AdminAppointmentDetails} role="admin" />
      </Route>
      <Route path="/admin/appointments">
        <ProtectedRoute component={AdminAppointments} role="admin" />
      </Route>
      <Route path="/admin/clients/:id">
        <ProtectedRoute component={AdminClientDetails} role="admin" />
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute component={AdminClients} role="admin" />
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
