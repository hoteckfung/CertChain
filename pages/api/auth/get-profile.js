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

    // Get user from database by wallet address
    const { data: user, error } = await mysql.getUserByWalletAddress(
      walletAddress
    );

    if (error) {
      console.error("Get user profile error:", error);
      return res.status(500).json({
        error: "Failed to fetch user profile",
        details: error.message,
      });
    }

    if (!user) {
      // User doesn't exist in database yet - return null profile
      return res.status(200).json({
        success: true,
        profile: null,
        exists: false,
      });
    }

    // Return user profile data
    const profile = {
      id: user.id,
      wallet_address: user.wallet_address,
      role: user.role,
      name: user.username,
      email: user.email,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      is_active: user.is_active,
      created_at: user.created_at,
      last_active: user.last_active,
    };

    res.status(200).json({
      success: true,
      profile,
      exists: true,
    });
  } catch (error) {
    console.error("Get profile API error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
