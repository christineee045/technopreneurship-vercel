import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { adminRouter } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <>
      <RouterProvider router={adminRouter} />
      <Toaster />
    </>
  );
}
