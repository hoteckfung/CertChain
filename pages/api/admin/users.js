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
    } else if (req.method === "DELETE") {
      // Delete user
      console.log("DELETE request received, body:", req.body);
      const { userId } = req.body;

      if (!userId) {
        console.log("No userId provided");
        return res.status(400).json({ error: "User ID is required" });
      }

      console.log("Attempting to delete user:", userId);

      // Get user data before deletion for logging
      const { data: allUsers } = await mysql.getAllUsers();
      const targetUser = allUsers.find((u) => u.id === parseInt(userId));

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (
        targetUser.wallet_address.toLowerCase() ===
        user.wallet_address.toLowerCase()
      ) {
        return res.status(400).json({ error: "Cannot delete yourself" });
      }

      try {
        // Delete user from database
        const { error: deleteError } = await mysql.deleteUser(userId);

        if (deleteError) {
          console.error("Delete user error:", deleteError);
          return res.status(500).json({
            error: "Failed to delete user",
            details: deleteError.message || "Database error",
          });
        }

        // Clear user cache
        clearUserCache(targetUser.wallet_address);

        // Log the user deletion activity
        await mysql.logActivity({
          user_id: user.id,
          action: "user_deleted",
          details: `Deleted user ${
            targetUser.username || targetUser.wallet_address
          }`,
          wallet_address: user.wallet_address,
        });
      } catch (dbError) {
        console.error("Database deletion error:", dbError);
        return res.status(500).json({
          error: "Database error during deletion",
          details: dbError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin users API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
