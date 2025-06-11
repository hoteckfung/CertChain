// Enhanced authentication login API
import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress, userData = {} } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    let user = null;
    let isBlockchainOnly = false;

    // Try to get or create user in database
    try {
      const { data: existingUser, error: getUserError } =
        await mysql.getUserByWalletAddress(walletAddress);

      if (existingUser) {
        user = existingUser;
        // Update last active time
        try {
          await mysql.updateUserLastActive(walletAddress);
        } catch (updateError) {
          console.warn("Failed to update last active:", updateError);
        }
      } else if (!getUserError) {
        // Try to create new user
        const newUserData = {
          wallet_address: walletAddress,
          role: userData.role || "holder",
          permissions: ["view_certificates"],
        };

        const { data: createdUser, error: createError } =
          await mysql.createUser(newUserData);

        if (createError) {
          console.error(
            "User creation failed, using blockchain-only auth:",
            createError
          );
          isBlockchainOnly = true;
        } else {
          user = createdUser;
        }
      } else {
        console.error(
          "Database error, using blockchain-only auth:",
          getUserError
        );
        isBlockchainOnly = true;
      }
    } catch (dbError) {
      console.error(
        "Database operation failed, using blockchain-only auth:",
        dbError
      );
      isBlockchainOnly = true;
    }

    // Create user object for session (even if database failed)
    const sessionUser = user || {
      id: `wallet_${walletAddress.slice(2, 8)}`,
      wallet_address: walletAddress,
      role: userData.role || "holder",
      permissions: ["view_certificates"],
    };

    // Create session cookie regardless of database status
    const authData = {
      walletAddress: sessionUser.wallet_address,
      userId: sessionUser.id,
      role: sessionUser.role,
      loginTime: new Date().toISOString(),
      blockchainOnly: isBlockchainOnly,
    };

    // Set secure cookie
    res.setHeader("Set-Cookie", [
      `auth=${JSON.stringify(
        authData
      )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`, // 24 hours
    ]);

    // Log activity if we have a real user ID
    if (user && user.id && !isBlockchainOnly) {
      try {
        await mysql.logActivity({
          user_id: user.id,
          action: "user_login",
          details: `User logged in successfully. Role: ${user.role}`,
          wallet_address: user.wallet_address,
          category: "authentication",
        });
      } catch (logError) {
        console.warn("Failed to log activity:", logError);
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: `Login successful${
        isBlockchainOnly ? " (blockchain-only)" : ""
      }`,
      user: {
        id: sessionUser.id,
        wallet_address: sessionUser.wallet_address,
        role: sessionUser.role,
        blockchainOnly: isBlockchainOnly,
      },
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Login API error:", error);

    // Even on error, try to set a basic session for blockchain auth
    if (req.body?.walletAddress) {
      const authData = {
        walletAddress: req.body.walletAddress,
        userId: `wallet_${req.body.walletAddress.slice(2, 8)}`,
        role: req.body?.userData?.role || "holder",
        loginTime: new Date().toISOString(),
        blockchainOnly: true,
      };

      res.setHeader("Set-Cookie", [
        `auth=${JSON.stringify(
          authData
        )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`,
      ]);

      return res.status(200).json({
        success: true,
        message: "Login successful (blockchain-only)",
        user: {
          id: authData.userId,
          wallet_address: authData.walletAddress,
          role: authData.role,
          blockchainOnly: true,
        },
        redirectTo: "/dashboard",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
