import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import "./index.css";
import App from "./App";
import Dashboard from "./Dashboard";
import SearchPage from "./SearchPage";
import ModPage from "./ModPage";
import NotFoundPage from "./NotFoundPage";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// --- IMPORTANT: Replace with your Clerk Publishable Key ---
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "YOUR_CLERK_PUBLISHABLE_KEY";

if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === "YOUR_CLERK_PUBLISHABLE_KEY") {
  console.warn(
    "Clerk Publishable Key is not set or is using the placeholder. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file."
  );
}

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/mod", element: <ModPage /> },
  { path: "/404", element: <NotFoundPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

// Component to bridge Clerk auth with Convex client
function ConvexAppWithClerk() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      convex.setAuth(async () => {
        const token = await getToken({ template: "convex" });
        return token;
      });
    } else {
      // If not signed in, clear any existing auth state from the Convex client
      convex.clearAuth();
    }
  }, [isSignedIn, getToken]);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexProvider client={convex}>
        {/* ConvexAppWithClerk now handles passing the router and setting auth */}
        <ConvexAppWithClerk />
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>
);
