import mysql from "../../../utils/mysql";
import { authenticateUser, hasRole, ROLES } from "../../../lib/auth-server";
import { checkUserRoles } from "../../../utils/contract";

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

            // Determine blockchain role (hierarchy: admin > issuer > holder)
            let blockchainRole = "holder"; // Default
            if (isAdmin) {
              blockchainRole = "admin";
            } else if (isIssuer) {
              blockchainRole = "issuer";
            }

            return {
              id: dbUser.id,
              wallet_address: dbUser.wallet_address,
              role: dbUser.role,
              blockchainRole: {
                isAdmin: isAdmin,
                isIssuer: isIssuer,
              },
              last_active: dbUser.last_active,
              created_at: dbUser.created_at,
            };
          } catch (blockchainError) {
            console.warn(
              `Failed to check blockchain roles for ${dbUser.wallet_address}:`,
              blockchainError
            );

            return {
              ...dbUser,
              database_role: dbUser.role,
              blockchain_roles: {
                is_admin: false,
                is_issuer: false,
                is_holder: true,
                primary_role: "holder", // Default on error
                roles_verified: false,
                error: blockchainError.message,
              },
              role_mismatch: false, // Can't determine if there's error
            };
          }
        })
      );

      // Log the admin activity
      await mysql.logActivity({
        user_id: user.id,
        action: "admin_users_viewed",
        entity_type: "user",
        details: `Admin viewed user list with blockchain roles`,
        wallet_address: user.wallet_address,
        category: "user_management",
      });

      return res.status(200).json({
        success: true,
        users: usersWithBlockchainRoles,
        totalUsers: usersWithBlockchainRoles.length,
        summary: {
          total: usersWithBlockchainRoles.length,
          admins: usersWithBlockchainRoles.filter(
            (u) => u.blockchain_roles.primary_role === "admin"
          ).length,
          issuers: usersWithBlockchainRoles.filter(
            (u) => u.blockchain_roles.primary_role === "issuer"
          ).length,
          holders: usersWithBlockchainRoles.filter(
            (u) => u.blockchain_roles.primary_role === "holder"
          ).length,
          role_mismatches: usersWithBlockchainRoles.filter(
            (u) => u.role_mismatch
          ).length,
          verification_errors: usersWithBlockchainRoles.filter(
            (u) => !u.blockchain_roles.roles_verified
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

    // Log the error
    try {
      await mysql.logActivity({
        user_id: user?.id || null,
        action: "admin_api_error",
        entity_type: "system",
        details: `Admin blockchain users API error: ${error.message}`,
        wallet_address: user?.wallet_address || null,
        category: "system_event",
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
