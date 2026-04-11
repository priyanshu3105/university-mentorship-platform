import { Navigate, useLocation } from "react-router-dom";
import { type Role, useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  allowWithoutProfile?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  allowWithoutProfile = false,
}: ProtectedRouteProps) {
  const { session, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowWithoutProfile && profile?.profileExists === false) {
    return <Navigate to="/complete-registration" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile?.profileExists) {
      return <Navigate to="/complete-registration" replace />;
    }

    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
