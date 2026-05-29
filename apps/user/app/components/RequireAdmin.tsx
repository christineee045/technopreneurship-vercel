import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/useAuth";
import { fetchCurrentUserWithToken, type User } from "../services/api";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [checkingAdminToken, setCheckingAdminToken] = useState(true);

  useEffect(() => {
    const verifyAdminToken = async () => {
      const adminToken = localStorage.getItem("adminToken");

      if (!adminToken) {
        setCheckingAdminToken(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUserWithToken(adminToken);
        if (currentUser.isAdmin) {
          setAdminUser(currentUser);
        }
      } catch {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
      } finally {
        setCheckingAdminToken(false);
      }
    };

    verifyAdminToken();
  }, []);

  if (isLoading || checkingAdminToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking admin access...</div>
      </div>
    );
  }

  const isAllowed = Boolean(user?.isAdmin || adminUser?.isAdmin);

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}