import mysql from "../../../utils/mysql";
import { authenticateUser } from "../../../lib/auth-server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tokenId, status, transactionHash } = req.body;

    // Validate input
    if (!tokenId || !status) {
      return res.status(400).json({
        error: "Token ID and status are required",
      });
    }

    const tokenIdNum = parseInt(tokenId);
    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      return res.status(400).json({
        error: "Invalid token ID format",
      });
    }

    // Validate status format
    if (!["Issued", "Revoked", "issued", "revoked"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status value. Must be 'Issued' or 'Revoked'",
      });
    }

    // Ensure lowercase status for database compatibility
    const dbStatus = status.toLowerCase();

    // Update certificate status in database
    const { error: updateError } = await mysql.updateCertificateStatusByTokenId(
      tokenIdNum,
      dbStatus
    );

    if (updateError) {
      console.error(
        "Failed to update certificate status in database:",
        updateError
      );
      return res.status(500).json({
        error: "Failed to update certificate status in database",
        details: updateError.message,
      });
    }

    // Get certificate details for the activity log
    const { data: certificateDetails } = await mysql.getCertificateByTokenId(
      tokenIdNum
    );
    let certificateTitle = "Unknown certificate";
    let holderWallet = "Unknown holder";

    if (certificateDetails) {
      certificateTitle = certificateDetails.title;
      holderWallet = certificateDetails.holder_wallet;
    }

    // Log the certificate status update activity
    try {
      await mysql.logActivity({
        user_id: user.id,
        action:
          status === "Revoked"
            ? "CERTIFICATE_REVOKED"
            : "CERTIFICATE_STATUS_UPDATED",
        details:
          status === "Revoked"
            ? `Certificate "${certificateTitle}" revoked from ${holderWallet}`
            : `Certificate "${certificateTitle}" status updated to ${status}`,
        wallet_address: user.wallet_address,
        token_id: tokenIdNum,
        transaction_hash: transactionHash || null,
        category: "certificate_management",
      });
    } catch (logError) {
      console.error(
        "Failed to log certificate status update activity:",
        logError
      );
      // Continue even if logging fails
    }

    res.status(200).json({
      success: true,
      message: `Certificate status updated to '${status}' successfully`,
    });
  } catch (error) {
    console.error("Error updating certificate status:", error);
    res.status(500).json({
      error: "Failed to update certificate status",
      details: error.message,
    });
  }
}
