import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Update last active timestamp for the user
    const { error } = await mysql.updateUserLastActive(walletAddress);

    if (error) {
      console.error("Update last login error:", error);
      return res.status(500).json({
        error: "Failed to update last login",
        details: error.message,
      });
    }

    // Log the activity
    await mysql.logActivity({
      user_id: null, // We'll update this if we have the user ID
      action: "last_login_updated",
      details: "User last login timestamp updated",
      wallet_address: walletAddress,
      severity: "info",
      ip_address:
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        "127.0.0.1",
      user_agent: req.headers["user-agent"] || "Unknown",
    });

    res.status(200).json({
      success: true,
      message: "Last login updated successfully",
    });
  } catch (error) {
    console.error("Update last login API error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
