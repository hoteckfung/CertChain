import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/router";
import {
  connectWallet,
  getCurrentWalletAddress,
  handleAccountChange,
  handleChainChange,
} from "../utils/wallet";

// Enhanced AuthContext with real-time role verification and caching
const AuthContext = createContext();

// Public routes that don't require authentication
const publicRoutes = ["/verify", "/", "/login"];

// Role-based route access
const roleRoutes = {
  admin: ["/admin", "/issuer", "/holder"],
  issuer: ["/issuer", "/holder"],
  holder: ["/holder"],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleVerificationCache, setRoleVerificationCache] = useState(null);
  const [lastVerification, setLastVerification] = useState(null);
  const router = useRouter();

  // Use refs to track event listeners and intervals
  const accountChangeListenerRef = useRef(null);
  const chainChangeListenerRef = useRef(null);
  const roleVerificationIntervalRef = useRef(null);

  // Role verification with caching (every 5 minutes)
  const verifyUserRole = useCallback(
    async (force = false) => {
      if (!user?.walletAddress) return null;

      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      // Use cached data if still valid and not forced
      if (
        !force &&
        roleVerificationCache &&
        lastVerification &&
        now - lastVerification < CACHE_DURATION
      ) {
        return roleVerificationCache;
      }

      try {
        const response = await fetch("/api/auth/verify-role", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Role verification failed");
        }

        const data = await response.json();

        if (data.authenticated) {
          setRoleVerificationCache(data);
          setLastVerification(now);

          // Update user data if role has changed
          if (user && data.user.role !== user.role) {
            console.log("Role change detected, updating user data");
            setUser((prev) => ({
              ...prev,
              ...data.user,
            }));

            // Redirect to appropriate route for new role
            const newRoleRoute = data.redirectTo;
            if (newRoleRoute && router.pathname !== newRoleRoute) {
              router.push(newRoleRoute);
            }
          }

          return data;
        } else {
          // User is no longer authenticated
          setUser(null);
          setRoleVerificationCache(null);
          setLastVerification(null);

          if (!publicRoutes.includes(router.pathname)) {
            router.push("/login");
          }
          return null;
        }
      } catch (error) {
        console.error("Role verification error:", error);
        return roleVerificationCache; // Return cached data on error
      }
    },
    [user, roleVerificationCache, lastVerification, router]
  );

  // Simplified user data loading - just try login API
  const loadUserData = useCallback(async (address) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: address }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser({
            ...data.user,
            walletAddress: address,
          });
        } else {
          setUser(null);
          setError(data.error || "Authentication failed");
        }
      } else {
        setUser(null);
        setError("Login failed");
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user can access current route
  const canAccessRoute = useCallback((userRole, pathname) => {
    if (publicRoutes.includes(pathname)) return true;

    const allowedRoutes = roleRoutes[userRole] || [];
    return allowedRoutes.some((route) => pathname.startsWith(route));
  }, []);

  // Initial authentication check
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        const address = await getCurrentWalletAddress();

        if (address) {
          await loadUserData(address);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [loadUserData]);

  // Disabled periodic role verification to prevent loops
  // TODO: Re-enable once authentication is stable
  // useEffect(() => {
  //   if (user?.walletAddress) {
  //     roleVerificationIntervalRef.current = setInterval(() => {
  //       verifyUserRole(false);
  //     }, 5 * 60 * 1000);

  //     return () => {
  //       if (roleVerificationIntervalRef.current) {
  //         clearInterval(roleVerificationIntervalRef.current);
  //       }
  //     };
  //   }
  // }, [user, verifyUserRole]);

  // Enhanced wallet event listeners
  useEffect(() => {
    if (window.ethereum) {
      // Remove previous listeners
      if (accountChangeListenerRef.current) {
        window.ethereum.removeListener(
          "accountsChanged",
          accountChangeListenerRef.current
        );
      }

      if (chainChangeListenerRef.current) {
        window.ethereum.removeListener(
          "chainChanged",
          chainChangeListenerRef.current
        );
      }

      // Enhanced account change handler
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setUser(null);
          setRoleVerificationCache(null);
          setLastVerification(null);

          if (!publicRoutes.includes(router.pathname)) {
            router.push("/login");
          }
        } else {
          // User switched accounts - force role verification
          await loadUserData(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Clear cache and reload
        setRoleVerificationCache(null);
        setLastVerification(null);
        window.location.reload();
      };

      // Save references
      accountChangeListenerRef.current = handleAccountsChanged;
      chainChangeListenerRef.current = handleChainChanged;

      // Add listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        if (accountChangeListenerRef.current) {
          window.ethereum.removeListener(
            "accountsChanged",
            accountChangeListenerRef.current
          );
        }

        if (chainChangeListenerRef.current) {
          window.ethereum.removeListener(
            "chainChanged",
            chainChangeListenerRef.current
          );
        }
      }
    };
  }, [router.pathname, loadUserData]);

  // Simplified route protection - only redirect to login if not authenticated
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(router.pathname);

    // Only redirect to login if user is not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      router.push("/login");
    }
    // Don't automatically redirect authenticated users - let them navigate manually
  }, [user, loading, router.pathname]);

  // Enhanced login with better error handling
  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      const { address } = await connectWallet();

      // Clear any existing cache
      setRoleVerificationCache(null);
      setLastVerification(null);

      await loadUserData(address);

      return { success: true, address };
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout with cache clearing
  const logout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Clear all state and cache
    setUser(null);
    setRoleVerificationCache(null);
    setLastVerification(null);
    setError(null);

    // Clear any intervals
    if (roleVerificationIntervalRef.current) {
      clearInterval(roleVerificationIntervalRef.current);
    }

    // Redirect to login
    router.push("/login");
  };

  // Force role refresh (for after admin changes)
  const refreshUserRole = useCallback(async () => {
    if (user?.walletAddress) {
      await verifyUserRole(true);
    }
  }, [user, verifyUserRole]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUserRole,
    canAccessRoute,
    roleVerification: roleVerificationCache,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
