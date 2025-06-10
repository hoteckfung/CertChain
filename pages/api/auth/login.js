// Enhanced authentication login API
import { loginUser } from "../../../lib/auth-server";
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

    // Login or create user
    const { user, error } = await loginUser(walletAddress, userData);

    if (error || !user) {
      // Log failed login attempt
      await mysql.logActivity({
        user_id: null,
        action: "login_failed",
        details: `Failed login attempt for wallet: ${walletAddress}. Error: ${error}`,
        wallet_address: walletAddress,
        category: "authentication",
      });

      return res.status(401).json({
        success: false,
        error: error || "Login failed",
      });
    }

    // Create session cookie
    const authData = {
      walletAddress: user.wallet_address,
      userId: user.id,
      role: user.role,
      loginTime: new Date().toISOString(),
    };

    // Set secure cookie
    res.setHeader("Set-Cookie", [
      `auth=${JSON.stringify(
        authData
      )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`, // 24 hours
    ]);

    // Enhanced login logging
    await mysql.logActivity({
      user_id: user.id,
      action: "user_login",
      details: `User logged in successfully. Role: ${user.role}`,
      wallet_address: user.wallet_address,
      category: "authentication",
    });

    // Return user data without sensitive information
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        role: user.role,
        // Add other relevant fields as needed, but not sensitive ones
      },
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Login API error:", error);

    // Log system error
    await mysql.logActivity({
      user_id: null,
      action: "system_error",
      details: `Login API error: ${error.message}`,
      wallet_address: req.body?.walletAddress || null,
      category: "system_event",
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
