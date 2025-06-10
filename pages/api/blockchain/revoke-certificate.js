import { revokeCertificate } from "../../../utils/contract";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tokenId } = req.body;

    // Validate input
    if (!tokenId) {
      return res.status(400).json({
        error: "Token ID is required",
      });
    }

    const tokenIdNum = parseInt(tokenId);
    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      return res.status(400).json({
        error: "Invalid token ID format",
      });
    }

    // Call the blockchain revoke function
    const result = await revokeCertificate(tokenIdNum);

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to revoke certificate",
        details: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Certificate revoked successfully",
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
    });
  } catch (error) {
    console.error("Error revoking certificate:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
