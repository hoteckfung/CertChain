// Enhanced logout API with comprehensive session management
import { logoutUser } from "../../../lib/auth-server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Logout user and log activity
    const { success, error } = await logoutUser(req);

    // Clear authentication cookie
    res.setHeader("Set-Cookie", [
      "auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0", // Expire immediately
    ]);

    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        error: "Logout failed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout API error:", error);

    // Clear cookie even on error
    res.setHeader("Set-Cookie", [
      "auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
    ]);

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
