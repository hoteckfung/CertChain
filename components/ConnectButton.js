import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "./ui/button";
import {
  connectWallet,
  redirectBasedOnRole,
  setWalletAddress,
  setUserRole,
  setUserId,
  ROLES,
} from "../lib/auth-client";
import MetaMaskIcon from "./MetaMaskIcon";

const ConnectButton = ({ children, size, className, ...props }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [hasMetaMask, setHasMetaMask] = useState(true);
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check if MetaMask is installed on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasMetaMask(!!window.ethereum);
    }
  }, []);

  // Handle development mode login
  const handleDevModeLogin = () => {
    // In development mode, we'll just simulate a login as a holder
    // without connecting to any real database

    // Clear previous auth state first
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");

    // Create a mock wallet address using the current timestamp for uniqueness
    const mockWalletAddress = `0x${ROLES.HOLDER}${Date.now()
      .toString(16)
      .substring(0, 8)}`;

    // Set auth data in localStorage
    setWalletAddress(mockWalletAddress);
    setUserRole(ROLES.HOLDER);
    const mockUserId = `dev-${ROLES.HOLDER}-${Date.now()}`;
    setUserId(mockUserId);

    console.log(
      `Development mode login: Setting up holder with wallet ${mockWalletAddress}`
    );

    // Navigate to holder dashboard after a slight delay
    // The delay ensures localStorage is fully set before navigation
    setTimeout(() => {
      router.push(`/${ROLES.HOLDER.toLowerCase()}`);
    }, 100);
  };

  const handleConnect = async () => {
    // In development mode, use a simpler approach that doesn't require database
    if (isDevelopment) {
      // Use the login page for more options, or direct login as holder
      router.push("/login");
      return;
    }

    // Check if MetaMask is installed
    if (!hasMetaMask) {
      setError(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      return;
    }

    // Normal MetaMask flow for production
    setIsConnecting(true);
    setError("");

    try {
      const user = await connectWallet();
      if (user) {
        redirectBasedOnRole(router);
      } else {
        setError("Failed to connect wallet. Check your network connection.");
      }
    } catch (error) {
      console.error("Connection error:", error);

      // Provide more helpful error messages based on error type
      if (error.message?.includes("wallet_address")) {
        setError(
          "Database error: wallet_address column issue. Database may not be initialized."
        );
      } else if (error.message?.includes("users")) {
        setError(
          "Database error: users table not found. Run database initialization."
        );
      } else if (
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("network")
      ) {
        setError(
          "Network error: Could not connect to MySQL. Check your credentials."
        );
      } else if (error.message?.includes("rejected")) {
        setError(
          "Connection rejected. Please approve the MetaMask connection request."
        );
      } else {
        setError(
          error.message || "Failed to connect. Check console for details."
        );
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        size={size}
        className={`inline-flex items-center ${className || ""}`}
        {...props}>
        {isConnecting ? "Connecting..." : children || "Connect Wallet"}
        <MetaMaskIcon className="h-5 w-5 ml-2" />
      </Button>
      {error && (
        <div className="text-red-500 text-sm mt-2 max-w-sm">{error}</div>
      )}
      {!hasMetaMask && !error && !isDevelopment && (
        <div className="text-amber-500 text-sm mt-2">
          MetaMask not detected.{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
            className="underline">
            Install MetaMask
          </a>{" "}
          to continue.
        </div>
      )}
    </>
  );
};

export default ConnectButton;
