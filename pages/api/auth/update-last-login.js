import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress, role } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // First, try to get existing user
    const { data: existingUser, error: getUserError } =
      await mysql.getUserByWalletAddress(walletAddress);

    let user = existingUser;
    let isNewUser = false;

    if (!existingUser && !getUserError) {
      // User doesn't exist, try to create one with minimal data
      try {
        const newUserData = {
          wallet_address: walletAddress,
          role: role || "holder", // Use provided role or default to holder
          permissions: ["view_certificates"], // Simple array, will be stringified by createUser
        };

        const { data: createdUser, error: createError } =
          await mysql.createUser(newUserData);

        if (createError) {
          console.error("User creation failed:", createError);
          // Continue without database user - blockchain auth is primary
          return res.status(200).json({
            success: true,
            message: "Authentication successful (blockchain-only)",
            user: {
              wallet_address: walletAddress,
              role: role || "holder",
              isNew: true,
              blockchainOnly: true,
            },
          });
        }

        user = createdUser;
        isNewUser = true;
      } catch (createError) {
        console.error("User creation error:", createError);
        // Continue without database user - blockchain is primary
        return res.status(200).json({
          success: true,
          message: "Authentication successful (blockchain-only)",
          user: {
            wallet_address: walletAddress,
            role: role || "holder",
            isNew: true,
            blockchainOnly: true,
          },
        });
      }
    } else if (existingUser) {
      // Update existing user's last active time
      try {
        await mysql.updateUserLastActive(walletAddress);
      } catch (updateError) {
        console.warn("Failed to update last active time:", updateError);
        // Continue - not critical
      }
    } else if (getUserError) {
      console.error("Database error when getting user:", getUserError);
      // Continue without database user - blockchain is primary
      return res.status(200).json({
        success: true,
        message: "Authentication successful (blockchain-only)",
        user: {
          wallet_address: walletAddress,
          role: role || "holder",
          isNew: false,
          blockchainOnly: true,
        },
      });
    }

    // Log activity if we have a user ID
    if (user && user.id) {
      try {
        await mysql.logActivity({
          user_id: user.id,
          action: isNewUser ? "user_auto_detected" : "last_login_updated",
          entity_type: "user",
          details: isNewUser
            ? "New user auto-detected via wallet connection"
            : "User last login timestamp updated",
          wallet_address: walletAddress,
          category: "authentication",
        });
      } catch (logError) {
        console.warn("Failed to log activity:", logError);
        // Continue - not critical
      }
    }

    console.log(
      `👤 ${isNewUser ? "New user created" : "User updated"}:`,
      walletAddress
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user?.id || `wallet_${walletAddress.slice(2, 8)}`,
        wallet_address: walletAddress,
        role: user?.role || role || "holder",
        isNew: isNewUser,
        blockchainOnly: !user?.id,
      },
    });
  } catch (error) {
    console.error("Update last login API error:", error);

    // Even if database operations fail, return success for blockchain-first auth
    res.status(200).json({
      success: true,
      message: "Authentication successful (blockchain-only)",
      user: {
        wallet_address: req.body?.walletAddress,
        role: req.body?.role || "holder",
        isNew: false,
        blockchainOnly: true,
      },
    });
  }
}
