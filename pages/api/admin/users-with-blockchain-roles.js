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

    console.log("🔍 Admin API: Authenticated user:", {
      wallet_address: user.wallet_address,
      database_role: user.role,
    });

    // Check blockchain admin role with fallback to database role
    let hasAdminAccess = false;
    let accessMethod = "";
    let blockchainError = null;

    // Try blockchain role check first
    try {
      const {
        success: roleCheckSuccess,
        isAdmin: isBlockchainAdmin,
        error: roleError,
      } = await checkUserRoles(user.wallet_address);

      if (roleCheckSuccess && isBlockchainAdmin) {
        hasAdminAccess = true;
        accessMethod = "blockchain";
        console.log("✅ Admin access granted via blockchain role");
      } else if (roleCheckSuccess && !isBlockchainAdmin) {
        console.log(
          "⚠️ Blockchain accessible but user is not admin on blockchain"
        );
        blockchainError = "User does not have admin role on blockchain";
      } else {
        console.log("❌ Blockchain role check failed:", roleError);
        blockchainError = roleError;
      }
    } catch (error) {
      console.log("❌ Blockchain role check threw exception:", error.message);
      blockchainError = error.message;
    }

    // Fallback to database role if blockchain failed or user isn't blockchain admin
    if (!hasAdminAccess && user.role === "admin") {
      hasAdminAccess = true;
      accessMethod = "database";
      console.log(
        "✅ Admin access granted via database role (blockchain fallback)"
      );
    }

    // Final access check
    if (!hasAdminAccess) {
      console.log("❌ Admin access denied:", {
        blockchain_error: blockchainError,
        database_role: user.role,
        wallet_address: user.wallet_address,
      });

      return res.status(403).json({
        error: "Admin access required",
        details: blockchainError
          ? `Blockchain verification failed: ${blockchainError}. User also lacks database admin role.`
          : "User does not have admin role on blockchain or database",
        blockchainError: blockchainError,
        databaseRole: user.role,
        suggestions: [
          "Ensure Ganache is running on the correct port",
          "Check if contract is deployed correctly",
          "Verify DEPLOYER_ADDRESS has admin role on contract",
          "As fallback, set role='admin' in database for this wallet",
        ],
      });
    }

    console.log(
      `✅ Admin access granted via ${accessMethod} for ${user.wallet_address}`
    );

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

      console.log(`📋 Found ${dbUsers.length} users in database`);

      // Enhance each user with live blockchain role data
      const usersWithBlockchainRoles = await Promise.all(
        dbUsers.map(async (dbUser) => {
          try {
            // Get live blockchain roles (with timeout and error handling)
            const { success, isAdmin, isIssuer } = await Promise.race([
              checkUserRoles(dbUser.wallet_address),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Blockchain timeout")), 5000)
              ),
            ]);

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
              blockchainError.message
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
        accessMethod: accessMethod,
        blockchainAvailable: !blockchainError,
        blockchainError: blockchainError,
        notes: {
          role_management:
            "Roles are now managed exclusively through blockchain smart contract",
          fallback:
            "Database roles used as fallback when blockchain unavailable",
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

    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      suggestions: [
        "Check server logs for detailed error information",
        "Verify database connection",
        "Ensure environment variables are set correctly",
      ],
    });
  }
}
