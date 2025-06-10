import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      type,
      walletAddress,
      targetAddress,
      details,
      transactionHash,
      blockNumber,
      tokenId,
      ipfsHash,
    } = req.body;

    // Validate required fields
    if (!type || !walletAddress) {
      return res.status(400).json({
        error: "Missing required fields: type and walletAddress",
      });
    }

    // Use the logActivity function from mysql utils
    const { data, error } = await mysql.logActivity({
      action: type,
      wallet_address: walletAddress,
      target_wallet_address: targetAddress,
      details: details,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      category: "user_action",
    });

    if (error) {
      throw new Error(`Failed to log activity: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      activityId: data?.insertId,
      message: "Activity logged successfully",
    });
  } catch (error) {
    console.error("Activity logging error:", error);
    res.status(500).json({
      error: "Failed to log activity",
      details: error.message,
    });
  }
}
