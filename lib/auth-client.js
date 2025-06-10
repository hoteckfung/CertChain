// Client-side authentication utilities
// This file handles browser-specific authentication logic

import { ethers } from "ethers";

// Local storage keys
const WALLET_ADDRESS_KEY = "walletAddress";
const USER_ROLE_KEY = "userRole";

// Available roles
export const ROLES = {
  ADMIN: "admin",
  ISSUER: "issuer",
  HOLDER: "holder",
  PUBLIC: "public",
};

// Local storage utilities
export const getWalletAddress = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(WALLET_ADDRESS_KEY);
  }
  return null;
};

export const getUserRole = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(USER_ROLE_KEY);
  }
  return null;
};

export const setWalletAddress = (address) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLET_ADDRESS_KEY, address);
  }
};

export const setUserRole = (role) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_ROLE_KEY, role);
  }
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALLET_ADDRESS_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
  }
};

// Wallet utilities
export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && !!window.ethereum;
};

export const isAuthenticated = () => {
  return !!getWalletAddress() && !!getUserRole();
};

export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

export const hasAnyRole = (roles = []) => {
  const userRole = getUserRole();
  return roles.includes(userRole);
};

// Wallet connection
export async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to connect."
      );
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error(
        "No accounts found. Please check MetaMask and try again."
      );
    }

    const address = accounts[0];
    setWalletAddress(address);

    return { address, success: true };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw error;
  }
}

export async function getCurrentWalletAddress() {
  try {
    if (!window.ethereum) return null;

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Failed to get current wallet address:", error);
    return null;
  }
}

// Role-based routing helpers
export function redirectBasedOnRole(router) {
  const role = getUserRole();

  if (!role) {
    router.push("/login");
    return;
  }

  switch (role) {
    case ROLES.ADMIN:
      router.push("/dashboard");
      break;
    case ROLES.ISSUER:
      router.push("/dashboard");
      break;
    case ROLES.HOLDER:
      router.push("/dashboard");
      break;
    default:
      router.push("/");
  }
}

export function logout() {
  clearAuth();
}

// Auth checking hook for components
export const checkAuth = (requiredRoles = []) => {
  const userRole = getUserRole();
  const walletAddress = getWalletAddress();

  const isAuthenticated = !!walletAddress && !!userRole;
  const hasRequiredRole =
    requiredRoles.length === 0 || requiredRoles.includes(userRole);

  return {
    isAuthenticated,
    hasRequiredRole,
    userRole,
    walletAddress,
  };
};
