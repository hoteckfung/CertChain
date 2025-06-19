import mysql from "../../../utils/mysql";
import { authenticateUser } from "../../../lib/auth-server";
import { checkUserRoles } from "../../../utils/contract";

export default async function handler(req, res) {
  try {
    // Authenticate user first
    const { user, error } = await authenticateUser(req);

    if (!user) {
      return res
        .status(401)
        .json({ error: error || "Authentication required" });
    }

    // Check blockchain admin role instead of database role
    const {
      success: roleCheckSuccess,
      isAdmin,
      error: roleError,
    } = await checkUserRoles(user.wallet_address);

    if (!roleCheckSuccess) {
      console.error("Failed to check blockchain roles:", roleError);
      return res.status(500).json({
        error: "Failed to verify admin status",
        details: roleError,
      });
    }

    if (!isAdmin) {
      return res.status(403).json({
        error:
          "Admin access required. Only blockchain admin can access this endpoint.",
      });
    }

    if (req.method === "GET") {
      // Get all users from database (for profile info)
      const { data: dbUsers, error: fetchError } = await mysql.getAllUsers();

      if (fetchError) {
        console.error("Failed to fetch users from database:", fetchError);
        return res.status(500).json({
          error: "Failed to fetch users",
          details: fetchError.message,
        });
      }

      // Enhance each user with live blockchain role data
      const usersWithBlockchainRoles = await Promise.all(
        dbUsers.map(async (dbUser) => {
          try {
            // Get live blockchain roles
            const { success, isAdmin, isIssuer } = await checkUserRoles(
              dbUser.wallet_address
            );

            return {
              id: dbUser.id,
              wallet_address: dbUser.wallet_address,
              role: dbUser.role, // Database role for reference
              blockchainRole: {
                isAdmin: success ? isAdmin : false,
                isIssuer: success ? isIssuer : false,
              },
              last_active: dbUser.last_active,
              created_at: dbUser.created_at,
              roles_verified: success,
            };
          } catch (blockchainError) {
            console.warn(
              `Failed to check blockchain roles for ${dbUser.wallet_address}:`,
              blockchainError
            );

            return {
              id: dbUser.id,
              wallet_address: dbUser.wallet_address,
              role: dbUser.role,
              blockchainRole: {
                isAdmin: false,
                isIssuer: false,
              },
              last_active: dbUser.last_active,
              created_at: dbUser.created_at,
              roles_verified: false,
              error: blockchainError.message,
            };
          }
        })
      );

      // Log the admin activity - Skip logging for admin actions
      // No longer logging admin activities per requirements

      return res.status(200).json({
        success: true,
        users: usersWithBlockchainRoles,
        totalUsers: usersWithBlockchainRoles.length,
        summary: {
          total: usersWithBlockchainRoles.length,
          admins: usersWithBlockchainRoles.filter(
            (u) => u.blockchainRole.isAdmin
          ).length,
          issuers: usersWithBlockchainRoles.filter(
            (u) => u.blockchainRole.isIssuer && !u.blockchainRole.isAdmin
          ).length,
          holders: usersWithBlockchainRoles.filter(
            (u) => !u.blockchainRole.isAdmin && !u.blockchainRole.isIssuer
          ).length,
          verification_errors: usersWithBlockchainRoles.filter(
            (u) => !u.roles_verified
          ).length,
        },
        notes: {
          role_management:
            "Roles are now managed exclusively through blockchain smart contract",
          grant_issuer:
            "Use: npx hardhat run scripts/grant-issuer-role.js --network ganache",
          contract_address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        },
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin blockchain users API error:", error);

    // Log the error - Skip logging for admin actions
    // No longer logging admin activities per requirements

    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
