import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Step 1: Session loading
  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-cream text-lg font-bold text-ink">Checking your session…</main>;
  
  // Step 2: Must be authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  
  // Step 3: Must be caregiver account type (defensive check — login handler enforces this)
  if (user?.account_type !== "caregiver") {
    console.warn("Non-caregiver reached ProtectedRoute — auth logic issue");
    return <Navigate to="/elderly" replace />;
  }
  
  return children;
}
