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

    // Get client IP and user agent for logging
    const ip_address =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      "127.0.0.1";

    const user_agent = req.headers["user-agent"] || "Unknown";

    // Login or create user
    const { user, error } = await loginUser(walletAddress, {
      ...userData,
      ip_address,
      user_agent,
    });

    if (error || !user) {
      // Log failed login attempt
      await mysql.logActivity({
        user_id: null,
        action: "login_failed",
        details: `Failed login attempt for wallet: ${walletAddress}. Error: ${error}`,
        wallet_address: walletAddress,
        severity: "warning",
        ip_address,
        user_agent,
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
      severity: "info",
      ip_address,
      user_agent,
    });

    // Return user data (excluding sensitive information)
    const responseUser = {
      id: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
      username: user.username,
      email: user.email,
      permissions: user.permissions || [],
      isActive: user.is_active !== false,
      lastActive: user.last_active,
      createdAt: user.created_at,
    };

    res.status(200).json({
      success: true,
      user: responseUser,
      message: user.id ? "Login successful" : "Account created and logged in",
    });
  } catch (error) {
    console.error("Login API error:", error);

    // Log system error
    await mysql.logActivity({
      user_id: null,
      action: "system_error",
      details: `Login API error: ${error.message}`,
      wallet_address: req.body?.walletAddress || null,
      severity: "error",
      ip_address:
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        "127.0.0.1",
      user_agent: req.headers["user-agent"] || "Unknown",
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
