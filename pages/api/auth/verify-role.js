import { authenticateUser } from "../../../lib/auth-server";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user, error } = await authenticateUser(req);

    if (error || !user) {
      return res.status(401).json({
        authenticated: false,
        error: error || "Not authenticated",
      });
    }

    // Return comprehensive user information
    const response = {
      authenticated: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        role: user.role,
        username: user.username,
        email: user.email,
        permissions: user.permissions || [],
        isActive: user.is_active !== false,
        lastActive: user.last_active,
        createdAt: user.created_at,
      },
      roleHierarchy: {
        admin: ["admin", "issuer", "holder"],
        issuer: ["issuer", "holder"],
        holder: ["holder"],
      },
    };

    // Add role-specific redirects
    const roleRoutes = {
      admin: "/admin",
      issuer: "/issuer",
      holder: "/holder",
    };

    response.redirectTo = roleRoutes[user.role] || "/login";

    res.status(200).json(response);
  } catch (error) {
    console.error("Role verification error:", error);
    res.status(500).json({
      authenticated: false,
      error: "Verification failed",
    });
  }
}
