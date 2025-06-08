import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getUserRole,
  getWalletAddress,
  clearAuth,
  ROLES,
} from "../lib/auth-client";
import { Card, CardContent } from "./ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authorization on component mount and when router or allowedRoles change
    const verifyUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get wallet address and role from local storage
        const walletAddress = getWalletAddress();
        let userRole = getUserRole();

        // If no wallet address or role, user is not authenticated
        if (!walletAddress || !userRole) {
          setAuthorized(false);
          router.push("/login");
          return;
        }

        // Special case: hardcoded admin address
        const adminAddress =
          "0x88Fd1ecd3Fd9A408deD64c6eE69764f7f997aB48".toLowerCase();
        if (walletAddress && walletAddress.toLowerCase() === adminAddress) {
          console.log("Admin address detected in ProtectedRoute");
          if (allowedRoles.includes("admin")) {
            setAuthorized(true);
            setIsLoading(false);
            return;
          }
        }

        // Note: In a clean architecture, role verification should be handled
        // by the AuthContext or via API calls, not direct database access from components
        // For now, we'll rely on localStorage and let the AuthContext handle database sync

        // Check if user has one of the allowed roles
        if (allowedRoles.includes(userRole)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          setError(
            `Access denied. You need ${allowedRoles.join(" or ")} role.`
          );

          // Redirect based on role
          switch (userRole) {
            case ROLES.ADMIN:
              router.push("/admin");
              break;
            case ROLES.ISSUER:
              router.push("/issuer");
              break;
            case ROLES.HOLDER:
              router.push("/holder");
              break;
            default:
              router.push("/login");
          }
        }
      } catch (error) {
        console.error("Authorization error:", error);
        setError("Error verifying access. Please try again.");
        setAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();

    // Listen for route changes and reverify on each change
    const handleRouteChange = () => {
      setAuthorized(false);
      setIsLoading(true);
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Verifying Access...</h2>
            <p className="mt-2 text-gray-500">
              Please wait while we check your credentials.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="mb-4 flex justify-center">
              <ShieldAlert className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-center text-2xl font-bold text-red-600">
              Access Denied
            </h2>
            <p className="mt-4 text-center text-gray-700">
              {error || "You do not have permission to view this page."}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
