import mysql from "../../../utils/mysql";
import {
  authenticateUser,
  hasRole,
  ROLES,
  clearUserCache,
} from "../../../lib/auth-server";

export default async function handler(req, res) {
  try {
    // Authenticate user and check admin role
    const { user, error } = await authenticateUser(req);

    if (!user) {
      return res
        .status(401)
        .json({ error: error || "Authentication required" });
    }

    if (!hasRole(user, ROLES.ADMIN)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (req.method === "GET") {
      // Get query parameters for filtering
      const { role, detailed } = req.query;

      let usersData;

      if (detailed === "true") {
        // Use the new admin overview function for detailed data
        const { data: users, error: fetchError } =
          await mysql.getAdminUserOverview(role);

        if (fetchError) {
          console.error("Failed to fetch detailed users:", fetchError);
          return res.status(500).json({
            error: "Failed to fetch users",
            details: fetchError.message,
          });
        }

        usersData = users;
      } else {
        // Use basic user fetch for simpler data
        const { data: users, error: fetchError } = await mysql.getAllUsers(
          role
        );

        if (fetchError) {
          console.error("Failed to fetch users:", fetchError);
          return res.status(500).json({
            error: "Failed to fetch users",
            details: fetchError.message,
          });
        }

        usersData = users;
      }

      // Log the admin activity - Skip logging for admin actions
      // No longer logging admin activities per requirements

      return res.status(200).json({
        success: true,
        users: usersData,
        totalUsers: usersData.length,
        filters: { role: role || "all", detailed: detailed === "true" },
      });
    } else if (req.method === "PUT") {
      // Role updates are now managed through blockchain only
      return res.status(400).json({
        error: "Role management has been moved to blockchain",
        message:
          "Roles are now managed exclusively through smart contract. Use the grant-issuer-role script or smart contract admin functions.",
        blockchainInfo: {
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          grantIssuerScript:
            "npx hardhat run scripts/grant-issuer-role.js --network ganache",
          revokeIssuerScript: "Use smart contract admin functions",
        },
      });
    } else if (req.method === "DELETE") {
      // Delete user
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Get the target user first
      const { data: targetUser } = await mysql.getUserByWalletAddress(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (targetUser.id === user.id) {
        return res.status(400).json({
          error: "Cannot delete your own account",
        });
      }

      // Delete the user
      const { error: deleteError } = await mysql.deleteUser(targetUser.id);

      if (deleteError) {
        console.error("Failed to delete user:", deleteError);
        return res.status(500).json({
          error: "Failed to delete user",
          details: deleteError.message,
        });
      }

      // Clear user cache
      clearUserCache(userId);

      // Log the deletion activity - Skip logging for admin actions
      // No longer logging admin activities per requirements

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
        deletedUser: {
          id: targetUser.id,
          wallet_address: targetUser.wallet_address,
          role: targetUser.role,
        },
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin users API error:", error);

    // Log the error - Skip logging for admin actions
    // No longer logging admin activities per requirements

    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
