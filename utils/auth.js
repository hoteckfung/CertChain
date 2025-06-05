import { ethers } from "ethers";
import mysql from "./mysql";

// Local storage keys
const WALLET_ADDRESS_KEY = "walletAddress";
const USER_ROLE_KEY = "userRole";
const USER_ID_KEY = "userId";

// Available roles
export const ROLES = {
  ADMIN: "admin",
  ISSUER: "issuer",
  HOLDER: "holder",
  PUBLIC: "public", // For verifier access (no authentication required)
};

// Get wallet address from local storage
export const getWalletAddress = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(WALLET_ADDRESS_KEY);
  }
  return null;
};

// Get user role from local storage
export const getUserRole = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(USER_ROLE_KEY);
  }
  return null;
};

// Get user ID from local storage
export const getUserId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(USER_ID_KEY);
  }
  return null;
};

// Set wallet address in local storage
export const setWalletAddress = (address) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLET_ADDRESS_KEY, address);
  }
};

// Set user role in local storage
export const setUserRole = (role) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_ROLE_KEY, role);
  }
};

// Set user ID in local storage
export const setUserId = (id) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_ID_KEY, id);
  }
};

// Clear auth data
export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALLET_ADDRESS_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && !!window.ethereum;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getWalletAddress() && !!getUserRole();
};

// Check if user has a specific role
export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles = []) => {
  const userRole = getUserRole();
  return roles.includes(userRole);
};

// Check user role from MySQL and update last_active
export const checkUserRoleFromDatabase = async (walletAddress) => {
  if (!walletAddress) {
    throw new Error("Wallet address is required");
  }

  try {
    // Get user from database
    const { data, error } = await mysql.getUserByWalletAddress(walletAddress);

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    // If user exists, update last_active
    if (data) {
      await mysql.updateUserLastActive(walletAddress);

      // Update local storage with role from database
      setUserRole(data.role);
      setUserId(data.id);

      return data;
    }

    return null;
  } catch (e) {
    console.error("Exception in checkUserRoleFromDatabase:", e);
    return null;
  }
};

// Login function that verifies wallet against database
export const loginWithWallet = async (walletAddress) => {
  try {
    // First check if user exists in database
    const userData = await checkUserRoleFromDatabase(walletAddress);

    if (!userData) {
      // User doesn't exist, create a new user with holder role
      const newUser = {
        wallet_address: walletAddress,
        role: ROLES.HOLDER,
        username: `User_${walletAddress.substring(2, 8)}`,
      };

      const { data: createdUser, error: createError } = await mysql.createUser(
        newUser
      );

      if (createError || !createdUser) {
        throw new Error("Failed to create new user");
      }

      // Log the activity
      await mysql.logActivity({
        user_id: createdUser.id,
        action: "user_registered",
        details: "New user registered via wallet connection",
        wallet_address: walletAddress,
      });

      // Set authentication data in local storage
      setWalletAddress(walletAddress);
      setUserRole(createdUser.role);
      setUserId(createdUser.id);

      return createdUser;
    }

    // User exists, log the activity
    await mysql.logActivity({
      user_id: userData.id,
      action: "user_login",
      details: "User logged in via wallet connection",
      wallet_address: walletAddress,
    });

    // Set authentication data in local storage
    setWalletAddress(walletAddress);
    setUserRole(userData.role);
    setUserId(userData.id);

    return userData;
  } catch (error) {
    console.error("Login error:", error);
    clearAuth();
    throw error;
  }
};

export async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to connect."
      );
    }

    // Request accounts access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error(
        "No accounts found. Please check MetaMask and try again."
      );
    }

    const address = accounts[0].toLowerCase(); // Make sure to lowercase

    // Login with wallet address
    const userData = await loginWithWallet(address);

    return userData;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

// Logout function
export function logout() {
  clearAuth();
}

// Redirect based on user role
export function redirectBasedOnRole(router) {
  const role = getUserRole();

  switch (role) {
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

// Update user data
export async function updateUserData(userData) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { error } = await mysql.updateUser(userId, userData);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
}

// Check authentication for protected routes
export const checkAuth = (requiredRoles = []) => {
  const walletAddress = getWalletAddress();
  const userRole = getUserRole();

  if (!walletAddress || !userRole) {
    return false;
  }

  if (requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.includes(userRole);
};

// Get all users
export async function getAllUsers(roleFilter = null) {
  try {
    const { data, error } = await mysql.getAllUsers(roleFilter);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

// Add issuer
export async function addIssuer(walletAddress) {
  try {
    // Check if user exists
    const { data: existingUser, error: checkError } =
      await mysql.getUserByWalletAddress(walletAddress);

    if (checkError) {
      throw checkError;
    }

    if (existingUser) {
      // Update existing user to issuer role
      const { error } = await mysql.updateUserRole(
        existingUser.id,
        ROLES.ISSUER
      );

      if (error) {
        throw error;
      }

      return true;
    } else {
      // Create new issuer
      const newIssuer = {
        wallet_address: walletAddress,
        role: ROLES.ISSUER,
        username: `Issuer_${walletAddress.substring(2, 8)}`,
      };

      const { error } = await mysql.createUser(newIssuer);

      if (error) {
        throw error;
      }

      return true;
    }
  } catch (error) {
    console.error("Error adding issuer:", error);
    throw error;
  }
}

// Remove issuer (change role to holder)
export async function removeIssuer(walletAddress) {
  try {
    const { data: user, error: checkError } =
      await mysql.getUserByWalletAddress(walletAddress);

    if (checkError) {
      throw checkError;
    }

    if (!user) {
      throw new Error("User not found");
    }

    const { error } = await mysql.updateUserRole(user.id, ROLES.HOLDER);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error removing issuer:", error);
    throw error;
  }
}

// Update user role
export async function updateUserRole(userId, newRole) {
  try {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error("Invalid role");
    }

    const { error } = await mysql.updateUserRole(userId, newRole);

    if (error) {
      throw error;
    }

    // Log the activity
    await mysql.logActivity({
      user_id: getUserId(),
      action: "role_update",
      details: `Updated user ${userId} role to ${newRole}`,
    });

    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(userId) {
  try {
    const { data, error } = await mysql.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}
