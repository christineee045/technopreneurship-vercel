import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import ItemReviewsPage from "./pages/ItemReviewsPage";
import AddListing from "./pages/AddListing";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "../../Frontend Admin/app/pages/AdminDashboard";
import UsersPage from "../../Frontend Admin/app/pages/UsersPage";
import ListingsPage from "../../Frontend Admin/app/pages/ListingsPage";
import RequestsPage from "../../Frontend Admin/app/pages/RequestsPage";
import OverduePage from "../../Frontend Admin/app/pages/OverduePage";
import DisputesPage from "../../Frontend Admin/app/pages/DisputesPage";
import AnalyticsPage from "../../Frontend Admin/app/pages/AnalyticsPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import Faq from "./pages/Faq";
import Community from "./pages/Community";
import HowItWorks from "./pages/HowItWorks";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import Support from "./pages/Support";
import ContactUs from "./pages/ContactUs";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/account",
    Component: () => (
      <RequireAuth>
        <Account />
      </RequireAuth>
    ),
  },
  {
    path: "/faq",
    Component: Faq,
  },
  {
    path: "/community",
    Component: Community,
  },
  {
    path: "/how-it-works",
    Component: HowItWorks,
  },
  {
    path: "/safety-guidelines",
    Component: SafetyGuidelines,
  },
  {
    path: "/support",
    Component: Support,
  },
  {
    path: "/contact-us",
    Component: ContactUs,
  },
  {
    path: "/terms-of-service",
    Component: TermsOfService,
  },
  {
    path: "/privacy-policy",
    Component: PrivacyPolicy,
  },
  {
    path: "/item/:id/reviews",
    Component: ItemReviewsPage,
  },
  {
    path: "/item/:id",
    Component: ItemDetail,
  },
  {
    path: "/add-listing",
    Component: () => (
      <RequireAuth>
        <AddListing />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard",
    Component: () => (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/user/:userId",
    Component: UserProfile,
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
  {
    path: "*",
    Component: NotFound,
  },
]);