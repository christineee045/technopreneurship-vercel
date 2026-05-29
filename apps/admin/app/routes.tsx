import { createBrowserRouter } from "react-router";
import { Navigate } from "react-router";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import UsersPage from "./pages/UsersPage";
import ListingsPage from "./pages/ListingsPage";
import ReviewsPage from "./pages/ReviewsPage";
import RequestsPage from "./pages/RequestsPage";
import OverduePage from "./pages/OverduePage";
import DisputesPage from "./pages/DisputesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RequireAdmin from "./components/RequireAdmin";

export const adminRouter = createBrowserRouter([
  {
    path: "/",
    Component: () => {
      const hasToken = Boolean(localStorage.getItem("adminToken"));
      return <Navigate to={hasToken ? "/admin" : "/admin/login"} replace />;
    },
  },
  {
    path: "/admin/login",
    Component: AdminLoginPage,
  },
  {
    path: "/admin",
    Component: () => (
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/users",
    Component: () => (
      <RequireAdmin>
        <UsersPage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/listings",
    Component: () => (
      <RequireAdmin>
        <ListingsPage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/reviews",
    Component: () => (
      <RequireAdmin>
        <ReviewsPage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/requests",
    Component: () => (
      <RequireAdmin>
        <RequestsPage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/overdue",
    Component: () => (
      <RequireAdmin>
        <OverduePage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/disputes",
    Component: () => (
      <RequireAdmin>
        <DisputesPage />
      </RequireAdmin>
    ),
  },
  {
    path: "/admin/analytics",
    Component: () => (
      <RequireAdmin>
        <AnalyticsPage />
      </RequireAdmin>
    ),
  },
]);
