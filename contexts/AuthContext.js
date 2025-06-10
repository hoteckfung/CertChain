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
import { checkUserRoles } from "../utils/contract";

// Enhanced AuthContext with blockchain-first authentication
const AuthContext = createContext();

// Public routes that don't require authentication
const publicRoutes = ["/verify", "/", "/login"];

// Role-based route access (now based on blockchain roles)
const roleRoutes = {
  admin: ["/dashboard"], // Admin can access unified dashboard
  issuer: ["/dashboard"], // Issuer and holder use unified dashboard
  holder: ["/dashboard"],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleVerificationCache, setRoleVerificationCache] = useState(null);
  const [lastVerification, setLastVerification] = useState(null);
  const [manualLogout, setManualLogout] = useState(false);
  const router = useRouter();

  // Use refs to track event listeners and intervals
  const accountChangeListenerRef = useRef(null);
  const chainChangeListenerRef = useRef(null);
  const roleVerificationIntervalRef = useRef(null);

  // Blockchain-first role verification
  const verifyUserRoleOnChain = useCallback(
    async (walletAddress, force = false) => {
      if (!walletAddress) return null;

      const now = Date.now();
      const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for blockchain roles

      // Use cached data if still valid and not forced
      if (
        !force &&
        roleVerificationCache &&
        lastVerification &&
        now - lastVerification < CACHE_DURATION &&
        roleVerificationCache.walletAddress === walletAddress
      ) {
        return roleVerificationCache;
      }

      try {
        console.log("🔍 Verifying blockchain roles for:", walletAddress);

        // Check roles using a single utility function
        const { success, isAdmin, isIssuer, error } = await checkUserRoles(
          walletAddress
        );

        console.log("🔍 Raw role check result:", {
          success,
          isAdmin,
          isIssuer,
          error,
        });

        if (!success) {
          console.error(
            "❌ Blockchain role verification failed:",
            error || "Unknown error"
          );
          throw new Error(error || "Contract role verification failed");
        }

        // Determine primary role (hierarchy: admin > issuer > holder)
        let primaryRole = "holder"; // Default role
        let redirectTo = "/dashboard";

        if (isAdmin) {
          primaryRole = "admin";
          redirectTo = "/dashboard"; // Admin uses unified dashboard
          console.log("🔍 Admin role detected - setting primaryRole to admin");
        } else if (isIssuer) {
          primaryRole = "issuer";
          redirectTo = "/dashboard"; // Unified dashboard for issuers and holders
          console.log(
            "🔍 Issuer role detected - setting primaryRole to issuer"
          );
        } else {
          console.log("🔍 No special roles detected - defaulting to holder");
        }

        const roleData = {
          walletAddress,
          roles: {
            isAdmin: isAdmin || false,
            isIssuer: isIssuer || false,
            isHolder: true, // Everyone is a holder
          },
          primaryRole,
          redirectTo,
          authenticated: true,
        };

        setRoleVerificationCache(roleData);
        setLastVerification(now);

        console.log("✅ Blockchain roles verified:", roleData);
        return roleData;
      } catch (error) {
        console.error("❌ Blockchain role verification error:", error);

        // On error, return cached data or default to holder
        if (
          roleVerificationCache &&
          roleVerificationCache.walletAddress === walletAddress
        ) {
          return roleVerificationCache;
        }

        return {
          walletAddress,
          roles: {
            isAdmin: false,
            isIssuer: false,
            isHolder: true,
          },
          primaryRole: "holder",
          redirectTo: "/dashboard",
          authenticated: true,
          error: error.message,
        };
      }
    },
    [roleVerificationCache, lastVerification]
  );

  // Load user data with blockchain-first approach
  const loadUserData = useCallback(
    async (address) => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔗 Loading user data for wallet:", address);

        // 1. Verify roles on blockchain (primary source of truth)
        const roleData = await verifyUserRoleOnChain(address, true);

        if (!roleData) {
          throw new Error("Failed to verify blockchain roles");
        }

        // 2. Get or create user profile from database (supplementary data only)
        let userProfile = null;
        try {
          const response = await fetch("/api/auth/get-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address }),
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              userProfile = data.profile;
            }
          }
        } catch (profileError) {
          console.warn(
            "⚠️ Could not load user profile from database:",
            profileError
          );
          // Continue without profile data - blockchain auth is primary
        }

        // 3. Combine blockchain roles with profile data
        const userData = {
          walletAddress: address,
          wallet_address: address, // alias for compatibility
          role: roleData.primaryRole,
          roles: roleData.roles,
          redirectTo: roleData.redirectTo,
          authenticated: true,
          // Profile data (optional)
          id: userProfile?.id || `wallet_${address.slice(2, 8)}`,
          name:
            userProfile?.name ||
            `User ${address.slice(0, 6)}...${address.slice(-4)}`,
          createdAt: userProfile?.created_at || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        setUser(userData);

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("walletAddress", address);
          localStorage.setItem("userRole", roleData.primaryRole);
          localStorage.setItem(
            "blockchainRoles",
            JSON.stringify(roleData.roles)
          );
        }

        // 4. Update database with latest login (fire and forget)
        try {
          fetch("/api/auth/update-last-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: address,
              role: roleData.primaryRole,
            }),
            credentials: "include",
          }).catch(console.warn); // Don't block on database errors
        } catch {}

        return userData;
      } catch (err) {
        console.error("❌ Error loading user data:", err);
        setError(err.message);
        setUser(null);

        // Clear localStorage on error
        if (typeof window !== "undefined") {
          localStorage.removeItem("walletAddress");
          localStorage.removeItem("userRole");
          localStorage.removeItem("blockchainRoles");
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [verifyUserRoleOnChain]
  );

  // Check if user can access current route
  const canAccessRoute = useCallback((userRole, pathname) => {
    if (publicRoutes.includes(pathname)) return true;

    const allowedRoutes = roleRoutes[userRole] || roleRoutes.holder;
    return allowedRoutes.some((route) => pathname.startsWith(route));
  }, []);

  // Initial authentication check
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);

        // Don't auto-login if user manually logged out
        if (manualLogout) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Check if wallet is connected
        const address = await getCurrentWalletAddress();

        if (address) {
          await loadUserData(address);
        } else {
          setUser(null);
          // Redirect to login if on protected route
          if (!publicRoutes.includes(router.pathname)) {
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err.message);
        setUser(null);

        if (!publicRoutes.includes(router.pathname)) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router.pathname, manualLogout]);

  // Set up wallet event listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    // Handle account changes
    const handleAccountsChanged = async (accounts) => {
      console.log("🔄 Account changed:", accounts);

      if (accounts.length === 0) {
        // User disconnected wallet from MetaMask
        setUser(null);
        setRoleVerificationCache(null);
        setLastVerification(null);
        setManualLogout(false); // Clear manual logout since this is MetaMask disconnection

        if (typeof window !== "undefined") {
          localStorage.removeItem("walletAddress");
          localStorage.removeItem("userRole");
          localStorage.removeItem("blockchainRoles");
        }

        if (!publicRoutes.includes(router.pathname)) {
          router.push("/login");
        }
      } else if (accounts[0] !== user?.walletAddress) {
        // User switched accounts - clear manual logout and login with new account
        setManualLogout(false);
        try {
          await loadUserData(accounts[0]);
        } catch (error) {
          console.error("Error switching accounts:", error);
          setError("Failed to switch accounts");
        }
      }
    };

    // Handle chain changes
    const handleChainChanged = (chainId) => {
      console.log("🔄 Chain changed:", chainId);
      // Refresh the page to reset the application state
      window.location.reload();
    };

    // Add event listeners
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Store listener refs for cleanup
    accountChangeListenerRef.current = handleAccountsChanged;
    chainChangeListenerRef.current = handleChainChanged;

    // Cleanup function
    return () => {
      if (window.ethereum && accountChangeListenerRef.current) {
        window.ethereum.removeListener(
          "accountsChanged",
          accountChangeListenerRef.current
        );
      }
      if (window.ethereum && chainChangeListenerRef.current) {
        window.ethereum.removeListener(
          "chainChanged",
          chainChangeListenerRef.current
        );
      }
    };
  }, [user, router, loadUserData]);

  // Periodic role verification (every 5 minutes)
  useEffect(() => {
    if (!user?.walletAddress) return;

    const interval = setInterval(async () => {
      try {
        console.log("🔄 Periodic role verification...");
        const currentRoles = await verifyUserRoleOnChain(
          user.walletAddress,
          true
        );

        if (currentRoles && currentRoles.primaryRole !== user.role) {
          console.log("🔄 Role change detected, reloading user data...");
          await loadUserData(user.walletAddress);
        }
      } catch (error) {
        console.warn("Periodic role verification failed:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    roleVerificationIntervalRef.current = interval;

    return () => {
      if (roleVerificationIntervalRef.current) {
        clearInterval(roleVerificationIntervalRef.current);
      }
    };
  }, [user?.walletAddress, user?.role, verifyUserRoleOnChain, loadUserData]);

  // Login function
  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      setManualLogout(false); // Clear manual logout flag

      const result = await connectWallet();

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      const address = result.address;
      await loadUserData(address);

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Failed to connect wallet";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setUser(null);
      setRoleVerificationCache(null);
      setLastVerification(null);
      setError(null);
      setManualLogout(true); // Prevent auto-login

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("blockchainRoles");
      }

      // Log logout activity (fire and forget)
      if (user?.walletAddress) {
        fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "USER_LOGOUT",
            walletAddress: user.walletAddress,
            details: "User disconnected wallet",
          }),
        }).catch(console.warn);
      }

      // Note: We don't need to explicitly disconnect from MetaMask as this would
      // require user confirmation. Instead, we just clear our local state.
      // The checkAuth function should respect that user is null and not auto-login

      // Redirect to home page instead of login
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    canAccessRoute,
    verifyUserRoleOnChain,
    roleVerificationCache,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
