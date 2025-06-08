import "../styles/globals.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  getWalletAddress,
  getUserRole,
  getUserId,
  ROLES,
} from "../lib/auth-client";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "../contexts/AuthContext";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on initial load and route changes
    const checkAuth = () => {
      const walletAddress = getWalletAddress();
      const userRole = getUserRole();
      const userId = getUserId();

      // Public routes that don't require authentication
      const publicRoutes = [
        "/login",
        "/verify",
        "/",
        "/fix-database",
        "/debug-supabase",
      ];
      const currentPath = router.pathname;

      // If on a public route, no need for authentication
      if (publicRoutes.includes(currentPath)) {
        setIsLoading(false);
        return;
      }

      // Hardcoded admin address check - keeping this for existing admin access
      const adminAddress =
        "0x241dBc6d5f283964536A94e33E2323B7580CE45A".toLowerCase();
      if (walletAddress && walletAddress.toLowerCase() === adminAddress) {
        console.log("Admin address detected in _app.js");
        // Allow access to admin routes
        if (currentPath.startsWith("/admin")) {
          setIsLoading(false);
          return;
        }
      }

      // Route-specific role requirements
      const roleRoutes = {
        "/admin": [ROLES.ADMIN],
        "/issuer": [ROLES.ISSUER],
        "/holder": [ROLES.HOLDER],
      };

      // Check if current path requires specific role
      for (const [route, roles] of Object.entries(roleRoutes)) {
        if (currentPath.startsWith(route)) {
          // If user has both a role and an ID, allow access
          if (walletAddress && userRole && userId && roles.includes(userRole)) {
            setIsLoading(false);
            return;
          }

          // Otherwise redirect to login
          console.log("Authentication failed, redirecting to login", {
            walletAddress,
            userRole,
            userId,
            requiredRoles: roles,
          });
          router.push("/login");
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();

    // Listen for route changes
    router.events.on("routeChangeComplete", checkAuth);

    // Listen for MetaMask account changes
    const handleAccountsChanged = () => {
      checkAuth();
    };

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      router.events.off("routeChangeComplete", checkAuth);
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return <AuthProvider>{getLayout(<Component {...pageProps} />)}</AuthProvider>;
}

export default MyApp;
