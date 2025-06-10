import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent } from "./ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Don't check authorization while loading
    if (loading) return;

    // If no user after loading is complete, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has one of the allowed roles
    if (allowedRoles.includes(user.role)) {
      setAuthorized(true);
    } else {
      setAuthorized(false);

      // Redirect based on user's actual role
      switch (user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "issuer":
        case "holder":
          router.push("/dashboard");
          break;
        default:
          router.push("/login");
      }
    }
  }, [user, loading, router, allowedRoles]);

  // Show loading while AuthContext is loading or while we're checking authorization
  if (loading || (!user && !error)) {
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

  // Show error or access denied if user is not authorized
  if (!authorized || error) {
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
              {error ||
                `Access denied. You need ${allowedRoles.join(" or ")} role.`}
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
