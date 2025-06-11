import mysql from "../../../utils/mysql";
import { loginUser } from "../../../lib/auth-server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress, role } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Use the existing loginUser function which handles user creation and login
    const { user, error } = await loginUser(walletAddress, { role });

    if (error) {
      console.error("Login/Update user error:", error);
      return res.status(500).json({
        error: "Failed to update user",
        details: error,
      });
    }

    if (user) {
      // Additional activity logging for auto-detection
      await mysql.logActivity({
        user_id: user.id,
        action:
          user.created_at === user.last_active
            ? "user_auto_detected"
            : "last_login_updated",
        entity_type: "user",
        details:
          user.created_at === user.last_active
            ? "New user auto-detected via wallet connection"
            : "User last login timestamp updated",
        wallet_address: walletAddress,
        category: "authentication",
      });

      console.log(
        `👤 ${
          user.created_at === user.last_active
            ? "New user auto-detected"
            : "User updated"
        }:`,
        walletAddress
      );
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        role: user.role,
        isNew: user.created_at === user.last_active,
      },
    });
  } catch (error) {
    console.error("Update last login API error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
