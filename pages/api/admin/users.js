import mysql from "../../../utils/mysql";
import {
  authenticateUser,
  hasRole,
  ROLES,
  clearUserCache,
} from "../../../lib/auth-server";

export default async function handler(req, res) {
  try {
    // Authenticate user and check admin role
    const { user, error } = await authenticateUser(req);

    if (!user) {
      return res
        .status(401)
        .json({ error: error || "Authentication required" });
    }

    if (!hasRole(user, ROLES.ADMIN)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (req.method === "GET") {
      // Get all users
      const { data: users, error: fetchError } = await mysql.getAllUsers();

      if (fetchError) {
        return res.status(500).json({ error: "Failed to fetch users" });
      }

      return res.status(200).json({
        success: true,
        users,
      });
    } else if (req.method === "PUT") {
      // Update user role
      const { userId, newRole } = req.body;

      if (!userId || !newRole) {
        return res
          .status(400)
          .json({ error: "User ID and new role are required" });
      }

      if (!Object.values(ROLES).includes(newRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Get user data before update for cache clearing
      const { data: allUsers } = await mysql.getAllUsers();
      const targetUser = allUsers.find((u) => u.id === parseInt(userId));

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user role
      const { error: updateError } = await mysql.updateUserRole(
        userId,
        newRole
      );

      if (updateError) {
        return res.status(500).json({ error: "Failed to update user role" });
      }

      // Clear user cache to force fresh data on next request
      clearUserCache(targetUser.wallet_address);

      // Get updated user data
      const { data: users } = await mysql.getAllUsers();
      const updatedUser = users.find((u) => u.id === parseInt(userId));

      // Log the role change activity
      await mysql.logActivity({
        user_id: user.id,
        action: "role_changed",
        details: `Changed user ${
          updatedUser.username || updatedUser.wallet_address
        } role to ${newRole}`,
        wallet_address: user.wallet_address,
      });

      // Log activity for the user whose role was changed
      await mysql.logActivity({
        user_id: userId,
        action: "role_updated",
        details: `Role updated to ${newRole} by admin`,
        wallet_address: updatedUser.wallet_address,
      });

      return res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin users API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
