import { authenticateUser, hasRole, ROLES } from "../../../lib/auth-server";
import {
  startBlockchainSync,
  stopBlockchainSync,
  isBlockchainSyncRunning,
  getBlockchainSyncStatus,
} from "../../../utils/blockchain-sync";
import mysql from "../../../utils/mysql";

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
      // Get sync status
      const status = getBlockchainSyncStatus();

      return res.status(200).json({
        success: true,
        status,
        message: status.isRunning
          ? "Blockchain sync is running"
          : "Blockchain sync is stopped",
      });
    } else if (req.method === "POST") {
      const { action } = req.body;

      if (action === "start") {
        // Start blockchain sync
        try {
          startBlockchainSync();

          // Log activity
          await mysql.logActivity({
            user_id: user.id,
            action: "blockchain_sync_started",
            entity_type: "system",
            details: "Admin started blockchain event sync service",
            wallet_address: user.wallet_address,
            category: "system_event",
          });

          return res.status(200).json({
            success: true,
            message: "Blockchain sync started successfully",
            status: getBlockchainSyncStatus(),
          });
        } catch (error) {
          console.error("Failed to start blockchain sync:", error);
          return res.status(500).json({
            success: false,
            error: "Failed to start blockchain sync",
            details: error.message,
          });
        }
      } else if (action === "stop") {
        // Stop blockchain sync
        try {
          stopBlockchainSync();

          // Log activity
          await mysql.logActivity({
            user_id: user.id,
            action: "blockchain_sync_stopped",
            entity_type: "system",
            details: "Admin stopped blockchain event sync service",
            wallet_address: user.wallet_address,
            category: "system_event",
          });

          return res.status(200).json({
            success: true,
            message: "Blockchain sync stopped successfully",
            status: getBlockchainSyncStatus(),
          });
        } catch (error) {
          console.error("Failed to stop blockchain sync:", error);
          return res.status(500).json({
            success: false,
            error: "Failed to stop blockchain sync",
            details: error.message,
          });
        }
      } else if (action === "restart") {
        // Restart blockchain sync
        try {
          stopBlockchainSync();

          // Wait a moment for cleanup
          await new Promise((resolve) => setTimeout(resolve, 1000));

          startBlockchainSync();

          // Log activity
          await mysql.logActivity({
            user_id: user.id,
            action: "blockchain_sync_restarted",
            entity_type: "system",
            details: "Admin restarted blockchain event sync service",
            wallet_address: user.wallet_address,
            category: "system_event",
          });

          return res.status(200).json({
            success: true,
            message: "Blockchain sync restarted successfully",
            status: getBlockchainSyncStatus(),
          });
        } catch (error) {
          console.error("Failed to restart blockchain sync:", error);
          return res.status(500).json({
            success: false,
            error: "Failed to restart blockchain sync",
            details: error.message,
          });
        }
      } else {
        return res.status(400).json({
          error: "Invalid action. Use 'start', 'stop', or 'restart'",
        });
      }
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Blockchain sync API error:", error);

    // Log the error
    try {
      await mysql.logActivity({
        user_id: user?.id || null,
        action: "blockchain_sync_api_error",
        entity_type: "system",
        details: `Blockchain sync API error: ${error.message}`,
        wallet_address: user?.wallet_address || null,
        category: "system_event",
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
