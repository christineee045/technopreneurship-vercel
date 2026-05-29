import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { fetchCurrentAdminWithToken } from "../services/admin-api";

// Cache so we don't re-fetch on every page navigation
let cachedAdminCheck: boolean | null = null;
let adminCheckPromise: Promise<boolean> | null = null;

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        cachedAdminCheck = false;
        setIsChecking(false);
        return;
      }

      // If we already have a cached result, use it
      if (cachedAdminCheck !== null) {
        setIsAllowed(cachedAdminCheck);
        setIsChecking(false);
        return;
      }

      // Deduplicate concurrent checks
      if (adminCheckPromise) {
        const isAdmin = await adminCheckPromise;
        setIsAllowed(isAdmin);
        setIsChecking(false);
        return;
      }

      adminCheckPromise = fetchCurrentAdminWithToken(token)
        .then((currentAdmin) => {
          cachedAdminCheck = currentAdmin.isAdmin;
          return currentAdmin.isAdmin;
        })
        .catch(() => {
          cachedAdminCheck = false;
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");
          return false;
        })
        .finally(() => {
          adminCheckPromise = null;
          setIsChecking(false);
        });

      const isAdmin = await adminCheckPromise;
      setIsAllowed(isAdmin);
    };

    verifyAdmin();
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking admin access...</div>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}