import { connectToDatabase } from "../../../lib/db";

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
      metadata = {},
    } = req.body;

    // Validate required fields
    if (!type || !walletAddress) {
      return res.status(400).json({
        error: "Missing required fields: type and walletAddress",
      });
    }

    const connection = await connectToDatabase();

    // Create activity log entry
    const [result] = await connection.execute(
      `INSERT INTO activity_logs (
        type, 
        wallet_address, 
        target_address, 
        details, 
        transaction_hash, 
        block_number, 
        token_id, 
        ipfs_hash, 
        metadata, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        type,
        walletAddress,
        targetAddress || null,
        details || null,
        transactionHash || null,
        blockNumber || null,
        tokenId || null,
        ipfsHash || null,
        JSON.stringify(metadata),
      ]
    );

    await connection.end();

    res.status(200).json({
      success: true,
      activityId: result.insertId,
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
