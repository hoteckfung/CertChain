// Enhanced server-side authentication utilities with caching and role hierarchies
// This file handles server-specific authentication logic

import mysql from "../utils/mysql";

export const ROLES = {
  ADMIN: "admin",
  ISSUER: "issuer",
  HOLDER: "holder",
  PUBLIC: "public",
};

export const ROLE_ROUTES = {
  [ROLES.ADMIN]: "/dashboard",
  [ROLES.ISSUER]: "/dashboard",
  [ROLES.HOLDER]: "/dashboard",
};

// Role hierarchy - higher roles inherit lower role permissions
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.ISSUER, ROLES.HOLDER],
  [ROLES.ISSUER]: [ROLES.ISSUER, ROLES.HOLDER],
  [ROLES.HOLDER]: [ROLES.HOLDER],
};

// Permission definitions for fine-grained access control
export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  ISSUE_CERTIFICATES: "issue_certificates",
  VERIFY_CERTIFICATES: "verify_certificates",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SYSTEM: "manage_system",
};

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ISSUE_CERTIFICATES,
    PERMISSIONS.VERIFY_CERTIFICATES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SYSTEM,
  ],
  [ROLES.ISSUER]: [
    PERMISSIONS.ISSUE_CERTIFICATES,
    PERMISSIONS.VERIFY_CERTIFICATES,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.HOLDER]: [PERMISSIONS.VERIFY_CERTIFICATES],
};

// Cache user data briefly to reduce database hits
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getUserWithCache(walletAddress) {
  const cacheKey = walletAddress.toLowerCase();
  const cached = userCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.user;
  }

  // Fetch from database
  const { data: user, error } = await mysql.getUserByWalletAddress(
    walletAddress
  );

  if (!error && user) {
    // Parse permissions if stored as JSON
    if (user.permissions && typeof user.permissions === "string") {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e) {
        user.permissions = ROLE_PERMISSIONS[user.role] || [];
      }
    } else {
      // Set default permissions based on role
      user.permissions = ROLE_PERMISSIONS[user.role] || [];
    }

    // Cache the user data
    userCache.set(cacheKey, {
      user,
      timestamp: Date.now(),
    });

    // Update last active asynchronously
    mysql.updateUserLastActive(walletAddress).catch(console.error);
  }

  return user;
}

export function clearUserCache(walletAddress) {
  if (walletAddress) {
    userCache.delete(walletAddress.toLowerCase());
  } else {
    // Clear all cache
    userCache.clear();
  }
}

// Enhanced authentication function with caching
export async function authenticateUser(req) {
  try {
    const authCookie = req.cookies.auth;

    if (!authCookie) {
      return { user: null, error: "Not authenticated" };
    }

    const authData = JSON.parse(authCookie);

    if (!authData.walletAddress) {
      return { user: null, error: "Invalid authentication data" };
    }

    // Try to get user from database first
    let user = await getUserWithCache(authData.walletAddress);

    // If no database user but we have a valid session (blockchain-only mode)
    if (!user && authData.blockchainOnly) {
      console.log(
        "Creating temporary user for blockchain-only session:",
        authData.walletAddress
      );
      user = {
        id: authData.userId,
        wallet_address: authData.walletAddress,
        role: authData.role,
        permissions:
          ROLE_PERMISSIONS[authData.role] || ROLE_PERMISSIONS[ROLES.HOLDER],
        blockchainOnly: true,
      };
    }

    if (!user) {
      return { user: null, error: "User not found" };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Authentication error:", error);
    return { user: null, error: "Authentication failed" };
  }
}

// Enhanced role checking with hierarchy support
export function hasRole(user, requiredRole) {
  if (!user || !user.role) return false;
  const userRoles = ROLE_HIERARCHY[user.role] || [user.role];
  return userRoles.includes(requiredRole);
}

// Check if user has any of the required roles using hierarchy
export function hasAnyRole(user, requiredRoles = []) {
  if (!user || !user.role) return false;
  const userRoles = ROLE_HIERARCHY[user.role] || [user.role];
  return requiredRoles.some((role) => userRoles.includes(role));
}

// Check if user has specific permission
export function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

// Enhanced middleware function to protect API routes
export function requireAuth(requiredRoles = [], requiredPermissions = []) {
  return async (req, res, next) => {
    const { user, error } = await authenticateUser(req);

    if (!user) {
      return res
        .status(401)
        .json({ error: error || "Authentication required" });
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !hasAnyRole(user, requiredRoles)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        redirectTo: ROLE_ROUTES[user.role] || "/login",
      });
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some((permission) =>
        hasPermission(user, permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: requiredPermissions,
        });
      }
    }

    // Attach user to request for use in route handlers
    req.user = user;

    if (next) {
      next();
    }

    return { user };
  };
}

