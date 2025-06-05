import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/router";
import {
  connectWallet,
  getCurrentWalletAddress,
  handleAccountChange,
  handleChainChange,
} from "../utils/wallet";
import mysql from "../utils/mysql";

// Manages user authentication state
// Handles role-based redirects
// Provides login/logout functions
// Persists user session

// Create the authentication context
const AuthContext = createContext();

// Public routes that don't require authentication
const publicRoutes = ["/verify", "/", "/login"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Use refs to track event listeners
  const accountChangeListenerRef = useRef(null);
  const chainChangeListenerRef = useRef(null);

  // Check if user is authenticated on initial load
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
  }, []);

  // Setup wallet event listeners
  useEffect(() => {
    // Remove any existing listeners first to prevent duplicates
    if (window.ethereum) {
      // Remove previous listeners if they exist
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

      // Create new listeners
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setUser(null);
          if (!publicRoutes.includes(router.pathname)) {
            router.push("/login");
          }
        } else {
          // User switched accounts
          await loadUserData(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Reload the page on chain change
        window.location.reload();
      };

      // Save references to the listeners
      accountChangeListenerRef.current = handleAccountsChanged;
      chainChangeListenerRef.current = handleChainChanged;

      // Add the listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    // Cleanup function
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  // Check for restricted routes
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (!user && !isPublicRoute) {
      // Redirect to login if accessing restricted route without authentication
      router.push("/login");
    } else if (user) {
      // Redirect based on user role
      const { role } = user;

      if (router.pathname === "/admin" && role !== "admin") {
        router.push(`/${role}`);
      } else if (
        router.pathname === "/issuer" &&
        role !== "issuer" &&
        role !== "admin"
      ) {
        router.push(`/${role}`);
      } else if (
        router.pathname === "/holder" &&
        role !== "holder" &&
        role !== "admin" &&
        role !== "issuer"
      ) {
        router.push("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router.pathname]);

  // Load user data from database
  const loadUserData = async (address) => {
    try {
      const { data: userData, error } = await mysql.getUserByWalletAddress(
        address
      );

      if (error) {
        throw new Error("Failed to load user data");
      }

      if (userData) {
        setUser({
          ...userData,
          walletAddress: address,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err.message);
      setUser(null);
    }
  };

  // Connect wallet
  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      const { address } = await connectWallet();
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

  // Disconnect wallet (for UI purposes only, actual disconnection happens in MetaMask)
  const logout = () => {
    setUser(null);
    router.push("/");
  };

  // Value object to be provided to consumers
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