// Helper functions for common auth patterns
export const requireAdmin = () => requireAuth([ROLES.ADMIN]);
export const requireIssuer = () => requireAuth([ROLES.ISSUER, ROLES.ADMIN]);
export const requireAnyAuth = () => requireAuth([]);

// Permission-based helpers
export const requireUserManagement = () =>
  requireAuth([], [PERMISSIONS.MANAGE_USERS]);
export const requireCertificateIssuing = () =>
  requireAuth([], [PERMISSIONS.ISSUE_CERTIFICATES]);

// Enhanced login function with better error handling
export async function loginUser(walletAddress, userData = {}) {
  try {
    let { data: user, error } = await mysql.getUserByWalletAddress(
      walletAddress
    );

    if (error) {
      console.error("Database error in loginUser:", error);
      return { user: null, error: "Database error" };
    }

    if (!user) {
      // Determine the role - use userData.role if provided, otherwise default to HOLDER
      const userRole = userData.role || ROLES.HOLDER;

      // Create new user with proper role and permissions
      const newUserData = {
        wallet_address: walletAddress,
        role: userRole,
        permissions:
          ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[ROLES.HOLDER],
      };

      console.log("Creating new user with data:", {
        wallet_address: walletAddress,
        role: userRole,
        permissions: newUserData.permissions,
      });

      const { data: createdUser, error: createError } = await mysql.createUser(
        newUserData
      );

      if (createError) {
        console.error("User creation error:", createError);
        return { user: null, error: "Failed to create user" };
      }

      if (!createdUser) {
        console.error("User creation returned null/undefined");
        return { user: null, error: "Failed to create user" };
      }

      user = createdUser;
      // Ensure permissions are parsed correctly
      try {
        if (typeof user.permissions === "string") {
          user.permissions = JSON.parse(user.permissions);
        }
        if (!Array.isArray(user.permissions)) {
          user.permissions =
            ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS[ROLES.HOLDER];
        }
      } catch (permError) {
        console.warn("Error parsing permissions, using defaults:", permError);
        user.permissions =
          ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS[ROLES.HOLDER];
      }

      // User registration no longer logged per requirements
    } else {
      // Existing user - ensure permissions are properly formatted
      try {
        if (typeof user.permissions === "string") {
          user.permissions = JSON.parse(user.permissions);
        }
        if (!Array.isArray(user.permissions)) {
          user.permissions =
            ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS[ROLES.HOLDER];
        }
      } catch (permError) {
        console.warn(
          "Error parsing existing user permissions, using defaults:",
          permError
        );
        user.permissions =
          ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS[ROLES.HOLDER];
      }

      // Update last active time
      try {
        await mysql.updateUserLastActive(walletAddress);
      } catch (updateError) {
        console.warn("Failed to update last active time:", updateError);
      }

      // Log login activity
      try {
        await mysql.logActivity({
          user_id: user.id,
          action: "user_login",
          details: "User logged in via wallet connection",
          wallet_address: walletAddress,
          category: "authentication",
        });
      } catch (logError) {
        console.warn("Failed to log login activity:", logError);
      }
    }

    // Cache the user
    userCache.set(walletAddress.toLowerCase(), {
      user,
      timestamp: Date.now(),
    });

    return { user, error: null };
  } catch (error) {
    console.error("Login error:", error);
    return { user: null, error: "Login failed: " + error.message };
  }
}

// Enhanced logout with cache clearing
export async function logoutUser(req) {
  try {
    const { user } = await authenticateUser(req);

    if (user) {
      // Clear user from cache
      clearUserCache(user.wallet_address);

      // User logout activity no longer logged per requirements
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Logout failed" };
  }
}

// Role management is now handled exclusively through blockchain
// Database roles are kept for historical reference only
export async function updateUserRole(userId, newRole, adminUserId) {
  console.warn(
    "⚠️ updateUserRole called - Role management is now blockchain-only"
  );
  return {
    success: false,
    error:
      "Role management has been moved to blockchain. Use smart contract admin functions or grant-issuer-role script.",
  };
}

// Route access checker
export function canAccessRoute(userRole, routePath) {
  const userRoles = ROLE_HIERARCHY[userRole] || [userRole];

  // Route-specific permission mapping
  const routePermissions = {
    "/dashboard": [ROLES.ADMIN, ROLES.ISSUER, ROLES.HOLDER],
  };

  // Find matching route
  const requiredRoles =
    Object.entries(routePermissions).find(([route]) =>
      routePath.startsWith(route)
    )?.[1] || [];

  // If no specific requirements, allow access (public route)
  if (requiredRoles.length === 0) return true;

  // Check if user has any required role
  return requiredRoles.some((role) => userRoles.includes(role));
}

// Get redirect URL for user role
export function getRedirectForRole(role) {
  return ROLE_ROUTES[role] || "/login";
}
